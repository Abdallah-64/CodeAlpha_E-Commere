import assert from 'node:assert/strict';
import test from 'node:test';

import Order from '../models/Order.js';

test('Order rejects missing customer name', async () => {
  const order = new Order({
    customerEmail: 'customer@example.com',
    totalAmount: 150
  });

  await assert.rejects(order.validate(), /Path `customerName` is required/);
});

test('Order rejects missing customer email', async () => {
  const order = new Order({
    customerName: 'Elena Rostova',
    totalAmount: 150
  });

  await assert.rejects(order.validate(), /Path `customerEmail` is required/);
});

test('Order validates correctly with customer details, items, and total', async () => {
  const order = new Order({
    customerName: '  Elena Rostova  ',
    customerEmail: 'ELENA@EXAMPLE.COM ',
    shippingAddress: '42 Rue Saint-Honoré, Paris',
    totalAmount: 280,
    items: [
      {
        name: 'Aero Wireless Studio Headphones',
        price: 280,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e'
      }
    ]
  });

  await order.validate();
  assert.equal(order.customerName, 'Elena Rostova');
  assert.equal(order.customerEmail, 'elena@example.com');
  assert.equal(order.items.length, 1);
  assert.equal(order.items[0].name, 'Aero Wireless Studio Headphones');
  assert.equal(order.status, 'paid');
});
