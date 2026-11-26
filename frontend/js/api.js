const API_ROOT = 'http://localhost:5000/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_ROOT}${path}`, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Unable to load marketplace data.');
  return data;
}

export const api = {
  getCategories: () => request('/categories'),
  getProducts: (categoryId = '') => request(`/products${categoryId ? `?category=${encodeURIComponent(categoryId)}` : ''}`),
  login: (email, password) => request('/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) }),
  verifySession: (token) => request('/auth/verify', { headers: { Authorization: `Bearer ${token}` } }),
  createProduct: (product, token) => request('/products', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(product) }),
  updateProductStock: (productId, stock, token) => request(`/products/${productId}/stock`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ stock }) }),
  deleteProduct: (productId, token) => request(`/products/${productId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }),
  createOrder: (order) => request('/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(order) }),
  getOrders: (token) => request('/orders', { headers: { Authorization: `Bearer ${token}` } }),
  createCategory: (category, token) => request('/categories', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(category) }),
  deleteCategory: (categoryId, token) => request(`/categories/${categoryId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
};
