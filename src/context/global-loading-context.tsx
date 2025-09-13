"use client";
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

type GlobalLoadingContextValue = {
  pending: number;
  isLoading: boolean;
  begin: () => void;
  end: () => void;
  track: <T>(p: Promise<T>) => Promise<T>;
};

const GlobalLoadingContext = createContext<GlobalLoadingContextValue | undefined>(undefined);

export function GlobalLoadingProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState(0);
  const unmountedRef = useRef(false);

  const begin = useCallback(() => {
    setPending((n) => n + 1);
  }, []);

  const end = useCallback(() => {
    // Ensure we never go below zero, and ignore after unmount
    if (unmountedRef.current) return;
    setPending((n) => (n > 0 ? n - 1 : 0));
  }, []);

  const track = useCallback(
    async <T,>(p: Promise<T>): Promise<T> => {
      begin();
      try {
        return await p;
      } finally {
        end();
      }
    },
    [begin, end]
  );

  const value = useMemo<GlobalLoadingContextValue>(() => ({ pending, isLoading: pending > 0, begin, end, track }), [pending, begin, end, track]);

  return <GlobalLoadingContext.Provider value={value}>{children}</GlobalLoadingContext.Provider>;
}

export function useGlobalLoading(): GlobalLoadingContextValue {
  const ctx = useContext(GlobalLoadingContext);
  if (!ctx) throw new Error("useGlobalLoading must be used within GlobalLoadingProvider");
  return ctx;
}

