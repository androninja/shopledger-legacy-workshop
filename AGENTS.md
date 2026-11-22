# ShopLedger

## Stack

Node.js with CommonJS, Express 4, and body-parser. The browser UI uses plain HTML, CSS, and JavaScript from `public/`. The app stores its data in `data/db.json`.

## Module map

- `routes/customers.js` lists Khata customers and recent settlements and records repayments.
- `routes/orders.js` lists, retrieves, places, and cancels orders.
- `routes/products.js` lists products and active coupons.
- `routes/reports.js` serves dashboard and GST reconciliation reports, cart pricing previews, and data export.
- `lib/coupons.js` normalizes and validates coupon codes and calculates discounts.
- `lib/dates.js` formats dates, normalizes date keys, and derives fiscal years.
- `lib/inventory.js` looks up products, checks sellable stock, updates inventory, and summarizes stock.
- `lib/invoice.js` recomputes invoice figures and renders printable HTML.
- `lib/ledger.js` tracks Khata balances, charges, reversals, and settlements.
- `lib/orders.js` adds, retrieves, filters, and cancels order records.
- `lib/pricing.js` computes checkout totals and allocates coupon discounts across taxable lines.
- `lib/reports.js` computes dashboard summaries and compares invoice figures with saved orders.
- `lib/store.js` reads and writes the JSON data file and appends audit entries.
- `lib/tax.js` resolves item GST rates and splits GST into CGST and SGST.

## Commands

- Start the app with `npm start` (runs `node server.js`).
- Run tests with `node --test`. The `npm test` script is a placeholder that exits with an error.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the modules covered by the ticket.
3. Tests must use in-memory data. Never read or write `data/db.json` in tests.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

The printable invoice total and GST breakdown do not match what the customer was billed.

Allowed files are `lib/invoice.js` and, only if truly needed, `lib/tax.js`.
