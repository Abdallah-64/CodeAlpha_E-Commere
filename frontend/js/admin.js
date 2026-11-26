import { api } from './api.js';
import { formatCurrency, mergeCatalogProducts, mergeCatalogCategories } from './format.js';

const rawSession = sessionStorage.getItem('lumenSession');
let session = null;
try {
  session = JSON.parse(rawSession || 'null');
} catch {}

if (!session?.token || session.user?.role !== 'admin') {
  sessionStorage.removeItem('lumenSession');
  localStorage.removeItem('lumenSession');
  window.location.replace('login.html');
}

// Actively verify session token with backend (or maintain valid owner session if offline)
async function verifyAccess() {
  if (!session?.token || session.user?.role !== 'admin') {
    sessionStorage.removeItem('lumenSession');
    window.location.replace('login.html');
    return false;
  }

  try {
    await api.verifySession(session.token);
  } catch (err) {
    if (err.message && (err.message.includes('expired') || err.message.includes('required') || err.message.includes('denied'))) {
      sessionStorage.removeItem('lumenSession');
      window.location.replace('login.html');
      return false;
    }
  }

  document.body.classList.add('authenticated');
  return true;
}

// DOM Elements
const rows = document.querySelector('#product-rows');
const status = document.querySelector('#dashboard-status');
const search = document.querySelector('#product-search');
const orderRows = document.querySelector('#order-rows');
const orderStatus = document.querySelector('#orders-status');
const orderSearch = document.querySelector('#order-search');
const productDialog = document.querySelector('#product-dialog');
const categoryInput = document.querySelector('#product-category-input');
const categoryDatalist = document.querySelector('#category-datalist');
const categoryChips = document.querySelector('#category-chips');
const ownerIdentity = document.querySelector('#owner-identity');

// Tabs and Panels
const panelProducts = document.querySelector('#panel-products');
const panelOrders = document.querySelector('#panel-orders');
const tabBtnProducts = document.querySelector('#tab-btn-products');
const tabBtnOrders = document.querySelector('#tab-btn-orders');
const navBtnProducts = document.querySelector('#nav-btn-products');
const navBtnOrders = document.querySelector('#nav-btn-orders');
const adminTitle = document.querySelector('#admin-title');
const adminSubtitle = document.querySelector('#admin-subtitle');
const adminIntroActions = document.querySelector('#admin-intro-actions');

// Metric Elements
const productTotalEl = document.querySelector('#product-total');
const stockTotalEl   = document.querySelector('#stock-total');
const ordersTotalEl  = document.querySelector('#orders-total');
const revenueTotalEl = document.querySelector('#revenue-total');
const tabProductCount = document.querySelector('#tab-product-count');
const tabOrderCount   = document.querySelector('#tab-order-count');
const navProductCount = document.querySelector('#nav-product-count');
const navOrdersCount  = document.querySelector('#nav-orders-count');

// --- Stock Management (stored in localStorage and synced with backend when online) ---
function getStockMap() {
  try {
    const raw = localStorage.getItem('lumen_stock');
    if (raw === null) {
      const initial = { 'prod-001': 10, 'prod-002': 10, 'prod-003': 10, 'prod-004': 10 };
      localStorage.setItem('lumen_stock', JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw || '{}');
  } catch { return {}; }
}
function saveStockMap(map) {
  localStorage.setItem('lumen_stock', JSON.stringify(map));
}
function getStock(productId) {
  const map = getStockMap();
  const v = map[String(productId)];
  return v === undefined || v === null ? null : Number(v);   // null = "not set"
}
function setStock(productId, qty) {
  const normalized = Math.max(0, Math.round(Number(qty)));
  const map = getStockMap();
  map[String(productId)] = normalized;
  saveStockMap(map);
  updateMetrics();
  api.updateProductStock(productId, normalized, session.token).catch(() => {});
}

// --- Sold Inventory Helpers ---
function getSoldProductIds() {
  try {
    const sold = JSON.parse(localStorage.getItem('lumen_sold_inventory') || '{}');
    return new Set(Object.keys(sold));
  } catch { return new Set(); }
}
function getSoldQtyForProduct(productId) {
  try {
    const sold = JSON.parse(localStorage.getItem('lumen_sold_inventory') || '{}');
    return Number(sold[String(productId)] || 0);
  } catch { return 0; }
}

// --- Metrics ---
function updateMetrics() {
  const map = getStockMap();
  // Total products = all items in catalog regardless of stock
  if (productTotalEl) productTotalEl.textContent = products.length;
  // Total stock = sum of all set quantities; products with no qty set count as 0 in the sum
  const totalStock = products.reduce((sum, p) => {
    const v = map[String(p._id)];
    return sum + (v === undefined || v === null ? 0 : Number(v));
  }, 0);
  if (stockTotalEl) stockTotalEl.textContent = totalStock;
  if (tabProductCount) tabProductCount.textContent = products.length;
  if (navProductCount) navProductCount.textContent = products.length;
}

if (ownerIdentity && session?.user?.email) {
  ownerIdentity.textContent = session.user.email;
}

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
    createdAt: new Date().toISOString(),
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85']
  },
  {
    _id: 'prod-002',
    name: 'Brutalist Oak & Brass Lamp',
    description: 'A warm ambient desk lamp in solid oak and brushed brass.',
    price: 195,
    category: { _id: 'cat-lighting', name: 'Lighting' },
    createdAt: new Date().toISOString(),
    images: ['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=85']
  },
  {
    _id: 'prod-003',
    name: 'Chronos Automatic Watch',
    description: 'A charcoal-dial automatic timepiece with a supple black strap.',
    price: 420,
    category: { _id: 'cat-timepieces', name: 'Timepieces' },
    createdAt: new Date().toISOString(),
    images: ['https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=900&q=85']
  },
  {
    _id: 'prod-004',
    name: 'Sculptural Ceramic Vessel',
    description: 'A quietly proportioned matte stoneware vessel.',
    price: 88,
    category: { _id: 'cat-objects', name: 'Objects' },
    createdAt: new Date().toISOString(),
    images: ['https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=900&q=85']
  }
];

let products = [];
let categories = [];
let orders = [];

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}

function showToast(message, isError = false) {
  const existing = document.querySelector('.toast-notice');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = `toast-notice${isError ? ' toast-error' : ''}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

function switchTab(tab) {
  if (tab === 'orders') {
    panelProducts?.classList.add('panel-hidden');
    panelOrders?.classList.remove('panel-hidden');
    tabBtnProducts?.classList.remove('active');
    tabBtnOrders?.classList.add('active');
    navBtnProducts?.classList.remove('active');
    navBtnOrders?.classList.add('active');
    if (adminTitle) adminTitle.textContent = 'Customer Purchases & Orders';
    if (adminSubtitle) adminSubtitle.textContent = 'Review customer checkouts, items bought, delivery addresses, and total revenue.';
    if (adminIntroActions) adminIntroActions.style.display = 'none';
  } else {
    panelProducts?.classList.remove('panel-hidden');
    panelOrders?.classList.add('panel-hidden');
    tabBtnProducts?.classList.add('active');
    tabBtnOrders?.classList.remove('active');
    navBtnProducts?.classList.add('active');
    navBtnOrders?.classList.remove('active');
    if (adminTitle) adminTitle.textContent = 'Product archive & inventory';
    if (adminSubtitle) adminSubtitle.textContent = 'Monitor website activity, add new products, and delete items from your store in real time.';
    if (adminIntroActions) adminIntroActions.style.display = '';
  }
}

function renderProducts() {
  const term = (search.value || '').toLowerCase();
  const matching = products.filter((product) => `${product.name} ${product.category?.name || ''}`.toLowerCase().includes(term));
  const soldIds = getSoldProductIds();

  rows.innerHTML = matching.map((product) => {
    const pid = String(product._id);
    const isSold = soldIds.has(pid);
    const soldQty = getSoldQtyForProduct(pid);
    const stock = getStock(pid);            // null = not set yet
    const stockDisplay = stock === null ? '—' : stock;
    const lowStock = stock !== null && stock <= 2;

    const soldBadge = isSold
      ? `<span class="sold-badge" title="Purchased by a customer">${soldQty} sold</span>`
      : '';

    return `
    <tr class="${isSold ? 'row-sold' : ''}">
      <td>
        <div class="artifact">
          <img src="${escapeHtml(product.images?.[0] || 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=160&q=80')}" alt="">
          <div>
            <strong>${escapeHtml(product.name)} ${soldBadge}</strong>
            <span>${escapeHtml(product.description || 'Lumen edition')}</span>
          </div>
        </div>
      </td>
      <td><span class="category-pill">${escapeHtml(product.category?.name || 'Unassigned')}</span></td>
      <td>${formatCurrency(product.price)}</td>
      <td>
        <div class="stock-cell ${lowStock ? 'stock-low' : ''}">
          <button type="button" class="stock-btn stock-dec" data-id="${pid}" aria-label="Decrease stock" ${stock === null || stock === 0 ? 'disabled' : ''}>−</button>
          <span class="stock-qty" data-id="${pid}" title="Click to edit">${stockDisplay}</span>
          <button type="button" class="stock-btn stock-inc" data-id="${pid}" aria-label="Increase stock">+</button>
          ${lowStock ? '<span class="stock-low-warn" title="Low stock!">⚠</span>' : ''}
        </div>
      </td>
      <td>${new Date(product.createdAt || Date.now()).toLocaleDateString()}</td>
      <td>
        <button type="button" class="delete-btn" data-id="${pid}" data-name="${escapeHtml(product.name)}" title="Delete item">
          Delete
        </button>
      </td>
    </tr>
  `;
  }).join('') || `<tr><td colspan="6" class="empty-row">No artifacts match the archive search.</td></tr>`;

  updateMetrics();
}

function renderOrders() {
  if (!orderRows) return;
  const term = (orderSearch?.value || '').toLowerCase().trim();

  const matching = orders.filter((order) => {
    if (!term) return true;
    const name = (order.customerName || '').toLowerCase();
    const email = (order.customerEmail || '').toLowerCase();
    const id = (order.orderId || order._id || '').toLowerCase();
    const address = (order.shippingAddress || '').toLowerCase();
    const itemNames = (order.items || []).map((i) => (i.name || '').toLowerCase()).join(' ');
    return name.includes(term) || email.includes(term) || id.includes(term) || address.includes(term) || itemNames.includes(term);
  });

  if (matching.length === 0) {
    orderRows.innerHTML = `<tr><td colspan="5" class="empty-row">${orders.length === 0 ? 'No customer purchases placed yet.' : 'No orders match your search.'}</td></tr>`;
  } else {
    orderRows.innerHTML = matching.map((order) => {
      const orderRef = order.orderId || (order._id ? ('ORD-' + String(order._id).slice(-6).toUpperCase()) : 'ORD-REF');
      const dateStr = new Date(order.createdAt || Date.now()).toLocaleString();
      const itemsList = (order.items || []).map((item) => `
        <div class="order-item-line">
          <img src="${escapeHtml(item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=120&q=80')}" alt="">
          <div class="order-item-desc">
            <strong>${escapeHtml(item.name)}</strong>
            <span>${escapeHtml(item.quantity || 1)} × ${formatCurrency(item.price)}</span>
          </div>
        </div>
      `).join('');

      return `
        <tr>
          <td>
            <div class="order-date-cell">
              <strong>${escapeHtml(orderRef)}</strong>
              <span>${escapeHtml(dateStr)}</span>
            </div>
          </td>
          <td>
            <div class="order-customer-cell">
              <strong>${escapeHtml(order.customerName || 'Customer')}</strong>
              <span>${escapeHtml(order.customerEmail || '—')}</span>
              <span class="order-customer-address">📍 ${escapeHtml(order.shippingAddress || 'Standard Delivery')}</span>
            </div>
          </td>
          <td>
            <div class="order-items-cell">
              ${itemsList || '<span style="color:var(--muted);font-size:12px;">Standard Atelier Selection</span>'}
            </div>
          </td>
          <td>
            <div class="order-total-cell">
              ${formatCurrency(order.totalAmount || 0)}
            </div>
          </td>
          <td>
            <span class="order-badge">Paid</span>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Update order counters and sales revenue
  const totalRev = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  if (ordersTotalEl) ordersTotalEl.textContent = orders.length;
  if (revenueTotalEl) revenueTotalEl.textContent = formatCurrency(totalRev);
  if (tabOrderCount) tabOrderCount.textContent = orders.length;
  if (navOrdersCount) navOrdersCount.textContent = orders.length;
  if (orderStatus) orderStatus.textContent = '';
}

function getDeletedIds() {
  try {
    const parsed = JSON.parse(localStorage.getItem('lumen_deleted_ids') || '[]');
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch { return []; }
}

function addDeletedId(id) {
  try {
    const list = new Set(getDeletedIds());
    list.add(String(id));
    localStorage.setItem('lumen_deleted_ids', JSON.stringify([...list]));
  } catch {}
}

function saveLocalCatalog() {
  try {
    localStorage.setItem('lumen_catalog_products', JSON.stringify(products));
    localStorage.setItem('lumen_catalog_categories', JSON.stringify(categories));
  } catch {}
}

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

function syncCategoryChipSelection() {
  const current = (categoryInput?.value || '').trim().toLowerCase();
  categoryChips?.querySelectorAll('.category-chip').forEach((chip) => {
    chip.classList.toggle('active', chip.dataset.name.toLowerCase() === current);
  });
}

function fillCategories() {
  if (categoryDatalist) {
    categoryDatalist.innerHTML = categories
      .map((category) => `<option value="${escapeHtml(category.name)}"></option>`)
      .join('');
  }
  if (categoryChips) {
    categoryChips.innerHTML = categories
      .map((category) => `<button type="button" class="category-chip" data-name="${escapeHtml(category.name)}">${escapeHtml(category.name)}</button>`)
      .join('');
    syncCategoryChipSelection();
  }
}

categoryChips?.addEventListener('click', (e) => {
  const chip = e.target.closest('.category-chip');
  if (!chip || !categoryInput) return;
  categoryInput.value = chip.dataset.name;
  syncCategoryChipSelection();
});
categoryInput?.addEventListener('input', syncCategoryChipSelection);

function readAndCompressImage(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Please select a valid image file (PNG, JPG, WEBP).'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Unable to read the selected image file.'));
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      if (file.type === 'image/svg+xml') {
        resolve(dataUrl);
        return;
      }
      const img = new Image();
      img.onerror = () => resolve(dataUrl);
      img.onload = () => {
        const maxSide = 900;
        let { width, height } = img;
        if (width > maxSide || height > maxSide) {
          const scale = maxSide / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

function setupImageUploader({ dropzone, fileInput, placeholder, preview, previewImg, previewName, clearBtn, errorEl }) {
  let value = '';

  function clear() {
    value = '';
    if (fileInput) fileInput.value = '';
    if (previewImg) previewImg.src = '';
    preview?.classList.add('panel-hidden');
    placeholder?.classList.remove('panel-hidden');
  }

  async function handleFile(file) {
    if (errorEl) errorEl.textContent = '';
    try {
      const compressed = await readAndCompressImage(file);
      value = compressed;
      if (previewImg) previewImg.src = compressed;
      if (previewName) previewName.textContent = file.name;
      placeholder?.classList.add('panel-hidden');
      preview?.classList.remove('panel-hidden');
    } catch (err) {
      if (errorEl) errorEl.textContent = err.message;
    }
  }

  dropzone?.addEventListener('click', (e) => {
    if (clearBtn && e.target.closest(`#${clearBtn.id}`)) return;
    fileInput?.click();
  });
  dropzone?.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && (!clearBtn || !e.target.closest(`#${clearBtn.id}`))) {
      e.preventDefault();
      fileInput?.click();
    }
  });
  dropzone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('is-dragover');
  });
  dropzone?.addEventListener('dragleave', () => {
    dropzone.classList.remove('is-dragover');
  });
  dropzone?.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('is-dragover');
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFile(file);
  });
  fileInput?.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (file) handleFile(file);
  });
  clearBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    clear();
  });

  return {
    getValue: () => value,
    clear
  };
}

const productImageUploader = setupImageUploader({
  dropzone: document.querySelector('#image-dropzone'),
  fileInput: document.querySelector('#product-image-file'),
  placeholder: document.querySelector('#upload-placeholder'),
  preview: document.querySelector('#upload-preview'),
  previewImg: document.querySelector('#upload-preview-img'),
  previewName: document.querySelector('#upload-preview-name'),
  clearBtn: document.querySelector('#clear-image-btn'),
  errorEl: document.querySelector('#product-error')
});

function resetProductFormUI() {
  productImageUploader.clear();
  syncCategoryChipSelection();
}

async function loadProductsAndCategories() {
  try {
    status.textContent = 'Loading product archive…';
    const [productData, categoryData] = await Promise.all([api.getProducts(), api.getCategories()]);
    const remoteProducts = productData.products || [];
    const remoteCategories = categoryData.categories || [];
    products = mergeCatalogProducts(remoteProducts, getLocalCatalogProducts(), getDeletedIds());
    categories = mergeCatalogCategories(remoteCategories, getLocalCatalogCategories());
    // Sync backend numeric stock values into localStorage stock map
    const map = getStockMap();
    let changed = false;
    for (const p of products) {
      if (p.stock !== null && p.stock !== undefined) {
        map[String(p._id)] = Number(p.stock);
        changed = true;
      }
    }
    if (changed) saveStockMap(map);
    saveLocalCatalog();
    fillCategories();
    renderProducts();
    status.textContent = products.length === 0 ? 'No products in catalog yet. Click "+ Add Product" to add one.' : '';
  } catch {
    // Offline fallback reads saved dashboard changes first so added/deleted items persist
    const deleted = new Set(getDeletedIds());
    products = getLocalCatalogProducts().filter((p) => !deleted.has(String(p._id)));
    categories = getLocalCatalogCategories();
    saveLocalCatalog();
    fillCategories();
    renderProducts();
    status.textContent = '';
  }
}

async function loadOrders() {
  let apiOrders = [];
  try {
    const res = await api.getOrders(session.token);
    apiOrders = res.orders || [];
  } catch {}

  let localOrders = [];
  try {
    localOrders = JSON.parse(localStorage.getItem('lumen_orders') || '[]');
  } catch {}

  // Merge and deduplicate orders by orderId or _id
  const seenIds = new Set();
  const merged = [];

  for (const o of [...apiOrders, ...localOrders]) {
    const key = o.orderId || o._id;
    if (key && !seenIds.has(String(key))) {
      seenIds.add(String(key));
      merged.push(o);
    } else if (!key) {
      merged.push(o);
    }
  }

  orders = merged.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  renderOrders();
}

// Dialog opener
document.querySelector('#show-product-form')?.addEventListener('click', () => {
  fillCategories();
  productDialog.showModal();
});

// Helper: close dialog and reset form cleanly
function closeDialog(dialog) {
  dialog.close();
  const form = dialog.querySelector('form');
  if (form) {
    form.reset();
    const errMsg = form.querySelector('.form-message');
    if (errMsg) errMsg.textContent = '';
  }
  resetProductFormUI();
}

document.querySelector('#product-dialog-close')?.addEventListener('click', () => closeDialog(productDialog));
document.querySelector('#product-cancel-btn')?.addEventListener('click', () => closeDialog(productDialog));

productDialog.addEventListener('click', (e) => {
  if (e.target === productDialog) closeDialog(productDialog);
});

productDialog.addEventListener('close', () => {
  const form = productDialog.querySelector('form');
  if (form) {
    form.reset();
    const errMsg = form.querySelector('.form-message');
    if (errMsg) errMsg.textContent = '';
  }
  resetProductFormUI();
});

// Search inputs
search.addEventListener('input', renderProducts);
orderSearch?.addEventListener('input', renderOrders);

// Tab switching
tabBtnProducts?.addEventListener('click', () => switchTab('products'));
tabBtnOrders?.addEventListener('click', () => switchTab('orders'));
navBtnProducts?.addEventListener('click', () => switchTab('products'));
navBtnOrders?.addEventListener('click', () => switchTab('orders'));

// Live sync from other tabs (storefront checkouts update orders, sold inventory, and remaining stock)
window.addEventListener('storage', (e) => {
  if (e.key === 'lumen_orders') {
    loadOrders();
  }
  if (e.key === 'lumen_sold_inventory' || e.key === 'lumen_stock') {
    // A product was sold or stock changed in another tab — update rows & remaining stock counts
    renderProducts();
  }
});

// Secure logout: clear session storage & history replacement
document.querySelector('#logout-button').addEventListener('click', () => {
  sessionStorage.removeItem('lumenSession');
  localStorage.removeItem('lumenSession');
  sessionStorage.clear();
  window.location.replace('login.html');
});

// Delete product handler with confirmation
rows.addEventListener('click', async (event) => {
  // --- Stock +/− buttons ---
  const incBtn = event.target.closest('.stock-inc');
  if (incBtn) {
    const pid = incBtn.dataset.id;
    const cur = getStock(pid);
    setStock(pid, cur === null ? 1 : cur + 1);
    renderProducts();
    return;
  }
  const decBtn = event.target.closest('.stock-dec');
  if (decBtn) {
    const pid = decBtn.dataset.id;
    const cur = getStock(pid);
    if (cur !== null && cur > 0) { setStock(pid, cur - 1); renderProducts(); }
    return;
  }
  // --- Inline qty click to type a number ---
  const qtySpan = event.target.closest('.stock-qty');
  if (qtySpan) {
    const pid = qtySpan.dataset.id;
    const cur = getStock(pid);
    const input = document.createElement('input');
    input.type = 'number'; input.min = '0'; input.step = '1';
    input.value = cur === null ? '' : cur;
    input.className = 'stock-inline-input';
    input.style.cssText = 'width:60px;border:1px solid #111;border-radius:4px;padding:2px 6px;font:inherit;font-size:12px;text-align:center;';
    qtySpan.replaceWith(input);
    input.focus(); input.select();
    const commit = () => {
      const val = input.value.trim();
      if (val !== '') setStock(pid, Number(val));
      renderProducts();
    };
    input.addEventListener('blur', commit);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') renderProducts(); });
    return;
  }

  // --- Delete button ---
  const deleteBtn = event.target.closest('.delete-btn');
  if (!deleteBtn) return;
  const productId = deleteBtn.dataset.id;
  const productName = deleteBtn.dataset.name;

  if (!confirm(`Are you sure you want to delete "${productName}" from the website?`)) {
    return;
  }

  deleteBtn.disabled = true;
  deleteBtn.textContent = 'Deleting…';

  try {
    addDeletedId(productId);
    try {
      await api.deleteProduct(productId, session.token);
    } catch {}
    products = products.filter((p) => String(p._id) !== String(productId));
    saveLocalCatalog();
    renderProducts();
    showToast(`Product "${productName}" has been deleted.`);
  } catch (err) {
    showToast(err.message, true);
    deleteBtn.disabled = false;
    deleteBtn.textContent = 'Delete';
  }
});

// Single unified Add Product handler (product + image + category in one step)
document.querySelector('#product-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const error = document.querySelector('#product-error');
  const submit = form.querySelector('button[type="submit"]');
  error.textContent = '';
  submit.disabled = true;
  submit.textContent = 'Saving…';

  try {
    const finalImage = productImageUploader.getValue();
    const typedCategoryName = (categoryInput?.value || form.categoryName?.value || '').trim();
    if (!typedCategoryName) {
      throw new Error('Please choose or type a category name.');
    }

    // 1. Resolve existing category by name or automatically create it in one step
    let resolvedCategory = categories.find((c) => c.name.toLowerCase() === typedCategoryName.toLowerCase());
    if (!resolvedCategory) {
      try {
        const catRes = await api.createCategory({ name: typedCategoryName, image: finalImage }, session.token);
        resolvedCategory = catRes.category || { _id: 'cat-' + Date.now(), name: typedCategoryName, image: finalImage };
      } catch {
        resolvedCategory = { _id: 'cat-' + Date.now(), name: typedCategoryName, description: '', image: finalImage };
      }
      categories.push(resolvedCategory);
      fillCategories();
    }

    const newProductData = {
      name: form.name.value,
      description: form.description.value,
      price: Number(form.price.value),
      stock: form.stock.value.trim() !== '' ? Math.max(0, Math.round(Number(form.stock.value))) : null,
      category: resolvedCategory._id,
      images: finalImage ? [finalImage] : []
    };

    let newProduct = null;
    try {
      const res = await api.createProduct(newProductData, session.token);
      newProduct = res.product || null;
    } catch {}

    if (!newProduct) {
      newProduct = {
        _id: 'prod-' + Date.now(),
        ...newProductData,
        category: resolvedCategory,
        createdAt: new Date().toISOString()
      };
    }

    products.unshift(newProduct);

    // Save stock quantity if the owner filled it in
    if (form.stock.value.trim() !== '') {
      setStock(String(newProduct._id), Number(form.stock.value));
    }

    saveLocalCatalog();
    renderProducts();
    form.reset();
    resetProductFormUI();
    productDialog.close();
    showToast('New product added successfully.');
  } catch (reason) {
    error.textContent = reason.message;
  } finally {
    submit.disabled = false;
    submit.textContent = 'Save product';
  }
});

async function init() {
  const verified = await verifyAccess();
  if (verified) {
    await Promise.all([loadProductsAndCategories(), loadOrders()]);
  }
}

init();
