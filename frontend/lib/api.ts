/**
 * lib/api.ts — Axios HTTP client for backend API
 */

import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // Send httpOnly cookies automatically
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000, // 15 second timeout
});

// ── Response Interceptor ───────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong. Please try again.';

    // Handle 401 globally — redirect to login
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith('/auth')) {
        window.location.href = `/auth/login?redirect=${encodeURIComponent(currentPath)}`;
      }
    }

    return Promise.reject(new Error(message));
  }
);

export default api;

// ── Typed API helpers ─────────────────────────────────────

// Menu
export const menuApi = {
  getItems: (params?: Record<string, string>) =>
    api.get('/menu/items', { params }),
  getSpecials: () => api.get('/menu/items/specials'),
  getItem: (id: string) => api.get(`/menu/items/${id}`),
  createItem: (data: FormData) =>
    api.post('/menu/items', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateItem: (id: string, data: FormData) =>
    api.put(`/menu/items/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteItem: (id: string) => api.delete(`/menu/items/${id}`),
  toggleSpecial: (id: string) => api.patch(`/menu/items/${id}/toggle-special`),
  toggleAvailable: (id: string) => api.patch(`/menu/items/${id}/toggle-available`),
};

// Auth
export const authApi = {
  register: (data: Record<string, unknown>) => api.post('/auth/register', data),
  login: (data: Record<string, string>) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
  changePassword: (data: any) => api.put('/auth/change-password', data),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, data: Record<string, string>) => api.post(`/auth/reset-password/${token}`, data),
  resetPasswordOtp: (data: Record<string, string>) => api.post('/auth/reset-password-otp', data),
  addAddress: (data: any) => api.post('/auth/address', data),
  deleteAddress: (id: string) => api.delete(`/auth/address/${id}`),
};

// Orders
export const orderApi = {
  create: (data: unknown) => api.post('/orders', data),
  createOffline: (data: unknown) => api.post('/orders/offline', data),
  myOrders: (params?: Record<string, string>) => api.get('/orders/my', { params }),
  getOrder: (id: string) => api.get(`/orders/${id}`),
  getAllOrders: (params?: Record<string, string>) => api.get('/orders', { params }),
  updateStatus: (id: string, status: string, note?: string) =>
    api.patch(`/orders/${id}/status`, { status, note }),
  updatePaymentStatus: (id: string, paymentStatus: string) =>
    api.patch(`/orders/${id}/payment-status`, { paymentStatus }),
};

// Payments
export const paymentApi = {
  createOrder: (data: { orderId: string; type: 'order' | 'tiffin' }) =>
    api.post('/payments/create-order', data),
  verify: (data: Record<string, string>) => api.post('/payments/verify', data),
  cancel: (data: { orderId: string; type: 'order' | 'tiffin' }) =>
    api.post('/payments/cancel', data),
};

// Coupons
export const couponApi = {
  validate: (code: string, orderAmount: number) =>
    api.post('/coupons/validate', { code, orderAmount }),
  getAll: () => api.get('/coupons'),
  create: (data: unknown) => api.post('/coupons', data),
  update: (id: string, data: unknown) => api.put(`/coupons/${id}`, data),
  delete: (id: string) => api.delete(`/coupons/${id}`),
};

// Settings
export const settingsApi = {
  get: () => api.get('/settings'),
  update: (data: unknown) => api.put('/settings', data),
  toggleStore: () => api.patch('/settings/toggle-store'),
};

// Analytics
export const analyticsApi = {
  dashboard: () => api.get('/analytics/dashboard'),
  revenue: (params?: Record<string, string>) => api.get('/analytics/revenue', { params }),
  topItems: (params?: Record<string, string>) => api.get('/analytics/top-items', { params }),
};

// Customers
export const customerApi = {
  getAll: (params?: Record<string, string>) => api.get('/customers', { params }),
  getOne: (id: string) => api.get(`/customers/${id}`),
};

// Tiffin
export const tiffinApi = {
  subscribe: (data: unknown) => api.post('/tiffin/subscribe', data),
  mySubscriptions: () => api.get('/tiffin/my'),
  getOne: (id: string) => api.get(`/tiffin/${id}`),
  getAll: (params?: Record<string, string>) => api.get('/tiffin', { params }),
  pause: (id: string, data?: unknown) => api.patch(`/tiffin/${id}/pause`, data),
  resume: (id: string) => api.patch(`/tiffin/${id}/resume`),
  cancel: (id: string) => api.patch(`/tiffin/${id}/cancel`),
};

// Reviews
export const reviewsApi = {
  addReview: (data: { orderId: string; rating: number; comment: string }) => api.post('/reviews', data),
  getReviews: () => api.get('/reviews'),
};
