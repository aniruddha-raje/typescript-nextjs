"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { isTokenExpired, mintMockToken } from "@/lib/jwt";

const TOKEN_STORAGE_KEY = "fastapi_crud_token";

// The credentials the mock login accepts. Configurable via env, defaulting
// to admin/admin. (These are NEXT_PUBLIC and therefore shipped to the browser —
// fine for a demo mock login, not a substitute for real authentication.)
const MOCK_USERNAME = process.env.NEXT_PUBLIC_ADMIN_USERNAME ?? "admin";
const MOCK_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "admin";

interface AuthContextValue {
  token: string | null;
  username: string | null;
  isAuthenticated: boolean;
  /** Whether we've finished reading any persisted token from storage. */
  isReady: boolean;
  /** Returns null on success, or an error message on failure. */
  login: (username: string, password: string) => string | null;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Rehydrate from localStorage on first mount.
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (stored && !isTokenExpired(stored)) {
      setToken(stored);
    } else if (stored) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
    setIsReady(true);
  }, []);

  const login = useCallback((username: string, password: string): string | null => {
    if (username !== MOCK_USERNAME || password !== MOCK_PASSWORD) {
      return "Invalid username or password.";
    }
    const newToken = mintMockToken(username);
    localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
    setToken(newToken);
    return null;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      username: token ? MOCK_USERNAME : null,
      isAuthenticated: Boolean(token),
      isReady,
      login,
      logout,
    }),
    [token, isReady, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

export { TOKEN_STORAGE_KEY };
