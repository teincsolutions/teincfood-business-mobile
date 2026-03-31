import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '@/utils/constants';
import { useAuthStore } from '@/stores/auth.store';

/**
 * Axios client instance for the TeincFoods API.
 */
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 10000, // 10s timeout
});

// Request interceptor: attach auth token
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => Promise.reject(error)
);

// Response interceptor: handle errors globally
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  (error: AxiosError) => {
    const status = error.response?.status;
    const message = (error.response?.data as any)?.message || error.message || 'An unexpected error occurred';
    
    // Auto-logout on 401 Unauthorized if needed
    if (status === 401) {
      useAuthStore.getState().clearAuth();
    }
    
    return Promise.reject(new ApiError(status ?? 500, message, error.response?.data));
  }
);

/**
 * Typed API Error wrapper for clean catch blocks.
 */
export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<T> => 
    axiosInstance.get(url, config),
    
  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => 
    axiosInstance.post(url, data, config),
    
  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => 
    axiosInstance.put(url, data, config),

  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => 
    axiosInstance.patch(url, data, config),

  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<T> => 
    axiosInstance.delete(url, config),
};
