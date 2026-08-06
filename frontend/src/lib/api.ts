import axios from 'axios';

const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const publicUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    return publicUrl.endsWith('/api') ? publicUrl : `${publicUrl}/api`;
  }
  const internalUrl = process.env.INTERNAL_API_URL || process.env.API_INTERNAL_URL || 'http://localhost:3001';
  return internalUrl.endsWith('/api') ? internalUrl : `${internalUrl}/api`;
};

export const api = axios.create({
  baseURL: getApiBaseUrl(),
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