import assert from 'node:assert/strict';
import test from 'node:test';

import {
  formatCurrency,
  calculateCartTotal,
  getRemainingStock,
  deductStockFromMap,
  mergeCatalogProducts,
  mergeCatalogCategories
} from '../js/format.js';

test('formatCurrency renders whole-dollar product prices with cents', () => {
  assert.equal(formatCurrency(280), '$280.00');
});

test('calculateCartTotal calculates combined items and quantities correctly', () => {
  const cart = [
    { name: 'Headphones', price: 280, quantity: 2 },
    { name: 'Lamp', price: 195, quantity: 1 }
  ];
  const total = calculateCartTotal(cart);
  assert.equal(total, 755);
  assert.equal(formatCurrency(total), '$755.00');
});

test('calculateCartTotal returns 0 for empty cart', () => {
  assert.equal(calculateCartTotal([]), 0);
});

test('deductStockFromMap cuts store stock down to remaining units only', () => {
  const storeStock = { 'prod-001': 10, 'prod-002': 3 };
  const soldItems = [
    { id: 'prod-001', quantity: 4 },
    { id: 'prod-002', quantity: 5 }
  ];

  const remaining = deductStockFromMap(storeStock, soldItems);
  assert.equal(remaining['prod-001'], 6);
  assert.equal(remaining['prod-002'], 0);
});

test('getRemainingStock reads tracked stock and returns null when untracked', () => {
  assert.equal(getRemainingStock({ _id: 'prod-001' }, { 'prod-001': 7 }), 7);
  assert.equal(getRemainingStock({ _id: 'prod-002', stock: 4 }, {}), 4);
  assert.equal(getRemainingStock({ _id: 'prod-003' }, {}), null);
});

test('mergeCatalogProducts preserves locally added products alongside backend products and excludes deleted IDs', () => {
  const remote = [
    { _id: 'db-1', name: 'Headphones' },
    { _id: 'db-2', name: 'Lamp' }
  ];
  const local = [
    { _id: 'prod-1700000000', name: 'Custom Vase' },
    { _id: 'prod-001', name: 'Starter Headphones' }
  ];
  const merged = mergeCatalogProducts(remote, local, ['db-2']);
  assert.deepEqual(
    merged.map((p) => p._id),
    ['prod-1700000000', 'db-1']
  );
});

test('mergeCatalogCategories keeps custom local categories without duplicating remote ones', () => {
  const remote = [{ _id: 'db-cat-1', name: 'Audio' }];
  const local = [
    { _id: 'cat-audio', name: 'Audio' },
    { _id: 'cat-1700000000', name: 'Ceramics' }
  ];
  const merged = mergeCatalogCategories(remote, local);
  assert.deepEqual(
    merged.map((c) => c.name),
    ['Audio', 'Ceramics']
  );
});
