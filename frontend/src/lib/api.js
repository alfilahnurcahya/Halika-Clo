import axios from 'axios';

const TOKEN_KEY = 'halika_admin_token';

export const tokenStorage = {
  get: () => {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  },
  set: (token) => {
    try { localStorage.setItem(TOKEN_KEY, token); } catch { /* storage tidak tersedia */ }
  },
  clear: () => {
    try { localStorage.removeItem(TOKEN_KEY); } catch { /* storage tidak tersedia */ }
  },
};

/** Satu instance Axios untuk seluruh networking calls ke backend. */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
  // Server free tier bisa "tidur" dan butuh waktu untuk bangun
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && tokenStorage.get()) {
      tokenStorage.clear();
      window.dispatchEvent(new Event('auth:expired'));
    }
    return Promise.reject(error);
  },
);

/** Ubah error Axios menjadi pesan yang mudah dipahami pengguna. */
export function getErrorMessage(error, fallback = 'Terjadi kesalahan. Silakan coba lagi.') {
  if (axios.isCancel?.(error)) return '';
  if (error?.code === 'ECONNABORTED') return 'Server terlalu lama merespons. Coba lagi beberapa saat.';
  if (!error?.response) return 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda lalu coba lagi.';
  return error.response.data?.message || fallback;
}

/** Ambil error per-field dari validasi Joi backend: { price: 'Harga ...' } */
export function getFieldErrors(error) {
  const list = error?.response?.data?.errors || [];
  return Object.fromEntries(list.map((e) => [e.field, e.message]));
}

// ---- Endpoint wrappers ----
export const productApi = {
  list: (params, config) => api.get('/products', { params, ...config }).then((r) => r.data),
  filters: () => api.get('/products/filters').then((r) => r.data.data),
  detail: (slug) => api.get(`/products/${slug}`).then((r) => r.data.data),
  adminList: (params) => api.get('/admin/products', { params }).then((r) => r.data),
  create: (payload) => api.post('/products', payload).then((r) => r.data),
  update: (id, payload) => api.put(`/products/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/products/${id}`).then((r) => r.data),
  updateStock: (id, variantId, stock) => api.patch(`/products/${id}/variants/${variantId}/stock`, { stock }).then((r) => r.data),
};

export const authApi = {
  login: (payload) => api.post('/auth/login', payload).then((r) => r.data.data),
  me: () => api.get('/auth/me').then((r) => r.data.data),
};

export const chatApi = {
  send: (payload) => api.post('/chat', payload).then((r) => r.data.data),
  logs: (params) => api.get('/chat/logs', { params }).then((r) => r.data),
};

export const analyticsApi = {
  summary: (params) => api.get('/analytics/summary', { params }).then((r) => r.data.data),
};

export default api;
