// Lightweight charts drawn with react-native-svg (no extra chart library needed)
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Animated, Platform } from 'react-native';
import Svg, { Circle, G, Rect, Line } from 'react-native-svg';
import { useTheme } from '../theme';
import { moneyShort, money } from '../utils/format';
import { haptic } from './ui';

const native = Platform.OS !== 'web';

// Fades and settles in when it appears (critically damped, no bounce)
function Appear({ children, style }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(v, { toValue: 1, useNativeDriver: native, speed: 14, bounciness: 0 }).start();
  }, []);
  return (
    <Animated.View style={[style, { opacity: v, transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }] }]}>
      {children}
    </Animated.View>
  );
}

/**
 * Donut (pie) chart. data: [{ label, value, color }]
 * Tap a slice in the legend to highlight it — the centre shows its value.
 */
export function Donut({ data, size = 170, thickness = 22, centerTitle = 'Total', legend = true, compact }) {
  const { c, type } = useTheme();
  const [sel, setSel] = useState(null);
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = (size - thickness) / 2;
  const C = 2 * Math.PI * r;
  const gap = data.length > 1 ? Math.min(3, C * 0.006) : 0;
  let offset = 0;

  const active = sel !== null ? data[sel] : null;

  return (
    <View style={{ flexDirection: compact ? 'row' : 'column', alignItems: 'center', gap: compact ? 18 : 16 }}>
      <Appear style={{ width: size, height: size }}>
        <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
          <G>
            <Circle cx={size / 2} cy={size / 2} r={r} stroke={c.fill} strokeWidth={thickness} fill="none" />
            {total > 0 && data.map((d, i) => {
              const len = (d.value / total) * C;
              const seg = (
                <Circle
                  key={d.label}
                  cx={size / 2} cy={size / 2} r={r}
                  stroke={d.color}
                  strokeWidth={sel === i ? thickness + 6 : thickness}
                  strokeOpacity={sel === null || sel === i ? 1 : 0.28}
                  fill="none"
                  strokeDasharray={`${Math.max(0, len - gap)} ${C}`}
                  strokeDashoffset={-offset}
                />
              );
              offset += len;
              return seg;
            })}
          </G>
        </Svg>
        <View style={{ position: 'absolute', inset: 0, top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: thickness + 6 }}>
          <Text style={[type.caption, { color: c.text2 }]} numberOfLines={1}>{active ? active.label : centerTitle}</Text>
          <Text style={[size > 150 ? type.title3 : type.headline, { color: c.text, fontWeight: '700', fontVariant: ['tabular-nums'] }]} numberOfLines={1} adjustsFontSizeToFit>
            {size < 150 ? moneyShort(active ? active.value : total).replace('Rs. ', '') : moneyShort(active ? active.value : total)}
          </Text>
          {active && total > 0 ? (
            <Text style={[type.caption, { color: active.color }]}>{((active.value / total) * 100).toFixed(0)}%</Text>
          ) : null}
        </View>
      </Appear>
      {legend ? (
        <View style={{ alignSelf: compact ? 'center' : 'stretch', flex: compact ? 1 : undefined, gap: 2 }}>
          {data.map((d, i) => (
            <Pressable
              key={d.label}
              onPress={() => { haptic.tap(); setSel(sel === i ? null : i); }}
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: compact ? 4 : 5, paddingHorizontal: 6, borderRadius: 8, backgroundColor: sel === i ? d.color + '18' : 'transparent', gap: 8 }}
            >
              <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: d.color, alignSelf: compact ? 'flex-start' : 'center', marginTop: compact ? 4 : 0 }} />
              {compact ? (
                <View style={{ flex: 1 }}>
                  <Text style={[type.footnote, { color: c.text, fontWeight: '500' }]} numberOfLines={1}>{d.label}</Text>
                  <Text style={[type.caption, { color: c.text2, fontVariant: ['tabular-nums'], fontWeight: '400' }]}>
                    {moneyShort(d.value)}{total > 0 ? ` · ${((d.value / total) * 100).toFixed(0)}%` : ''}
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={[type.subhead, { color: c.text, flex: 1 }]} numberOfLines={1}>{d.label}</Text>
                  <Text style={[type.subhead, { color: c.text2, fontVariant: ['tabular-nums'] }]}>{money(d.value)}</Text>
                </>
              )}
              {!compact && total > 0 ? (
                <Text style={[type.footnote, { color: c.text3, width: 38, textAlign: 'right', fontVariant: ['tabular-nums'] }]}>
                  {((d.value / total) * 100).toFixed(0)}%
                </Text>
              ) : null}
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

// Horizontal bars, good for "expenses by category"
export function BarList({ data, max, formatter = moneyShort }) {
  const { c, type } = useTheme();
  const top = max || Math.max(1, ...data.map((d) => Math.abs(d.value)));
  return (
    <View style={{ gap: 12 }}>
      {data.map((d) => (
        <View key={d.label}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
            <Text style={[type.subhead, { color: c.text }]} numberOfLines={1}>{d.label}</Text>
            <Text style={[type.subhead, { color: d.value < 0 ? c.red : c.text2, fontVariant: ['tabular-nums'], fontWeight: '600' }]}>{formatter(d.value)}</Text>
          </View>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: c.fill, overflow: 'hidden' }}>
            <View style={{ width: `${Math.max(2, (Math.abs(d.value) / top) * 100)}%`, height: 8, borderRadius: 4, backgroundColor: d.color || c.blue }} />
          </View>
        </View>
      ))}
    </View>
  );
}

// One thin bar split into coloured parts (e.g. assets by status)
export function StackBar({ data, height = 10 }) {
  const { c } = useTheme();
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  return (
    <View style={{ flexDirection: 'row', height, borderRadius: height / 2, overflow: 'hidden', backgroundColor: c.fill, gap: 2 }}>
      {data.filter((d) => d.value > 0).map((d) => (
        <View key={d.label} style={{ flex: d.value / total, backgroundColor: d.color }} />
      ))}
    </View>
  );
}

// Small daily spending bars (last 14 days)
export function MiniBars({ data, color, height = 44, highlightLast = true }) {
  const { c } = useTheme();
  const max = Math.max(1, ...data.map((d) => d.value));
  const n = data.length;
  const w = 100 / n;
  return (
    <Svg width="100%" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none">
      {data.map((d, i) => {
        const h = Math.max(2, (d.value / max) * (height - 2));
        const last = highlightLast && i === n - 1;
        return (
          <Rect key={i} x={i * w + w * 0.18} y={height - h} width={w * 0.64} height={h} rx={1.2}
            fill={last ? color : color} opacity={last ? 1 : 0.38} />
        );
      })}
    </Svg>
  );
}

// Monthly net profit bars that can go below zero
export function TrendBars({ data, height = 150, labels }) {
  const { c, type } = useTheme();
  const max = Math.max(1, ...data.map((d) => Math.abs(d.value)));
  const hasNeg = data.some((d) => d.value < 0);
  const top = hasNeg ? height * 0.62 : height;
  const bottom = height - top;
  return (
    <View>
      <View style={{ height, flexDirection: 'row', alignItems: 'stretch', gap: 10 }}>
        {data.map((d, i) => {
          const h = (Math.abs(d.value) / max) * (d.value >= 0 ? top - 18 : bottom - 4);
          return (
            <View key={i} style={{ flex: 1 }}>
              <View style={{ height: top, justifyContent: 'flex-end', alignItems: 'center' }}>
                {d.value >= 0 ? (
                  <>
                    <Text style={[type.caption2, { color: c.text2, marginBottom: 3 }]} numberOfLines={1}>{moneyShort(d.value).replace('Rs. ', '')}</Text>
                    <View style={{ width: '70%', height: Math.max(3, h), borderRadius: 6, backgroundColor: d.active ? c.green : c.green + '70' }} />
                  </>
                ) : null}
              </View>
              <View style={{ height: 1, backgroundColor: c.separator }} />
              <View style={{ height: bottom - 1, alignItems: 'center' }}>
                {d.value < 0 ? (
                  <>
                    <View style={{ width: '70%', height: Math.max(3, h), borderRadius: 6, backgroundColor: d.active ? c.red : c.red + '70' }} />
                    <Text style={[type.caption2, { color: c.red, marginTop: 3 }]} numberOfLines={1}>{moneyShort(d.value).replace('Rs. ', '')}</Text>
                  </>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
        {data.map((d, i) => (
          <Text key={i} style={[type.caption, { flex: 1, textAlign: 'center', color: d.active ? c.text : c.text2, fontWeight: d.active ? '700' : '500' }]}>{labels[i]}</Text>
        ))}
      </View>
    </View>
  );
}

// Progress ring (e.g. expense % against alert limit)
export function Ring({ value, max, size = 44, thickness = 5, color }) {
  const { c } = useTheme();
  const r = (size - thickness) / 2;
  const C = 2 * Math.PI * r;
  const p = Math.min(1, max > 0 ? value / max : 0);
  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
      <G>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={c.fill} strokeWidth={thickness} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={thickness} fill="none"
          strokeDasharray={`${C * p} ${C}`} strokeLinecap="round" />
      </G>
    </Svg>
  );
}
