// Date and money inputs that work on Android, iOS and web
import React, { useState } from 'react';
import { View, Text, Pressable, Platform, TextInput } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { FieldRow } from './ui';
import { prettyDate, parseDate, toISODate, groupDigits, today } from '../utils/format';

export function DateField({ label, value, onChange, maximumDate }) {
  const { c, type, isDark } = useTheme();
  const [open, setOpen] = useState(false);

  if (Platform.OS === 'web') {
    return (
      <FieldRow label={label}>
        {React.createElement('input', {
          type: 'date',
          value,
          max: maximumDate ? toISODate(maximumDate) : undefined,
          onChange: (e) => e.target.value && onChange(e.target.value),
          style: { fontSize: 17, border: 'none', width: '100%', boxSizing: 'border-box', minWidth: 0, background: 'transparent', color: c.text, padding: 0, fontFamily: 'system-ui, -apple-system, Roboto, sans-serif', colorScheme: isDark ? 'dark' : 'light' },
        })}
      </FieldRow>
    );
  }

  return (
    <FieldRow label={label}>
      <Pressable onPress={() => setOpen(!open)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={[type.body, { color: c.text }]}>{prettyDate(value)}{value === today() ? '  ·  Today' : ''}</Text>
        <View style={{ backgroundColor: c.fill, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}>
          <Ionicons name="calendar" size={16} color={c.blue} />
        </View>
      </Pressable>
      {open ? (
        <DateTimePicker
          value={parseDate(value)}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          maximumDate={maximumDate}
          themeVariant={isDark ? 'dark' : 'light'}
          onChange={(event, d) => {
            if (Platform.OS === 'android') setOpen(false);
            if (event.type === 'set' && d) onChange(toISODate(d));
            if (Platform.OS === 'ios' && d) onChange(toISODate(d));
          }}
        />
      ) : null}
    </FieldRow>
  );
}

// Big amount field with thousands separators: "Rs. 1,250,000"
export function MoneyField({ label, value, onChange, error, autoFocus }) {
  const { c, type } = useTheme();
  return (
    <FieldRow label={label}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={[type.title2, { color: c.text2, marginRight: 8 }]}>Rs.</Text>
        <TextInput
          value={groupDigits(value)}
          onChangeText={(t) => onChange(t.replace(/[^0-9]/g, ''))}
          keyboardType="number-pad"
          placeholder="0"
          autoFocus={autoFocus}
          placeholderTextColor={c.text3}
          style={[type.title2, { color: c.text, flex: 1, minWidth: 0, padding: 0, fontVariant: ['tabular-nums'], outlineStyle: 'none' }]}
        />
      </View>
      {error ? <Text style={[type.footnote, { color: c.red, marginTop: 4 }]}>{error}</Text> : null}
    </FieldRow>
  );
}
