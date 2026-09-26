import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import { API_BASE_URL } from "@/utils/constants";
import { toast } from "sonner-native";
import { useAuthStore } from "@/stores/auth.store";
import { getObservability } from "@teincfood/observability";
import {
  extractFromResponseBody,
  recordAttempt,
  extractAuthFailure,
  isAccessExpired,
  isSessionDead,
  hasAuthRetrySkip,
  refreshSession,
  clearAuth,
  noteRateLimited,
  extractRetryAfterMs,
  isRateLimited,
  getRateLimitWaitMs,
  shouldReportRateLimit,
} from "@teincfood/core";

/**
 * Axios client instance for the Teinc Food Business API.
 */
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 30000,
});

// Global 429 back-pressure gate: while the server has throttled us, fail
// network requests fast with a synthesized 429 instead of piling on. Background
// sync auto-resumes once the cooldown clears.
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (isRateLimited()) {
      const waitMs = getRateLimitWaitMs();
      const err = new Error("Server is busy — please try again shortly") as Error & {
        status?: number;
        response?: unknown;
        isRateLimited?: boolean;
      };
      err.status = 429;
      err.isRateLimited = true;
      err.response = {
        status: 429,
        data: {
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: err.message,
            retry_after_seconds: Math.ceil(waitMs / 1000),
          },
        },
      };
      return Promise.reject(err);
    }
    return config;
  },
  (error: unknown) => Promise.reject(error),
);

// Request interceptor: attach auth token
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }    try { recordAttempt("rest_attempt", `${config.method?.toUpperCase()} ${config.url ?? ""}`); } catch {}
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, {
      data: config.data,
      params: config.params,
      headers: {
        ...config.headers,
        Authorization: config.headers?.Authorization ? "Bearer ..." : undefined,
      },
    });
    return config;
  },
  (error: unknown) => Promise.reject(error),
);

// Observability request hook LAST so it runs first (axios request
// interceptors are LIFO): creates the api.request span + traceparent.
// Safe before init.
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    try {
      const out = getObservability()
        ?.axiosInterceptors()
        .request(config as never) as unknown;
      return (out ?? config) as InternalAxiosRequestConfig;
    } catch {
      return config;
    }
  },
  (error: unknown) => Promise.reject(error),
);

// Response interceptor: session lifecycle is owned by @teincfood/core.
// This layer only attaches tokens, normalizes errors, and delegates
// classification (isAccessExpired/isSessionDead) + recovery
// (refreshSession/clearAuth) to core. No local refresh state.
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    try {
      getObservability()
        ?.axiosInterceptors()
        .response(response as never);
    } catch {}
    return response;
  },
  async (error: unknown) => {
    try {
      const ax = getObservability()?.axiosInterceptors();
      if (ax) await ax.responseError(error as never);
    } catch {}
    return Promise.reject(error);
  },
);

// Unwrap + session recovery (observability FIRST so spans see the real
// response before unwrapping; responseError above rethrows into this handler).
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;
    const status = error.response?.status;
    const responseData = error.response?.data as
      | Record<string, unknown>
      | undefined;

    let errorMessage: string | undefined;
    if (responseData && typeof responseData === "object") {
      errorMessage =
        extractFromResponseBody(responseData as Record<string, unknown>) ??
        undefined;
    }
    const rejectAsApiError = () =>
      Promise.reject(
        new ApiError(
          status ?? 500,
          errorMessage || error.message || "An unexpected error occurred",
          responseData,
        ),
      );

    // 429: open the global cooldown so background sync pauses, and tell the
    // user once per window instead of failing silently.
    if (status === 429) {
      noteRateLimited(extractRetryAfterMs(error));
      if (shouldReportRateLimit()) {
        try {
          toast.error("Server is busy — retrying automatically");
        } catch {}
      }
      return rejectAsApiError();
    }

    // Core-owned refresh calls must never recurse into session handling —
    // their own 401 rejects immediately for core to classify.
    if (originalRequest && hasAuthRetrySkip(originalRequest)) {
      return rejectAsApiError();
    }

    const failure = extractAuthFailure(error);

    // Access token expired — single-flight refresh in core, then retry once.
    // Concurrent 401s share core's in-flight refresh (no local queue, no
    // refresh-token rotation races).
    if (originalRequest && isAccessExpired(failure) && !originalRequest._retry) {
      originalRequest._retry = true;
      const tokens = await refreshSession().catch(() => null);
      if (tokens?.access_token) {
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${tokens.access_token}`;
        }
        return axiosInstance(originalRequest);
      }
      return rejectAsApiError();
    }

    // Refresh/session dead (e.g. REFRESH_FAILED "Token has expired") —
    // core clearAuth() routes to login. A 401 WITHOUT a code (proxy/gateway
    // HTML) never logs out mid-shift; the app keeps working offline.
    if (isSessionDead(failure)) {
      try {
        clearAuth();
      } catch {}
    }
    return rejectAsApiError();
  },
);

/**
 * Typed API Error wrapper for clean catch blocks.
 */
export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    axiosInstance.get(url, config),

  post: <T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> => axiosInstance.post(url, data, config),

  put: <T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> => axiosInstance.put(url, data, config),

  patch: <T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> => axiosInstance.patch(url, data, config),

  delete: <T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> => {
    if (data) {
      return axiosInstance.delete(url, { ...config, data });
    }
    return axiosInstance.delete(url, config);
  },
};
