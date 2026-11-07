// Opens the local SQLite database and creates the tables.
// Everything is stored on the device — no internet needed.
import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import { DEFAULT_SETTINGS } from '../constants';
import { seedSampleData, seedRentalSample } from './seed';

const DB_NAME = 'dealmint.db';
export const SCHEMA_VERSION = 2;

let dbPromise = null;

export const uuid = () => Crypto.randomUUID();
export const now = () => new Date().toISOString();

// Sync-ready design: UUID ids, created_at / updated_at and soft delete (is_deleted),
// so a cloud sync can be added later without changing the data.
const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS assets (
  id             TEXT PRIMARY KEY NOT NULL,
  type           TEXT NOT NULL,              -- Land | House | Vehicle
  identifier     TEXT NOT NULL,              -- Address (Land/House) or Vehicle number
  title          TEXT,                       -- short description e.g. "15 perch land"
  city           TEXT,
  purchase_price REAL NOT NULL,
  purchase_date  TEXT NOT NULL,              -- YYYY-MM-DD
  seller_name    TEXT,
  deal_type      TEXT NOT NULL DEFAULT 'Sale', -- Sale | Rent  (the plan for this asset)
  status         TEXT NOT NULL DEFAULT 'Purchased',
  rent_amount    REAL,                       -- monthly rent (Rent plan)
  tenant_name    TEXT,
  tenant_phone   TEXT,
  rent_start     TEXT,                       -- rent is due on this day each month
  asking_price   REAL,
  sale_price     REAL,
  sale_date      TEXT,
  buyer_name     TEXT,
  buyer_phone    TEXT,
  details        TEXT,                       -- JSON with type-specific fields
  notes          TEXT,
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL,
  is_deleted     INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS expenses (
  id           TEXT PRIMARY KEY NOT NULL,
  expense_type TEXT NOT NULL,                -- Direct | Indirect
  asset_id     TEXT,                         -- set for Direct, NULL for Indirect
  phase        TEXT,                         -- Direct only
  category     TEXT NOT NULL,
  amount       REAL NOT NULL,
  date         TEXT NOT NULL,                -- YYYY-MM-DD
  note         TEXT,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL,
  is_deleted   INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (asset_id) REFERENCES assets(id)
);

-- Money coming in from an asset while you hold it (rent, hire)
CREATE TABLE IF NOT EXISTS incomes (
  id           TEXT PRIMARY KEY NOT NULL,
  asset_id     TEXT NOT NULL,
  income_type  TEXT NOT NULL DEFAULT 'Rent', -- Rent | Other income
  amount       REAL NOT NULL,
  date         TEXT NOT NULL,                -- date received
  period       TEXT,                         -- month the rent is for, YYYY-MM
  note         TEXT,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL,
  is_deleted   INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (asset_id) REFERENCES assets(id)
);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY NOT NULL,
  value TEXT
);

CREATE INDEX IF NOT EXISTS idx_expenses_asset ON expenses(asset_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date  ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_assets_status  ON assets(status);
CREATE INDEX IF NOT EXISTS idx_incomes_asset  ON incomes(asset_id);
`;

// Upgrades a database created by version 1 of the app (adds the rent columns)
async function migrate(db) {
  const cols = (await db.getAllAsync('PRAGMA table_info(assets)')).map((c) => c.name);
  const add = [
    ['deal_type', "TEXT NOT NULL DEFAULT 'Sale'"],
    ['rent_amount', 'REAL'],
    ['tenant_name', 'TEXT'],
    ['tenant_phone', 'TEXT'],
    ['rent_start', 'TEXT'],
  ];
  for (const [name, def] of add) {
    if (!cols.includes(name)) await db.execAsync(`ALTER TABLE assets ADD COLUMN ${name} ${def}`);
  }
  await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
}

async function init() {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync(SCHEMA);
  await migrate(db);

  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await db.runAsync('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', key, value);
  }

  // First launch: load the sample data
  const seeded = await db.getFirstAsync("SELECT value FROM settings WHERE key = 'seeded'");
  if (!seeded) {
    await seedSampleData(db);
    await db.runAsync("INSERT OR REPLACE INTO settings (key, value) VALUES ('seeded', '1')");
    await db.runAsync("INSERT OR REPLACE INTO settings (key, value) VALUES ('rentals_seeded', '1')");
  } else {
    // Phones that already had version 1 sample data get the rental examples too
    const rentals = await db.getFirstAsync("SELECT value FROM settings WHERE key = 'rentals_seeded'");
    if (!rentals) {
      await seedRentalSample(db);
      await db.runAsync("INSERT OR REPLACE INTO settings (key, value) VALUES ('rentals_seeded', '1')");
      // The rental examples cost about Rs. 61M, so raise the sample starting capital to match
      await db.runAsync("UPDATE settings SET value = '175000000' WHERE key = 'starting_capital' AND value = '110000000'");
    }
  }
  return db;
}

export function getDb() {
  if (!dbPromise) dbPromise = init();
  return dbPromise;
}
