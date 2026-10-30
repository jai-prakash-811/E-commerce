const API_ROOT = '/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('shopverse-token');
  const headers = { ...options.headers };

  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_ROOT}${path}`, { ...options, headers });
  const data = response.status === 204 ? null : await response.json();

  if (!response.ok) {
    const error = new Error(data?.message || 'Something went wrong. Please try again.');
    error.status = response.status;
    throw error;
  }

  return data;
}

export const api = {
  products: (query = '') => request(`/products${query}`),
  product: (id) => request(`/products/${id}`),
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  signup: (details) => request('/auth/signup', { method: 'POST', body: JSON.stringify(details) }),
  me: () => request('/auth/me'),
  wishlist: () => request('/wishlist'),
  toggleWishlist: (productId) => request(`/wishlist/${productId}`, { method: 'PUT' }),
  createOrder: (order) => request('/orders', { method: 'POST', body: JSON.stringify(order) }),
  orders: () => request('/orders'),
  adminProducts: () => request('/admin/products'),
  saveProduct: (product, id) => request(`/admin/products${id ? `/${id}` : ''}`, {
    method: id ? 'PUT' : 'POST',
    body: JSON.stringify(product)
  }),
  deleteProduct: (id) => request(`/admin/products/${id}`, { method: 'DELETE' })
};
