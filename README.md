# Dealmint – Asset Purchase-to-Sale Expense & Profit Manager

An offline React Native (Expo) app for dealers who buy land, houses and vehicles. It tracks every expense from purchase to sale and shows profit per asset, daily cash status and a month-end profit report.

## Run it

1. Install **Node.js** (LTS) and **VS Code**.
2. Install **Expo Go** on your Android phone (Play Store).
3. In this folder:
   ```bash
   npm install
   npx expo start
   ```
4. Scan the QR code with Expo Go. The app opens with sample data.

Phone and computer must be on the same Wi-Fi. If they can't connect, run `npx expo start --tunnel`.

## How the app is organised

The app opens on a **Home** screen where you choose what to manage: **Houses, Land, Vehicles or All assets**. Every screen after that shows only that type. Each asset has a **plan**:

- **Sell**: buy, fix up, sell for profit. Statuses: Purchased → Under Repair → Listed → Sold
- **Rent out**: buy, fix up, rent for monthly income. Statuses: Purchased → Under Repair → Vacant → Rented (it can still be sold later)

## Screens

| Tab / screen | What it does |
|---|---|
| **Home** | Choose House / Land / Vehicle / All. Shows cash available and this month's profit |
| **Overview** | Invested now, earned so far, selling vs renting, items needing attention (rent due, over-budget assets), this month, recent activity |
| **Rent received** | Record rent for a month (amount, month, date received) |
| **Assets** | Search by address / vehicle number / city, filter by type and status. Tap a card to expand it and see a **pie chart** of where the money went |
| **Asset details** | Lifecycle (Purchased → Under Repair → Listed → Sold), profit/ROI, days held, cost breakdown pie, expense timeline grouped by phase with running total |
| **New / Edit asset** | Type-specific fields. Land & houses are identified by **address**, vehicles by **vehicle number** |
| **Add expense** | **Direct** (one asset, with phase) or **Indirect** (overhead: fuel, phone, rent, staff) |
| **Sell asset** | Sale price, buyer, commission, live profit preview |
| **Daily** | Every day's money in/out and closing cash balance |
| **Reports** | Month-end statement (gross profit − indirect costs = net profit), 6-month trend, all-time profit by asset type, expenses by phase and category |
| **Settings** | Starting capital, expense alert %, backup export/import, sample data |

## How profit works

- **Sell plan profit** = Sale price − Purchase price − Direct expenses
- **Rent plan**: each month, Rent received − running costs (Holding & Marketing expenses). Purchase + Acquisition/Improvement costs are the investment. Yield = yearly rent ÷ investment
- **Month-end gross profit** = Profit from sales + Rent received − Rental running costs
- **Month-end net profit** = Gross profit of assets sold that month − Indirect expenses of that month
- **Cash available** = Starting capital − Purchases − All expenses + Sales
- **Expense alert** when an asset's direct expenses reach the set % of its purchase price

## Database (SQLite, on the phone)

`src/db/database.js` creates three tables:

- **assets**: type, identifier (address or vehicle number), prices, dates, status, buyer, `details` (JSON with type-specific fields)
- **expenses**: `expense_type` (Direct/Indirect), `asset_id` (empty for indirect), phase, category, amount, date, note
- **incomes**: rent received per asset: amount, date, month covered (`period`)
- **settings**: starting capital, alert %, business name

Assets also store `deal_type` (Sale/Rent), `rent_amount`, tenant name/phone and `rent_start`. Phones running version 1 are upgraded automatically (new columns are added on launch).

The tables are sync-ready: UUID ids, `created_at`/`updated_at` and soft delete (`is_deleted`). Cloud sync and team access can be added later without changing the data.

## Folder structure

```
App.js                  navigation (tabs + modal screens)
src/theme.js            Apple-style colours, light/dark mode, type scale
src/constants.js        asset types, statuses, phases, categories
src/db/                 database, queries (repo.js), sample data, backup
src/components/         UI building blocks, charts (pie/donut, bars), asset card
src/screens/            the 9 screens
src/utils/              money/date formatting, helpers
```

## Future work

Cloud sync (e.g. Supabase) so 3–4 agency staff can share data, logins with roles, and receipt photos.
