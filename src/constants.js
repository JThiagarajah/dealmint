// Shared lists used across the app (types, statuses, phases, categories)

export const ASSET_TYPES = {
  Land: {
    icon: 'map',
    color: 'green',
    idLabel: 'Address',
    idPlaceholder: 'e.g. No. 45, Temple Road, Maharagama',
    fields: [
      { key: 'extent', label: 'Land extent (perches)', numeric: true, placeholder: '15' },
      { key: 'deed_no', label: 'Deed number', placeholder: 'e.g. 4521' },
      { key: 'plan_no', label: 'Survey plan number', placeholder: 'e.g. 2210' },
      { key: 'land_use', label: 'Land use', options: ['Residential', 'Commercial', 'Agricultural'] },
    ],
  },
  House: {
    icon: 'home',
    color: 'blue',
    idLabel: 'Address',
    idPlaceholder: 'e.g. No. 12/3, Flower Lane, Nugegoda',
    fields: [
      { key: 'bedrooms', label: 'Bedrooms', numeric: true, placeholder: '3' },
      { key: 'bathrooms', label: 'Bathrooms', numeric: true, placeholder: '2' },
      { key: 'floor_area', label: 'Floor area (sq ft)', numeric: true, placeholder: '1850' },
      { key: 'extent', label: 'Land extent (perches)', numeric: true, placeholder: '10' },
      { key: 'deed_no', label: 'Deed number', placeholder: 'e.g. 7731' },
    ],
  },
  Vehicle: {
    icon: 'car-sport',
    color: 'orange',
    idLabel: 'Vehicle number',
    idPlaceholder: 'e.g. WP CAQ-4521',
    fields: [
      { key: 'make', label: 'Make', placeholder: 'Toyota' },
      { key: 'model', label: 'Model', placeholder: 'Aqua' },
      { key: 'year', label: 'Year', numeric: true, placeholder: '2016' },
      { key: 'mileage', label: 'Mileage (km)', numeric: true, placeholder: '85000' },
      { key: 'fuel', label: 'Fuel', options: ['Petrol', 'Hybrid', 'Diesel', 'Electric'] },
      { key: 'chassis_no', label: 'Chassis number', placeholder: 'NHP10-1234567' },
    ],
  },
};

export const TYPE_LIST = Object.keys(ASSET_TYPES);

export const STATUSES = {
  Purchased: { color: 'blue', icon: 'bag-check' },
  'Under Repair': { color: 'orange', icon: 'construct' },
  Listed: { color: 'purple', icon: 'pricetag' },
  Vacant: { color: 'teal', icon: 'key' },
  Rented: { color: 'indigo', icon: 'people' },
  Sold: { color: 'green', icon: 'checkmark-circle' },
};
export const STATUS_LIST = Object.keys(STATUSES);

// Every asset has a plan: sell it for profit, or rent it out for monthly income
export const PLANS = {
  Sale: { label: 'Sell', long: 'Buy & sell', icon: 'pricetag', color: 'purple' },
  Rent: { label: 'Rent out', long: 'Rent out', icon: 'key', color: 'teal' },
};
export const STATUS_FLOW = {
  Sale: ['Purchased', 'Under Repair', 'Listed', 'Sold'],
  Rent: ['Purchased', 'Under Repair', 'Vacant', 'Rented'],
};

// For rentals, these phases are part of the investment (capital).
// Holding & Marketing costs are running costs, deducted from rent every month.
export const CAPITAL_PHASES = ['Acquisition', 'Improvement', 'Sale'];
export const RUNNING_PHASES = ['Holding', 'Marketing'];

export const INCOME_TYPES = ['Rent', 'Other income'];

export const TYPE_PLURAL = { Land: 'Land', House: 'Houses', Vehicle: 'Vehicles', All: 'All assets' };

// The life of an asset, from buying to selling
export const PHASES = {
  Acquisition: { color: 'blue', icon: 'document-text' },
  Holding: { color: 'teal', icon: 'time' },
  Improvement: { color: 'orange', icon: 'hammer' },
  Marketing: { color: 'purple', icon: 'megaphone' },
  Sale: { color: 'green', icon: 'cash' },
};
export const PHASE_LIST = Object.keys(PHASES);

// Direct = belongs to one asset. The phase is suggested automatically.
export const DIRECT_CATEGORIES = [
  { name: 'Legal & Documents', icon: 'document-text', phase: 'Acquisition' },
  { name: 'Stamp Duty & Tax', icon: 'receipt', phase: 'Acquisition' },
  { name: 'Survey & Valuation', icon: 'resize', phase: 'Acquisition' },
  { name: 'Brokerage', icon: 'people', phase: 'Acquisition' },
  { name: 'Transport', icon: 'bus', phase: 'Acquisition' },
  { name: 'Repairs', icon: 'hammer', phase: 'Improvement' },
  { name: 'Renovation', icon: 'color-palette', phase: 'Improvement' },
  { name: 'Cleaning & Clearing', icon: 'leaf', phase: 'Improvement' },
  { name: 'Security', icon: 'shield-checkmark', phase: 'Holding' },
  { name: 'Utilities', icon: 'flash', phase: 'Holding' },
  { name: 'Insurance', icon: 'umbrella', phase: 'Holding' },
  { name: 'Loan Interest', icon: 'trending-up', phase: 'Holding' },
  { name: 'Advertising', icon: 'megaphone', phase: 'Marketing' },
  { name: 'Sales Commission', icon: 'cash', phase: 'Sale' },
  { name: 'Transfer Fees', icon: 'swap-horizontal', phase: 'Sale' },
  { name: 'Other', icon: 'ellipsis-horizontal', phase: 'Holding' },
];

// Indirect = running the business, not tied to one asset. Deducted at month end.
export const INDIRECT_CATEGORIES = [
  { name: 'Travel & Fuel', icon: 'car' },
  { name: 'Communication', icon: 'call' },
  { name: 'Office & Rent', icon: 'business' },
  { name: 'Staff & Wages', icon: 'people' },
  { name: 'General Marketing', icon: 'megaphone' },
  { name: 'Bank & Finance', icon: 'card' },
  { name: 'Professional Fees', icon: 'briefcase' },
  { name: 'Deal Hunting', icon: 'search' },
  { name: 'Hospitality', icon: 'cafe' },
  { name: 'Other', icon: 'ellipsis-horizontal' },
];

export const categoryIcon = (type, name) => {
  const list = type === 'Indirect' ? INDIRECT_CATEGORIES : DIRECT_CATEGORIES;
  return (list.find((c) => c.name === name) || { icon: 'ellipsis-horizontal' }).icon;
};

export const DEFAULT_SETTINGS = {
  business_name: 'My Agency',
  starting_capital: '175000000',
  alert_percent: '15',
};
