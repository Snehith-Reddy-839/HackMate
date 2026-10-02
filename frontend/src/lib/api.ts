import axios, { AxiosRequestConfig } from 'axios';
import { getCachedOrFetch, invalidateCache } from './cache';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    // Invalidate cache on mutations
    const method = response.config.method?.toUpperCase();
    if (method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      const url = response.config.url || '';
      if (url.includes('/teams')) invalidateCache('/teams');
      if (url.includes('/hackathons')) invalidateCache('/hackathons');
      if (url.includes('/profiles') || url.includes('/auth')) invalidateCache('/profiles');
      if (url.includes('/requests')) {
        invalidateCache('/requests');
        invalidateCache('/teams');
      }
      if (url.includes('/notifications')) invalidateCache('/notifications');
      invalidateCache('/stats');
    }
    return response;
  },
  (error) => {
    if (typeof window !== 'undefined' && error?.response?.status === 401) {
      localStorage.removeItem('token');
      invalidateCache();
    }
    return Promise.reject(error);
  }
);

/**
 * Safely fetches with client-side deduplication and TTL caching.
 * Scoped by auth token to guarantee user-isolated caching.
 */
export async function getCached<T = any>(
  url: string,
  config?: AxiosRequestConfig,
  ttlMs = 30000
): Promise<{ data: T }> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  const tokenScope = token ? `:auth-${token.slice(-12)}` : ':anon';
  const cacheKey = `${url}?${JSON.stringify(config?.params || {})}${tokenScope}`;
  return getCachedOrFetch(cacheKey, () => api.get<T>(url, config), ttlMs);
}

export { invalidateCache };
