"use client";
import { useCost } from "@/context/cost-context";
import type { BreakdownFilters, Granularity } from "@/types/cost/cost";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type DimKey = "REGION" | "INSTANCE_TYPE" | "INSTANCE_FAMILY" | "USAGE_TYPE";

type FilterState = {
    tagKeys: string[];
    activeTagKey: string;
    setActiveTagKey: (k: string) => void;
    tagValues: string[];
    selectedTagValues: string[];
    setSelectedTagValues: (vals: string[]) => void;
    activeDimKey: DimKey;
    setActiveDimKey: (k: DimKey) => void;
    dimValues: string[];
    selectedDimValues: string[];
    setSelectedDimValues: (vals: string[]) => void;
    filters: BreakdownFilters | undefined;
};

const Ctx = createContext<FilterState | undefined>(undefined);

const FALLBACK_TAG_KEYS = ["Team", "Project"];

export function FilterProvider({ children, start, end, granularity }: { children: React.ReactNode; start: string; end: string; granularity: Granularity }) {
    const { getTags, getDimensions, getTagKeys } = useCost();

    const [tagKeys, setTagKeys] = useState<string[]>([]);
    const [activeTagKey, setActiveTagKey] = useState<string>("");
    const [tagValues, setTagValues] = useState<string[]>([]);
    const [selectedTagValues, setSelectedTagValues] = useState<string[]>([]);

    const [activeDimKey, setActiveDimKey] = useState<DimKey>("REGION");
    const [dimValues, setDimValues] = useState<string[]>([]);
    const [selectedDimValues, setSelectedDimValues] = useState<string[]>([]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const json = await getTagKeys();
                const keys = Array.isArray(json?.keys) && json.keys.length ? json.keys : FALLBACK_TAG_KEYS;
                if (!cancelled) {
                    setTagKeys(keys);
                    if (!activeTagKey && keys.length) setActiveTagKey(keys[0]);
                }
            } catch {
                if (!cancelled) {
                    setTagKeys(FALLBACK_TAG_KEYS);
                    if (!activeTagKey && FALLBACK_TAG_KEYS.length) setActiveTagKey(FALLBACK_TAG_KEYS[0]);
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [start, end, getTagKeys]);

    useEffect(() => {
        if (!activeTagKey) {
            setTagValues([]);
            setSelectedTagValues([]);
            return;
        }
        (async () => {
            const res = await getTags({ key: activeTagKey, start, end });
            const vals = (res as any)?.values ?? (res as any)?.items ?? (Array.isArray(res) ? res : []);
            setTagValues(vals);
            setSelectedTagValues((sel) => sel.filter((v) => vals.includes(v)));
        })();
    }, [activeTagKey, start, end, getTags]);

    useEffect(() => {
        (async () => {
            const res = await getDimensions({ key: activeDimKey as any, start, end });
            const vals = (res as any)?.values ?? (Array.isArray(res) ? res : []);
            setDimValues(vals);
            setSelectedDimValues((sel) => sel.filter((v) => vals.includes(v)));
        })();
    }, [activeDimKey, start, end, getDimensions]);

    const filters = useMemo<BreakdownFilters | undefined>(() => {
        const obj: Record<string, string[]> = {};
        if (activeTagKey && selectedTagValues.length) obj[`TAG:${activeTagKey}`] = selectedTagValues;
        if (activeDimKey && selectedDimValues.length) obj[activeDimKey] = selectedDimValues;
        return Object.keys(obj).length ? (obj as BreakdownFilters) : undefined;
    }, [activeTagKey, selectedTagValues, activeDimKey, selectedDimValues]);

    const value: FilterState = {
        tagKeys,
        activeTagKey,
        setActiveTagKey,
        tagValues,
        selectedTagValues,
        setSelectedTagValues,
        activeDimKey,
        setActiveDimKey,
        dimValues,
        selectedDimValues,
        setSelectedDimValues,
        filters,
    };

    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFilterSettings(): FilterState {
    const v = useContext(Ctx);
    if (!v) throw new Error("useFilterSettings must be used within FilterProvider");
    return v;
}
