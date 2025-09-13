"use client";

import type { BreakdownFilters, CostAttribution, CostBreakdown, CostSummary, DimensionValues, Granularity, Metric, TagValues } from "@/types/cost/cost";
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

type LoadingState = Partial<Record<string, boolean>>;
type ErrorState = Partial<Record<string, string | null>>;

type CostContextValue = {
    getSummary: (p?: { start?: string; end?: string; granularity?: Granularity; metric?: Metric; includeFuture?: boolean }) => Promise<CostSummary>;
    getBreakdown: (p: { groupBy: string | string[]; start?: string; end?: string; granularity?: Granularity; metric?: Metric; filters?: BreakdownFilters; includeFuture?: boolean }) => Promise<CostBreakdown>;
    getAttribution: (p: { tag: string; start?: string; end?: string; granularity?: Granularity; metric?: Metric; includeFuture?: boolean }) => Promise<CostAttribution>;
    getDimensions: (p: { key: string; start?: string; end?: string; includeFuture?: boolean }) => Promise<DimensionValues>;
    getTags: (p: { key: string; start?: string; end?: string }) => Promise<TagValues>;
    getTagKeys: () => Promise<{ keys: string[] }>;

    loading: LoadingState;
    errors: ErrorState;
};

const CostContext = createContext<CostContextValue | undefined>(undefined);

type Props = {
    children: React.ReactNode;
    basePath?: string;
    cacheTtlMs?: number;
};

export function CostProvider({ children, basePath = "/api/cost", cacheTtlMs = 120_000 }: Props) {
    const [loading, setLoading] = useState<LoadingState>({});
    const [errors, setErrors] = useState<ErrorState>({});

    // simple in-memory cache keyed by URL
    const cache = useRef<Map<string, { ts: number; data: any }>>(new Map());

    const setLoad = (k: string, v: boolean) => setLoading((s) => ({ ...s, [k]: v }));
    const setErr = (k: string, e: string | null) => setErrors((s) => ({ ...s, [k]: e }));

    const getJSON = useCallback(
        async <T,>(url: string): Promise<T> => {
            const now = Date.now();
            const c = cache.current.get(url);
            if (c && now - c.ts < cacheTtlMs) {
                return c.data as T;
            }

            const key = `GET:${url}`;
            setLoad(key, true);
            setErr(key, null);
            try {
                const res = await fetch(url, { cache: "no-store" });
                if (!res.ok) {
                    const text = await res.text().catch(() => "");
                    throw new Error(`HTTP ${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`);
                }
                const json = (await res.json()) as T;
                cache.current.set(url, { ts: now, data: json });
                return json;
            } catch (e: any) {
                setErr(key, e?.message || "Request failed");
                throw e;
            } finally {
                setLoad(key, false);
            }
        },
        [cacheTtlMs]
    );

    // ---- API wrappers ----
    const buildQS = (params: Record<string, any>) =>
        Object.entries(params)
            .filter(([, v]) => v !== undefined && v !== null)
            .map(([k, v]) => {
                if (typeof v === "object" && !Array.isArray(v)) {
                    return `${encodeURIComponent(k)}=${encodeURIComponent(JSON.stringify(v))}`;
                }
                return `${encodeURIComponent(k)}=${encodeURIComponent(Array.isArray(v) ? v.join(",") : v)}`;
            })
            .join("&");

    const getSummary = useCallback<CostContextValue["getSummary"]>(
        async (p = {}) => {
            const qs = buildQS({
                metric: p.metric || "UnblendedCost",
                granularity: p.granularity || "DAILY",
                start: p.start,
                end: p.end,
            });
            return getJSON<CostSummary>(`${basePath}/summary?${qs}`);
        },
        [basePath, getJSON]
    );

    const getBreakdown = useCallback<CostContextValue["getBreakdown"]>(
        async (p) => {
            const groupBy = Array.isArray(p.groupBy) ? p.groupBy.join(",") : p.groupBy;
            const qs = buildQS({
                groupBy,
                metric: p.metric || "UnblendedCost",
                granularity: p.granularity || "DAILY",
                start: p.start,
                end: p.end,
                ...(p.filters ? { filters: p.filters } : {}),
            });
            return getJSON<CostBreakdown>(`${basePath}/breakdown?${qs}`);
        },
        [basePath, getJSON]
    );

    const getAttribution = useCallback<CostContextValue["getAttribution"]>(
        async (p) => {
            const qs = buildQS({
                tag: p.tag,
                metric: p.metric || "UnblendedCost",
                granularity: p.granularity || "DAILY",
                start: p.start,
                end: p.end,
            });
            return getJSON<CostAttribution>(`${basePath}/attribution?${qs}`);
        },
        [basePath, getJSON]
    );

    const getDimensions = useCallback<CostContextValue["getDimensions"]>(
        async (p) => {
            const qs = buildQS({ key: p.key, start: p.start, end: p.end });
            return getJSON<DimensionValues>(`${basePath}/dimensions?${qs}`);
        },
        [basePath, getJSON]
    );

    const getTags = useCallback<CostContextValue["getTags"]>(
        async (p) => {
            const qs = buildQS({ key: p.key, start: p.start, end: p.end });
            console.log("Fetching tags with URL:", `${basePath}/tags?${qs}`); // Debug log
            return getJSON<TagValues>(`${basePath}/tags?${qs}`);
        },
        [basePath, getJSON]
    );

    const getTagKeys = useCallback<CostContextValue["getTagKeys"]>(
        async () => {
            return getJSON<{ keys: string[] }>(`${basePath}/tag-keys`);
        },
        [basePath, getJSON]
    );

    const value = useMemo<CostContextValue>(
        () => ({
            getSummary,
            getBreakdown,
            getAttribution,
            getDimensions,
            getTags,
            getTagKeys,
            loading,
            errors,
        }),
        [getSummary, getBreakdown, getAttribution, getDimensions, getTags, getTagKeys, loading, errors]
    );

    return <CostContext.Provider value={value}>{children}</CostContext.Provider>;
}

export function useCost(): CostContextValue {
    const ctx = useContext(CostContext);
    if (!ctx) throw new Error("useCost must be used within a CostProvider");
    return ctx;
}
