// Backup & restore: export everything to a JSON file, import it on another phone.
import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { getDb, SCHEMA_VERSION } from './database';
import { seedSampleData } from './seed';
import { today } from '../utils/format';

const ASSET_COLS = ['id', 'type', 'identifier', 'title', 'city', 'purchase_price', 'purchase_date', 'seller_name',
  'deal_type', 'status', 'asking_price', 'rent_amount', 'tenant_name', 'tenant_phone', 'rent_start', 'sale_price', 'sale_date', 'buyer_name', 'buyer_phone', 'details', 'notes',
  'created_at', 'updated_at', 'is_deleted'];
const INCOME_COLS = ['id', 'asset_id', 'income_type', 'amount', 'date', 'period', 'note', 'created_at', 'updated_at', 'is_deleted'];
const EXPENSE_COLS = ['id', 'expense_type', 'asset_id', 'phase', 'category', 'amount', 'date', 'note',
  'created_at', 'updated_at', 'is_deleted'];

export async function buildBackup() {
  const db = await getDb();
  return {
    app: 'dealmint',
    schema_version: SCHEMA_VERSION,
    exported_at: new Date().toISOString(),
    assets: await db.getAllAsync('SELECT * FROM assets'),
    expenses: await db.getAllAsync('SELECT * FROM expenses'),
    incomes: await db.getAllAsync('SELECT * FROM incomes'),
    settings: await db.getAllAsync("SELECT * FROM settings WHERE key != 'seeded'"),
  };
}

// Creates the file and opens the share sheet (WhatsApp, Drive, email…)
export async function exportBackup() {
  const data = await buildBackup();
  const json = JSON.stringify(data, null, 2);
  const name = `dealmint_backup_${today()}.json`;

  if (Platform.OS === 'web') {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = name; link.click();
    URL.revokeObjectURL(url);
    return { count: data.assets.length };
  }

  const file = new File(Paths.cache, name);
  if (file.exists) file.delete();
  file.create();
  await file.write(json);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Save Dealmint backup' });
  }
  return { count: data.assets.length };
}

// Keeps a safety copy on the phone before replacing data
async function saveSafetyCopy() {
  if (Platform.OS === 'web') return;
  const data = await buildBackup();
  const file = new File(Paths.document, 'dealmint_before_import.json');
  if (file.exists) file.delete();
  file.create();
  await file.write(JSON.stringify(data));
}

// Step 1: pick a file and check it. Returns a summary for the confirmation screen.
export async function pickBackup() {
  const res = await DocumentPicker.getDocumentAsync({ type: ['application/json', '*/*'], copyToCacheDirectory: true });
  if (res.canceled || !res.assets?.length) return null;
  const asset = res.assets[0];
  let text;
  if (Platform.OS === 'web') text = await (asset.file ? asset.file.text() : fetch(asset.uri).then((r) => r.text()));
  else text = await new File(asset.uri).text();

  let data;
  try { data = JSON.parse(text); } catch { throw new Error('This file is not a valid backup.'); }
  if (data.app !== 'dealmint' || !Array.isArray(data.assets) || !Array.isArray(data.expenses)) {
    throw new Error('This file is not a Dealmint backup.');
  }
  return {
    data,
    name: asset.name,
    exportedAt: data.exported_at,
    assets: data.assets.filter((a) => !a.is_deleted).length,
    expenses: data.expenses.filter((e) => !e.is_deleted).length,
    incomes: (data.incomes || []).filter((e) => !e.is_deleted).length,
  };
}

// Step 2: replace everything on this phone with the backup
export async function restoreBackup(data) {
  await saveSafetyCopy();
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM incomes');
    await db.runAsync('DELETE FROM expenses');
    await db.runAsync('DELETE FROM assets');
    for (const a of data.assets) {
      await db.runAsync(
        `INSERT INTO assets (${ASSET_COLS.join(',')}) VALUES (${ASSET_COLS.map(() => '?').join(',')})`,
        ...ASSET_COLS.map((c) => a[c] ?? (c === 'is_deleted' ? 0 : c === 'deal_type' ? 'Sale' : null))
      );
    }
    for (const i of data.incomes || []) {
      await db.runAsync(
        `INSERT INTO incomes (${INCOME_COLS.join(',')}) VALUES (${INCOME_COLS.map(() => '?').join(',')})`,
        ...INCOME_COLS.map((c) => i[c] ?? (c === 'is_deleted' ? 0 : null))
      );
    }
    for (const e of data.expenses) {
      await db.runAsync(
        `INSERT INTO expenses (${EXPENSE_COLS.join(',')}) VALUES (${EXPENSE_COLS.map(() => '?').join(',')})`,
        ...EXPENSE_COLS.map((c) => e[c] ?? (c === 'is_deleted' ? 0 : null))
      );
    }
    for (const s of data.settings || []) {
      await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', s.key, s.value);
    }
  });
}

// Wipes data and loads the sample set again (useful for demos)
export async function resetToSample() {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM incomes');
    await db.runAsync('DELETE FROM expenses');
    await db.runAsync('DELETE FROM assets');
  });
  await seedSampleData(db);
}

export async function clearAll() {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM incomes');
    await db.runAsync('DELETE FROM expenses');
    await db.runAsync('DELETE FROM assets');
  });
}
