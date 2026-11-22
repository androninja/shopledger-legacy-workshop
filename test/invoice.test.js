const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

test('invoice matches checkout for mixed GST slabs and a capped coupon', () => {
  const items = [
    { name: 'Rice', hsn: '1006', price: 500, qty: 2 },
    { name: 'Ghee', hsn: '0405', price: 500, qty: 2 }
  ];
  const coupon = 'SAVE10';
  const checkout = pricing.computeTotals(items, coupon);
  const { rows, ...invoiceTotals } = invoice.computeInvoiceFigures({ items, coupon });
  const { lines, taxable, ...checkoutTotals } = checkout;

  assert.deepEqual(invoiceTotals, checkoutTotals);
  assert.equal(invoiceTotals.discount, 150);
  assert.deepEqual(rows.map(row => [row.gstPercent, row.lineTax]), [[5, 46.25], [12, 111]]);

  const html = invoice.render({ id: 1009, items, coupon, total: checkout.total });
  assert.match(html, /<td class="r">5%<\/td><td class="r">₹46\.25<\/td>/);
  assert.match(html, /<td class="r">12%<\/td><td class="r">₹111\.00<\/td>/);
  assert.match(html, /Coupon Discount \(SAVE10\)<\/td><td[^>]*>-₹150\.00<\/td>/);
  assert.match(html, /Total GST\)<\/td><td class="r">₹157\.25<\/td>/);
  assert.match(html, /Invoice Total<\/td><td class="r">₹2007\.25<\/td>/);
  assert.doesNotMatch(html, /Accountant Reconciliation Notice/);
});

// Synthetic orders mirror checkout lines, which carry HSN and omit gstRate.
const cases = [
  {
    name: '#1001 invoice uses 5% and 12% HSN slabs',
    order: {
      id: 1001,
      coupon: '',
      items: [
        { name: 'Rice', hsn: '1006', price: 200, qty: 2 },
        { name: 'Ghee', hsn: '0405', price: 300, qty: 1 }
      ]
    },
    invoiceTotals: { subtotal: 700, discount: 0, tax: 56, cgst: 28, sgst: 28, total: 756 },
    invoiceLineGst: [[5, 20], [12, 36]],
    checkout: { rates: [5, 12], discount: 0, tax: 56, total: 756 }
  },
  {
    name: '#1002 invoice applies SAVE10 before GST',
    order: {
      id: 1002,
      coupon: 'SAVE10',
      items: [{ name: 'Rice', hsn: '1006', price: 200, qty: 3 }]
    },
    invoiceTotals: { subtotal: 600, discount: 60, tax: 27, cgst: 13.5, sgst: 13.5, total: 567 },
    invoiceLineGst: [[5, 27]],
    checkout: { rates: [5], discount: 60, tax: 27, total: 567 }
  },
  {
    name: '#1004 invoice applies the SAVE10 cap on a ₹2,240 subtotal',
    order: {
      id: 1004,
      coupon: 'SAVE10',
      items: [{ name: 'Tea', hsn: '0902', price: 560, qty: 4 }]
    },
    invoiceTotals: { subtotal: 2240, discount: 150, tax: 376.2, cgst: 188.1, sgst: 188.1, total: 2466.2 },
    invoiceLineGst: [[18, 376.2]],
    checkout: { rates: [18], discount: 150, tax: 376.2, total: 2466.2 }
  },
  {
    name: '#1008 invoice agrees with checkout for 18% items without a coupon',
    order: {
      id: 1008,
      coupon: '',
      items: [
        { name: 'Tea', hsn: '0902', price: 150, qty: 2 },
        { name: 'Coffee', hsn: '0901', price: 200, qty: 1 }
      ]
    },
    invoiceTotals: { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 },
    invoiceLineGst: [[18, 54], [18, 36]],
    checkout: { rates: [18, 18], discount: 0, tax: 90, total: 590 }
  }
];

for (const scenario of cases) {
  test(`CURRENT BEHAVIOUR: ${scenario.name}`, () => {
    const { order } = scenario;
    const { rows, ...invoiceTotals } = invoice.computeInvoiceFigures(order);
    const checkout = pricing.computeTotals(order.items, order.coupon);

    assert.deepEqual(invoiceTotals, scenario.invoiceTotals);
    assert.deepEqual(rows.map(row => [row.gstPercent, row.lineTax]), scenario.invoiceLineGst);
    assert.deepEqual({
      rates: checkout.lines.map(line => line.gstPercent),
      discount: checkout.discount,
      tax: checkout.tax,
      total: checkout.total
    }, scenario.checkout);
  });
}
