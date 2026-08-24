"use client";
// Per-request hook state: loading / error / retry (Phase 5 §15).
import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";

export function useApi<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      setLoading(true);
      setError(null);
      fetcher()
        .then((result) => {
          if (!cancelled) setData(result);
        })
        .catch((err: unknown) => {
          if (!cancelled)
            setError(
              err instanceof ApiError ? err : new ApiError(500, "UNKNOWN", "Unexpected error.")
            );
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const retry = useCallback(() => setTick((value) => value + 1), []);
  return { data, loading, error, retry };
}
