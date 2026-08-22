"use client";

import {
  useCallback,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { apiErrorMessage } from "@/lib/api";

export interface AsyncData<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  /** Refetch with the spinner shown. Event handlers only — sets state synchronously. */
  refresh: () => Promise<void>;
  /** Replace the data locally, e.g. to show a single search hit. */
  setData: Dispatch<SetStateAction<T | null>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setLoading: Dispatch<SetStateAction<boolean>>;
}

/**
 * Loads `fetcher` once on mount and exposes the loading/error/data trio that
 * every list page here needs.
 *
 * The initial load runs inline inside the effect rather than in a callback the
 * effect calls: nothing touches state before the first await, and a `cancelled`
 * flag stops a slow response from writing to a page the user already left.
 * Both are what `react-hooks/set-state-in-effect` asks for, and the cancellation
 * fixes a real (if rare) race the per-page versions all had.
 *
 * `fetcher` must be referentially stable — declare it at module scope or wrap it
 * in `useCallback`, otherwise the effect refetches on every render.
 */
export function useAsyncData<T>(fetcher: () => Promise<T>): AsyncData<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const result = await fetcher();
        if (cancelled) return;
        setData(result);
        setError(null);
      } catch (e) {
        if (!cancelled) setError(apiErrorMessage(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetcher]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetcher());
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [fetcher]);

  return { data, loading, error, refresh, setData, setError, setLoading };
}
