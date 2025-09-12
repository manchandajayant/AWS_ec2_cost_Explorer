"use client";
import React, { createContext, useContext, useMemo, useState } from "react";

interface UIContextValue {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  toggleSidebar: () => void;
}

const UIContext = createContext<UIContextValue | undefined>(undefined);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const value = useMemo<UIContextValue>(() => ({ sidebarCollapsed, setSidebarCollapsed, toggleSidebar: () => setSidebarCollapsed((v) => !v) }), [sidebarCollapsed]);
  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI(): UIContextValue {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used within UIProvider");
  return ctx;
}

