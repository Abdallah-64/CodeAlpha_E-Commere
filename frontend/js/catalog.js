import { api } from './api.js';
import {
  formatCurrency,
  calculateCartTotal,
  getRemainingStock,
  deductStockFromMap,
  mergeCatalogProducts,
  mergeCatalogCategories
} from './format.js';

const elements = {
  filters: document.querySelector('#category-filters'),
  showcase: document.querySelector('#category-showcase-grid'),
  grid: document.querySelector('#product-grid'),
  status: document.querySelector('#catalog-status'),
  counter: document.querySelector('#product-counter'),
  cartCount: document.querySelector('#cart-count'),
  cartLink: document.querySelector('.cart-link'),
  cartDialog: document.querySelector('#cart-dialog'),
  cartContent: document.querySelector('#cart-content'),
  closeCartBtn: document.querySelector('#close-cart-btn'),
  detailDialog: document.querySelector('#detail-dialog'),
  detailContent: document.querySelector('#detail-dialog-content')
};

const fallbackImage = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
let activeCategory = '';

const categoryVisuals = {
  Audio: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=900&q=85',
  Lighting: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=900&q=85',
  Timepieces: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=900&q=85',
  Objects: 'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=900&q=85'
};

// Curated default fallback catalog
const defaultCategories = [
  { _id: 'cat-audio', name: 'Audio', description: 'Sound objects for focused listening.' },
  { _id: 'cat-lighting', name: 'Lighting', description: 'Architectural lighting for warm spaces.' },
  { _id: 'cat-timepieces', name: 'Timepieces', description: 'Objects that mark time with restraint.' },
  { _id: 'cat-objects', name: 'Objects', description: 'Functional forms for daily rituals.' }
];

const defaultProducts = [
  {
    _id: 'prod-001',
    name: 'Aero Wireless Studio Headphones',
    description: 'Matte-black over-ear headphones with balanced wireless sound.',
    price: 280,
    category: { _id: 'cat-audio', name: 'Audio' },
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85']
  },
  {
    _id: 'prod-002',
    name: 'Brutalist Oak & Brass Lamp',
    description: 'A warm ambient desk lamp in solid oak and brushed brass.',
    price: 195,
    category: { _id: 'cat-lighting', name: 'Lighting' },
    images: ['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=85']
  },
  {
    _id: 'prod-003',
    name: 'Chronos Automatic Watch',
    description: 'A charcoal-dial automatic timepiece with a supple black strap.',
    price: 420,
    category: { _id: 'cat-timepieces', name: 'Timepieces' },
    images: ['https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=900&q=85']
  },
  {
    _id: 'prod-004',
    name: 'Sculptural Ceramic Vessel',
    description: 'A quietly proportioned matte stoneware vessel.',
    price: 88,
    category: { _id: 'cat-objects', name: 'Objects' },
    images: ['https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=900&q=85']
  }
];

let currentProducts = [...defaultProducts];
let currentCategories = [...defaultCategories];

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}

function showToast(message) {
  const existing = document.querySelector('.toast-notice');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast-notice';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function showStatus(message = '', type = '') {
  if (!elements.status) return;
  elements.status.textContent = message;
  elements.status.className = `catalog-status${message ? ' show' : ''}${type ? ` ${type}` : ''}`;
}

// ---------------- STOCK HELPERS ---------------- //
function getStockMap() {
  try {
    const raw = localStorage.getItem('lumen_stock');
    if (raw === null) {
      const initial = { 'prod-001': 10, 'prod-002': 10, 'prod-003': 10, 'prod-004': 10 };
      localStorage.setItem('lumen_stock', JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw || '{}');
  } catch {
    return {};
  }
}

function getProductStock(product) {
  return getRemainingStock(product, getStockMap());
}

// ---------------- CART MANAGEMENT ---------------- //
function getCart() {
  try {
    return JSON.parse(localStorage.getItem('lumen_cart') || '[]');
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem('lumen_cart', JSON.stringify(cart));
  updateCartBadge();
}

function updateCartBadge() {
  const cart = getCart();
  const totalQty = cart.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  if (elements.cartCount) elements.cartCount.textContent = totalQty;
}

function addToCart(product) {
  const available = getProductStock(product);
  const cart = getCart();
  const prodId = String(product._id);
  const existing = cart.find((item) => String(item.id) === prodId);

  if (available === 0) {
    showToast(`Sorry, "${product.name}" is sold out.`);
    return;
  }

  if (available !== null && (existing?.quantity || 0) >= available) {
    showToast(`Only ${available} remaining in stock for "${product.name}".`);
    return;
  }

  if (existing) {
    existing.quantity = (existing.quantity || 1) + 1;
  } else {
    cart.push({
      id: prodId,
      name: product.name,
      price: Number(product.price),
      image: product.images?.[0] || fallbackImage,
      quantity: 1
    });
  }

  saveCart(cart);
  showToast(`Added "${product.name}" to cart.`);
}

function renderCart() {
  if (!elements.cartContent) return;
  const cart = getCart();

  if (cart.length === 0) {
    elements.cartContent.innerHTML = `
      <div class="cart-empty">
        <p>Your atelier cart is currently empty.</p>
        <button class="button button-secondary" id="close-empty-cart">Browse Collection</button>
      </div>
    `;
    elements.cartContent.querySelector('#close-empty-cart')?.addEventListener('click', () => {
      elements.cartDialog.close();
      document.querySelector('#catalog')?.scrollIntoView({ behavior: 'smooth' });
    });
    return;
  }

  const subtotal = calculateCartTotal(cart);
  const stockMap = getStockMap();

  elements.cartContent.innerHTML = `
    <div class="cart-items">
      ${cart.map((item) => {
        const product = currentProducts.find((p) => String(p._id) === String(item.id)) || { _id: item.id };
        const available = getRemainingStock(product, stockMap);
        const atMax = available !== null && item.quantity >= available;
        const stockHint = available === null ? '' : (available === 0 ? ' · Sold out' : ` · ${available} left`);
        return `
        <div class="cart-item" data-id="${escapeHtml(item.id)}">
          <div class="cart-item-info">
            <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}">
            <div>
              <div class="cart-item-title">${escapeHtml(item.name)}</div>
              <div class="cart-item-price">${formatCurrency(item.price)} each${escapeHtml(stockHint)}</div>
            </div>
          </div>
          <div class="cart-item-actions">
            <button class="qty-btn" data-action="decrease" data-id="${escapeHtml(item.id)}" aria-label="Decrease quantity">−</button>
            <span class="cart-qty">${escapeHtml(item.quantity)}</span>
            <button class="qty-btn" data-action="increase" data-id="${escapeHtml(item.id)}" aria-label="Increase quantity" ${atMax ? 'disabled' : ''}>+</button>
            <span style="font-size:13px;font-weight:700;margin:0 4px;">${formatCurrency(item.price * item.quantity)}</span>
            <button class="cart-item-remove" data-action="remove" data-id="${escapeHtml(item.id)}" title="Remove item" aria-label="Remove item">✕</button>
          </div>
        </div>
      `;
      }).join('')}
    </div>

    <div class="cart-summary">
      <div class="cart-summary-row">
        <span>Subtotal</span>
        <span>${formatCurrency(subtotal)}</span>
      </div>
      <div class="cart-summary-row">
        <span>Delivery</span>
        <span style="color:#059669;font-weight:600;">Complimentary</span>
      </div>
      <div class="cart-summary-total">
        <span>Total money to pay</span>
        <span>${formatCurrency(subtotal)}</span>
      </div>
    </div>

    <form id="checkout-form" class="cart-checkout-form">
      <p class="eyebrow" style="margin:8px 0 0;">Customer Details</p>
      <input type="text" name="customerName" placeholder="Your full name" required maxlength="100">
      <input type="email" name="customerEmail" placeholder="Your email address" required maxlength="120">
      <input type="text" name="shippingAddress" placeholder="Delivery street address and city" required maxlength="200">
      <button class="button" type="submit" style="width:100%;min-height:48px;margin-top:6px;">
        Pay ${formatCurrency(subtotal)} &amp; Complete Order
      </button>
    </form>
  `;

  // Attach quantity and removal listeners
  elements.cartContent.querySelectorAll('.qty-btn, .cart-item-remove').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      const currentCart = getCart();
      const targetItem = currentCart.find((i) => String(i.id) === id);

      if (!targetItem) return;

      if (action === 'increase') {
        const product = currentProducts.find((p) => String(p._id) === id) || { _id: id };
        const available = getProductStock(product);
        if (available !== null && (targetItem.quantity || 1) >= available) {
          showToast(`Only ${available} left in stock for "${targetItem.name}".`);
          return;
        }
        targetItem.quantity = (targetItem.quantity || 1) + 1;
      } else if (action === 'decrease') {
        targetItem.quantity = (targetItem.quantity || 1) - 1;
        if (targetItem.quantity <= 0) {
          const idx = currentCart.indexOf(targetItem);
          currentCart.splice(idx, 1);
        }
      } else if (action === 'remove') {
        const idx = currentCart.indexOf(targetItem);
        currentCart.splice(idx, 1);
      }

      saveCart(currentCart);
      renderCart();
    });
  });

  // Handle checkout form submit
  elements.cartContent.querySelector('#checkout-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');

    // Verify local remaining stock before completing checkout
    const latestStockMap = getStockMap();
    for (const item of cart) {
      const product = currentProducts.find((p) => String(p._id) === String(item.id)) || { _id: item.id };
      const available = getRemainingStock(product, latestStockMap);
      if (available !== null && Number(item.quantity || 1) > available) {
        showToast(available === 0 ? `Sorry, "${item.name}" is sold out.` : `Only ${available} left in stock for "${item.name}".`);
        renderCart();
        return;
      }
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing Payment…';

    const orderData = {
      orderId: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
      customerName: form.customerName.value.trim(),
      customerEmail: form.customerEmail.value.trim().toLowerCase(),
      shippingAddress: form.shippingAddress.value.trim(),
      items: cart.map((i) => ({
        productId: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        image: i.image
      })),
      totalAmount: subtotal,
      status: 'paid',
      createdAt: new Date().toISOString()
    };

    // 1. Send to Backend API if running (reject if backend reports out-of-stock)
    try {
      await api.createOrder(orderData);
    } catch (apiErr) {
      const msg = (apiErr?.message || '').toLowerCase();
      if (msg.includes('out of stock') || msg.includes('left in stock')) {
        showToast(apiErr.message);
        submitBtn.disabled = false;
        submitBtn.textContent = `Pay ${formatCurrency(subtotal)} & Complete Order`;
        return;
      }
    }

    // 2. Save order persistently to shared localStorage so Admin Dashboard always displays it
    try {
      const existingOrders = JSON.parse(localStorage.getItem('lumen_orders') || '[]');
      existingOrders.unshift(orderData);
      localStorage.setItem('lumen_orders', JSON.stringify(existingOrders));
    } catch {}

    // 2b. Track which product IDs were sold
    try {
      const soldInventory = JSON.parse(localStorage.getItem('lumen_sold_inventory') || '{}');
      for (const item of cart) {
        const id = String(item.id);
        soldInventory[id] = (soldInventory[id] || 0) + (Number(item.quantity) || 1);
      }
      localStorage.setItem('lumen_sold_inventory', JSON.stringify(soldInventory));
    } catch {}

    // 2c. Cut the store's stock down to the remaining quantities only
    try {
      const remainingStockMap = deductStockFromMap(getStockMap(), cart);
      localStorage.setItem('lumen_stock', JSON.stringify(remainingStockMap));
      for (const p of currentProducts) {
        const key = String(p._id);
        if (Object.prototype.hasOwnProperty.call(remainingStockMap, key)) {
          p.stock = remainingStockMap[key];
        }
      }
    } catch {}

    // 3. Clear cart & immediately refresh storefront product grid to show remaining stock
    saveCart([]);
    renderProducts(currentProducts);

    // 4. Render confirmation receipt in the dialog
    elements.cartContent.innerHTML = `
      <div class="order-success-card">
        <div class="order-success-icon">✓</div>
        <h3 style="font-size:22px;margin:0;letter-spacing:-.03em;">Payment Successful!</h3>
        <p style="color:var(--muted);font-size:14px;line-height:1.6;margin:0;">
          Thank you, <strong>${escapeHtml(orderData.customerName)}</strong>. Your order has been placed and received by the atelier.
        </p>
        <div style="background:var(--soft);padding:14px 18px;border-radius:8px;border:1px solid var(--line);width:100%;text-align:left;font-size:12px;margin:8px 0;">
          <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
            <span>Order Reference:</span>
            <strong>${escapeHtml(orderData.orderId)}</strong>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
            <span>Total Paid:</span>
            <strong>${formatCurrency(orderData.totalAmount)}</strong>
          </div>
          <div style="display:flex;justify-content:space-between;">
            <span>Delivery to:</span>
            <span>${escapeHtml(orderData.shippingAddress)}</span>
          </div>
        </div>
        <button class="button" id="order-done-btn" style="width:100%;min-height:44px;">Continue Exploring</button>
      </div>
    `;

    elements.cartContent.querySelector('#order-done-btn')?.addEventListener('click', () => {
      elements.cartDialog.close();
    });
  });
}

function openCartDialog() {
  if (!elements.cartDialog) return;
  renderCart();
  elements.cartDialog.showModal();
}

// ---------------- FILTERS & SHOWCASE ---------------- //
function getLocalCatalogProducts() {
  try {
    const raw = localStorage.getItem('lumen_catalog_products');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [...defaultProducts];
}

function getLocalCatalogCategories() {
  try {
    const raw = localStorage.getItem('lumen_catalog_categories');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [...defaultCategories];
}

function filterProductsByCategory(list, categoryId) {
  if (!categoryId) return list;
  const catName = getCategoryName(categoryId).toLowerCase();
  return list.filter((p) => String(p.category?._id) === String(categoryId) || (catName && p.category?.name?.toLowerCase() === catName));
}

function renderFilters(categories) {
  const choices = [{ _id: '', name: 'All artifacts' }, ...categories];
  elements.filters.innerHTML = choices.map((category) => `<button class="filter${category._id === activeCategory ? ' active' : ''}" data-category="${escapeHtml(category._id)}">${escapeHtml(category.name)}</button>`).join('');
  elements.filters.querySelectorAll('[data-category]').forEach((button) => button.addEventListener('click', () => loadProducts(button.dataset.category)));
}

function resolveCategoryImage(category) {
  if (category?.image) return category.image;
  if (category?.name && categoryVisuals[category.name]) return categoryVisuals[category.name];
  const allKnown = getLocalCatalogProducts();
  const matchProduct = allKnown.find((p) => String(p.category?._id) === String(category?._id) || p.category?.name?.toLowerCase() === category?.name?.toLowerCase());
  if (matchProduct?.images?.[0]) return matchProduct.images[0];
  return 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=900&q=85';
}

function renderCategoryShowcase(categories) {
  elements.showcase.innerHTML = categories.map((category, index) => {
    const image = resolveCategoryImage(category);
    const safeCssUrl = String(image).replace(/'/g, "\\'");
    const description = category.description || 'A considered selection from the Lumen archive.';
    return `<button class="category-tile${category._id === activeCategory ? ' active' : ''}" style="--category-image:url('${safeCssUrl}')" data-showcase-category="${escapeHtml(category._id)}"><span class="category-tile-count">0${index + 1}</span><span class="category-tile-content"><strong>${escapeHtml(category.name)}</strong><small>${escapeHtml(description)}</small><em>Explore collection <b>→</b></em></span></button>`;
  }).join('');
  elements.showcase.querySelectorAll('[data-showcase-category]').forEach((tile) => tile.addEventListener('click', () => {
    document.querySelector('#catalog').scrollIntoView({ behavior: 'smooth', block: 'start' });
    loadProducts(tile.dataset.showcaseCategory);
  }));
}

export function renderProducts(products) {
  const stockMap = getStockMap();
  elements.grid.innerHTML = products.map((product) => {
    const image = product.images?.[0] || fallbackImage;
    const category = product.category?.name || 'Collection';
    const shortId = product._id ? String(product._id).slice(-6).toUpperCase() : 'EDITION';
    const stock = getRemainingStock(product, stockMap);
    const isSoldOut = stock === 0;
    const stockBadge = stock === null
      ? ''
      : (isSoldOut
        ? `<span class="stock-pill sold-out">Sold out</span>`
        : `<span class="stock-pill${stock <= 3 ? ' low-stock' : ''}">${stock} left</span>`);
    return `
      <article class="product-card${isSoldOut ? ' is-sold-out' : ''}" data-id="${escapeHtml(product._id)}">
        <div class="product-image">
          <img src="${escapeHtml(image)}" alt="${escapeHtml(product.name)}" loading="lazy" onerror="this.remove();this.parentElement.insertAdjacentHTML('beforeend','<div class=\\'image-fallback\\'>Lumen object</div>')">
          <span class="product-category">${escapeHtml(category)}</span>
          ${stockBadge}
          <button type="button" class="image-quick-view view-detail-btn" data-id="${escapeHtml(product._id)}" aria-label="Quick view of ${escapeHtml(product.name)}">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            <span>Quick View</span>
          </button>
        </div>
        <div class="product-details">
          <span class="sku">Lumen / ${escapeHtml(shortId)}</span>
          <h3 class="product-name">${escapeHtml(product.name)}</h3>
          <p class="product-price">${formatCurrency(product.price)}</p>
          <div class="product-actions">
            <button type="button" class="action-detail-btn view-detail-btn" data-id="${escapeHtml(product._id)}" aria-label="View details for ${escapeHtml(product.name)}">
              <span>View Details</span>
              <span class="btn-arrow" aria-hidden="true">→</span>
            </button>
            <button class="add-cart-btn" type="button" data-id="${escapeHtml(product._id)}" aria-label="Add ${escapeHtml(product.name)} to cart" ${isSoldOut ? 'disabled' : ''}>
              <span>${isSoldOut ? 'Sold out' : '+ Add'}</span>
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function openDetailModal(product) {
  if (!elements.detailDialog || !elements.detailContent) return;
  const image = product.images?.[0] || fallbackImage;
  const category = product.category?.name || 'Curated';
  const shortId = product._id ? String(product._id).slice(-6).toUpperCase() : 'EDITION';
  const stock = getProductStock(product);
  const isSoldOut = stock === 0;
  const availabilityText = stock === null
    ? 'Permanent atelier archive release'
    : (isSoldOut ? 'Currently sold out' : `${stock} remaining in store`);
  elements.detailContent.innerHTML = `
    <div class="detail-dialog-inner">
      <div class="dialog-head" style="margin-bottom:20px;">
        <div>
          <p class="eyebrow" style="margin:0 0 6px;">Lumen Archive / ${escapeHtml(category)}</p>
          <h2 class="detail-modal-title">${escapeHtml(product.name)}</h2>
        </div>
        <button class="close-button" id="close-detail" aria-label="Close">×</button>
      </div>
      <div class="detail-modal-grid">
        <div class="detail-modal-image-wrap">
          <img src="${escapeHtml(image)}" alt="${escapeHtml(product.name)}" class="detail-modal-image">
          <span class="product-category" style="position:absolute;top:12px;left:12px;">${escapeHtml(category)}</span>
        </div>
        <div class="detail-modal-info">
          <div>
            <div class="sku" style="margin-bottom:6px;">Edition No. ${escapeHtml(shortId)}</div>
            <div class="detail-modal-price">${formatCurrency(product.price)}</div>
            <p class="detail-modal-desc">${escapeHtml(product.description || 'Thoughtfully crafted object from the Lumen archive. Designed with architectural restraint, pure materiality, and enduring poise.')}</p>
            
            <div class="detail-features">
              <div class="detail-feature-item">
                <span class="feature-dot"></span>
                <span>${escapeHtml(availabilityText)}</span>
              </div>
              <div class="detail-feature-item">
                <span class="feature-dot"></span>
                <span>Complimentary insured worldwide delivery</span>
              </div>
              <div class="detail-feature-item">
                <span class="feature-dot"></span>
                <span>Includes certificate of authenticity</span>
              </div>
            </div>
          </div>
          <div class="detail-modal-actions">
            <button class="button modal-add-btn" type="button" style="width:100%;min-height:48px;" ${isSoldOut ? 'disabled' : ''}>
              ${isSoldOut ? 'Sold Out' : `Add to Cart · ${formatCurrency(product.price)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  elements.detailDialog.showModal();

  elements.detailContent.querySelector('#close-detail')?.addEventListener('click', () => {
    elements.detailDialog.close();
  });

  elements.detailContent.querySelector('.modal-add-btn')?.addEventListener('click', () => {
    addToCart(product);
    elements.detailDialog.close();
  });
}

// Global click delegation for Add-to-cart, View details, and Cart opening
document.addEventListener('click', (event) => {
  const addBtn = event.target.closest('.add-cart-btn');
  if (addBtn) {
    const id = addBtn.dataset.id;
    const product = currentProducts.find((p) => String(p._id) === id);
    if (product) addToCart(product);
    return;
  }

  const detailBtn = event.target.closest('.view-detail-btn');
  if (detailBtn) {
    event.preventDefault();
    const id = detailBtn.dataset.id;
    const product = currentProducts.find((p) => String(p._id) === id);
    if (product) openDetailModal(product);
    return;
  }

  const cartTrigger = event.target.closest('.cart-link, #open-cart-btn');
  if (cartTrigger) {
    event.preventDefault();
    openCartDialog();
  }
});

elements.closeCartBtn?.addEventListener('click', () => {
  elements.cartDialog.close();
});

function getDeletedIds() {
  try {
    const parsed = JSON.parse(localStorage.getItem('lumen_deleted_ids') || '[]');
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch { return []; }
}

async function loadProducts(categoryId = '') {
  activeCategory = categoryId;
  renderFilters(currentCategories);
  renderCategoryShowcase(currentCategories);

  const deletedIds = getDeletedIds();
  const localAll = getLocalCatalogProducts();

  try {
    // Always fetch full backend list so local dashboard additions merge cleanly, then filter by categoryId
    const { products: remoteProducts = [] } = await api.getProducts();
    const mergedAll = mergeCatalogProducts(remoteProducts, localAll, deletedIds);

    // Sync backend numeric stock values into localStorage stock map
    const stockMap = getStockMap();
    let changed = false;
    for (const p of mergedAll) {
      if (p.stock !== null && p.stock !== undefined) {
        stockMap[String(p._id)] = Number(p.stock);
        changed = true;
      }
    }
    if (changed) localStorage.setItem('lumen_stock', JSON.stringify(stockMap));
    try { localStorage.setItem('lumen_catalog_products', JSON.stringify(mergedAll)); } catch {}

    currentProducts = filterProductsByCategory(mergedAll, categoryId);
    showStatus('');
    renderProducts(currentProducts);
    elements.counter.textContent = `${currentProducts.length} ${currentProducts.length === 1 ? 'object' : 'objects'}`;
  } catch {
    const mergedOffline = mergeCatalogProducts([], localAll, deletedIds);
    currentProducts = filterProductsByCategory(mergedOffline, categoryId);
    showStatus('');
    renderProducts(currentProducts);
    elements.counter.textContent = `${currentProducts.length} ${currentProducts.length === 1 ? 'object' : 'objects'}`;
  }
}

function getCategoryName(id) {
  const found = currentCategories.find((c) => String(c._id) === String(id));
  return found ? found.name : '';
}

async function initializeCatalog() {
  // Update cart badge initially
  updateCartBadge();

  // 1. Instantly render catalog from saved dashboard items (or defaults), excluding deleted items
  currentCategories = getLocalCatalogCategories();
  const initialMerged = mergeCatalogProducts([], getLocalCatalogProducts(), getDeletedIds());
  currentProducts = filterProductsByCategory(initialMerged, activeCategory);
  renderFilters(currentCategories);
  renderCategoryShowcase(currentCategories);
  renderProducts(currentProducts);
  elements.counter.textContent = `${currentProducts.length} ${currentProducts.length === 1 ? 'object' : 'objects'}`;

  // 2. Fetch live data from backend if available and merge with local additions
  try {
    const { categories: remoteCategories = [] } = await api.getCategories();
    if (remoteCategories.length > 0) {
      currentCategories = mergeCatalogCategories(remoteCategories, getLocalCatalogCategories());
      window.lumenCategories = currentCategories;
      try { localStorage.setItem('lumen_catalog_categories', JSON.stringify(currentCategories)); } catch {}
      renderFilters(currentCategories);
      renderCategoryShowcase(currentCategories);
    }
    await loadProducts(activeCategory);
  } catch {
    showStatus('');
  }
}

window.addEventListener('storage', (e) => {
  if (e.key === 'lumen_stock') {
    renderProducts(currentProducts);
    if (elements.cartDialog?.open) renderCart();
  }
  if (e.key === 'lumen_catalog_categories') {
    currentCategories = getLocalCatalogCategories();
    renderFilters(currentCategories);
    renderCategoryShowcase(currentCategories);
  }
  if (e.key === 'lumen_catalog_products' || e.key === 'lumen_deleted_ids') {
    const merged = mergeCatalogProducts([], getLocalCatalogProducts(), getDeletedIds());
    currentProducts = filterProductsByCategory(merged, activeCategory);
    renderCategoryShowcase(currentCategories);
    renderProducts(currentProducts);
    elements.counter.textContent = `${currentProducts.length} ${currentProducts.length === 1 ? 'object' : 'objects'}`;
  }
});

initializeCatalog();
