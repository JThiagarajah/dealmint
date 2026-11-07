// The "+" menu: new asset, expense, rent received, overhead
import React, { useState } from 'react';
import { useTheme } from '../theme';
import ActionSheet from './ActionSheet';
import { CircleButton } from './ui';
import { TYPE_PLURAL } from '../constants';

export default function AddMenu({ navigation, scope, accent }) {
  const { c } = useTheme();
  const [open, setOpen] = useState(false);
  const typed = scope !== 'All';
  const options = [
    { label: typed ? `New ${scope.toLowerCase()}` : 'New asset', sub: 'Something you just bought', icon: 'add-circle', color: c.blue,
      onPress: () => navigation.navigate('AssetForm', typed ? { type: scope } : {}) },
    { label: 'Add expense', sub: 'Money spent on one asset', icon: 'receipt', color: c.orange,
      onPress: () => navigation.navigate('ExpenseForm', { scope }) },
    { label: 'Rent received', sub: 'Record rent or hire income', icon: 'key', color: c.teal,
      onPress: () => navigation.navigate('IncomeForm', { scope }) },
    { label: 'Overhead', sub: 'Fuel, phone, rent, staff', icon: 'business', color: c.indigo,
      onPress: () => navigation.navigate('ExpenseForm', { expense_type: 'Indirect' }) },
  ];
  return (
    <>
      <CircleButton icon="add" filled color={accent} onPress={() => setOpen(true)} />
      <ActionSheet visible={open} onClose={() => setOpen(false)} title={TYPE_PLURAL[scope]} options={options} />
    </>
  );
}
