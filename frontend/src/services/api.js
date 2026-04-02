import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Auth APIs
export const auth = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/user'),
};

// Subscription APIs
export const subscriptions = {
  getStatus: () => api.get('/subscriptions/status'),
  subscribe: (data) => api.post('/subscriptions', data),
  getCheckoutUrl: (planType, charityPercentage) => 
    api.post('/subscriptions/checkout', { planType, charityPercentage }),
};

// Scores APIs
export const scores = {
  getAll: () => api.get('/scores'),
  add: (data) => api.post('/scores', data),
};

// Draws APIs
export const draws = {
  getHistory: () => api.get('/draws'),
  simulate: (drawType) => api.post('/draws/simulate', { drawType }),
  publish: (data) => api.post('/draws/publish', data),
};

// Charities APIs
export const charities = {
  getAll: () => api.get('/charities'),
  getFeatured: () => api.get('/charities/featured'),
  update: (data) => api.post('/charities/update', data),
  donate: (data) => api.post('/charities/donate', data),
};

// Winners APIs
export const winners = {
  getAll: () => api.get('/winners'),
  uploadProof: (data) => api.post('/winners/proof', data),
  getWinnings: () => api.get('/winners/winnings'),
};

// Dashboard APIs
export const dashboard = {
  getStats: () => api.get('/dashboard'),
  getAdminStats: () => api.get('/dashboard/admin'),
};

export default api;
