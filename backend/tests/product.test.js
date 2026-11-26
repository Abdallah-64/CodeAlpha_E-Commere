import assert from 'node:assert/strict';
import test from 'node:test';
import mongoose from 'mongoose';

import Product from '../models/Product.js';

test('Product rejects a zero price', async () => {
  const product = new Product({
    name: 'Architectural lamp',
    price: 0,
    category: new mongoose.Types.ObjectId()
  });

  await assert.rejects(product.validate(), /Path `price` \(0\) is less than minimum allowed value/);
});

test('Product requires a category reference', async () => {
  const product = new Product({ name: 'Architectural lamp', price: 195 });

  await assert.rejects(product.validate(), /Path `category` is required/);
});

test('Product rejects negative stock and accepts zero or positive stock', async () => {
  const invalid = new Product({
    name: 'Architectural lamp',
    price: 195,
    stock: -1,
    category: new mongoose.Types.ObjectId()
  });
  await assert.rejects(invalid.validate(), /Path `stock` \(-1\) is less than minimum allowed value/);

  const valid = new Product({
    name: 'Architectural lamp',
    price: 195,
    stock: 0,
    category: new mongoose.Types.ObjectId()
  });
  await valid.validate();
  assert.equal(valid.stock, 0);
});
