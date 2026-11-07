// Sample data loaded on first launch: 13 assets, ~90 direct and ~70 indirect expenses.
// Dates are relative to today so "days held", "today" and monthly reports always look realistic.
import * as Crypto from 'expo-crypto';
import { daysAgo, toISODate } from '../utils/format';

const A = 'Acquisition', H = 'Holding', I = 'Improvement', M = 'Marketing', S = 'Sale';

// p = bought N days ago, s = sold N days ago
// e = [days after purchase, phase, category, amount, note]
const ASSETS = [
  {
    type: 'Land', identifier: 'No. 18, Station Road, Kurunegala', title: '12 perch bare land', city: 'Kurunegala',
    price: 3850000, p: 210, s: 75, sale: 4600000, buyer: 'Mr. R. Bandara', seller: 'Mrs. K. Herath',
    details: { extent: '12', deed_no: '3381', plan_no: '1172', land_use: 'Residential' },
    e: [[0, A, 'Legal & Documents', 85000, 'Deed transfer & lawyer'], [0, A, 'Stamp Duty & Tax', 154000, 'Stamp duty 4%'],
      [3, A, 'Survey & Valuation', 25000, 'Boundary survey'], [20, I, 'Cleaning & Clearing', 45000, 'Cleared overgrowth'],
      [60, M, 'Advertising', 12000, 'ikman.lk ad + banner'], [130, S, 'Sales Commission', 92000, '2% broker commission'],
      [134, S, 'Transfer Fees', 18000, 'Final deed copy']],
  },
  {
    type: 'House', identifier: 'No. 78, Peradeniya Road, Kandy', title: '4 bedroom two-storey house', city: 'Kandy',
    price: 22000000, p: 190, s: 22, sale: 26800000, buyer: 'Dr. N. Wijesinghe', seller: 'Mr. P. Ratnayake',
    details: { bedrooms: '4', bathrooms: '3', floor_area: '2600', extent: '14', deed_no: '9920' },
    e: [[0, A, 'Legal & Documents', 140000, 'Lawyer & title search'], [0, A, 'Stamp Duty & Tax', 880000, 'Stamp duty'],
      [2, A, 'Survey & Valuation', 35000, 'Bank valuation'], [20, I, 'Repairs', 285000, 'Roof tiles & gutters'],
      [35, I, 'Renovation', 420000, 'Full interior painting'], [60, H, 'Utilities', 9800, 'Water & electricity'],
      [90, H, 'Security', 30000, 'Caretaker 3 months'], [120, M, 'Advertising', 25000, 'Facebook + newspaper'],
      [165, S, 'Sales Commission', 536000, '2% broker commission'], [168, S, 'Transfer Fees', 30000, 'Deed handover']],
  },
  {
    type: 'Land', identifier: 'No. 45, Temple Road, Maharagama', title: '15 perch residential land', city: 'Maharagama',
    price: 6750000, p: 160, s: 48, sale: 8950000, buyer: 'Mr. S. Perera', seller: 'Mr. A. Gunawardena',
    details: { extent: '15', deed_no: '4521', plan_no: '2210', land_use: 'Residential' },
    e: [[0, A, 'Legal & Documents', 95000, 'Deed & lawyer'], [0, A, 'Stamp Duty & Tax', 270000, 'Stamp duty'],
      [0, A, 'Brokerage', 67500, '1% finder fee'], [15, I, 'Cleaning & Clearing', 38000, 'Clearing & levelling'],
      [25, I, 'Repairs', 120000, 'Boundary fence'], [70, M, 'Advertising', 18000, 'Signboard + online ad'],
      [110, S, 'Sales Commission', 179000, '2% broker commission'], [112, S, 'Transfer Fees', 22000, 'Deed handover']],
  },
  {
    type: 'House', identifier: 'No. 12/3, Flower Lane, Nugegoda', title: '3 bedroom single-storey house', city: 'Nugegoda',
    price: 18500000, p: 130, status: 'Under Repair', asking: 24500000, seller: 'Mrs. D. Fernando',
    details: { bedrooms: '3', bathrooms: '2', floor_area: '1850', extent: '10', deed_no: '7731' },
    e: [[0, A, 'Legal & Documents', 120000, 'Lawyer & title search'], [0, A, 'Stamp Duty & Tax', 740000, 'Stamp duty'],
      [0, A, 'Brokerage', 185000, '1% finder fee'], [20, I, 'Repairs', 165000, 'Plumbing replaced'],
      [40, I, 'Renovation', 680000, 'New pantry & kitchen'], [70, I, 'Renovation', 450000, 'Two bathrooms redone'],
      [95, I, 'Repairs', 210000, 'Full rewiring'], [100, H, 'Utilities', 12400, 'Water & electricity'],
      [110, H, 'Security', 25000, 'Night watcher'], [125, I, 'Renovation', 380000, 'Painting inside & out']],
  },
  {
    type: 'Vehicle', identifier: 'SP CAD-1190', title: 'Toyota Premio 2012', city: 'Galle',
    price: 7250000, p: 120, status: 'Listed', asking: 8100000, seller: 'Mr. L. Silva',
    details: { make: 'Toyota', model: 'Premio', year: '2012', mileage: '112000', fuel: 'Petrol', chassis_no: 'NZT260-3021876' },
    e: [[0, A, 'Legal & Documents', 32000, 'RMV ownership transfer'], [5, H, 'Insurance', 55000, 'Comprehensive insurance'],
      [10, I, 'Repairs', 95000, 'Suspension bushes'], [25, I, 'Repairs', 38000, 'A/C gas & compressor'],
      [30, I, 'Cleaning & Clearing', 14000, 'Full detailing'], [40, M, 'Advertising', 9000, 'riyasewana.com ad'],
      [60, H, 'Loan Interest', 72000, 'Leasing interest'], [80, M, 'Advertising', 9000, 'Ad renewal'],
      [90, H, 'Loan Interest', 72000, 'Leasing interest'], [118, H, 'Loan Interest', 72000, 'Leasing interest']],
  },
  {
    type: 'Land', identifier: 'Lot 7, Kandy Road, Kadawatha', title: '20 perch land near highway', city: 'Kadawatha',
    price: 9200000, p: 95, status: 'Listed', asking: 11500000, seller: 'Mr. J. Peiris',
    details: { extent: '20', deed_no: '5108', plan_no: '3305', land_use: 'Commercial' },
    e: [[0, A, 'Legal & Documents', 105000, 'Deed & lawyer'], [0, A, 'Stamp Duty & Tax', 368000, 'Stamp duty'],
      [4, A, 'Survey & Valuation', 30000, 'Survey plan'], [12, I, 'Cleaning & Clearing', 55000, 'Clearing & filling'],
      [40, H, 'Security', 18000, 'Caretaker'], [60, M, 'Advertising', 15000, 'Online ads'],
      [62, M, 'Advertising', 8500, 'Roadside signboard']],
  },
  {
    type: 'Vehicle', identifier: 'WP PH-6672', title: 'Nissan Leaf 2018', city: 'Colombo',
    price: 6100000, p: 80, s: 10, sale: 6900000, buyer: 'Ms. T. Jayasuriya', seller: 'Mr. M. Rizwan',
    details: { make: 'Nissan', model: 'Leaf', year: '2018', mileage: '46000', fuel: 'Electric', chassis_no: 'ZE1-031144' },
    e: [[0, A, 'Legal & Documents', 35000, 'RMV ownership transfer'], [0, A, 'Transport', 12000, 'Driver from Kurunegala'],
      [5, H, 'Insurance', 42000, 'Insurance'], [8, I, 'Repairs', 48000, 'Battery health check & tyres'],
      [12, I, 'Cleaning & Clearing', 15000, 'Full detailing'], [30, M, 'Advertising', 9500, 'riyasewana.com ad'],
      [70, S, 'Sales Commission', 69000, 'Broker commission']],
  },
  {
    type: 'House', identifier: 'No. 5, Lake Drive, Negombo', title: '2 bedroom house near lagoon', city: 'Negombo',
    price: 14200000, p: 60, status: 'Listed', asking: 17000000, seller: 'Mr. C. Fernando',
    details: { bedrooms: '2', bathrooms: '1', floor_area: '1200', extent: '8', deed_no: '6640' },
    e: [[0, A, 'Legal & Documents', 98000, 'Lawyer & title search'], [0, A, 'Stamp Duty & Tax', 568000, 'Stamp duty'],
      [10, I, 'Repairs', 145000, 'Ceiling & doors'], [25, I, 'Renovation', 75000, 'Garden & gate'],
      [30, H, 'Utilities', 7600, 'Water & electricity'], [45, M, 'Advertising', 22000, 'Facebook + ikman.lk'],
      [55, I, 'Cleaning & Clearing', 18000, 'Deep clean before viewings']],
  },
  {
    type: 'Vehicle', identifier: 'WP CAQ-4521', title: 'Toyota Aqua 2014', city: 'Colombo',
    price: 5650000, p: 55, s: 3, sale: 6350000, buyer: 'Mr. H. Dissanayake', seller: 'Mr. U. Kumara',
    details: { make: 'Toyota', model: 'Aqua', year: '2014', mileage: '98000', fuel: 'Hybrid', chassis_no: 'NHP10-2418873' },
    e: [[0, A, 'Legal & Documents', 30000, 'RMV ownership transfer'], [6, I, 'Repairs', 165000, 'Hybrid battery reconditioned'],
      [10, I, 'Cleaning & Clearing', 12500, 'Full detailing'], [20, M, 'Advertising', 7500, 'riyasewana.com ad'],
      [51, S, 'Sales Commission', 63500, 'Broker commission']],
  },
  {
    type: 'Land', identifier: 'Galle Road, Unawatuna', title: '30 perch coastal land', city: 'Galle',
    price: 12500000, p: 40, status: 'Purchased', asking: 15800000, seller: 'Mr. G. de Silva',
    details: { extent: '30', deed_no: '8812', plan_no: '4410', land_use: 'Commercial' },
    e: [[0, A, 'Legal & Documents', 110000, 'Deed & lawyer'], [0, A, 'Stamp Duty & Tax', 500000, 'Stamp duty'],
      [0, A, 'Brokerage', 125000, '1% finder fee'], [5, A, 'Survey & Valuation', 40000, 'Survey plan'],
      [20, I, 'Cleaning & Clearing', 32000, 'Clearing']],
  },
  {
    type: 'Vehicle', identifier: 'WP CBK-7788', title: 'Honda Vezel 2016', city: 'Colombo',
    price: 8900000, p: 35, status: 'Listed', asking: 9850000, seller: 'Mrs. S. Nanayakkara',
    details: { make: 'Honda', model: 'Vezel', year: '2016', mileage: '74000', fuel: 'Hybrid', chassis_no: 'RU3-1203398' },
    e: [[0, A, 'Legal & Documents', 30000, 'RMV ownership transfer'], [4, I, 'Repairs', 118000, 'Full service + 4 tyres'],
      [8, I, 'Cleaning & Clearing', 15000, 'Full detailing'], [15, M, 'Advertising', 12000, 'riyasewana.com ad']],
  },
  {
    type: 'House', identifier: 'No. 221, High Level Road, Homagama', title: '3 bedroom house, needs work', city: 'Homagama',
    price: 16750000, p: 15, status: 'Purchased', asking: 21000000, seller: 'Mr. W. Senanayake',
    details: { bedrooms: '3', bathrooms: '2', floor_area: '1650', extent: '12', deed_no: '10234' },
    e: [[0, A, 'Legal & Documents', 115000, 'Lawyer & title search'], [0, A, 'Stamp Duty & Tax', 670000, 'Stamp duty'],
      [0, A, 'Brokerage', 167500, '1% finder fee'], [6, A, 'Survey & Valuation', 30000, 'Valuation report']],
  },
  {
    type: 'Vehicle', identifier: 'CP KQ-3309', title: 'Suzuki Wagon R 2017', city: 'Kandy',
    price: 4300000, p: 12, status: 'Under Repair', asking: 5100000, seller: 'Mr. F. Nizam',
    details: { make: 'Suzuki', model: 'Wagon R', year: '2017', mileage: '61000', fuel: 'Hybrid', chassis_no: 'MH55S-7781204' },
    e: [[0, A, 'Legal & Documents', 25000, 'RMV ownership transfer'], [0, A, 'Transport', 8000, 'Towing to garage'],
      [5, I, 'Repairs', 135000, 'Engine overhaul'], [12, I, 'Repairs', 40000, 'Body paint (advance)']],
  },
];

// Indirect costs repeat every month, on these days
const MONTHLY_INDIRECT = [
  [1, 'Office & Rent', 45000, 'Office rent'],
  [3, 'Travel & Fuel', 7800, 'Fuel'],
  [5, 'Communication', 8500, 'Mobile & data bills'],
  [10, 'Office & Rent', 6200, 'Office electricity'],
  [10, 'Travel & Fuel', 9500, 'Fuel'],
  [12, 'Hospitality', 4800, 'Tea & meals with buyers'],
  [15, 'General Marketing', 15000, 'Facebook page boost'],
  [17, 'Travel & Fuel', 6400, 'Fuel'],
  [24, 'Travel & Fuel', 11200, 'Fuel – outstation visits'],
  [28, 'Staff & Wages', 60000, 'Assistant salary'],
  [28, 'Bank & Finance', 1450, 'Bank charges'],
];
const OCCASIONAL_INDIRECT = [
  [0, 20, 'Deal Hunting', 12500, 'Inspection trip – Matale land (not bought)'],
  [2, 20, 'Deal Hunting', 18000, 'Valuation – Kottawa house (not bought)'],
  [4, 20, 'Deal Hunting', 9000, 'Broker tip – Gampaha lead'],
  [1, 22, 'Professional Fees', 25000, 'Accountant – quarterly'],
  [4, 22, 'Professional Fees', 25000, 'Accountant – quarterly'],
  [3, 8, 'Other', 7500, 'Stationery & photocopies'],
];

export async function seedSampleData(db) {
  const stamp = new Date().toISOString();
  const id = () => Crypto.randomUUID();
  const todayStr = daysAgo(0);

  await db.withTransactionAsync(async () => {
    for (const a of ASSETS) {
      const assetId = id();
      const status = a.s !== undefined ? 'Sold' : a.status;
      await db.runAsync(
        `INSERT INTO assets (id, type, identifier, title, city, purchase_price, purchase_date, seller_name, status,
          asking_price, sale_price, sale_date, buyer_name, details, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        assetId, a.type, a.identifier, a.title, a.city, a.price, daysAgo(a.p), a.seller || null, status,
        a.asking ?? a.sale ?? null, a.sale ?? null, a.s !== undefined ? daysAgo(a.s) : null, a.buyer || null,
        JSON.stringify(a.details), stamp, stamp
      );
      for (const [offset, phase, category, amount, note] of a.e) {
        const ago = Math.max(a.s ?? 0, a.p - offset);
        await db.runAsync(
          `INSERT INTO expenses (id, expense_type, asset_id, phase, category, amount, date, note, created_at, updated_at)
           VALUES (?, 'Direct', ?, ?, ?, ?, ?, ?, ?, ?)`,
          id(), assetId, phase, category, amount, daysAgo(ago), note, stamp, stamp
        );
      }
    }

    // Indirect: the last 7 calendar months, up to today
    const base = new Date();
    for (let k = 0; k < 7; k++) {
      const y = base.getFullYear();
      const m = base.getMonth() - k;
      const rows = [
        ...MONTHLY_INDIRECT,
        ...OCCASIONAL_INDIRECT.filter(([mk]) => mk === k).map(([, ...r]) => r),
      ];
      for (const [day, category, amount, note] of rows) {
        const date = toISODate(new Date(y, m, day));
        if (date > todayStr) continue;
        await db.runAsync(
          `INSERT INTO expenses (id, expense_type, asset_id, phase, category, amount, date, note, created_at, updated_at)
           VALUES (?, 'Indirect', NULL, NULL, ?, ?, ?, ?, ?, ?)`,
          id(), category, amount, date, note, stamp, stamp
        );
      }
    }
    // Something for "today"
    await db.runAsync(
      `INSERT INTO expenses (id, expense_type, asset_id, phase, category, amount, date, note, created_at, updated_at)
       VALUES (?, 'Indirect', NULL, NULL, 'Travel & Fuel', 3500, ?, 'Site visit – Homagama', ?, ?)`,
      id(), todayStr, stamp, stamp
    );
  });
  await seedRentalSample(db);
}

// Rental examples: assets kept and rented out for monthly income
const RENTALS = [
  {
    type: 'House', identifier: 'No. 9, Park Avenue, Rajagiriya', title: '3 bedroom house, rented', city: 'Rajagiriya',
    price: 24500000, p: 240, status: 'Rented', rent: 95000, rentStartAgo: 200,
    tenant: 'Mr. & Mrs. Wickramasinghe', phone: '077 412 8890', seller: 'Mrs. R. Jayawardena',
    details: { bedrooms: '3', bathrooms: '2', floor_area: '1950', extent: '9', deed_no: '11208' },
    e: [[0, A, 'Legal & Documents', 150000, 'Lawyer & title search'], [0, A, 'Stamp Duty & Tax', 980000, 'Stamp duty'],
      [15, I, 'Renovation', 320000, 'Painting & new fittings'], [25, I, 'Repairs', 85000, 'Roof leak fixed'],
      [30, M, 'Advertising', 15000, 'To-let ads'], [60, H, 'Insurance', 38000, 'Building insurance'],
      [120, H, 'Stamp Duty & Tax', 18000, 'Assessment rates'], [150, H, 'Repairs', 22000, 'Water pump replaced']],
  },
  {
    type: 'Land', identifier: 'No. 3, Main Street, Kiribathgoda', title: '10 perch commercial land, leased', city: 'Kiribathgoda',
    price: 11000000, p: 300, status: 'Rented', rent: 55000, rentStartAgo: 270,
    tenant: 'Kiribathgoda Hardware (Pvt) Ltd', phone: '011 291 4455', seller: 'Mr. D. Perera',
    details: { extent: '10', deed_no: '2290', plan_no: '881', land_use: 'Commercial' },
    e: [[0, A, 'Legal & Documents', 95000, 'Deed & lawyer'], [0, A, 'Stamp Duty & Tax', 440000, 'Stamp duty'],
      [10, I, 'Cleaning & Clearing', 40000, 'Clearing & levelling'], [20, I, 'Repairs', 180000, 'Boundary wall & gate'],
      [200, H, 'Stamp Duty & Tax', 12000, 'Assessment rates']],
  },
  {
    type: 'Vehicle', identifier: 'WP PE-5521', title: 'Toyota KDH van 2015, on hire', city: 'Colombo',
    price: 9800000, p: 150, status: 'Rented', rent: 175000, rentStartFirstOfMonthsAgo: 4, unpaidThisMonth: true,
    tenant: 'Lanka Tours (Pvt) Ltd', phone: '076 220 1188', seller: 'Mr. K. Rajapaksha',
    details: { make: 'Toyota', model: 'KDH', year: '2015', mileage: '138000', fuel: 'Diesel', chassis_no: 'KDH201-0081123' },
    e: [[0, A, 'Legal & Documents', 35000, 'RMV ownership transfer'], [3, H, 'Insurance', 95000, 'Commercial insurance'],
      [5, I, 'Repairs', 65000, 'Full service before hire'], [90, H, 'Repairs', 42000, 'Brake pads & service']],
  },
  {
    type: 'House', identifier: 'No. 14, Hill Street, Dehiwala', title: '2 bedroom house, ready to let', city: 'Dehiwala',
    price: 15800000, p: 45, status: 'Vacant', rent: 70000, seller: 'Mr. S. Gunasekara',
    details: { bedrooms: '2', bathrooms: '1', floor_area: '1150', extent: '6', deed_no: '12011' },
    e: [[0, A, 'Legal & Documents', 105000, 'Lawyer & title search'], [0, A, 'Stamp Duty & Tax', 630000, 'Stamp duty'],
      [15, I, 'Renovation', 260000, 'Kitchen & bathroom refresh'], [40, M, 'Advertising', 8000, 'To-let ads']],
  },
];

export async function seedRentalSample(db) {
  const stamp = new Date().toISOString();
  const id = () => Crypto.randomUUID();
  const now = new Date();
  const todayStr = daysAgo(0);

  await db.withTransactionAsync(async () => {
    for (const a of RENTALS) {
      const assetId = id();
      let rentStart = null;
      if (a.rentStartAgo) rentStart = daysAgo(a.rentStartAgo);
      if (a.rentStartFirstOfMonthsAgo) rentStart = toISODate(new Date(now.getFullYear(), now.getMonth() - a.rentStartFirstOfMonthsAgo, 1));
      await db.runAsync(
        `INSERT INTO assets (id, type, identifier, title, city, purchase_price, purchase_date, seller_name, deal_type, status,
          rent_amount, tenant_name, tenant_phone, rent_start, details, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Rent', ?, ?, ?, ?, ?, ?, ?, ?)`,
        assetId, a.type, a.identifier, a.title, a.city, a.price, daysAgo(a.p), a.seller, a.status,
        a.rent, a.tenant || null, a.phone || null, rentStart, JSON.stringify(a.details), stamp, stamp
      );
      for (const [offset, phase, category, amount, note] of a.e) {
        await db.runAsync(
          `INSERT INTO expenses (id, expense_type, asset_id, phase, category, amount, date, note, created_at, updated_at)
           VALUES (?, 'Direct', ?, ?, ?, ?, ?, ?, ?, ?)`,
          id(), assetId, phase, category, amount, daysAgo(Math.max(0, a.p - offset)), note, stamp, stamp
        );
      }
      // One rent payment per month, on the due day, up to today
      if (rentStart) {
        const dueDay = Math.min(28, Number(rentStart.slice(8, 10)));
        let y = Number(rentStart.slice(0, 4));
        let m = Number(rentStart.slice(5, 7)) - 1;
        while (true) {
          const due = toISODate(new Date(y, m, dueDay));
          if (due > todayStr) break;
          const isThisMonth = y === now.getFullYear() && m === now.getMonth();
          if (!(isThisMonth && a.unpaidThisMonth) && due >= rentStart) {
            await db.runAsync(
              `INSERT INTO incomes (id, asset_id, income_type, amount, date, period, note, created_at, updated_at)
               VALUES (?, ?, 'Rent', ?, ?, ?, ?, ?, ?)`,
              id(), assetId, a.rent, due, due.slice(0, 7), 'Monthly rent', stamp, stamp
            );
          }
          m += 1;
          if (m > 11) { m = 0; y += 1; }
        }
      }
    }
  });
}
