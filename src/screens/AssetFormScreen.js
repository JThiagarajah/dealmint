import React, { useEffect, useLayoutEffect, useState } from 'react';
import { View, Text, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../theme';
import { Screen, Group, Input, Segmented, Chip, FieldRow, haptic } from '../components/ui';
import { DateField, MoneyField } from '../components/fields';
import { getAsset, saveAsset, findAssetByIdentifier } from '../db/repo';
import { ASSET_TYPES, TYPE_LIST, STATUSES, STATUS_FLOW, PLANS } from '../constants';
import { today, cleanNumber } from '../utils/format';

const EMPTY = {
  type: 'Land', identifier: '', title: '', city: '', purchase_price: '', purchase_date: today(),
  seller_name: '', deal_type: 'Sale', status: 'Purchased', asking_price: '', rent_amount: '',
  tenant_name: '', tenant_phone: '', rent_start: null, details: {}, notes: '',
};

export default function AssetFormScreen({ route, navigation }) {
  const { c, type } = useTheme();
  const id = route.params?.id;
  const [f, setF] = useState({
    ...EMPTY,
    type: route.params?.type || EMPTY.type,
    deal_type: route.params?.plan || EMPTY.deal_type,
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    getAsset(id).then((a) => a && setF({
      ...a,
      purchase_price: String(a.purchase_price || ''),
      asking_price: a.asking_price ? String(a.asking_price) : '',
      rent_amount: a.rent_amount ? String(a.rent_amount) : '',
      tenant_name: a.tenant_name || '', tenant_phone: a.tenant_phone || '',
      title: a.title || '', city: a.city || '', seller_name: a.seller_name || '', notes: a.notes || '',
    }));
  }, [id]);

  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));
  const setDetail = (k) => (v) => setF((p) => ({ ...p, details: { ...p.details, [k]: v } }));
  const t = ASSET_TYPES[f.type];

  const save = async () => {
    const e = {};
    const identifier = f.type === 'Vehicle' ? f.identifier.trim().toUpperCase() : f.identifier.trim();
    if (!identifier) e.identifier = `${t.idLabel} is required`;
    if (cleanNumber(f.purchase_price) <= 0) e.purchase_price = 'Enter the purchase price';
    if (identifier && !e.identifier) {
      const dup = await findAssetByIdentifier(identifier, id || '');
      if (dup) e.identifier = `An asset with this ${t.idLabel.toLowerCase()} already exists`;
    }
    setErrors(e);
    if (Object.keys(e).length) { haptic.warn(); return; }
    setSaving(true);
    const newId = await saveAsset({
      ...f,
      identifier,
      title: f.title.trim(), city: f.city.trim(), seller_name: f.seller_name.trim(), notes: f.notes.trim(),
      purchase_price: cleanNumber(f.purchase_price),
      asking_price: f.asking_price ? cleanNumber(f.asking_price) : null,
      rent_amount: f.rent_amount ? cleanNumber(f.rent_amount) : null,
      tenant_name: f.tenant_name.trim(), tenant_phone: f.tenant_phone.trim(),
    });
    haptic.success();
    if (id) navigation.goBack();
    else navigation.replace('AssetDetail', { id: newId });
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: id ? 'Edit Asset' : 'New Asset',
      headerLeft: () => (
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}><Text style={{ color: c.blue, fontSize: 17 }}>Cancel</Text></Pressable>
      ),
      headerRight: () => (
        <Pressable onPress={save} disabled={saving} hitSlop={10}><Text style={{ color: c.blue, fontSize: 17, fontWeight: '600' }}>Save</Text></Pressable>
      ),
    });
  });

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen contentStyle={{ paddingTop: 4 }}>
        <View style={{ marginHorizontal: 16, marginTop: 12 }}>
          <Segmented value={f.type} onChange={(v) => setF((p) => ({ ...p, type: v }))} options={TYPE_LIST} />
        </View>

        <Group header="Identification" footer={f.type === 'Vehicle' ? 'The vehicle number identifies this asset everywhere in the app.' : 'The address identifies this property everywhere in the app.'}>
          <Input label={t.idLabel} value={f.identifier} onChangeText={set('identifier')} placeholder={t.idPlaceholder}
            autoCapitalize={f.type === 'Vehicle' ? 'characters' : 'words'} error={errors.identifier} />
          <Input label="Short description" value={f.title} onChangeText={set('title')}
            placeholder={f.type === 'Vehicle' ? 'e.g. Toyota Aqua 2014' : f.type === 'House' ? 'e.g. 3 bedroom house' : 'e.g. 15 perch residential land'} />
          <Input label="City / area" value={f.city} onChangeText={set('city')} placeholder="e.g. Nugegoda" />
        </Group>

        <Group header="Purchase">
          <MoneyField label="Purchase price" value={f.purchase_price} onChange={set('purchase_price')} error={errors.purchase_price} />
          <DateField label="Purchase date" value={f.purchase_date} onChange={set('purchase_date')} maximumDate={new Date()} />
          <Input label="Bought from (seller)" value={f.seller_name} onChangeText={set('seller_name')} placeholder="Optional" />
        </Group>

        <Group header="Plan" footer={f.deal_type === 'Rent'
          ? 'Rent out: earn monthly income. Running costs are taken from the rent each month.'
          : 'Sell: profit = sale price − purchase price − all expenses.'}>
          <FieldRow>
            <Segmented
              value={f.deal_type}
              onChange={(v) => setF((p) => ({ ...p, deal_type: v, status: STATUS_FLOW[v].includes(p.status) ? p.status : 'Purchased' }))}
              options={[{ value: 'Sale', label: `${PLANS.Sale.label} for profit` }, { value: 'Rent', label: f.type === 'Vehicle' ? 'Rent / hire out' : 'Rent out' }]}
            />
          </FieldRow>
          {f.deal_type === 'Sale'
            ? <MoneyField label="Asking price" value={f.asking_price} onChange={set('asking_price')} />
            : <MoneyField label={f.type === 'Vehicle' ? 'Monthly rent / hire' : 'Monthly rent'} value={f.rent_amount} onChange={set('rent_amount')} />}
          {f.status !== 'Sold' ? (
            <FieldRow label="Status">
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                {STATUS_FLOW[f.deal_type].filter((s) => s !== 'Sold').map((s) => (
                  <Chip key={s} label={s} color={c[STATUSES[s].color]} active={f.status === s} onPress={() => set('status')(s)} />
                ))}
              </View>
            </FieldRow>
          ) : null}
        </Group>

        {f.deal_type === 'Rent' && f.status === 'Rented' ? (
          <Group header="Tenant" footer="Rent is due on the same day every month as the start date.">
            <Input label={f.type === 'Vehicle' ? 'Hired by' : 'Tenant name'} value={f.tenant_name} onChangeText={set('tenant_name')} placeholder="e.g. Mr. N. Silva" />
            <Input label="Phone" value={f.tenant_phone} onChangeText={set('tenant_phone')} placeholder="Optional" keyboardType="phone-pad" />
            <DateField label="Rent start date" value={f.rent_start || today()} onChange={set('rent_start')} />
          </Group>
        ) : null}

        <Group header={`${f.type} details`}>
          {t.fields.map((fl) => fl.options ? (
            <FieldRow key={fl.key} label={fl.label}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                {fl.options.map((o) => (
                  <Chip key={o} label={o} active={f.details[fl.key] === o} onPress={() => setDetail(fl.key)(f.details[fl.key] === o ? '' : o)} />
                ))}
              </View>
            </FieldRow>
          ) : (
            <Input key={fl.key} label={fl.label} value={String(f.details[fl.key] || '')} onChangeText={setDetail(fl.key)}
              placeholder={fl.placeholder} keyboardType={fl.numeric ? 'number-pad' : 'default'} />
          ))}
        </Group>

        <Group header="Notes">
          <Input value={f.notes} onChangeText={set('notes')} placeholder="Anything worth remembering" multiline />
        </Group>
      </Screen>
    </KeyboardAvoidingView>
  );
}
