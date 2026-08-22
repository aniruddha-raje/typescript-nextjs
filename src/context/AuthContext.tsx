"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { isTokenExpired, mintMockToken } from "@/lib/jwt";

const TOKEN_STORAGE_KEY = "fastapi_crud_token";

// The credentials the mock login accepts. Configurable via env, defaulting
// to admin/admin. (These are NEXT_PUBLIC and therefore shipped to the browser —
// fine for a demo mock login, not a substitute for real authentication.)
const MOCK_USERNAME = process.env.NEXT_PUBLIC_ADMIN_USERNAME ?? "admin";
const MOCK_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "admin";

// ─── localStorage as an external store ───────────────────────────────────────
//
// The token lives in localStorage, which React treats as an external store.
// Reading it with useSyncExternalStore (rather than copying it into state from
// an effect) keeps the read out of the render path and gives cross-tab sync
// for free: signing out in one tab signs out the others.

const listeners = new Set<() => void>();

/** Notify subscribers after we change the token in this tab. */
function emitTokenChange() {
  listeners.forEach((listener) => listener());
}

function subscribe(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  // `storage` only fires in *other* tabs, hence the local listener set above.
  window.addEventListener("storage", onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

/** Snapshot must be a stable primitive — localStorage.getItem returns one. */
function getSnapshot(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

/**
 * There is no token on the server. `undefined` (as opposed to `null`) marks
 * "not read yet", which is what `isReady` reports — it lets the layouts hold
 * off redirecting until the real value has arrived on the client.
 */
function getServerSnapshot(): undefined {
  return undefined;
}

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
  const stored = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const isReady = stored !== undefined;
  // An expired token counts as no token. It is left in storage until the next
  // login or logout overwrites it; nothing reads it while it is expired.
  const token = stored && !isTokenExpired(stored) ? stored : null;

  const login = useCallback((username: string, password: string): string | null => {
    if (username !== MOCK_USERNAME || password !== MOCK_PASSWORD) {
      return "Invalid username or password.";
    }
    localStorage.setItem(TOKEN_STORAGE_KEY, mintMockToken(username));
    emitTokenChange();
    return null;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    emitTokenChange();
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
