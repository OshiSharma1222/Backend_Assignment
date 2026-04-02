import axios from 'axios';

// In development, use the Vite proxy configured in vite.config.js
// In production, the same origin is used
const API_BASE_URL = '';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Auth APIs
export const auth = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  logout: () => api.post('/api/auth/logout'),
  getCurrentUser: () => api.get('/api/auth/user'),
};

// Subscription APIs
export const subscriptions = {
  getStatus: () => api.get('/api/subscriptions/status'),
  subscribe: (data) => api.post('/api/subscriptions', data),
  getCheckoutUrl: (planType, charityPercentage) => 
    api.post('/api/subscriptions/checkout', { planType, charityPercentage }),
};

// Scores APIs
export const scores = {
  getAll: () => api.get('/api/scores'),
  add: (data) => api.post('/api/scores', data),
};

// Draws APIs
export const draws = {
  getHistory: () => api.get('/api/draws'),
  simulate: (drawType) => api.post('/api/draws/simulate', { drawType }),
  publish: (data) => api.post('/api/draws/publish', data),
};

// Charities APIs
export const charities = {
  getAll: () => api.get('/api/charities'),
  getFeatured: () => api.get('/api/charities/featured'),
  update: (data) => api.post('/api/charities/update', data),
  donate: (data) => api.post('/api/charities/donate', data),
};

// Winners APIs
export const winners = {
  getAll: () => api.get('/api/winners'),
  uploadProof: (data) => api.post('/api/winners/proof', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getWinnings: () => api.get('/api/winners/winnings'),
};

// Dashboard APIs
export const dashboard = {
  getStats: () => api.get('/api/dashboard'),
  getAdminStats: () => api.get('/api/dashboard/admin'),
};

export default api;

