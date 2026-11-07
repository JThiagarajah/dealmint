// All database reads and writes live here. Screens never write SQL directly,
// so adding cloud sync later only changes this folder.
import { getDb, uuid, now } from './database';
import { DEFAULT_SETTINGS, CAPITAL_PHASES, RUNNING_PHASES } from '../constants';
import { today, monthKey, daysHeld } from '../utils/format';

const inList = (arr) => arr.map((x) => `'${x}'`).join(',');

/* ---------------- Settings ---------------- */

export async function getSettings() {
  const db = await getDb();
  const rows = await db.getAllAsync('SELECT key, value FROM settings');
  const s = { ...DEFAULT_SETTINGS };
  rows.forEach((r) => (s[r.key] = r.value));
  return {
    business_name: s.business_name,
    starting_capital: Number(s.starting_capital) || 0,
    alert_percent: Number(s.alert_percent) || 0,
  };
}

export async function setSetting(key, value) {
  const db = await getDb();
  await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', key, String(value));
}

/* ---------------- Assets ---------------- */

/*
  Profit rules
  - Sell plan:  profit (when sold) = sale price − purchase price − all direct expenses
  - Rent plan:  each month: rent received − running costs (Holding, Marketing)
                purchase + Acquisition/Improvement costs are the investment
                if later sold: sale price − purchase − capital costs
  - Lifetime (both): sale price + rent received − purchase − all direct expenses
*/
const parseAsset = (a) => {
  if (!a) return a;
  let details = {};
  try { details = a.details ? JSON.parse(a.details) : {}; } catch { details = {}; }
  const direct = a.direct_total || 0;
  const income = a.income_total || 0;
  const running = a.running_total || 0;
  const capital = direct - running;
  const sold = a.status === 'Sold';
  const rent = a.deal_type === 'Rent';
  const cost = a.purchase_price + direct;
  const invested = a.purchase_price + (rent ? capital : direct);

  const lifetime = (sold ? a.sale_price || 0 : 0) + income - a.purchase_price - direct;
  const profit = sold ? lifetime : null;
  const expected = !sold && !rent && a.asking_price ? a.asking_price - cost : null;
  const netRent = income - running;

  return {
    ...a,
    details,
    direct_total: direct,
    income_total: income,
    running_total: running,
    capital_total: capital,
    cost,
    invested,
    profit,
    lifetime,
    expected_profit: expected,
    net_rent: netRent,
    // what this asset has actually earned so far
    earned: sold ? lifetime : rent ? netRent : 0,
    roi: profit !== null && cost > 0 ? (profit / cost) * 100 : null,
    yield_pct: rent && a.rent_amount && invested > 0 ? ((a.rent_amount * 12) / invested) * 100 : null,
    payback_pct: rent && invested > 0 ? (netRent / invested) * 100 : null,
    days_held: daysHeld(a),
    expense_ratio: a.purchase_price > 0 ? (direct / a.purchase_price) * 100 : 0,
    // sale gain counted in the month of sale (rent was already counted month by month)
    sale_gain: sold ? (a.sale_price || 0) - a.purchase_price - (rent ? capital : direct) : null,
  };
};

const ASSET_SELECT = `
  SELECT a.*,
    COALESCE((SELECT SUM(amount) FROM expenses e
              WHERE e.asset_id = a.id AND e.is_deleted = 0 AND e.expense_type = 'Direct'), 0) AS direct_total,
    COALESCE((SELECT SUM(amount) FROM expenses e
              WHERE e.asset_id = a.id AND e.is_deleted = 0 AND e.expense_type = 'Direct'
                AND e.phase IN (${inList(RUNNING_PHASES)})), 0) AS running_total,
    (SELECT COUNT(*) FROM expenses e
              WHERE e.asset_id = a.id AND e.is_deleted = 0 AND e.expense_type = 'Direct') AS expense_count,
    COALESCE((SELECT SUM(amount) FROM incomes i WHERE i.asset_id = a.id AND i.is_deleted = 0), 0) AS income_total,
    (SELECT MAX(period) FROM incomes i WHERE i.asset_id = a.id AND i.is_deleted = 0 AND i.income_type = 'Rent') AS last_rent_period
  FROM assets a`;

export async function listAssets({ search = '', type = 'All', status = 'All', plan = 'All' } = {}) {
  const db = await getDb();
  const where = ['a.is_deleted = 0'];
  const params = [];
  if (search.trim()) {
    where.push('(a.identifier LIKE ? OR a.title LIKE ? OR a.city LIKE ? OR a.details LIKE ? OR a.tenant_name LIKE ?)');
    const q = `%${search.trim()}%`;
    params.push(q, q, q, q, q);
  }
  if (type !== 'All') { where.push('a.type = ?'); params.push(type); }
  if (status !== 'All') { where.push('a.status = ?'); params.push(status); }
  if (plan !== 'All') { where.push('a.deal_type = ?'); params.push(plan); }
  const rows = await db.getAllAsync(
    `${ASSET_SELECT} WHERE ${where.join(' AND ')}
     ORDER BY CASE a.status WHEN 'Sold' THEN 1 ELSE 0 END, a.purchase_date DESC`,
    ...params
  );
  return rows.map(parseAsset);
}

export async function getAsset(id) {
  const db = await getDb();
  const row = await db.getFirstAsync(`${ASSET_SELECT} WHERE a.id = ? AND a.is_deleted = 0`, id);
  return parseAsset(row);
}

export async function findAssetByIdentifier(identifier, excludeId = '') {
  const db = await getDb();
  return db.getFirstAsync(
    'SELECT id, identifier FROM assets WHERE is_deleted = 0 AND LOWER(TRIM(identifier)) = LOWER(TRIM(?)) AND id != ?',
    identifier, excludeId
  );
}

export async function saveAsset(a) {
  const db = await getDb();
  const t = now();
  const details = JSON.stringify(a.details || {});
  const rentStart = a.deal_type === 'Rent' && a.status === 'Rented' ? a.rent_start || today() : a.rent_start || null;
  const vals = [a.type, a.identifier, a.title, a.city, a.purchase_price, a.purchase_date, a.seller_name,
    a.deal_type || 'Sale', a.status, a.asking_price, a.rent_amount, a.tenant_name, a.tenant_phone, rentStart, details, a.notes];
  if (a.id) {
    await db.runAsync(
      `UPDATE assets SET type=?, identifier=?, title=?, city=?, purchase_price=?, purchase_date=?, seller_name=?,
        deal_type=?, status=?, asking_price=?, rent_amount=?, tenant_name=?, tenant_phone=?, rent_start=?,
        details=?, notes=?, updated_at=? WHERE id=?`,
      ...vals, t, a.id
    );
    return a.id;
  }
  const id = uuid();
  await db.runAsync(
    `INSERT INTO assets (type, identifier, title, city, purchase_price, purchase_date, seller_name, deal_type, status,
      asking_price, rent_amount, tenant_name, tenant_phone, rent_start, details, notes, id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ...vals, id, t, t
  );
  return id;
}

export async function updateStatus(id, status) {
  const db = await getDb();
  await db.runAsync(
    `UPDATE assets SET status = ?, rent_start = CASE WHEN ? = 'Rented' AND rent_start IS NULL THEN ? ELSE rent_start END,
     updated_at = ? WHERE id = ?`,
    status, status, today(), now(), id
  );
}

export async function sellAsset(id, { sale_price, sale_date, buyer_name, buyer_phone }) {
  const db = await getDb();
  await db.runAsync(
    `UPDATE assets SET status='Sold', sale_price=?, sale_date=?, buyer_name=?, buyer_phone=?, updated_at=? WHERE id=?`,
    sale_price, sale_date, buyer_name, buyer_phone, now(), id
  );
}

export async function undoSale(id) {
  const db = await getDb();
  await db.runAsync(
    `UPDATE assets SET status = CASE deal_type WHEN 'Rent' THEN 'Vacant' ELSE 'Listed' END,
      sale_price=NULL, sale_date=NULL, buyer_name=NULL, buyer_phone=NULL, updated_at=? WHERE id=?`,
    now(), id
  );
}

// Soft delete keeps the row (marked deleted) so a future sync can pass the deletion on
export async function deleteAsset(id) {
  const db = await getDb();
  const t = now();
  await db.withTransactionAsync(async () => {
    await db.runAsync('UPDATE assets SET is_deleted = 1, updated_at = ? WHERE id = ?', t, id);
    await db.runAsync('UPDATE expenses SET is_deleted = 1, updated_at = ? WHERE asset_id = ?', t, id);
    await db.runAsync('UPDATE incomes SET is_deleted = 1, updated_at = ? WHERE asset_id = ?', t, id);
  });
}

/* ---------------- Expenses ---------------- */

export async function getAssetExpenses(assetId) {
  const db = await getDb();
  return db.getAllAsync(
    `SELECT * FROM expenses WHERE asset_id = ? AND is_deleted = 0 ORDER BY date DESC, created_at DESC`,
    assetId
  );
}

export async function getExpense(id) {
  const db = await getDb();
  return db.getFirstAsync('SELECT * FROM expenses WHERE id = ?', id);
}

export async function saveExpense(e) {
  const db = await getDb();
  const t = now();
  const assetId = e.expense_type === 'Direct' ? e.asset_id : null;
  const phase = e.expense_type === 'Direct' ? e.phase : null;
  if (e.id) {
    await db.runAsync(
      `UPDATE expenses SET expense_type=?, asset_id=?, phase=?, category=?, amount=?, date=?, note=?, updated_at=? WHERE id=?`,
      e.expense_type, assetId, phase, e.category, e.amount, e.date, e.note, t, e.id
    );
  } else {
    await db.runAsync(
      `INSERT INTO expenses (id, expense_type, asset_id, phase, category, amount, date, note, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      uuid(), e.expense_type, assetId, phase, e.category, e.amount, e.date, e.note, t, t
    );
  }
  if (assetId) await db.runAsync('UPDATE assets SET updated_at = ? WHERE id = ?', t, assetId);
}

export async function deleteExpense(id) {
  const db = await getDb();
  await db.runAsync('UPDATE expenses SET is_deleted = 1, updated_at = ? WHERE id = ?', now(), id);
}

/* ---------------- Incomes (rent) ---------------- */

export async function getAssetIncomes(assetId) {
  const db = await getDb();
  return db.getAllAsync(
    'SELECT * FROM incomes WHERE asset_id = ? AND is_deleted = 0 ORDER BY date DESC, created_at DESC',
    assetId
  );
}

export async function getIncome(id) {
  const db = await getDb();
  return db.getFirstAsync('SELECT * FROM incomes WHERE id = ?', id);
}

export async function saveIncome(i) {
  const db = await getDb();
  const t = now();
  if (i.id) {
    await db.runAsync(
      'UPDATE incomes SET asset_id=?, income_type=?, amount=?, date=?, period=?, note=?, updated_at=? WHERE id=?',
      i.asset_id, i.income_type, i.amount, i.date, i.period, i.note, t, i.id
    );
  } else {
    await db.runAsync(
      `INSERT INTO incomes (id, asset_id, income_type, amount, date, period, note, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      uuid(), i.asset_id, i.income_type, i.amount, i.date, i.period, i.note, t, t
    );
  }
  await db.runAsync('UPDATE assets SET updated_at = ? WHERE id = ?', t, i.asset_id);
}

export async function deleteIncome(id) {
  const db = await getDb();
  await db.runAsync('UPDATE incomes SET is_deleted = 1, updated_at = ? WHERE id = ?', now(), id);
}

// Rented assets whose rent for this month is due (due day passed) but not recorded
export function rentDue(assets) {
  const t = today();
  const thisMonth = t.slice(0, 7);
  return assets.filter((a) => {
    if (a.deal_type !== 'Rent' || a.status !== 'Rented' || !a.rent_amount) return false;
    const dueDay = Math.min(28, Number((a.rent_start || t).slice(8, 10)));
    const due = `${thisMonth}-${String(dueDay).padStart(2, '0')}`;
    if (a.rent_start && a.rent_start > due) return false;
    return due <= t && (a.last_rent_period || '') < thisMonth;
  });
}

/* ---------------- Breakdown helpers ---------------- */

export function groupSum(rows, key) {
  const map = {};
  rows.forEach((r) => (map[r[key] || 'Other'] = (map[r[key] || 'Other'] || 0) + r.amount));
  return Object.entries(map)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

/* ---------------- Money movements (ledger) ---------------- */

// Every money movement: buying (out), expense (out), rent (in), sale (in)
async function allMovements(type = 'All') {
  const db = await getDb();
  const rows = await db.getAllAsync(`
    SELECT 'purchase' AS kind, id AS ref, id AS asset_id, type AS asset_type, purchase_date AS date, -purchase_price AS amount,
           identifier AS label, type AS sub, NULL AS note, created_at
      FROM assets WHERE is_deleted = 0
    UNION ALL
    SELECT 'sale', id, id, type, sale_date, sale_price, identifier, type, buyer_name, updated_at
      FROM assets WHERE is_deleted = 0 AND status = 'Sold' AND sale_date IS NOT NULL
    UNION ALL
    SELECT 'income', i.id, i.asset_id, a.type, i.date, i.amount, i.income_type, a.identifier, i.note, i.created_at
      FROM incomes i JOIN assets a ON a.id = i.asset_id WHERE i.is_deleted = 0 AND a.is_deleted = 0
    UNION ALL
    SELECT CASE e.expense_type WHEN 'Direct' THEN 'direct' ELSE 'indirect' END, e.id, e.asset_id, a.type, e.date, -e.amount,
           e.category, a.identifier, e.note, e.created_at
      FROM expenses e LEFT JOIN assets a ON a.id = e.asset_id WHERE e.is_deleted = 0
    ORDER BY date ASC, created_at ASC`);
  return type === 'All' ? rows : rows.filter((r) => r.asset_type === type);
}

// Days with their entries and totals (newest first). In "All" each day also has the closing cash balance.
export async function getLedger(type = 'All') {
  const { starting_capital } = await getSettings();
  const rows = await allMovements(type);
  const days = [];
  let balance = starting_capital;
  let current = null;
  for (const r of rows) {
    if (!current || current.date !== r.date) {
      current = { date: r.date, entries: [], moneyIn: 0, moneyOut: 0 };
      days.push(current);
    }
    current.entries.push(r);
    if (r.amount >= 0) current.moneyIn += r.amount;
    else current.moneyOut += -r.amount;
    balance += r.amount;
    current.closing = type === 'All' ? balance : null;
  }
  days.forEach((d) => d.entries.reverse());
  const totalIn = rows.filter((r) => r.amount > 0).reduce((s, r) => s + r.amount, 0);
  const totalOut = rows.filter((r) => r.amount < 0).reduce((s, r) => s - r.amount, 0);
  return { days: days.reverse(), startingCapital: starting_capital, balance, totalIn, totalOut };
}

/* ---------------- Reports ---------------- */

/*
  Month-end report
    Sales profit   (assets sold this month)
  + Rent received  (this month)
  − Running costs of rented assets (Holding & Marketing, this month)
  = Gross profit
  − Indirect expenses (overhead — only in "All", it isn't tied to a type)
  = Net profit
*/
export async function getMonthReport(year, month, type = 'All') {
  const db = await getDb();
  const key = monthKey(year, month);
  const tw = type === 'All' ? '' : ' AND a.type = ?';
  const tp = type === 'All' ? [] : [type];

  const sold = (await db.getAllAsync(
    `${ASSET_SELECT} WHERE a.is_deleted = 0 AND a.status = 'Sold' AND substr(a.sale_date, 1, 7) = ?${tw} ORDER BY a.sale_date`,
    key, ...tp
  )).map(parseAsset);

  const incomes = await db.getAllAsync(
    `SELECT i.*, a.identifier, a.type FROM incomes i JOIN assets a ON a.id = i.asset_id
     WHERE i.is_deleted = 0 AND a.is_deleted = 0 AND substr(i.date, 1, 7) = ?${tw} ORDER BY i.date`,
    key, ...tp
  );
  const rentRunning = await db.getAllAsync(
    `SELECT e.* FROM expenses e JOIN assets a ON a.id = e.asset_id
     WHERE e.is_deleted = 0 AND a.is_deleted = 0 AND e.expense_type = 'Direct' AND a.deal_type = 'Rent'
       AND e.phase IN (${inList(RUNNING_PHASES)}) AND substr(e.date, 1, 7) = ?${tw}`,
    key, ...tp
  );
  const indirectRows = type === 'All' ? await db.getAllAsync(
    `SELECT * FROM expenses WHERE is_deleted = 0 AND expense_type = 'Indirect' AND substr(date, 1, 7) = ?`, key
  ) : [];
  const directSpent = await db.getFirstAsync(
    `SELECT COALESCE(SUM(e.amount), 0) AS total FROM expenses e JOIN assets a ON a.id = e.asset_id
     WHERE e.is_deleted = 0 AND a.is_deleted = 0 AND e.expense_type = 'Direct' AND substr(e.date, 1, 7) = ?${tw}`,
    key, ...tp
  );
  const purchases = await db.getFirstAsync(
    `SELECT COUNT(*) AS n, COALESCE(SUM(purchase_price), 0) AS total FROM assets a
     WHERE a.is_deleted = 0 AND substr(a.purchase_date, 1, 7) = ?${tw}`,
    key, ...tp
  );

  const salesGain = sold.reduce((s, a) => s + a.sale_gain, 0);
  const revenue = sold.reduce((s, a) => s + a.sale_price, 0);
  const rentIncome = incomes.reduce((s, r) => s + r.amount, 0);
  const runningTotal = rentRunning.reduce((s, r) => s + r.amount, 0);
  const gross = salesGain + rentIncome - runningTotal;
  const indirect = groupSum(indirectRows, 'category');
  const indirectTotal = indirect.reduce((s, c) => s + c.value, 0);

  return {
    key, year, month, type, sold, revenue, salesGain,
    incomes, rentIncome, runningTotal, gross,
    indirect, indirectTotal, net: gross - indirectTotal,
    directSpent: directSpent.total,
    purchasesCount: purchases.n, purchasesTotal: purchases.total,
  };
}

export async function getMonthlyTrend(n = 6, type = 'All') {
  const out = [];
  const d = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const x = new Date(d.getFullYear(), d.getMonth() - i, 1);
    const r = await getMonthReport(x.getFullYear(), x.getMonth(), type);
    out.push({ year: r.year, month: r.month, gross: r.gross, net: r.net, rent: r.rentIncome, sales: r.salesGain });
  }
  return out;
}

export async function getOverallReport(type = 'All') {
  const db = await getDb();
  const assets = await listAssets({ type });
  const sold = assets.filter((a) => a.status === 'Sold');
  const tw = type === 'All' ? '' : ' AND a.type = ?';
  const tp = type === 'All' ? [] : [type];

  const byType = {};
  assets.forEach((a) => {
    byType[a.type] = byType[a.type] || { type: a.type, count: 0, sold: 0, earned: 0 };
    byType[a.type].count += 1;
    byType[a.type].earned += a.earned;
    if (a.status === 'Sold') byType[a.type].sold += 1;
  });
  const salesEarned = assets.filter((a) => a.deal_type === 'Sale').reduce((s, a) => s + a.earned, 0);
  const rentEarned = assets.filter((a) => a.deal_type === 'Rent').reduce((s, a) => s + a.earned, 0);

  const direct = await db.getAllAsync(
    `SELECT e.category, e.phase, e.amount FROM expenses e JOIN assets a ON a.id = e.asset_id
     WHERE e.is_deleted = 0 AND a.is_deleted = 0 AND e.expense_type = 'Direct'${tw}`, ...tp);
  const indirect = type === 'All'
    ? await db.getAllAsync(`SELECT category, amount FROM expenses WHERE is_deleted = 0 AND expense_type = 'Indirect'`)
    : [];
  const earnedAll = assets.reduce((s, a) => s + a.earned, 0);
  const indirectAll = indirect.reduce((s, r) => s + r.amount, 0);
  const best = [...sold].sort((a, b) => b.profit - a.profit)[0] || null;
  const rentals = assets.filter((a) => a.deal_type === 'Rent' && a.status !== 'Sold');

  return {
    byType: Object.values(byType),
    salesEarned, rentEarned,
    directByCategory: groupSum(direct, 'category'),
    directByPhase: groupSum(direct, 'phase'),
    indirectByCategory: groupSum(indirect, 'category'),
    earnedAll, indirectAll, netAll: earnedAll - indirectAll,
    soldCount: sold.length,
    avgDays: sold.length ? Math.round(sold.reduce((s, a) => s + a.days_held, 0) / sold.length) : 0,
    avgRoi: sold.length ? sold.reduce((s, a) => s + a.roi, 0) / sold.length : 0,
    best,
    rentalCount: rentals.length,
    rentReceived: assets.reduce((s, a) => s + a.income_total, 0),
    avgYield: rentals.length ? rentals.reduce((s, a) => s + (a.yield_pct || 0), 0) / rentals.length : 0,
  };
}

/* ---------------- Home & overview ---------------- */

async function cashAvailable(settings) {
  const db = await getDb();
  const t = await db.getFirstAsync(`
    SELECT
      (SELECT COALESCE(SUM(purchase_price),0) FROM assets WHERE is_deleted=0) AS purchases,
      (SELECT COALESCE(SUM(sale_price),0) FROM assets WHERE is_deleted=0 AND status='Sold') AS sales,
      (SELECT COALESCE(SUM(amount),0) FROM expenses WHERE is_deleted=0) AS expenses,
      (SELECT COALESCE(SUM(i.amount),0) FROM incomes i JOIN assets a ON a.id = i.asset_id
         WHERE i.is_deleted=0 AND a.is_deleted=0) AS incomes`);
  return settings.starting_capital - t.purchases - t.expenses + t.sales + t.incomes;
}

function summarize(list) {
  const held = list.filter((a) => a.status !== 'Sold');
  const rentals = held.filter((a) => a.deal_type === 'Rent');
  const rented = rentals.filter((a) => a.status === 'Rented');
  return {
    count: list.length,
    held: held.length,
    sold: list.length - held.length,
    forSale: held.filter((a) => a.deal_type === 'Sale').length,
    forRent: rentals.length,
    rented: rented.length,
    vacant: rentals.filter((a) => a.status !== 'Rented').length,
    invested: held.reduce((s, a) => s + a.cost, 0),
    earned: list.reduce((s, a) => s + a.earned, 0),
    monthlyRent: rented.reduce((s, a) => s + (a.rent_amount || 0), 0),
    expectedSale: held.filter((a) => a.deal_type === 'Sale').reduce((s, a) => s + (a.expected_profit || 0), 0),
  };
}

// The first screen: one summary per asset type
export async function getHomeSummary() {
  const settings = await getSettings();
  const assets = await listAssets();
  const needs = (list) =>
    rentDue(list).length +
    list.filter((a) => a.status !== 'Sold' && a.deal_type === 'Sale' && a.expense_ratio >= settings.alert_percent).length;
  const out = { All: { ...summarize(assets), attention: needs(assets) } };
  ['House', 'Land', 'Vehicle'].forEach((t) => {
    const list = assets.filter((a) => a.type === t);
    out[t] = { ...summarize(list), attention: needs(list) };
  });
  return { settings, types: out };
}

// Overview tab for one type (or All)
export async function getOverview(type = 'All') {
  const settings = await getSettings();
  const assets = await listAssets({ type });
  const d = new Date();
  const month = await getMonthReport(d.getFullYear(), d.getMonth(), type);
  const due = rentDue(assets);
  const over = assets
    .filter((a) => a.status !== 'Sold' && a.deal_type === 'Sale' && a.expense_ratio >= settings.alert_percent)
    .sort((a, b) => b.expense_ratio - a.expense_ratio);
  const recent = (await allMovements(type)).slice(-5).reverse();
  return {
    settings,
    sum: summarize(assets),
    cash: type === 'All' ? await cashAvailable(settings) : null,
    month,
    due,
    over,
    recent,
  };
}
