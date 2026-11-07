// Shared list rows used on several screens
import React from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme';
import { IconTile } from './ui';
import { categoryIcon } from '../constants';
import { money, relativeDay } from '../utils/format';

// One money movement: purchase, sale, rent received, direct or indirect expense
export function ActivityRow({ r, first, onPress, hideDate }) {
  const { c, type } = useTheme();
  const meta = {
    purchase: { icon: 'bag-handle', color: c.blue, title: `Bought · ${r.label}` },
    sale: { icon: 'checkmark-circle', color: c.green, title: `Sold · ${r.label}` },
    income: { icon: 'key', color: c.teal, title: `${r.label} received` },
    direct: { icon: categoryIcon('Direct', r.label), color: c.orange, title: r.label },
    indirect: { icon: categoryIcon('Indirect', r.label), color: c.indigo, title: r.label },
  }[r.kind];
  const sub = r.kind === 'indirect' ? [r.note, 'Overhead'] :
    r.kind === 'direct' || r.kind === 'income' ? [r.note, r.sub] : [r.note || r.sub];
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12, borderTopWidth: first ? 0 : 0.5, borderTopColor: c.separator }, pressed && { backgroundColor: c.fill2 }]}>
      <IconTile name={meta.icon} color={meta.color} size={32} />
      <View style={{ flex: 1 }}>
        <Text style={[type.subhead, { color: c.text, fontWeight: '500' }]} numberOfLines={1}>{meta.title}</Text>
        <Text style={[type.footnote, { color: c.text2 }]} numberOfLines={1}>{sub.filter(Boolean).join(' · ')}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[type.subhead, { color: r.amount >= 0 ? c.green : c.text, fontWeight: '600', fontVariant: ['tabular-nums'] }]}>
          {money(r.amount, { sign: true })}
        </Text>
        {hideDate ? null : <Text style={[type.caption, { color: c.text3 }]}>{relativeDay(r.date)}</Text>}
      </View>
    </Pressable>
  );
}

export function Loading() {
  const { c } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bg }}>
      <ActivityIndicator color={c.blue} />
    </View>
  );
}

// Opens the right screen for a movement row
export function openMovement(navigation, e) {
  if (e.kind === 'direct' || e.kind === 'indirect') navigation.navigate('ExpenseForm', { id: e.ref });
  else if (e.kind === 'income') navigation.navigate('IncomeForm', { id: e.ref });
  else navigation.navigate('AssetDetail', { id: e.asset_id });
}
