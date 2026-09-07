import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Bearer JWT token va Active Company ID qo'shish
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    const activeCompanyId = localStorage.getItem('active_company_id');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (activeCompanyId) {
      config.headers['X-Company-Id'] = activeCompanyId;
    }
  }
  return config;
});

// Response interceptor: 401 bo'lsa login sahifasiga yo'naltirish
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      if (!window.location.pathname.includes('/login') && window.location.pathname !== '/') {
        localStorage.removeItem('access_token');
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  },
);
