import assert from 'node:assert/strict';
import test from 'node:test';

import Category from '../models/Category.js';

test('Category rejects a missing name', async () => {
  const category = new Category({});

  await assert.rejects(category.validate(), /Path `name` is required/);
});

test('Category trims its name before validation', async () => {
  const category = new Category({ name: '  Lighting  ' });

  await category.validate();
  assert.equal(category.name, 'Lighting');
  assert.equal(category.image, '');
});

test('Category stores an uploaded image value', async () => {
  const category = new Category({
    name: 'Ceramics',
    image: 'data:image/jpeg;base64,/9j/4AAQ'
  });

  await category.validate();
  assert.equal(category.image, 'data:image/jpeg;base64,/9j/4AAQ');
});
