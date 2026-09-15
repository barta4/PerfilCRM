import axios from 'axios';

const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    if (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('localhost')) {
      const publicUrl = process.env.NEXT_PUBLIC_API_URL;
      return publicUrl.endsWith('/api') ? publicUrl : `${publicUrl}/api`;
    }
    return '/api';
  }
  const internalUrl = process.env.INTERNAL_API_URL || process.env.API_INTERNAL_URL || 'http://perfil-backend:3001';
  return internalUrl.endsWith('/api') ? internalUrl : `${internalUrl}/api`;
};

export const api = axios.create({
  baseURL: getApiBaseUrl(),
});

// Request interceptor to ensure auth token is always attached
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('perfilgranos-auth');
      if (stored) {
        const parsed = JSON.parse(stored);
        const token = parsed?.state?.token;
        if (token && !config.headers.Authorization) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch {}
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        localStorage.removeItem('perfilgranos-auth');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);