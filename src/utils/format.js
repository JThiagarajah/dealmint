// Money and date helpers

export function money(n, { sign = false } = {}) {
  const v = Math.round(Number(n) || 0);
  const s = Math.abs(v).toLocaleString('en-US');
  const prefix = v < 0 ? '−' : sign && v > 0 ? '+' : '';
  return `${prefix}Rs. ${s}`;
}

// Short form for tiles and charts: Rs. 1.45M, Rs. 850K
export function moneyShort(n, { sign = false } = {}) {
  const v = Number(n) || 0;
  const a = Math.abs(v);
  let s;
  if (a >= 1e6) s = `${trim(a / 1e6)}M`;
  else if (a >= 1e3) s = `${trim(a / 1e3)}K`;
  else s = `${Math.round(a)}`;
  const prefix = v < 0 ? '−' : sign && v > 0 ? '+' : '';
  return `${prefix}Rs. ${s}`;
}

function trim(x) {
  return x >= 100 ? Math.round(x).toString() : x.toFixed(x >= 10 ? 1 : 2).replace(/\.?0+$/, '');
}

export function percent(n, digits = 1) {
  if (!isFinite(n)) return '—';
  return `${n >= 0 ? '' : '−'}${Math.abs(n).toFixed(digits)}%`;
}

// Dates are stored as 'YYYY-MM-DD' (local time)
export function toISODate(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const today = () => toISODate(new Date());

export function parseDate(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toISODate(d);
}

export function daysBetween(a, b) {
  return Math.round((parseDate(b) - parseDate(a)) / 86400000);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function prettyDate(s) {
  if (!s) return '';
  const d = parseDate(s);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function relativeDay(s) {
  const diff = daysBetween(s, today());
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  const d = parseDate(s);
  if (diff > 1 && diff < 7) return DAYS[d.getDay()];
  return prettyDate(s);
}

export function longToday() {
  const d = new Date();
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS_FULL[d.getMonth()]}`;
}

export const monthName = (m) => MONTHS_FULL[m];
export const monthShort = (m) => MONTHS[m];

// 'YYYY-MM' key for a month
export const monthKey = (y, m) => `${y}-${String(m + 1).padStart(2, '0')}`;

export function daysHeld(asset) {
  const end = asset.status === 'Sold' && asset.sale_date ? asset.sale_date : today();
  return Math.max(0, daysBetween(asset.purchase_date, end));
}

export function cleanNumber(text) {
  const n = parseFloat(String(text).replace(/[^0-9.]/g, ''));
  return isNaN(n) ? 0 : n;
}

export function groupDigits(text) {
  const digits = String(text).replace(/[^0-9]/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('en-US');
}

// '2026-10' -> 'October 2026'
export function monthLabel(key) {
  const [y, m] = key.split('-').map(Number);
  return `${MONTHS_FULL[m - 1]} ${y}`;
}

export function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}
