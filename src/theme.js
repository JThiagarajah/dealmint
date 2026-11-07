// Apple-style design tokens (iOS system colours, grouped backgrounds, type scale).
// Light and dark mode follow the phone's setting automatically.
import { useColorScheme, Platform } from 'react-native';

const light = {
  bg: '#F2F2F7',
  card: '#FFFFFF',
  card2: '#F2F2F7',
  elevated: '#FFFFFF',
  segSel: '#FFFFFF',
  text: '#000000',
  text2: 'rgba(60,60,67,0.62)',
  text3: 'rgba(60,60,67,0.32)',
  separator: 'rgba(60,60,67,0.18)',
  fill: 'rgba(120,120,128,0.12)',
  fill2: 'rgba(120,120,128,0.08)',
  blue: '#007AFF', green: '#34C759', red: '#FF3B30', orange: '#FF9500', purple: '#AF52DE',
  teal: '#30B0C7', indigo: '#5856D6', pink: '#FF2D55', yellow: '#FFCC00', mint: '#00C7BE',
  cyan: '#32ADE6', brown: '#A2845E', gray: '#8E8E93',
  hero1: '#0A84FF', hero2: '#5E5CE6',
  shadow: 'rgba(0,0,0,0.06)',
};

const dark = {
  bg: '#000000',
  card: '#1C1C1E',
  card2: '#2C2C2E',
  elevated: '#2C2C2E',
  segSel: '#636366',
  text: '#FFFFFF',
  text2: 'rgba(235,235,245,0.62)',
  text3: 'rgba(235,235,245,0.32)',
  separator: 'rgba(84,84,88,0.6)',
  fill: 'rgba(120,120,128,0.26)',
  fill2: 'rgba(120,120,128,0.16)',
  blue: '#0A84FF', green: '#30D158', red: '#FF453A', orange: '#FF9F0A', purple: '#BF5AF2',
  teal: '#40C8E0', indigo: '#5E5CE6', pink: '#FF375F', yellow: '#FFD60A', mint: '#63E6E2',
  cyan: '#64D2FF', brown: '#AC8E68', gray: '#8E8E93',
  hero1: '#0A84FF', hero2: '#5E5CE6',
  shadow: 'rgba(0,0,0,0)',
};

// Order used for chart slices — distinct hues, readable in both modes
export const CHART_KEYS = ['blue', 'orange', 'green', 'purple', 'teal', 'pink', 'indigo', 'yellow', 'mint', 'red', 'brown', 'cyan'];

const font = Platform.select({ ios: 'System', android: 'sans-serif', default: 'system-ui, -apple-system, "SF Pro Text", Roboto, sans-serif' });

// Size-specific tracking: tighter as text gets bigger
export const type = {
  largeTitle: { fontSize: 34, lineHeight: 41, fontWeight: '700', letterSpacing: -0.6 },
  title1: { fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: -0.5 },
  title2: { fontSize: 22, lineHeight: 28, fontWeight: '700', letterSpacing: -0.35 },
  title3: { fontSize: 20, lineHeight: 25, fontWeight: '600', letterSpacing: -0.3 },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600', letterSpacing: -0.2 },
  body: { fontSize: 17, lineHeight: 22, fontWeight: '400', letterSpacing: -0.2 },
  callout: { fontSize: 16, lineHeight: 21, fontWeight: '400', letterSpacing: -0.15 },
  subhead: { fontSize: 15, lineHeight: 20, fontWeight: '400', letterSpacing: -0.1 },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400', letterSpacing: 0 },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500', letterSpacing: 0.1 },
  caption2: { fontSize: 11, lineHeight: 13, fontWeight: '600', letterSpacing: 0.3 },
  numberXL: { fontSize: 40, lineHeight: 46, fontWeight: '700', letterSpacing: -1.2, fontVariant: ['tabular-nums'] },
  number: { fontSize: 22, lineHeight: 28, fontWeight: '700', letterSpacing: -0.5, fontVariant: ['tabular-nums'] },
};
Object.values(type).forEach((s) => {
  s.fontFamily = font;
  // Apple's tight tracking is tuned for San Francisco; Android's Roboto looks cramped with it
  if (Platform.OS === 'android') s.letterSpacing = s.fontSize >= 20 ? -0.2 : 0;
});

export const radius = { s: 10, m: 14, l: 20, xl: 26 };
export const space = { xs: 4, s: 8, m: 12, l: 16, xl: 20, xxl: 28 };

export function useTheme() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const c = isDark ? dark : light;
  return { c, isDark, type, radius, space, chart: (i) => c[CHART_KEYS[i % CHART_KEYS.length]] };
}
