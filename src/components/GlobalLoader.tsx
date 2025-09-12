"use client";
import React from "react";
import { useGlobalLoading } from "@/context/GlobalLoadingContext";

export default function GlobalLoader() {
  const { isLoading } = useGlobalLoading();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-white shadow-lg border border-gray-200">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" aria-label="Loading" />
        <div className="text-xs text-gray-600">Loading data…</div>
      </div>
    </div>
  );
}

