import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../theme';
import { Screen, Group, Row, Input, Chip, FieldRow, haptic } from '../components/ui';
import { MoneyField } from '../components/fields';
import { getSettings, setSetting } from '../db/repo';
import { exportBackup, pickBackup, restoreBackup, resetToSample, clearAll } from '../db/backup';
import useFocusData from '../utils/useFocusData';
import { confirm, notify } from '../utils/confirm';
import { prettyDate } from '../utils/format';

export default function SettingsScreen() {
  const { c, type } = useTheme();
  const [s, reload] = useFocusData(getSettings);
  const [busy, setBusy] = useState(false);

  if (!s) return null;

  const update = async (key, value) => { await setSetting(key, value); reload(); };

  const doExport = async () => {
    try {
      setBusy(true);
      const r = await exportBackup();
      haptic.success();
      if (r) notify('Backup ready', `${r.count} assets exported. Send the file to your other phone, then use "Import backup" there.`);
    } catch (e) { notify('Export failed', e.message); } finally { setBusy(false); }
  };

  const doImport = async () => {
    try {
      const b = await pickBackup();
      if (!b) return;
      const ok = await confirm(
        'Replace all data?',
        `Backup from ${b.exportedAt ? prettyDate(b.exportedAt.slice(0, 10)) : 'unknown date'}\n${b.assets} assets · ${b.expenses} expenses\n\nEverything on this phone will be replaced. A safety copy is saved first.`,
        { okText: 'Import', destructive: true }
      );
      if (!ok) return;
      await restoreBackup(b.data);
      haptic.success();
      reload();
      notify('Import complete', `${b.assets} assets and ${b.expenses} expenses restored.`);
    } catch (e) { notify('Import failed', e.message); }
  };

  const doReset = async () => {
    if (!(await confirm('Load sample data?', 'All current assets and expenses will be replaced with the sample set.', { okText: 'Load sample', destructive: true }))) return;
    await resetToSample();
    haptic.success();
    notify('Sample data loaded');
  };

  const doClear = async () => {
    if (!(await confirm('Erase all data?', 'Every asset and expense will be deleted. Export a backup first if you need it.', { okText: 'Erase', destructive: true }))) return;
    await clearAll();
    notify('All data erased');
  };

  return (
    <Screen contentStyle={{ paddingTop: 4 }}>
      <Group header="Business">
        <Input label="Business name" value={s.business_name} onChangeText={(v) => update('business_name', v)} placeholder="My Agency" />
        <MoneyField label="Starting capital" value={String(s.starting_capital || '')} onChange={(v) => update('starting_capital', v || '0')} />
      </Group>
      <Text style={[type.footnote, { color: c.text2, marginHorizontal: 32, marginTop: 6 }]}>
        Cash available = starting capital − purchases − expenses + sales.
      </Text>

      <Group header="Expense alert" footer={`Warn when an asset's expenses reach ${s.alert_percent}% of its purchase price.`}>
        <FieldRow>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {[5, 10, 15, 20, 25, 30].map((p) => (
              <Chip key={p} label={`${p}%`} active={s.alert_percent === p} color={c.orange} onPress={() => update('alert_percent', p)} />
            ))}
          </View>
        </FieldRow>
      </Group>

      <Group header="Backup & restore" footer="Export creates a file you can send by WhatsApp, email or Google Drive. Import it on another phone to move all your records.">
        <Row icon="share-outline" iconColor={c.blue} title={busy ? 'Exporting…' : 'Export backup'} onPress={doExport} chevron />
        <Row icon="download-outline" iconColor={c.green} title="Import backup" onPress={doImport} chevron />
      </Group>

      <Group header="Data">
        <Row icon="flask" iconColor={c.purple} title="Load sample data" subtitle="Replaces everything with demo records" onPress={doReset} />
        <Row icon="trash" iconColor={c.red} title="Erase all data" onPress={doClear} destructive />
      </Group>

      <Group header="About">
        <Row icon="leaf" iconColor={c.mint} title="Dealmint" value="1.0.0" />
        <Row icon="phone-portrait" iconColor={c.gray} title="Storage" value="This phone only" />
        <Row icon="cloud-outline" iconColor={c.cyan} title="Team sync" value="Coming later" />
      </Group>
    </Screen>
  );
}
