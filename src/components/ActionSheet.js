// iOS-style action sheet that slides up from the bottom
import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, Pressable, Animated, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { IconTile, haptic } from './ui';

const native = Platform.OS !== 'web';

export default function ActionSheet({ visible, onClose, title, options }) {
  const { c, type } = useTheme();
  const insets = useSafeAreaInsets();
  const y = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) Animated.spring(y, { toValue: 1, useNativeDriver: native, speed: 18, bounciness: 0 }).start();
    else y.setValue(0);
  }, [visible]);

  const pick = (o) => { haptic.tap(); onClose(); setTimeout(o.onPress, 250); };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.35)' }]} onPress={onClose} />
      <Animated.View
        style={{
          position: 'absolute', left: 8, right: 8, bottom: insets.bottom + 8,
          transform: [{ translateY: y.interpolate({ inputRange: [0, 1], outputRange: [300, 0] }) }],
        }}
      >
        <View style={{ backgroundColor: c.card, borderRadius: 18, overflow: 'hidden' }}>
          {title ? <Text style={[type.footnote, { color: c.text2, textAlign: 'center', paddingVertical: 12, fontWeight: '600' }]}>{title}</Text> : null}
          {options.map((o, i) => (
            <Pressable key={o.label} onPress={() => pick(o)}
              style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 14, borderTopWidth: i || title ? 0.5 : 0, borderTopColor: c.separator }, pressed && { backgroundColor: c.fill }]}>
              <IconTile name={o.icon} color={o.color || c.blue} size={34} />
              <View style={{ flex: 1 }}>
                <Text style={[type.body, { color: c.text, fontWeight: '500' }]}>{o.label}</Text>
                {o.sub ? <Text style={[type.footnote, { color: c.text2 }]}>{o.sub}</Text> : null}
              </View>
              <Ionicons name="chevron-forward" size={17} color={c.text3} />
            </Pressable>
          ))}
        </View>
        <Pressable onPress={onClose} style={({ pressed }) => [{ backgroundColor: c.card, borderRadius: 18, marginTop: 8, paddingVertical: 16, alignItems: 'center' }, pressed && { opacity: 0.7 }]}>
          <Text style={{ color: c.blue, fontSize: 18, fontWeight: '600' }}>Cancel</Text>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}
