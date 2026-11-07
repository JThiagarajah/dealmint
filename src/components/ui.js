// Reusable Apple-style building blocks
import React, { useRef } from 'react';
import {
  View, Text, Pressable, Animated, StyleSheet, Platform, TextInput, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Stop, Rect, Circle } from 'react-native-svg';
import { useTheme } from '../theme';

const native = Platform.OS !== 'web';

export const haptic = {
  tap: () => native && Haptics.selectionAsync().catch(() => {}),
  success: () => native && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}),
  warn: () => native && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {}),
};

// Responds the moment a finger touches it (scale down), springs back on release
export function Touchable({ onPress, children, style, scaleTo = 0.97, disabled, haptics = false, ...rest }) {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (v) =>
    Animated.spring(scale, { toValue: v, useNativeDriver: native, speed: 40, bounciness: 0 }).start();
  // Layout props (flex, width, margins) go on the outer Pressable so the button sizes correctly
  const flat = StyleSheet.flatten(style) || {};
  const outer = {};
  const inner = {};
  Object.entries(flat).forEach(([k, v]) => {
    if (/^(flex$|flexGrow|flexShrink|flexBasis|width|alignSelf|margin|position|top|left|right|bottom|minWidth|maxWidth)/.test(k)) outer[k] = v;
    else inner[k] = v;
  });
  if (outer.flex !== undefined) inner.flex = 1;
  return (
    <Pressable
      disabled={disabled}
      onPressIn={() => to(scaleTo)}
      onPressOut={() => to(1)}
      onPress={(e) => { if (haptics) haptic.tap(); onPress && onPress(e); }}
      style={outer}
      {...rest}
    >
      <Animated.View style={[inner, { transform: [{ scale }] }, disabled && { opacity: 0.4 }]}>{children}</Animated.View>
    </Pressable>
  );
}

export function Screen({ children, title, subtitle, right, scroll = true, contentStyle, refreshControl, headerExtra, onBack, backLabel, accent }) {
  const { c, type } = useTheme();
  const insets = useSafeAreaInsets();
  const header = title ? (
    <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 8 }}>
      {onBack ? (
        <Pressable onPress={onBack} hitSlop={10} style={{ flexDirection: 'row', alignItems: 'center', marginLeft: -6, marginBottom: 2, alignSelf: 'flex-start' }}>
          <Ionicons name="chevron-back" size={22} color={accent || c.blue} />
          <Text style={[type.body, { color: accent || c.blue }]}>{backLabel || 'Back'}</Text>
        </Pressable>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          {subtitle ? <Text style={[type.footnote, { color: c.text2, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 }]}>{subtitle}</Text> : null}
          <Text style={[type.largeTitle, { color: c.text }]} numberOfLines={1}>{title}</Text>
        </View>
        {right}
      </View>
      {headerExtra}
    </View>
  ) : null;
  if (!scroll) return <View style={{ flex: 1, backgroundColor: c.bg }}>{header}{children}</View>;
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={[{ paddingBottom: insets.bottom + 110 }, contentStyle]}
      refreshControl={refreshControl}
      keyboardShouldPersistTaps="handled"
    >
      {header}
      {children}
    </ScrollView>
  );
}

export function Card({ children, style, onPress, padded = true }) {
  const { c } = useTheme();
  const s = [
    styles.card,
    { backgroundColor: c.card, shadowColor: '#000', shadowOpacity: c.shadow === 'rgba(0,0,0,0)' ? 0 : 0.05 },
    padded && { padding: 16 },
    style,
  ];
  if (onPress) return <Touchable onPress={onPress} style={s} scaleTo={0.98}>{children}</Touchable>;
  return <View style={s}>{children}</View>;
}

export function SectionHeader({ title, action, onAction, style }) {
  const { c, type } = useTheme();
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 26, marginBottom: 10 }, style]}>
      <Text style={[type.title3, { color: c.text, fontWeight: '700' }]}>{title}</Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={10}>
          <Text style={[type.subhead, { color: c.blue }]}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// Settings-style rounded square with a white icon
export function IconTile({ name, color, size = 30, iconSize }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.27, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={name} size={iconSize || size * 0.58} color="#fff" />
    </View>
  );
}

export function Pill({ label, color, icon, small }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: color + '22', borderRadius: 99, paddingHorizontal: small ? 8 : 10, paddingVertical: small ? 3 : 5, gap: 4 }}>
      {icon ? <Ionicons name={icon} size={small ? 11 : 13} color={color} /> : null}
      <Text style={{ color, fontSize: small ? 11 : 13, fontWeight: '600', letterSpacing: 0.1 }}>{label}</Text>
    </View>
  );
}

export function Segmented({ options, value, onChange, style }) {
  const { c } = useTheme();
  return (
    <View style={[{ flexDirection: 'row', backgroundColor: c.fill, borderRadius: 10, padding: 2 }, style]}>
      {options.map((o) => {
        const key = typeof o === 'string' ? o : o.value;
        const label = typeof o === 'string' ? o : o.label;
        const active = key === value;
        return (
          <Pressable
            key={key}
            onPress={() => { haptic.tap(); onChange(key); }}
            style={[
              { flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: 'center' },
              active && { backgroundColor: c.segSel, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
            ]}
          >
            <Text style={{ fontSize: 13, fontWeight: active ? '600' : '500', color: c.text }}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Chip({ label, active, onPress, color, icon }) {
  const { c } = useTheme();
  const tint = color || c.blue;
  return (
    <Touchable onPress={() => { haptic.tap(); onPress(); }} scaleTo={0.94}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 13, paddingVertical: 7, borderRadius: 99, backgroundColor: active ? tint : c.card, borderWidth: active ? 0 : StyleSheet.hairlineWidth, borderColor: c.separator }}>
      {icon ? <Ionicons name={icon} size={14} color={active ? '#fff' : c.text2} /> : null}
      <Text style={{ fontSize: 14, fontWeight: '600', color: active ? '#fff' : c.text }}>{label}</Text>
    </Touchable>
  );
}

export function ChipRow({ children, style }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[{ gap: 8, paddingHorizontal: 20 }, style]}>
      {children}
    </ScrollView>
  );
}

export function Button({ title, onPress, icon, kind = 'filled', color, style, disabled }) {
  const { c } = useTheme();
  const tint = color || c.blue;
  const bg = kind === 'filled' ? tint : kind === 'tinted' ? tint + '1F' : 'transparent';
  const fg = kind === 'filled' ? '#fff' : tint;
  return (
    <Touchable onPress={onPress} disabled={disabled} haptics
      style={[{ flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: bg, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 18 }, style]}>
      {icon ? <Ionicons name={icon} size={18} color={fg} /> : null}
      <Text style={{ color: fg, fontSize: 17, fontWeight: '600', letterSpacing: -0.2 }}>{title}</Text>
    </Touchable>
  );
}

// Round icon button used in headers
export function CircleButton({ icon, onPress, color, filled }) {
  const { c } = useTheme();
  return (
    <Touchable onPress={onPress} haptics scaleTo={0.9}
      style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: filled ? (color || c.blue) : c.fill }}>
      <Ionicons name={icon} size={20} color={filled ? '#fff' : color || c.blue} />
    </Touchable>
  );
}

/* ---------- Grouped list (iOS Settings style) ---------- */

export function Group({ children, style, footer, header }) {
  const { c, type } = useTheme();
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={[{ marginHorizontal: 16, marginTop: 20 }, style]}>
      {header ? <Text style={[type.footnote, { color: c.text2, textTransform: 'uppercase', marginLeft: 16, marginBottom: 6, letterSpacing: 0.3 }]}>{header}</Text> : null}
      <View style={{ backgroundColor: c.card, borderRadius: 12, overflow: 'hidden' }}>
        {items.map((child, i) => (
          <View key={i}>
            {child}
            {i < items.length - 1 ? <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: c.separator, marginLeft: child.props?.inset ?? 16 }} /> : null}
          </View>
        ))}
      </View>
      {footer ? <Text style={[type.footnote, { color: c.text2, marginHorizontal: 16, marginTop: 6 }]}>{footer}</Text> : null}
    </View>
  );
}

export function Row({ icon, iconColor, title, subtitle, value, valueColor, onPress, chevron, right, inset, destructive }) {
  const { c, type } = useTheme();
  const body = (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 11, gap: 12, minHeight: 48 }}>
      {icon ? <IconTile name={icon} color={iconColor || c.blue} /> : null}
      <View style={{ flex: 1 }}>
        <Text style={[type.body, { color: destructive ? c.red : c.text }]} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={[type.footnote, { color: c.text2, marginTop: 1 }]} numberOfLines={2}>{subtitle}</Text> : null}
      </View>
      {value !== undefined ? <Text style={[type.body, { color: valueColor || c.text2, fontVariant: ['tabular-nums'] }]} numberOfLines={1}>{value}</Text> : null}
      {right}
      {chevron ? <Ionicons name="chevron-forward" size={18} color={c.text3} /> : null}
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && { backgroundColor: c.fill }}>{body}</Pressable>
  );
}

/* ---------- Form fields ---------- */

export function FieldRow({ label, children }) {
  const { c, type } = useTheme();
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 10, minHeight: 48, justifyContent: 'center' }}>
      {label ? <Text style={[type.caption, { color: c.text2, marginBottom: 3 }]}>{label}</Text> : null}
      {children}
    </View>
  );
}

export function Input({ label, value, onChangeText, placeholder, keyboardType, multiline, autoCapitalize, error, prefix, big }) {
  const { c, type } = useTheme();
  return (
    <FieldRow label={label}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {prefix ? <Text style={[big ? type.title2 : type.body, { color: c.text2, marginRight: 6 }]}>{prefix}</Text> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={c.text3}
          keyboardType={keyboardType}
          multiline={multiline}
          autoCapitalize={autoCapitalize}
          style={[big ? type.title2 : type.body, { color: c.text, flex: 1, minWidth: 0, padding: 0, minHeight: multiline ? 60 : undefined, outlineStyle: 'none' }]}
        />
      </View>
      {error ? <Text style={[type.footnote, { color: c.red, marginTop: 4 }]}>{error}</Text> : null}
    </FieldRow>
  );
}

export function Empty({ icon, title, message, action, onAction }) {
  const { c, type } = useTheme();
  return (
    <View style={{ alignItems: 'center', padding: 40, gap: 8 }}>
      <Ionicons name={icon} size={46} color={c.text3} />
      <Text style={[type.title3, { color: c.text }]}>{title}</Text>
      {message ? <Text style={[type.subhead, { color: c.text2, textAlign: 'center' }]}>{message}</Text> : null}
      {action ? <Button title={action} onPress={onAction} kind="tinted" style={{ marginTop: 10 }} /> : null}
    </View>
  );
}

export const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
    elevation: 1,
  },
});

// Card with a diagonal colour gradient and soft light circles (hero cards).
// The gradient is drawn at the card's measured size, which keeps it correct on Android.
let gradId = 0;
export function GradientCard({ colors, children, style, onPress, radius = 24 }) {
  const id = useRef(`g${gradId++}`).current;
  const [size, setSize] = React.useState(null);
  const onLayout = (e) => {
    const { width, height } = e.nativeEvent.layout;
    if (!size || size.w !== width || size.h !== height) setSize({ w: width, h: height });
  };
  const bg = (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors[1] }]} pointerEvents="none">
      {size ? (
        <Svg width={size.w} height={size.h}>
          <Defs>
            <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={colors[0]} />
              <Stop offset="1" stopColor={colors[1]} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width={size.w} height={size.h} fill={`url(#${id})`} />
          <Circle cx={size.w - 24} cy={10} r={size.h * 0.55} fill="#fff" opacity={0.08} />
        </Svg>
      ) : null}
    </View>
  );
  const inner = [{ borderRadius: radius, overflow: 'hidden' }, style];
  if (onPress) return <Touchable onPress={onPress} haptics scaleTo={0.97} style={inner} onLayout={onLayout}>{bg}{children}</Touchable>;
  return <View style={inner} onLayout={onLayout}>{bg}{children}</View>;
}
