// Record rent (or other income) received from an asset
import React, { useEffect, useLayoutEffect, useState } from 'react';
import { View, Text, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { Screen, Group, Input, Segmented, FieldRow, IconTile, haptic } from '../components/ui';
import { DateField, MoneyField } from '../components/fields';
import { smoothLayout } from '../components/AssetCard';
import { getIncome, saveIncome, deleteIncome, listAssets } from '../db/repo';
import { confirm } from '../utils/confirm';
import { ASSET_TYPES, INCOME_TYPES } from '../constants';
import { today, cleanNumber, moneyShort, monthLabel } from '../utils/format';

const shiftMonth = (key, n) => {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export default function IncomeFormScreen({ route, navigation }) {
  const { c, type } = useTheme();
  const p = route.params || {};
  const [f, setF] = useState({
    asset_id: p.asset_id || null, income_type: 'Rent', amount: '', date: today(), period: today().slice(0, 7), note: '',
  });
  const [assets, setAssets] = useState([]);
  const [picking, setPicking] = useState(!p.asset_id && !p.id);
  const [error, setError] = useState({});

  useEffect(() => {
    listAssets({ plan: 'Rent', type: p.scope && p.scope !== 'All' ? p.scope : 'All' }).then((list) => {
      setAssets(list);
      const pre = list.find((a) => a.id === p.asset_id);
      if (pre && !p.id) setF((x) => ({ ...x, amount: pre.rent_amount ? String(pre.rent_amount) : '' }));
    });
    if (p.id) getIncome(p.id).then((i) => {
      if (!i) return;
      setF({ ...i, amount: String(i.amount), note: i.note || '', period: i.period || i.date.slice(0, 7) });
      setPicking(false);
    });
  }, [p.id]);

  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  const selected = assets.find((a) => a.id === f.asset_id);

  const save = async () => {
    const e = {};
    if (!f.asset_id) e.asset = 'Choose the asset this money came from';
    if (cleanNumber(f.amount) <= 0) e.amount = 'Enter the amount received';
    setError(e);
    if (Object.keys(e).length) { haptic.warn(); return; }
    await saveIncome({ ...f, amount: cleanNumber(f.amount), note: f.note.trim(), period: f.income_type === 'Rent' ? f.period : null });
    haptic.success();
    navigation.goBack();
  };

  const remove = async () => {
    if (!(await confirm('Delete this payment?', 'This cannot be undone.', { okText: 'Delete', destructive: true }))) return;
    await deleteIncome(p.id);
    navigation.goBack();
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: p.id ? 'Edit Income' : 'Rent Received',
      headerLeft: () => <Pressable onPress={() => navigation.goBack()} hitSlop={10}><Text style={{ color: c.blue, fontSize: 17 }}>Cancel</Text></Pressable>,
      headerRight: () => <Pressable onPress={save} hitSlop={10}><Text style={{ color: c.blue, fontSize: 17, fontWeight: '600' }}>Save</Text></Pressable>,
    });
  });

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen contentStyle={{ paddingTop: 4 }}>
        <View style={{ marginHorizontal: 16, marginTop: 12 }}>
          <Segmented value={f.income_type} onChange={set('income_type')} options={INCOME_TYPES} />
        </View>

        <Group header="Asset" footer={error.asset}>
          {selected && !picking ? (
            <Pressable onPress={() => { smoothLayout(); setPicking(true); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}>
              <IconTile name={ASSET_TYPES[selected.type].icon} color={c[ASSET_TYPES[selected.type].color]} size={36} />
              <View style={{ flex: 1 }}>
                <Text style={[type.subhead, { color: c.text, fontWeight: '600' }]} numberOfLines={1}>{selected.identifier}</Text>
                <Text style={[type.footnote, { color: c.text2 }]} numberOfLines={1}>
                  {selected.tenant_name || selected.status}{selected.rent_amount ? ` · ${moneyShort(selected.rent_amount)}/month` : ''}
                </Text>
              </View>
              <Text style={{ color: c.blue, fontSize: 15 }}>Change</Text>
            </Pressable>
          ) : assets.length === 0 ? (
            <Text style={[type.subhead, { color: c.text2, padding: 16 }]}>No assets are set to "Rent out" yet. Edit an asset and choose the Rent out plan.</Text>
          ) : (
            assets.filter((a) => a.status !== 'Sold').map((a, i) => (
              <Pressable key={a.id}
                onPress={() => { haptic.tap(); smoothLayout(); setF((x) => ({ ...x, asset_id: a.id, amount: x.amount || (a.rent_amount ? String(a.rent_amount) : '') })); setPicking(false); }}
                style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 11, borderTopWidth: i ? 0.5 : 0, borderTopColor: c.separator }, pressed && { backgroundColor: c.fill2 }]}>
                <IconTile name={ASSET_TYPES[a.type].icon} color={c[ASSET_TYPES[a.type].color]} size={30} />
                <View style={{ flex: 1 }}>
                  <Text style={[type.subhead, { color: c.text }]} numberOfLines={1}>{a.identifier}</Text>
                  <Text style={[type.footnote, { color: c.text2 }]}>{a.status}{a.rent_amount ? ` · ${moneyShort(a.rent_amount)}/month` : ''}</Text>
                </View>
                {a.id === f.asset_id ? <Ionicons name="checkmark" size={20} color={c.blue} /> : null}
              </Pressable>
            ))
          )}
        </Group>

        <Group>
          <MoneyField label="Amount received" value={f.amount} onChange={set('amount')} error={error.amount} />
          {f.income_type === 'Rent' ? (
            <FieldRow label="Rent for the month of">
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Pressable onPress={() => { haptic.tap(); set('period')(shiftMonth(f.period, -1)); }} hitSlop={10} style={{ padding: 4 }}>
                  <Ionicons name="chevron-back" size={22} color={c.blue} />
                </Pressable>
                <Text style={[type.headline, { color: c.text }]}>{monthLabel(f.period)}</Text>
                <Pressable onPress={() => { haptic.tap(); set('period')(shiftMonth(f.period, 1)); }} hitSlop={10} style={{ padding: 4 }}>
                  <Ionicons name="chevron-forward" size={22} color={c.blue} />
                </Pressable>
              </View>
            </FieldRow>
          ) : null}
          <DateField label="Date received" value={f.date} onChange={set('date')} maximumDate={new Date()} />
        </Group>

        <Group header="Note">
          <Input value={f.note} onChangeText={set('note')} placeholder="e.g. Paid by bank transfer" />
        </Group>

        {p.id ? (
          <Pressable onPress={remove} style={{ alignItems: 'center', padding: 20, marginTop: 10 }}>
            <Text style={{ color: c.red, fontSize: 17 }}>Delete payment</Text>
          </Pressable>
        ) : null}
      </Screen>
    </KeyboardAvoidingView>
  );
}
