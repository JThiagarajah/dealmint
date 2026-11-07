import React, { useEffect, useLayoutEffect, useState } from 'react';
import { View, Text, Pressable, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { Screen, Group, Input, Segmented, Chip, FieldRow, IconTile, haptic } from '../components/ui';
import { DateField, MoneyField } from '../components/fields';
import { smoothLayout } from '../components/AssetCard';
import { getExpense, saveExpense, deleteExpense, listAssets } from '../db/repo';
import { confirm } from '../utils/confirm';
import { ASSET_TYPES, DIRECT_CATEGORIES, INDIRECT_CATEGORIES, PHASES, PHASE_LIST } from '../constants';
import { today, cleanNumber, moneyShort } from '../utils/format';

export default function ExpenseFormScreen({ route, navigation }) {
  const { c, type } = useTheme();
  const p = route.params || {};
  const [f, setF] = useState({
    expense_type: p.expense_type || 'Direct',
    asset_id: p.asset_id || null,
    phase: 'Acquisition',
    category: '',
    amount: '',
    date: today(),
    note: '',
  });
  const [assets, setAssets] = useState([]);
  const [picking, setPicking] = useState(!p.asset_id && (p.expense_type || 'Direct') === 'Direct');
  const [q, setQ] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    listAssets({ type: p.scope && p.scope !== 'All' ? p.scope : 'All' }).then(setAssets);
    if (p.id) getExpense(p.id).then((e) => {
      if (!e) return;
      setF({ ...e, amount: String(e.amount), note: e.note || '', phase: e.phase || 'Acquisition' });
      setPicking(false);
    });
  }, [p.id]);

  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  const isDirect = f.expense_type === 'Direct';
  const selected = assets.find((a) => a.id === f.asset_id);
  const cats = isDirect ? DIRECT_CATEGORIES : INDIRECT_CATEGORIES;

  const chooseCategory = (cat) => {
    haptic.tap();
    setF((x) => ({ ...x, category: cat.name, phase: isDirect && cat.phase ? cat.phase : x.phase }));
  };

  const save = async () => {
    const e = {};
    if (isDirect && !f.asset_id) e.asset = 'Choose which asset this expense belongs to';
    if (!f.category) e.category = 'Choose a category';
    if (cleanNumber(f.amount) <= 0) e.amount = 'Enter an amount';
    setErrors(e);
    if (Object.keys(e).length) { haptic.warn(); return; }
    await saveExpense({ ...f, amount: cleanNumber(f.amount), note: f.note.trim() });
    haptic.success();
    navigation.goBack();
  };

  const remove = async () => {
    if (!(await confirm('Delete expense?', 'This cannot be undone.', { okText: 'Delete', destructive: true }))) return;
    await deleteExpense(p.id);
    navigation.goBack();
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: p.id ? 'Edit Expense' : 'New Expense',
      headerLeft: () => <Pressable onPress={() => navigation.goBack()} hitSlop={10}><Text style={{ color: c.blue, fontSize: 17 }}>Cancel</Text></Pressable>,
      headerRight: () => <Pressable onPress={save} hitSlop={10}><Text style={{ color: c.blue, fontSize: 17, fontWeight: '600' }}>Save</Text></Pressable>,
    });
  });

  const filtered = assets
    .filter((a) => a.status !== 'Sold' || a.id === f.asset_id)
    .filter((a) => !q || `${a.identifier} ${a.title} ${a.city}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen contentStyle={{ paddingTop: 4 }}>
        <View style={{ marginHorizontal: 16, marginTop: 12 }}>
          <Segmented
            value={f.expense_type}
            onChange={(v) => { smoothLayout(); setF((x) => ({ ...x, expense_type: v, category: '' })); setPicking(v === 'Direct' && !f.asset_id); }}
            options={[{ value: 'Direct', label: 'Direct · one asset' }, { value: 'Indirect', label: 'Indirect · overhead' }]}
          />
          <Text style={[type.footnote, { color: c.text2, marginTop: 8, marginHorizontal: 4 }]}>
            {isDirect
              ? 'Belongs to one asset. Counted in that asset’s profit.'
              : 'Running the business (fuel, phone, rent, staff). Deducted from total profit at month end.'}
          </Text>
        </View>

        <Group>
          <MoneyField label="Amount" value={f.amount} onChange={set('amount')} error={errors.amount} autoFocus={!p.id} />
          <DateField label="Date" value={f.date} onChange={set('date')} maximumDate={new Date()} />
        </Group>

        {isDirect ? (
          <Group header="Asset" footer={errors.asset}>
            {selected && !picking ? (
              <Pressable onPress={() => { smoothLayout(); setPicking(true); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}>
                <IconTile name={ASSET_TYPES[selected.type].icon} color={c[ASSET_TYPES[selected.type].color]} size={36} />
                <View style={{ flex: 1 }}>
                  <Text style={[type.subhead, { color: c.text, fontWeight: '600' }]} numberOfLines={1}>{selected.identifier}</Text>
                  <Text style={[type.footnote, { color: c.text2 }]}>{selected.status} · spent so far {moneyShort(selected.direct_total)}</Text>
                </View>
                <Text style={{ color: c.blue, fontSize: 15 }}>Change</Text>
              </Pressable>
            ) : (
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: c.fill, borderRadius: 10, margin: 10, paddingHorizontal: 10, height: 36 }}>
                  <Ionicons name="search" size={16} color={c.text2} />
                  <TextInput value={q} onChangeText={setQ} placeholder="Search address or vehicle number" placeholderTextColor={c.text2}
                    style={[type.subhead, { flex: 1, marginLeft: 6, color: c.text, padding: 0, outlineStyle: 'none' }]} />
                </View>
                {filtered.map((a) => (
                  <Pressable key={a.id} onPress={() => { haptic.tap(); smoothLayout(); set('asset_id')(a.id); setPicking(false); }}
                    style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 0.5, borderTopColor: c.separator }, pressed && { backgroundColor: c.fill2 }]}>
                    <IconTile name={ASSET_TYPES[a.type].icon} color={c[ASSET_TYPES[a.type].color]} size={30} />
                    <View style={{ flex: 1 }}>
                      <Text style={[type.subhead, { color: c.text }]} numberOfLines={1}>{a.identifier}</Text>
                      <Text style={[type.footnote, { color: c.text2 }]}>{a.status}</Text>
                    </View>
                    {a.id === f.asset_id ? <Ionicons name="checkmark" size={20} color={c.blue} /> : null}
                  </Pressable>
                ))}
              </View>
            )}
          </Group>
        ) : null}

        <Group header="Category" footer={errors.category}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', padding: 8 }}>
            {cats.map((cat) => {
              const active = f.category === cat.name;
              const col = isDirect ? c[PHASES[cat.phase].color] : c.indigo;
              return (
                <View key={cat.name} style={{ width: '33.33%', padding: 4 }}>
                  <Pressable onPress={() => chooseCategory(cat)}
                    style={{ alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4, borderRadius: 14, backgroundColor: active ? col + '1F' : c.card2, borderWidth: 1.5, borderColor: active ? col : 'transparent' }}>
                    <Ionicons name={cat.icon} size={22} color={active ? col : c.text2} />
                    <Text style={{ fontSize: 12, fontWeight: '600', color: active ? col : c.text, marginTop: 5, textAlign: 'center' }} numberOfLines={2}>{cat.name}</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </Group>

        {isDirect ? (
          <Group header="Phase" footer="Suggested from the category. Change it if needed.">
            <FieldRow>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {PHASE_LIST.map((ph) => (
                  <Chip key={ph} label={ph} icon={PHASES[ph].icon} color={c[PHASES[ph].color]} active={f.phase === ph} onPress={() => set('phase')(ph)} />
                ))}
              </View>
            </FieldRow>
          </Group>
        ) : null}

        <Group header="Note">
          <Input value={f.note} onChangeText={set('note')} placeholder="e.g. Plumber – kitchen sink" />
        </Group>

        {p.id ? (
          <Pressable onPress={remove} style={{ alignItems: 'center', padding: 20, marginTop: 10 }}>
            <Text style={{ color: c.red, fontSize: 17 }}>Delete expense</Text>
          </Pressable>
        ) : null}
      </Screen>
    </KeyboardAvoidingView>
  );
}
