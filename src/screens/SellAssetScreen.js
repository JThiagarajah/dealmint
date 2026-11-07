import React, { useEffect, useLayoutEffect, useState } from 'react';
import { View, Text, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../theme';
import { Screen, Group, Input, Card, Button, IconTile, haptic } from '../components/ui';
import { DateField, MoneyField } from '../components/fields';
import { getAsset, sellAsset, saveExpense } from '../db/repo';
import { ASSET_TYPES } from '../constants';
import { today, cleanNumber, money, percent, daysBetween } from '../utils/format';

export default function SellAssetScreen({ route, navigation }) {
  const { c, type } = useTheme();
  const { id } = route.params;
  const [a, setA] = useState(null);
  const [price, setPrice] = useState('');
  const [commission, setCommission] = useState('');
  const [date, setDate] = useState(today());
  const [buyer, setBuyer] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    getAsset(id).then((x) => { setA(x); if (x?.asking_price) setPrice(String(x.asking_price)); });
  }, [id]);

  const sale = cleanNumber(price);
  const comm = cleanNumber(commission);
  const cost = a ? a.cost + comm : 0;
  const income = a ? a.income_total : 0;
  const profit = sale + income - cost;
  const roi = cost > 0 ? (profit / cost) * 100 : 0;
  const good = profit >= 0;

  const confirmSale = async () => {
    if (sale <= 0) { setError('Enter the sale price'); haptic.warn(); return; }
    if (comm > 0) {
      await saveExpense({ expense_type: 'Direct', asset_id: id, phase: 'Sale', category: 'Sales Commission', amount: comm, date, note: 'Added when selling' });
    }
    await sellAsset(id, { sale_price: sale, sale_date: date, buyer_name: buyer.trim(), buyer_phone: phone.trim() });
    haptic.success();
    navigation.goBack();
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => <Pressable onPress={() => navigation.goBack()} hitSlop={10}><Text style={{ color: c.blue, fontSize: 17 }}>Cancel</Text></Pressable>,
    });
  }, [navigation, c.blue]);

  if (!a) return null;
  const t = ASSET_TYPES[a.type];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen contentStyle={{ paddingTop: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 20, marginTop: 14 }}>
          <IconTile name={t.icon} color={c[t.color]} size={40} />
          <View style={{ flex: 1 }}>
            <Text style={[type.headline, { color: c.text }]} numberOfLines={2}>{a.identifier}</Text>
            <Text style={[type.footnote, { color: c.text2 }]}>Total cost so far {money(a.cost)}</Text>
          </View>
        </View>

        <Group header="Sale">
          <MoneyField label="Sale price" value={price} onChange={(v) => { setPrice(v); setError(''); }} error={error} />
          <DateField label="Sale date" value={date} onChange={setDate} maximumDate={new Date()} />
          <MoneyField label="Sales commission (optional)" value={commission} onChange={setCommission} />
        </Group>

        <Group header="Buyer">
          <Input label="Buyer name" value={buyer} onChangeText={setBuyer} placeholder="Optional" />
          <Input label="Phone" value={phone} onChangeText={setPhone} placeholder="Optional" keyboardType="phone-pad" />
        </Group>

        {/* Live profit preview */}
        <Card style={{ marginHorizontal: 16, marginTop: 20, backgroundColor: sale > 0 ? (good ? c.green : c.red) + '14' : c.card }}>
          <Text style={[type.footnote, { color: c.text2, fontWeight: '600' }]}>{good ? 'You will make' : 'You will lose'}</Text>
          <Text style={[type.numberXL, { color: sale > 0 ? (good ? c.green : c.red) : c.text3 }]} numberOfLines={1} adjustsFontSizeToFit>
            {sale > 0 ? money(profit, { sign: true }) : 'Rs. —'}
          </Text>
          <View style={{ marginTop: 12, gap: 8 }}>
            <Row label="Sale price" value={money(sale)} />
            <Row label="Purchase price" value={`− ${money(a.purchase_price)}`} />
            <Row label="Expenses" value={`− ${money(a.direct_total + comm)}`} />
            {income ? <Row label="Rent already received" value={`+ ${money(income)}`} /> : null}
            <View style={{ height: 0.5, backgroundColor: c.separator }} />
            <Row label="Return on investment" value={sale > 0 ? percent(roi) : '—'} />
            <Row label="Days held" value={`${Math.max(0, daysBetween(a.purchase_date, date))} days`} />
          </View>
        </Card>

        <Button title="Confirm sale" icon="checkmark-circle" color={c.green} onPress={confirmSale} style={{ marginHorizontal: 16, marginTop: 20 }} />
        <Text style={[type.footnote, { color: c.text2, textAlign: 'center', marginTop: 10, marginHorizontal: 30 }]}>
          Overhead (indirect costs) is deducted from your total profit in the month-end report.
        </Text>
      </Screen>
    </KeyboardAvoidingView>
  );
}

function Row({ label, value }) {
  const { c, type } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={[type.subhead, { color: c.text2 }]}>{label}</Text>
      <Text style={[type.subhead, { color: c.text, fontWeight: '600', fontVariant: ['tabular-nums'] }]}>{value}</Text>
    </View>
  );
}
