export const BASE_URL: string = (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:5000/api";
export const SERVER_ORIGIN: string = BASE_URL.replace(/\/api\/?$/, "");

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
  details?: unknown;
  pagination?: { page: number; limit: number; total: number; pages: number };
  unreadCount?: number;
}

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const TOKEN_KEY = "rmh_access_token";
const REFRESH_KEY = "rmh_refresh_token";
const USER_KEY = "rmh_user";

export const tokenStorage = {
  getAccess: () => localStorage.getItem(TOKEN_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  getUser: <T = unknown,>(): T | null => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  },
  setSession: (accessToken: string, refreshToken: string, user: unknown) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  setUser: (user: unknown) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

let refreshPromise: Promise<string | null> | null = null;

async function tryRefreshToken(): Promise<string | null> {
  const refreshToken = tokenStorage.getRefresh();
  if (!refreshToken) return null;

  if (!refreshPromise) {
    refreshPromise = fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (res) => {
        if (!res.ok) return null;
        const json = await res.json();
        const newAccess = json?.data?.accessToken as string | undefined;
        const newRefresh = json?.data?.refreshToken as string | undefined;
        if (newAccess && newRefresh) {
          localStorage.setItem(TOKEN_KEY, newAccess);
          localStorage.setItem(REFRESH_KEY, newRefresh);
          return newAccess;
        }
        return null;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  auth?: boolean; // defaults to true
  retry?: boolean; // internal - prevents infinite refresh loop
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(`${BASE_URL}${path}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<ApiEnvelope<T>> {
  const { method = "GET", body, query, auth = true, retry = true } = options;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) {
    const token = tokenStorage.getAccess();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(buildUrl(path, query), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && auth && retry) {
    const newToken = await tryRefreshToken();
    if (newToken) {
      return apiRequest<T>(path, { ...options, retry: false });
    }
    tokenStorage.clear();
  }

  let json: ApiEnvelope<T> | undefined;
  try {
    json = await res.json();
  } catch {
    // no body
  }

  if (!res.ok || !json?.success) {
    throw new ApiError(json?.message ?? `Request failed (${res.status})`, res.status, json?.details);
  }

  return json;
}

export const api = {
  get: <T,>(path: string, query?: RequestOptions["query"], auth = true) =>
    apiRequest<T>(path, { method: "GET", query, auth }),
  post: <T,>(path: string, body?: unknown, auth = true) => apiRequest<T>(path, { method: "POST", body, auth }),
  put: <T,>(path: string, body?: unknown, auth = true) => apiRequest<T>(path, { method: "PUT", body, auth }),
  patch: <T,>(path: string, body?: unknown, auth = true) => apiRequest<T>(path, { method: "PATCH", body, auth }),
  del: <T,>(path: string, auth = true) => apiRequest<T>(path, { method: "DELETE", auth }),
};
