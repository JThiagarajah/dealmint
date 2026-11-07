// First screen: just one question — what would you like to work on?
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { Screen, CircleButton, IconTile, haptic } from '../components/ui';
import { Loading } from '../components/rows';
import { getHomeSummary } from '../db/repo';
import useFocusData from '../utils/useFocusData';
import { SCOPE_ICON, SCOPE_TINT } from '../utils/scope';
import { TYPE_PLURAL } from '../constants';
import { longToday } from '../utils/format';

const CHOICES = ['House', 'Land', 'Vehicle', 'All'];
const NOUN = { House: 'house', Land: 'plot', Vehicle: 'vehicle', All: 'asset' };

export default function HomeScreen({ navigation }) {
  const { c, type } = useTheme();
  const [d] = useFocusData(getHomeSummary);
  if (!d) return <Loading />;

  const countLine = (t) => {
    const s = d.types[t];
    if (!s.count) return 'Nothing added yet';
    const n = s.held;
    return `${n} ${NOUN[t]}${n === 1 ? '' : 's'}`;
  };

  return (
    <Screen
      title="Dealmint"
      subtitle={longToday()}
      right={<CircleButton icon="settings-outline" onPress={() => navigation.navigate('Settings')} color={c.text2} />}
    >
      <Text style={[type.body, { color: c.text2, marginHorizontal: 20, marginTop: 18, marginBottom: 14 }]}>
        What would you like to work on?
      </Text>

      <View style={{ marginHorizontal: 16, backgroundColor: c.card, borderRadius: 20, overflow: 'hidden' }}>
        {CHOICES.map((t, i) => {
          const s = d.types[t];
          return (
            <Pressable
              key={t}
              onPress={() => { haptic.tap(); navigation.navigate('Workspace', { type: t }); }}
              style={({ pressed }) => [{ backgroundColor: pressed ? c.fill2 : 'transparent' }]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 18, gap: 14 }}>
                <IconTile name={SCOPE_ICON[t]} color={c[SCOPE_TINT[t]]} size={44} />
                <View style={{ flex: 1 }}>
                  <Text style={[type.headline, { color: c.text }]}>{TYPE_PLURAL[t]}</Text>
                  <Text style={[type.footnote, { color: c.text2, marginTop: 1 }]}>{countLine(t)}</Text>
                </View>
                {s.attention ? (
                  <View style={{ backgroundColor: c.red, borderRadius: 11, minWidth: 22, height: 22, paddingHorizontal: 7, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>{s.attention}</Text>
                  </View>
                ) : null}
                <Ionicons name="chevron-forward" size={20} color={c.text3} />
              </View>
              {i < CHOICES.length - 1 ? <View style={{ height: 0.5, backgroundColor: c.separator, marginLeft: 74 }} /> : null}
            </Pressable>
          );
        })}
      </View>

      <Text style={[type.footnote, { color: c.text3, marginHorizontal: 20, marginTop: 12 }]}>
        A red number means something needs your attention, like rent that is due.
      </Text>
    </Screen>
  );
}
