import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { Screen, Chip, ChipRow, Segmented, Empty } from '../components/ui';
import AssetCard from '../components/AssetCard';
import AddMenu from '../components/AddMenu';
import { listAssets, getSettings } from '../db/repo';
import { useScope, SCOPE_TINT } from '../utils/scope';
import { ASSET_TYPES, TYPE_LIST, STATUSES, STATUS_LIST, STATUS_FLOW, TYPE_PLURAL } from '../constants';
import { moneyShort } from '../utils/format';

export default function AssetsScreen({ navigation, route }) {
  const { c, type } = useTheme();
  const { type: scope } = useScope();
  const accent = c[SCOPE_TINT[scope]];
  const [search, setSearch] = useState('');
  const [assetType, setAssetType] = useState('All');
  const [plan, setPlan] = useState('All');
  const [status, setStatus] = useState('All');
  const [assets, setAssets] = useState([]);
  const [alertPercent, setAlertPercent] = useState(15);

  // Overview can open this tab already filtered (e.g. "Renting")
  useEffect(() => {
    if (route.params?.plan) setPlan(route.params.plan);
    if (route.params?.status) setStatus(route.params.status);
  }, [route.params?.t]);

  const load = useCallback(async () => {
    setAssets(await listAssets({ search, type: scope === 'All' ? assetType : scope, status, plan }));
    setAlertPercent((await getSettings()).alert_percent);
  }, [search, assetType, status, plan, scope]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => { load(); }, [load]);

  const statuses = plan === 'All' ? STATUS_LIST : [...STATUS_FLOW[plan], ...(plan === 'Rent' ? ['Sold'] : [])];
  const value = assets.filter((a) => a.status !== 'Sold').reduce((s, a) => s + a.cost, 0);

  return (
    <Screen
      title={scope === 'All' ? 'Assets' : TYPE_PLURAL[scope]}
      right={<AddMenu navigation={navigation} scope={scope} accent={accent} />}
      headerExtra={
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: c.fill, borderRadius: 12, paddingHorizontal: 10, marginTop: 12, height: 38 }}>
            <Ionicons name="search" size={17} color={c.text2} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={scope === 'Vehicle' ? 'Vehicle number, make, model…' : scope === 'All' ? 'Address, vehicle number, tenant…' : 'Address, city, tenant…'}
              placeholderTextColor={c.text2}
              autoCapitalize="none"
              style={[type.body, { flex: 1, minWidth: 0, color: c.text, marginLeft: 6, padding: 0, outlineStyle: 'none' }]}
            />
            {search ? <Pressable onPress={() => setSearch('')} hitSlop={10}><Ionicons name="close-circle" size={17} color={c.text2} /></Pressable> : null}
          </View>
          <Segmented
            value={plan}
            onChange={(v) => { setPlan(v); setStatus('All'); }}
            style={{ marginTop: 12 }}
            options={[{ value: 'All', label: 'All' }, { value: 'Sale', label: 'For sale' }, { value: 'Rent', label: 'For rent' }]}
          />
        </>
      }
    >
      {scope === 'All' ? (
        <ChipRow style={{ paddingTop: 6 }}>
          <Chip label="All types" active={assetType === 'All'} onPress={() => setAssetType('All')} />
          {TYPE_LIST.map((t) => (
            <Chip key={t} label={t} icon={ASSET_TYPES[t].icon} color={c[ASSET_TYPES[t].color]} active={assetType === t} onPress={() => setAssetType(assetType === t ? 'All' : t)} />
          ))}
        </ChipRow>
      ) : null}
      <Text style={[type.footnote, { color: c.text2, marginHorizontal: 20, marginTop: 14, marginBottom: 10 }]}>
        {assets.length} {assets.length === 1 ? 'asset' : 'assets'} · tap one to see where the money went
      </Text>

      {assets.length === 0 ? (
        <Empty
          icon="albums-outline"
          title="Nothing found"
          message={search || status !== 'All' || plan !== 'All' ? 'Try a different search or filter.' : 'Add your first one with the + button.'}
          action="Add asset"
          onAction={() => navigation.navigate('AssetForm', { type: scope !== 'All' ? scope : undefined, plan: plan !== 'All' ? plan : undefined })}
        />
      ) : (
        <View style={{ backgroundColor: c.card, borderRadius: 18, marginHorizontal: 16, overflow: 'hidden' }}>
        {assets.map((a, i) => (
          <AssetCard
            key={`${a.id}-${a.direct_total}-${a.income_total}-${a.status}-${a.updated_at}`}
            asset={a}
            first={i === 0}
            onOpen={(x) => navigation.navigate('AssetDetail', { id: x.id })}
            onAddExpense={(x) => navigation.navigate('ExpenseForm', { asset_id: x.id })}
            onRecordRent={(x) => navigation.navigate('IncomeForm', { asset_id: x.id })}
          />
        ))}
        </View>
      )}
    </Screen>
  );
}
