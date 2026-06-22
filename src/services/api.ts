import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '@/utils/constants';
import { useAuthStore } from '@/stores/auth.store';
import { extractFromResponseBody } from '@/utils/error';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Axios client instance for the TeincFoods API.
 */
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 30000,
});

// Request interceptor: attach auth token
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, {
      data: config.data,
      params: config.params,
      headers: { ...config.headers, Authorization: config.headers?.Authorization ? 'Bearer ...' : undefined },
    });
    return config;
  },
  (error: unknown) => Promise.reject(error)
);

// Response interceptor: handle errors globally with token refresh
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;
    const responseData = error.response?.data as Record<string, unknown> | undefined;

    let errorCode: string | undefined;
    let errorMessage: string | undefined;

    if (responseData && typeof responseData === 'object') {
      const data = responseData as Record<string, unknown>;
      errorMessage = extractFromResponseBody(data) ?? undefined;

      const errorField = data.error;
      if (errorField && typeof errorField === 'object') {
        errorCode = (errorField as Record<string, unknown>).code as string | undefined;
      } else if (typeof errorField === 'string') {
        errorCode = errorField;
      }
    }

    // Token expired — attempt refresh
    if (status === 401 && errorCode === 'TOKEN_EXPIRED' && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              resolve(axiosInstance(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) {
          useAuthStore.getState().clearAuth();
          throw new Error('No refresh token available');
        }

        const response = await axiosInstance.post('/auth/refresh', {
          refresh_token: refreshToken,
        });
        const data = response as unknown as { access_token: string; refresh_token: string };

        useAuthStore.getState().setTokens(data.access_token, data.refresh_token);

        processQueue(null, data.access_token);
        isRefreshing = false;

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        }

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        isRefreshing = false;
        useAuthStore.getState().clearAuth();
        return Promise.reject(refreshError);
      }
    }

    // Only clear auth for actual token/session errors
    const AUTH_INVALIDATING_CODES = ['UNAUTHORIZED', 'TOKEN_INVALID', 'SESSION_EXPIRED', 'ACCOUNT_DISABLED'];
    if (status === 401 && errorCode !== 'TOKEN_EXPIRED') {
      const isAuthError = !errorCode || AUTH_INVALIDATING_CODES.includes(errorCode);
      if (isAuthError) {
        useAuthStore.getState().clearAuth();
      }
    }

    const message = errorMessage || error.message || 'An unexpected error occurred';
    return Promise.reject(new ApiError(status ?? 500, message, responseData));
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

  delete: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    if (data) {
      return axiosInstance.delete(url, { ...config, data });
    }
    return axiosInstance.delete(url, config);
  },
};
