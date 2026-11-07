// Overview for the chosen category. One number, what needs attention, and your assets.
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { Screen, Card, SectionHeader, IconTile, Touchable, Button } from '../components/ui';
import { Loading } from '../components/rows';
import { AssetRowBody } from '../components/AssetCard';
import AddMenu from '../components/AddMenu';
import { getOverview, listAssets } from '../db/repo';
import useFocusData from '../utils/useFocusData';
import { useScope, SCOPE_TINT } from '../utils/scope';
import { money, moneyShort, monthName } from '../utils/format';
import { TYPE_PLURAL } from '../constants';

export default function OverviewScreen({ navigation }) {
  const { c, type } = useTheme();
  const { type: scope } = useScope();
  const [d] = useFocusData(async () => ({
    ...(await getOverview(scope)),
    assets: (await listAssets({ type: scope })).filter((a) => a.status !== 'Sold'),
  }), [scope]);
  const accent = c[SCOPE_TINT[scope]];

  if (!d) return <Loading />;
  const s = d.sum;
  const m = d.month;
  const all = scope === 'All';
  const shown = d.assets.slice(0, 6);
  const attention = d.due.length + d.over.length;

  return (
    <Screen
      title={TYPE_PLURAL[scope]}
      onBack={() => navigation.navigate('Home')}
      backLabel="Dealmint"
      accent={accent}
      right={<AddMenu navigation={navigation} scope={scope} accent={accent} />}
    >
      {/* The one number that matters */}
      <Card style={{ marginHorizontal: 16, marginTop: 10, paddingVertical: 20 }} onPress={() => navigation.navigate('Reports')}>
        <Text style={[type.subhead, { color: c.text2 }]}>{all ? 'Net profit' : 'Profit'} in {monthName(new Date().getMonth())}</Text>
        <Text style={[type.numberXL, { color: m.net > 0 ? c.green : m.net < 0 ? c.red : c.text, marginTop: 2 }]} numberOfLines={1} adjustsFontSizeToFit>
          {money(m.net, { sign: true })}
        </Text>
        <Text style={[type.footnote, { color: c.text2, marginTop: 6 }]}>
          {moneyShort(s.invested)} invested  ·  {s.held} {s.held === 1 ? 'asset' : 'assets'}
        </Text>
      </Card>

      {/* Needs attention — only when there is something */}
      {attention ? (
        <>
          <SectionHeader title="Needs attention" />
          <Card style={{ marginHorizontal: 16 }} padded={false}>
            {d.due.map((a, i) => (
              <Row key={a.id} first={i === 0} icon="alarm" color={c.red}
                title={a.identifier} sub={`Rent of ${moneyShort(a.rent_amount)} is due`}
                action="Record" actionColor={c.teal}
                onPress={() => navigation.navigate('AssetDetail', { id: a.id })}
                onAction={() => navigation.navigate('IncomeForm', { asset_id: a.id })} />
            ))}
            {d.over.map((a, i) => (
              <Row key={a.id} first={i === 0 && !d.due.length} icon="warning" color={c.orange}
                title={a.identifier} sub={`Costs reached ${a.expense_ratio.toFixed(0)}% of the price`}
                onPress={() => navigation.navigate('AssetDetail', { id: a.id })} />
            ))}
          </Card>
        </>
      ) : null}

      {/* Your assets */}
      <SectionHeader
        title={all ? 'Your assets' : `Your ${TYPE_PLURAL[scope].toLowerCase()}`}
        action={d.assets.length > shown.length ? `See all ${d.assets.length}` : 'See all'}
        onAction={() => navigation.navigate('Assets')}
      />
      {shown.length ? (
        <Card style={{ marginHorizontal: 16 }} padded={false}>
          {shown.map((a, i) => (
            <Pressable key={a.id} onPress={() => navigation.navigate('AssetDetail', { id: a.id })}
              style={({ pressed }) => [{ borderTopWidth: i ? 0.5 : 0, borderTopColor: c.separator }, pressed && { backgroundColor: c.fill2 }]}>
              <AssetRowBody a={a} />
            </Pressable>
          ))}
        </Card>
      ) : (
        <Card style={{ marginHorizontal: 16, alignItems: 'center', paddingVertical: 28 }}>
          <Ionicons name="add-circle-outline" size={36} color={c.text3} />
          <Text style={[type.subhead, { color: c.text2, marginTop: 8, marginBottom: 14 }]}>Nothing here yet</Text>
          <Button title="Add your first one" kind="tinted" color={accent}
            onPress={() => navigation.navigate('AssetForm', all ? {} : { type: scope })} />
        </Card>
      )}
    </Screen>
  );
}

function Row({ first, icon, color, title, sub, action, actionColor, onPress, onAction }) {
  const { c, type } = useTheme();
  return (
    <Pressable onPress={onPress}
      style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 13, borderTopWidth: first ? 0 : 0.5, borderTopColor: c.separator }, pressed && { backgroundColor: c.fill2 }]}>
      <IconTile name={icon} color={color} size={34} />
      <View style={{ flex: 1 }}>
        <Text style={[type.subhead, { color: c.text, fontWeight: '600' }]} numberOfLines={1}>{title}</Text>
        <Text style={[type.footnote, { color: c.text2 }]} numberOfLines={1}>{sub}</Text>
      </View>
      {action ? (
        <Touchable onPress={onAction} haptics style={{ backgroundColor: actionColor + '22', borderRadius: 99, paddingHorizontal: 14, paddingVertical: 7 }}>
          <Text style={{ color: actionColor, fontWeight: '700', fontSize: 14 }}>{action}</Text>
        </Touchable>
      ) : (
        <Ionicons name="chevron-forward" size={17} color={c.text3} />
      )}
    </Pressable>
  );
}
