"use client";

import { useGlobalLoading } from "@/context/global-loading-context";
import type { EC2InstanceDTO } from "@/types/ec2/EC2InstanceDTO";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

type Ec2ContextValue = {
    instances: EC2InstanceDTO[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    refreshUtilization: (days?: number) => Promise<void>; // ← new

    regions: string[];
    instanceTypes: string[];
    teams: string[];
    projects: string[];
};

const Ec2Context = createContext<Ec2ContextValue | undefined>(undefined);

type Props = {
    children: React.ReactNode;
    endpoint?: string;
    autoRefreshMs?: number;
};

export function Ec2Provider({ children, endpoint = "/api/ec2", autoRefreshMs = 0 }: Props) {
    const [instances, setInstances] = useState<EC2InstanceDTO[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const abortRef = useRef<AbortController | null>(null);
    const { begin, end } = useGlobalLoading();

    // fetchInstances
    const fetchInstances = useCallback(async () => {
        setLoading(true);
        setError(null);
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        begin();

        try {
            const res = await fetch(endpoint, { signal: controller.signal, cache: "no-store" });
            if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
            const json = await res.json();
            const list: EC2InstanceDTO[] = json?.instances ?? [];
            setInstances(Array.isArray(list) ? list : []);
        } catch (e: any) {
            if (e?.name !== "AbortError") setError(e?.message || "Failed to fetch EC2 instances");
        } finally {
            setLoading(false);
            end();
        }
    }, [endpoint, begin, end]);

    const refresh = useCallback(async () => {
        await fetchInstances();
    }, [fetchInstances]);

    useEffect(() => {
        fetchInstances();
        return () => abortRef.current?.abort();
    }, [fetchInstances]);

    useEffect(() => {
        if (!autoRefreshMs) return;
        const id = setInterval(fetchInstances, autoRefreshMs);
        return () => clearInterval(id);
    }, [autoRefreshMs, fetchInstances]);

    // UTILIZATION FETCH
    // Simple in-memory cache so we don't re-hit API for same instance repeatedly.
    // Cache TTL: 5 minutes.
    const utilCacheRef = useRef<Map<string, { cpuAvg7d: number; memAvg7d: number | null; ts: number }>>(new Map());

    // Small concurrency limiter
    async function withLimit<T>(tasks: (() => Promise<T>)[], limit = 5): Promise<T[]> {
        const out: T[] = [];
        let i = 0;
        async function worker() {
            while (i < tasks.length) {
                const idx = i++;
                out[idx] = await tasks[idx]();
            }
        }
        const workers = Array.from({ length: Math.min(limit, tasks.length) }, () => worker());
        await Promise.all(workers);
        return out;
    }

    const fetchOneUtil = useCallback(async (inst: EC2InstanceDTO, days = 7) => {
        const key = `${inst.instanceId}:${inst.region}:${days}`;
        const cached = utilCacheRef.current.get(key);
        const now = Date.now();
        if (cached && now - cached.ts < 5 * 60 * 1000) {
            return { instanceId: inst.instanceId, cpuAvg7d: cached.cpuAvg7d, memAvg7d: cached.memAvg7d };
        }

        const url = `/api/utilization?instanceId=${encodeURIComponent(inst.instanceId)}&region=${encodeURIComponent(inst.region)}&days=${days}`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`Utilization HTTP ${res.status}`);
        const json = await res.json();

        const cpuAvg = Number(json?.cpu?.average ?? 0);
        const memAvg = json?.memory?.average ?? null;

        utilCacheRef.current.set(key, { cpuAvg7d: cpuAvg, memAvg7d: memAvg, ts: now });
        return { instanceId: inst.instanceId, cpuAvg7d: cpuAvg, memAvg7d: memAvg as number | null };
    }, []);

    // Public action to refresh utilization for current instance list
    const refreshUtilization = useCallback(
        async (days = 7) => {
            if (instances.length === 0) return;
            begin();
            try {
                // Build tasks only for those missing/expired metrics
                const tasks = instances.map((inst) => async () => {
                    try {
                        const res = await fetchOneUtil(inst, days);
                        return res;
                    } catch {
                        return { instanceId: inst.instanceId, cpuAvg7d: 0, memAvg7d: null as number | null };
                    }
                });

                const results = await withLimit(tasks, 5);

                // Merge back into instances
                setInstances((prev) => {
                    const map = new Map(results.map((r) => [r.instanceId, r]));
                    return prev.map((i) => {
                        const m = map.get(i.instanceId);
                        return m ? { ...i, cpuAvg7d: m.cpuAvg7d, memAvg7d: m.memAvg7d } : i;
                    });
                });
            } finally {
                end();
            }
        },
        [instances, fetchOneUtil, begin, end]
    );

    // Optionally: auto-fetch utilization after base instances load (once)
    useEffect(() => {
        if (instances.length > 0) refreshUtilization(7);
    }, [instances.length]);

    const { regions, instanceTypes, teams, projects } = useMemo(() => {
        const uniq = <T,>(arr: T[]) => Array.from(new Set(arr)).sort();
        return {
            regions: uniq(instances.map((i) => i.region)),
            instanceTypes: uniq(instances.map((i) => i.type)),
            teams: uniq(instances.map((i) => i.tags?.Team).filter(Boolean) as string[]),
            projects: uniq(instances.map((i) => i.tags?.Project).filter(Boolean) as string[]),
        };
    }, [instances]);

    const value: Ec2ContextValue = {
        instances,
        loading,
        error,
        refresh,
        refreshUtilization,
        regions,
        instanceTypes,
        teams,
        projects,
    };

    return <Ec2Context.Provider value={value}>{children}</Ec2Context.Provider>;
}

export function useEc2(): Ec2ContextValue {
    const ctx = useContext(Ec2Context);
    if (!ctx) throw new Error("useEc2 must be used within an Ec2Provider");
    return ctx;
}
