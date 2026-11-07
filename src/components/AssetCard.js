// One asset as a simple row: icon, address / vehicle number, one status line, one number.
// Tap to expand (when expandable): pie chart of where the money went + key numbers.
import React, { useState } from 'react';
import { View, Text, Pressable, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { ASSET_TYPES, PHASES, PHASE_LIST } from '../constants';
import { IconTile, Segmented, Touchable, haptic } from './ui';
import { Donut } from './charts';
import { money, moneyShort, percent, prettyDate } from '../utils/format';
import { getAssetExpenses, groupSum } from '../db/repo';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental && !global.nativeFabricUIManager) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Smooth, no-bounce expand (critically damped)
export const smoothLayout = () =>
  LayoutAnimation.configureNext({
    duration: 300,
    create: { type: 'easeInEaseOut', property: 'opacity' },
    update: { type: 'spring', springDamping: 1 },
    delete: { type: 'easeInEaseOut', property: 'opacity' },
  });

export function assetSubtitle(a) {
  const d = a.details || {};
  if (a.type === 'Vehicle') return [d.make, d.model, d.year].filter(Boolean).join(' ') || a.title;
  if (a.type === 'House') return [a.title, d.bedrooms ? `${d.bedrooms} bed` : null].filter(Boolean).join(' · ') || a.title;
  return [a.title, d.extent ? `${d.extent} perches` : null].filter(Boolean).join(' · ') || a.title;
}

// One short line with the status and the number that matters for it
export function statusLine(a) {
  if (a.status === 'Sold') return `Sold · ${moneyShort(a.profit, { sign: true })} profit`;
  if (a.status === 'Rented') return a.rent_amount ? `Rented · ${moneyShort(a.rent_amount)} a month` : 'Rented';
  if (a.status === 'Vacant') return a.rent_amount ? `Vacant · ${moneyShort(a.rent_amount)} a month` : 'Vacant';
  const plan = a.deal_type === 'Rent' ? 'to rent out' : a.asking_price ? `asking ${moneyShort(a.asking_price)}` : 'to sell';
  return a.status === 'Listed' ? `For sale · ${plan}` : `${a.status} · ${plan}`;
}

const STATUS_DOT = { Purchased: 'blue', 'Under Repair': 'orange', Listed: 'purple', Vacant: 'teal', Rented: 'indigo', Sold: 'green' };

export function AssetRowBody({ a, open, chevron = 'forward' }) {
  const { c, type } = useTheme();
  const t = ASSET_TYPES[a.type];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, gap: 12 }}>
      <IconTile name={t.icon} color={c[t.color]} size={38} />
      <View style={{ flex: 1 }}>
        <Text style={[type.subhead, { color: c.text, fontWeight: '600' }]} numberOfLines={1}>{a.identifier}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: c[STATUS_DOT[a.status]] }} />
          <Text style={[type.footnote, { color: c.text2, flex: 1 }]} numberOfLines={1}>{statusLine(a)}</Text>
        </View>
      </View>
      <Ionicons name={chevron === 'expand' ? (open ? 'chevron-up' : 'chevron-down') : 'chevron-forward'} size={17} color={c.text3} />
    </View>
  );
}

export default function AssetCard({ asset: a, onOpen, onAddExpense, onRecordRent, first }) {
  const { c, type, chart } = useTheme();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState(null);
  const [by, setBy] = useState('phase');
  const sold = a.status === 'Sold';
  const renting = a.deal_type === 'Rent' && !sold;

  const toggle = async () => {
    haptic.tap();
    if (!rows) setRows(await getAssetExpenses(a.id));
    smoothLayout();
    setOpen(!open);
  };

  const pieData = !rows ? [] : by === 'phase'
    ? PHASE_LIST.map((p) => ({ label: p, value: rows.filter((r) => r.phase === p).reduce((s, r) => s + r.amount, 0), color: c[PHASES[p].color] })).filter((d) => d.value > 0)
    : groupSum(rows, 'category').map((d, i) => ({ ...d, color: chart(i) }));

  const result = sold ? a.profit : renting ? a.net_rent : a.expected_profit;
  const resultColor = result === null ? c.text : result >= 0 ? c.green : c.red;

  return (
    <View style={{ borderTopWidth: first ? 0 : 0.5, borderTopColor: c.separator }}>
      <Pressable onPress={toggle} style={({ pressed }) => pressed && { backgroundColor: c.fill2 }}>
        <AssetRowBody a={a} open={open} chevron="expand" />
      </Pressable>

      {open ? (
        <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
          <Segmented
            value={by}
            onChange={setBy}
            options={[{ value: 'phase', label: 'By phase' }, { value: 'category', label: 'By category' }]}
            style={{ marginBottom: 14 }}
          />
          {pieData.length
            ? <Donut compact size={124} thickness={16} centerTitle="Expenses" data={pieData} />
            : <Text style={[type.subhead, { color: c.text2, textAlign: 'center', paddingVertical: 16 }]}>No expenses yet</Text>}

          <View style={{ flexDirection: 'row', marginTop: 16, gap: 8 }}>
            {renting ? (
              <>
                <Fig label="Invested" value={moneyShort(a.invested)} />
                <Fig label="Rent received" value={moneyShort(a.income_total)} />
                <Fig label="Net earned" value={moneyShort(a.net_rent, { sign: true })} color={resultColor} />
              </>
            ) : (
              <>
                <Fig label="Total cost" value={moneyShort(a.cost)} />
                <Fig label={sold ? 'Sold for' : 'Asking'} value={sold ? moneyShort(a.sale_price) : a.asking_price ? moneyShort(a.asking_price) : '—'} />
                <Fig label={sold ? 'Profit' : 'Expected'} value={result === null ? '—' : moneyShort(result, { sign: true })} color={resultColor} />
              </>
            )}
          </View>

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
            {renting ? <SmallBtn icon="key" label="Rent in" color={c.teal} onPress={() => onRecordRent(a)} /> : null}
            {!sold ? <SmallBtn icon="add" label="Expense" color={c.blue} onPress={() => onAddExpense(a)} /> : null}
            <SmallBtn icon="arrow-forward" label="Details" color={c.blue} filled onPress={() => onOpen(a)} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

function Fig({ label, value, color }) {
  const { c, type } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: c.card2, borderRadius: 12, padding: 10 }}>
      <Text style={[type.caption, { color: c.text2 }]} numberOfLines={1}>{label}</Text>
      <Text style={[type.subhead, { color: color || c.text, fontWeight: '700', fontVariant: ['tabular-nums'], marginTop: 2 }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function SmallBtn({ icon, label, color, filled, onPress }) {
  return (
    <Touchable onPress={onPress} haptics style={{ flex: 1, flexDirection: 'row', gap: 5, alignItems: 'center', justifyContent: 'center', backgroundColor: filled ? color : color + '1F', borderRadius: 12, paddingVertical: 11 }}>
      <Ionicons name={icon} size={16} color={filled ? '#fff' : color} />
      <Text style={{ color: filled ? '#fff' : color, fontWeight: '600', fontSize: 15 }}>{label}</Text>
    </Touchable>
  );
}
