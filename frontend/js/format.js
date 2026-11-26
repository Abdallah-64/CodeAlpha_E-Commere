export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export function calculateCartTotal(cart = []) {
  return cart.reduce((sum, item) => sum + (Number(item.price) * (Number(item.quantity) || 1)), 0);
}

/**
 * Returns remaining stock for a product from local stockMap or product.stock.
 * Returns null when stock tracking is not set (unlimited).
 */
export function getRemainingStock(product, stockMap = {}) {
  const id = String(product?._id ?? product?.id ?? '');
  if (id && Object.prototype.hasOwnProperty.call(stockMap, id)) {
    const val = stockMap[id];
    return val === null || val === undefined ? null : Math.max(0, Number(val));
  }
  if (product?.stock !== null && product?.stock !== undefined) {
    return Math.max(0, Number(product.stock));
  }
  return null;
}

/**
 * Subtracts sold item quantities from stockMap so only remaining quantities stay.
 * Items whose stock is not tracked (null/undefined) remain untracked.
 */
export function deductStockFromMap(stockMap = {}, items = []) {
  const updated = { ...stockMap };
  for (const item of items) {
    const id = String(item?.id ?? item?.productId ?? '');
    if (!id || !Object.prototype.hasOwnProperty.call(updated, id)) continue;
    const current = updated[id];
    if (current === null || current === undefined) continue;
    const soldQty = Math.max(0, Number(item.quantity) || 1);
    updated[id] = Math.max(0, Number(current) - soldQty);
  }
  return updated;
}

const STARTER_PRODUCT_IDS = new Set(['prod-001', 'prod-002', 'prod-003', 'prod-004']);
const STARTER_CATEGORY_IDS = new Set(['cat-audio', 'cat-lighting', 'cat-timepieces', 'cat-objects']);

/**
 * Merges backend products with locally added dashboard products while excluding deleted IDs.
 * Starter demo IDs (prod-001..004) are only included when no backend products exist.
 */
export function mergeCatalogProducts(remoteProducts = [], localProducts = [], deletedIds = []) {
  const deleted = new Set((deletedIds || []).map(String));
  const seen = new Set();
  const merged = [];

  // Prefer locally added dashboard products (non-starter) first so newest additions appear at top
  for (const p of localProducts) {
    const id = String(p?._id || '');
    if (!id || deleted.has(id) || seen.has(id)) continue;
    if (remoteProducts.length > 0 && STARTER_PRODUCT_IDS.has(id)) continue;
    if (remoteProducts.length > 0 && !id.startsWith('prod-')) continue;
    seen.add(id);
    merged.push(p);
  }

  for (const p of remoteProducts) {
    const id = String(p?._id || '');
    if (!id || deleted.has(id) || seen.has(id)) continue;
    seen.add(id);
    merged.push(p);
  }

  // When offline / remoteProducts empty, also keep remaining localProducts
  if (remoteProducts.length === 0) {
    for (const p of localProducts) {
      const id = String(p?._id || '');
      if (!id || deleted.has(id) || seen.has(id)) continue;
      seen.add(id);
      merged.push(p);
    }
  }

  return merged;
}

/**
 * Merges backend categories with locally created categories (preserving local image overrides).
 */
export function mergeCatalogCategories(remoteCategories = [], localCategories = []) {
  const seenIds = new Set();
  const seenNames = new Set();
  const merged = [];

  for (const c of remoteCategories) {
    const id = String(c?._id || '');
    const nameKey = String(c?.name || '').trim().toLowerCase();
    if (!id || seenIds.has(id)) continue;
    seenIds.add(id);
    if (nameKey) seenNames.add(nameKey);
    merged.push(c);
  }

  for (const c of localCategories) {
    const id = String(c?._id || '');
    const nameKey = String(c?.name || '').trim().toLowerCase();
    if (!id || seenIds.has(id) || (nameKey && seenNames.has(nameKey))) continue;
    if (remoteCategories.length > 0 && STARTER_CATEGORY_IDS.has(id)) continue;
    if (remoteCategories.length > 0 && !id.startsWith('cat-')) continue;
    seenIds.add(id);
    if (nameKey) seenNames.add(nameKey);
    merged.push(c);
  }

  return merged;
}
