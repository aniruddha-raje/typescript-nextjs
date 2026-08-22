import axios, { AxiosError } from "axios";
import { TOKEN_STORAGE_KEY } from "@/context/AuthContext";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export const api = axios.create({ baseURL: BASE_URL });

// Attach the JWT from storage to every request.
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// On 401, drop the token and bounce to login.
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      if (window.location.pathname !== "/login") {
        // A hard navigation on purpose: this runs inside an axios interceptor,
        // outside React, where useRouter() is unavailable — and a full reload is
        // what we want anyway, to drop any state belonging to the signed-out user.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

/** Turn an axios error into a human-readable message. */
export function apiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = (error.response?.data as { detail?: unknown } | undefined)
      ?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail.length > 0) {
      // FastAPI validation errors.
      const first = detail[0] as { msg?: string };
      if (first?.msg) return first.msg;
    }
    if (error.code === "ERR_NETWORK") {
      return `Cannot reach the API at ${BASE_URL}. Is the backend server running?`;
    }
    return error.message;
  }
  return "An unexpected error occurred.";
}

/** True if the error is an HTTP 404 from the API. */
export function isNotFound(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404;
}

// ─── Shared types ───────────────────────────────────────────────────────────

export interface APIResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface Profile {
  bio: string;
}

export interface Post {
  id: number;
  title: string;
  content: string | null;
}

export interface User {
  id: number;
  username: string;
  profile: Profile | null;
  posts: Post[];
}

export interface JPPost {
  userId: number;
  id: number;
  title: string;
  body: string;
}

export interface JPComment {
  postId: number;
  id: number;
  name: string;
  email: string;
  body: string;
}

export const API_BASE_URL = BASE_URL;
