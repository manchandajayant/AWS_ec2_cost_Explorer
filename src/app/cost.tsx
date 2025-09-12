"use client";

import { ModernDatePicker } from "@/components/DatePicker";
import { FilterPill } from "@/components/FilterPill";
import MonthPicker from "@/components/MonthPicker";
import { CostProvider, useCost } from "@/context/CostContext";
import type { BreakdownFilters, BreakdownRow, CostAttribution, CostBreakdown, CostSummary } from "@/types/cost/cost";
import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, LineElement, PointElement, Tooltip } from "chart.js";
import { useEffect, useMemo, useState } from "react";
import { Bar, Line } from "react-chartjs-2";

ChartJS.register(LineElement, PointElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const fmtUSD = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const todayISO = () => new Date().toISOString().slice(0, 10);
export const addDays = (iso: string, d: number) => {
    const dt = new Date(iso);
    dt.setDate(dt.getDate() + d);
    return dt.toISOString().slice(0, 10);
};
const last30 = () => ({ start: addDays(todayISO(), -30), end: todayISO() });
const COLORS = ["#a7a2ffff", "#9de3f0ff", "#75e29dff", "#e8be75ff", "#ee7272ff", "#a787f2ff", "#77dbbaff", "#ffaf76ff", "#86e4d9ff", "#9bc1ffff"];

function aggregateTotals(rows: BreakdownRow[]) {
    const totals = new Map<string, number>();
    for (const r of rows) {
        const k = r.keys.join(" • ");
        totals.set(k, (totals.get(k) || 0) + r.amount);
    }
    return [...totals.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

function buildLineSeries(rows: BreakdownRow[], topN = 5) {
    const dates = Array.from(new Set(rows.map((r) => r.start))).sort();
    const totals = aggregateTotals(rows);
    const top = totals.slice(0, topN).map((t) => t.name);
    const map = new Map<string, Map<string, number>>();
    for (const r of rows) {
        const g = r.keys.join(" • ");
        if (!top.includes(g)) continue;
        if (!map.has(g)) map.set(g, new Map());
        map.get(g)!.set(r.start, (map.get(g)!.get(r.start) || 0) + r.amount);
    }
    const datasets = top.map((g, i) => ({
        label: g,
        data: dates.map((d) => map.get(g)?.get(d) ?? 0),
        borderColor: COLORS[i % COLORS.length],
        backgroundColor: COLORS[i % COLORS.length],
        tension: 0.25,
        fill: false,
    }));
    return { labels: dates, datasets, topTotals: totals };
}

// (If needed later) helper to aggregate by date
// function buildTotalSeriesByDate(rows: BreakdownRow[]) {
//     const totals = new Map<string, number>();
//     for (const r of rows) {
//         totals.set(r.start, (totals.get(r.start) || 0) + r.amount);
//     }
//     const labels = Array.from(totals.keys()).sort();
//     const data = labels.map((d) => totals.get(d) || 0);
//     return { labels, data };
// }

type Tab = "OVERVIEW" | "COMPARE";

function Inner() {
    const { getBreakdown, getTags, getDimensions, getAttribution, getSummary } = useCost();

    // Shared state
    const [tab, setTab] = useState<Tab>("OVERVIEW");
    const [groupBy, setGroupBy] = useState<"REGION" | "INSTANCE_TYPE" | "USAGE_TYPE">("REGION");
    const [chartType, setChartType] = useState<"line" | "bar">("bar"); // default bar
    const [topN, setTopN] = useState<number | "ALL">(5);

    // Overview state
    const [granularity, setGranularity] = useState<"DAILY" | "MONTHLY">("MONTHLY");
    const [start, setStart] = useState<string>(last30().start);
    const [end, setEnd] = useState<string>(last30().end);
    const [breakdown, setBreakdown] = useState<CostBreakdown | null>(null);

    // Tag filter state (used in both tabs)
    const AVAILABLE_TAG_KEYS = ["Team", "Project"]; // adjust if backend exposes more
    const [tagKeys, setTagKeys] = useState<string[]>([]);
    const [activeTagKey, setActiveTagKey] = useState<string>("");
    const [tagValues, setTagValues] = useState<string[]>([]);
    const [selectedTagValues, setSelectedTagValues] = useState<string[]>([]);

    // Dimension filter state
    const DIM_KEYS: ("REGION" | "INSTANCE_TYPE" | "INSTANCE_FAMILY" | "USAGE_TYPE")[] = ["REGION", "INSTANCE_TYPE", "INSTANCE_FAMILY", "USAGE_TYPE"];
    const [activeDimKey, setActiveDimKey] = useState<"REGION" | "INSTANCE_TYPE" | "INSTANCE_FAMILY" | "USAGE_TYPE">("REGION");
    const [dimValues, setDimValues] = useState<string[]>([]);
    const [selectedDimValues, setSelectedDimValues] = useState<string[]>([]);

    // Attribution + Summary (to inform filtering)
    const [attrCoverage, setAttrCoverage] = useState<CostAttribution | null>(null);
    const [summary, setSummary] = useState<CostSummary | null>(null);

    // Compare (Month vs Month)
    const yyyymm = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const [monthA, setMonthA] = useState<string>(yyyymm());
    const [monthB, setMonthB] = useState<string>(yyyymm(new Date(new Date().setMonth(new Date().getMonth() - 1))));
    const [compareA, setCompareA] = useState<CostBreakdown | null>(null);
    const [compareB, setCompareB] = useState<CostBreakdown | null>(null);

    // Projections
    const [showProjections, setShowProjections] = useState(false);

    // ---------- Tag helpers ----------
    const fetchTagKeys = async () => {
        // If you want to fetch available keys dynamically, add an API.
        const keys = AVAILABLE_TAG_KEYS;
        setTagKeys(keys);
        if (!activeTagKey && keys.length) setActiveTagKey(keys[0]);
    };

    const fetchTagValues = async (key: string) => {
        if (!key) {
            setTagValues([]);
            setSelectedTagValues([]);
            return;
        }
        const res = await getTags({ key, start, end });
        const vals = (res as any)?.values ?? (res as any)?.items ?? (Array.isArray(res) ? res : []);
        setTagValues(vals);
        // keep selected values that still exist, drop stale ones
        setSelectedTagValues((sel) => sel.filter((v) => vals.includes(v)));
    };

    const fetchDimValues = async (key: typeof activeDimKey) => {
        const res = await getDimensions({ key, start, end });
        const vals = (res as any)?.values ?? (Array.isArray(res) ? res : []);
        setDimValues(vals);
        setSelectedDimValues((sel) => sel.filter((v) => vals.includes(v)));
    };

    const makeFilters = (): BreakdownFilters | undefined => {
        const obj: Record<string, string[]> = {};
        if (activeTagKey && selectedTagValues.length) obj[`TAG:${activeTagKey}`] = selectedTagValues;
        if (activeDimKey && selectedDimValues.length) obj[activeDimKey] = selectedDimValues;
        return Object.keys(obj).length ? (obj as BreakdownFilters) : undefined;
    };

    const fetchOverview = async () => {
        // For DAILY granularity, add one day to the user-selected end date.
        // MONTHLY ranges from `monthToRange` are already correct.
        const apiEnd = granularity === "DAILY" ? addDays(end, 1) : end;
        const br = await getBreakdown({
            groupBy: [groupBy],
            metric: "UnblendedCost",
            granularity,
            start,
            end: apiEnd,
            includeFuture: shouldIncludeFuture,
            filters: makeFilters(),
        });
        setBreakdown(br);
    };

    const monthToRange = (m: string) => {
        // m = "YYYY-MM"
        const [y, mm] = m.split("-").map(Number);
        const start = new Date(y, (mm ?? 1) - 1, 1);
        const end = new Date(y, mm ?? 1, 1); // exclusive
        const iso = (d: Date) => d.toISOString().slice(0, 10);
        return { start: iso(start), end: iso(end) };
    };

    const fetchCompare = async () => {
        const ra = monthToRange(monthA);
        const rb = monthToRange(monthB);
        const [aRes, bRes] = await Promise.all([
            getBreakdown({
                groupBy: [groupBy],
                metric: "UnblendedCost",
                granularity: "MONTHLY",
                start: ra.start,
                end: ra.end,
                filters: makeFilters(),
            }),
            getBreakdown({
                groupBy: [groupBy],
                metric: "UnblendedCost",
                granularity: "MONTHLY",
                start: rb.start,
                end: rb.end,
                filters: makeFilters(),
            }),
        ]);
        setCompareA(aRes);
        setCompareB(bRes);
    };

    useEffect(() => {
        fetchTagKeys();
    }, [start, end]);

    useEffect(() => {
        if (activeTagKey) fetchTagValues(activeTagKey);
    }, [activeTagKey, start, end]);

    // Load dimension values for chosen dim key
    useEffect(() => {
        fetchDimValues(activeDimKey);
    }, [activeDimKey, start, end]);

    // Attribution coverage for selected tag key
    useEffect(() => {
        if (!activeTagKey) {
            setAttrCoverage(null);
            return;
        }
        (async () => {
            const apiEnd = granularity === "DAILY" ? addDays(end, 1) : end;
            const res = await getAttribution({ tag: activeTagKey, start, end: apiEnd, metric: "UnblendedCost", granularity, includeFuture: shouldIncludeFuture });
            setAttrCoverage(res);
        })();
    }, [activeTagKey, start, end, granularity]);

    // Summary for current range (informational)
    useEffect(() => {
        (async () => {
            const apiEnd = granularity === "DAILY" ? addDays(end, 1) : end;
            const res = await getSummary({ start, end: apiEnd, granularity, metric: "UnblendedCost", includeFuture: shouldIncludeFuture });
            setSummary(res);
        })();
    }, [start, end, granularity]);

    // Overview reactive loads
    useEffect(() => {
        if (tab === "OVERVIEW") fetchOverview();
    }, [tab, groupBy, granularity, start, end, activeTagKey, selectedTagValues]);

    // Compare reactive loads
    useEffect(() => {
        if (tab === "COMPARE") fetchCompare();
    }, [tab, groupBy, monthA, monthB, activeTagKey, selectedTagValues]);

    // ---- Handlers ----
    const handleDateApply = (s: string, e: string) => {
        setStart(s);
        setEnd(e);
    };

    const toggleTagValue = (v: string) => {
        setSelectedTagValues((cur) => (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]));
    };

    // ---- Derived data (Overview) ----
    const { labels, datasets, topTotals } = useMemo(() => buildLineSeries(breakdown?.rows ?? [], topN === "ALL" ? Number.MAX_SAFE_INTEGER : topN), [breakdown, topN]);
    const total = useMemo(() => topTotals.reduce((s, d) => s + d.value, 0), [topTotals]);
    const { maxValue, avgValue } = useMemo(() => {
        if (!topTotals.length) return { maxValue: 0, avgValue: 0 };
        const vals = topTotals.map((t) => t.value);
        const maxValue = Math.max(...vals);
        const avgValue = vals.reduce((a, b) => a + b, 0) / vals.length;
        return { maxValue, avgValue };
    }, [topTotals]);
    const beyondToday = useMemo(() => end > todayISO(), [end]);

    // ---- Derived data (Compare) ----
    const totalsA = useMemo(() => aggregateTotals(compareA?.rows ?? []), [compareA]);
    const totalsB = useMemo(() => aggregateTotals(compareB?.rows ?? []), [compareB]);
    const allGroups = useMemo(() => Array.from(new Set([...totalsA.map((t) => t.name), ...totalsB.map((t) => t.name)])), [totalsA, totalsB]);
    const mapA = new Map(totalsA.map((t) => [t.name, t.value]));
    const mapB = new Map(totalsB.map((t) => [t.name, t.value]));
    const compareBarData = {
        labels: allGroups,
        datasets: [
            { label: monthA, data: allGroups.map((g) => mapA.get(g) ?? 0), backgroundColor: COLORS[0] },
            { label: monthB, data: allGroups.map((g) => mapB.get(g) ?? 0), backgroundColor: COLORS[1] },
        ],
    };

    const shouldIncludeFuture = useMemo(() => {
        const today = todayISO();
        return end > today;
    }, [end]);
    // Add this new useEffect inside your `Inner` component

    useEffect(() => {
        if (!breakdown) {
            console.log("BREAKDOWN DATA CLEARED");
            return;
        }

        console.group(`[DEBUG] Data updated for Granularity: ${granularity}`);

        // 1. Calculate the total directly from the raw API response
        const rawTotal = (breakdown.rows || []).reduce((sum, row) => sum + row.amount, 0);
        console.log(`%cRAW API Total: $${rawTotal.toFixed(6)}`, "color: blue; font-weight: bold;");
        console.log("Raw breakdown rows:", breakdown.rows);

        // 2. Log the total calculated by your component's logic
        console.log(`%cComponent-Calculated Total: $${total.toFixed(6)}`, "color: green; font-weight: bold;");
        console.log("topTotals used for calculation:", topTotals);

        if (Math.abs(rawTotal - total) > 0.01) {
            console.error("%cMISMATCH DETECTED between raw API total and component total.", "color: red; font-size: 14px;");
        } else {
            console.log("%cTotals appear consistent.", "color: green;");
        }

        console.groupEnd();
    }, [breakdown, total, granularity, topTotals]); // This will run whenever the data or the final total changes
    return (
        <>
            <div className="flex flex-col gap-4">
                <div className="mb-1">
                    <h2 className="text-base font-semibold text-gray-900">Costs Attributions</h2>
                    <p className="text-sm text-gray-600">find in detail costs breakup by your deployment regions, instance type and custom tags</p>
                </div>
                {/* Tabs */}
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        className={`rounded-md px-3 py-2 text-sm font-semibold shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 ${tab === "OVERVIEW" ? "bg-gray-100" : "bg-white"}`}
                        onClick={() => setTab("OVERVIEW")}
                    >
                        Overview
                    </button>
                    <button
                        type="button"
                        className={`rounded-md px-3 py-2 text-sm font-semibold shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 ${tab === "COMPARE" ? "bg-gray-100" : "bg-white"}`}
                        onClick={() => setTab("COMPARE")}
                    >
                        Compare
                    </button>
                </div>

                <div className="flex gap-4">
                    {/* Sidebar */}
                    <aside className="w-95 shrink-0 space-y-4">
                        <div className="p-3 flex flex-col gap-3">
                            {/* Sidebar content switches by tab */}
                            {tab === "OVERVIEW" ? (
                                <>
                                    {/* Date range */}
                                    <ModernDatePicker onApply={handleDateApply} initialStart={start} initialEnd={end} />
                                    {/* Granularity */}
                                    <div>
                                        <div className="text-sm font-semibold mb-2">Granularity</div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                className={`rounded-md px-3 py-2 text-sm font-semibold shadow-xs ring-1 ring-inset hover:bg-gray-50 ${
                                                    granularity === "DAILY" ? "bg-gray-100 ring-gray-400" : "bg-white ring-gray-300"
                                                }`}
                                                onClick={() => setGranularity("DAILY")}
                                            >
                                                Daily
                                            </button>
                                            <button
                                                className={`rounded-md px-3 py-2 text-sm font-semibold shadow-xs ring-1 ring-inset hover:bg-gray-50 ${
                                                    granularity === "MONTHLY" ? "bg-gray-100 ring-gray-400" : "bg-white ring-gray-300"
                                                }`}
                                                onClick={() => setGranularity("MONTHLY")}
                                            >
                                                Monthly
                                            </button>
                                        </div>
                                    </div>
                                    {/* Group By */}
                                    <div>
                                        <div className="text-sm font-semibold mb-2">Group By</div>
                                        <div className="grid grid-cols-3 gap-2">
                                            <button
                                                className={`rounded-md px-3 py-2 text-sm font-semibold shadow-xs ring-1 ring-inset hover:bg-gray-50 ${
                                                    groupBy === "REGION" ? "bg-gray-100 ring-gray-400" : "bg-white ring-gray-300"
                                                }`}
                                                onClick={() => setGroupBy("REGION")}
                                            >
                                                Region
                                            </button>
                                            <button
                                                className={`rounded-md px-3 py-2 text-sm font-semibold shadow-xs ring-1 ring-inset hover:bg-gray-50 ${
                                                    groupBy === "INSTANCE_TYPE" ? "bg-gray-100 ring-gray-400" : "bg-white ring-gray-300"
                                                }`}
                                                onClick={() => setGroupBy("INSTANCE_TYPE")}
                                            >
                                                Instance Type
                                            </button>
                                            <button
                                                className={`rounded-md px-3 py-2 text-sm font-semibold shadow-xs ring-1 ring-inset hover:bg-gray-50 ${
                                                    groupBy === "USAGE_TYPE" ? "bg-gray-100 ring-gray-400" : "bg-white ring-gray-300"
                                                }`}
                                                onClick={() => setGroupBy("USAGE_TYPE")}
                                            >
                                                Usage Type
                                            </button>
                                        </div>
                                    </div>
                                    {/* Chart Type */}
                                    <div>
                                        <div className="text-sm font-semibold mb-2">Chart Type</div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                className={`rounded-md px-3 py-2 text-sm font-semibold shadow-xs ring-1 ring-inset hover:bg-gray-50 ${
                                                    chartType === "bar" ? "bg-gray-100 ring-gray-400" : "bg-white ring-gray-300"
                                                }`}
                                                onClick={() => setChartType("bar")}
                                            >
                                                Bar
                                            </button>
                                            <button
                                                className={`rounded-md px-3 py-2 text-sm font-semibold shadow-xs ring-1 ring-inset hover:bg-gray-50 ${
                                                    chartType === "line" ? "bg-gray-100 ring-gray-400" : "bg-white ring-gray-300"
                                                }`}
                                                onClick={() => setChartType("line")}
                                            >
                                                Line
                                            </button>
                                        </div>
                                    </div>
                                    {/* Top N */}
                                    <div>
                                        <div className="text-sm font-semibold mb-2">Top N</div>
                                        <div className="grid grid-cols-4 gap-2">
                                            {[5, 10, 20].map((n) => (
                                                <button
                                                    key={n}
                                                    className={`rounded-md px-3 py-2 text-sm font-semibold shadow-xs ring-1 ring-inset hover:bg-gray-50 ${
                                                        topN === n ? "bg-gray-100 ring-gray-400" : "bg-white ring-gray-300"
                                                    }`}
                                                    onClick={() => setTopN(n)}
                                                >
                                                    {n}
                                                </button>
                                            ))}
                                            <button
                                                className={`rounded-md px-3 py-2 text-sm font-semibold shadow-xs ring-1 ring-inset hover:bg-gray-50 ${
                                                    topN === "ALL" ? "bg-gray-100 ring-gray-400" : "bg-white ring-gray-300"
                                                }`}
                                                onClick={() => setTopN("ALL")}
                                            >
                                                All
                                            </button>
                                        </div>
                                    </div>
                                    {/* Tag Filters */}
                                    <div>
                                        <div className="text-sm font-semibold mb-2">Filter by Tag</div>
                                        <select className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm" value={activeTagKey} onChange={(e) => setActiveTagKey(e.target.value)}>
                                            {tagKeys.map((k) => (
                                                <option key={k} value={k}>
                                                    {k}
                                                </option>
                                            ))}
                                        </select>

                                        {!!tagValues.length && (
                                            <>
                                                <div className="text-xs text-gray-500 mt-2">Values</div>
                                                <div className="flex flex-wrap gap-2 mt-1">
                                                    {tagValues.slice(0, 40).map((v) => {
                                                        const active = selectedTagValues.includes(v);
                                                        return (
                                                            <button
                                                                key={v}
                                                                className={`rounded-md px-2.5 py-1.5 text-xs font-medium shadow-xs ring-1 ring-inset hover:bg-gray-50 ${
                                                                    active ? "bg-gray-100 ring-gray-400" : "bg-white ring-gray-300"
                                                                }`}
                                                                onClick={() => toggleTagValue(v)}
                                                            >
                                                                {v}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                                {/* <div className="mt-2">
                                                <button
                                                    type="button"
                                                    className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50"
                                                    onClick={() => fetchOverview()}
                                                >
                                                    Apply Filter
                                                </button>
                                                {!!selectedTagValues.length && (
                                                    <button
                                                        type="button"
                                                        className="ml-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50"
                                                        onClick={() => {
                                                            setSelectedTagValues([]);
                                                            fetchOverview();
                                                        }}
                                                    >
                                                        Clear
                                                    </button>
                                                )}
                                            </div> */}
                                            </>
                                        )}
                                    </div>
                                    {/* Dimension Filters shared */}
                                    {/* <div>
                                    <div className="text-sm font-semibold mb-2">Filter by Dimension</div>
                                    <select className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm" value={activeDimKey} onChange={(e) => setActiveDimKey(e.target.value as any)}>
                                        {(["REGION", "INSTANCE_TYPE", "INSTANCE_FAMILY", "USAGE_TYPE"] as const).map((k) => (
                                            <option key={k} value={k}>
                                                {k}
                                            </option>
                                        ))}
                                    </select>
                                    {!!dimValues.length && (
                                        <>
                                            <div className="text-xs text-gray-500 mt-2">Values</div>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {dimValues.slice(0, 40).map((v) => {
                                                    const active = selectedDimValues.includes(v);
                                                    return (
                                                        <button
                                                            key={v}
                                                            className={`rounded-md px-2.5 py-1.5 text-xs font-medium shadow-xs ring-1 ring-inset hover:bg-gray-50 ${
                                                                active ? "bg-gray-100 ring-gray-400" : "bg-white ring-gray-300"
                                                            }`}
                                                            onClick={() => setSelectedDimValues((cur) => (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]))}
                                                        >
                                                            {v}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <div className="mt-2">
                                                <button
                                                    type="button"
                                                    className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50"
                                                    onClick={() => fetchCompare()}
                                                >
                                                    Apply Filter
                                                </button>
                                                {!!selectedDimValues.length && (
                                                    <button
                                                        type="button"
                                                        className="ml-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50"
                                                        onClick={() => {
                                                            setSelectedDimValues([]);
                                                            fetchCompare();
                                                        }}
                                                    >
                                                        Clear
                                                    </button>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div> */}
                                    {/* Dimension Filters */}
                                    {/* <div>
                                    <div className="text-sm font-semibold mb-2">Filter by Dimension</div>
                                    <select className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm" value={activeDimKey} onChange={(e) => setActiveDimKey(e.target.value as any)}>
                                        {(["REGION", "INSTANCE_TYPE", "INSTANCE_FAMILY", "USAGE_TYPE"] as const).map((k) => (
                                            <option key={k} value={k}>
                                                {k}
                                            </option>
                                        ))}
                                    </select>
                                    {!!dimValues.length && (
                                        <>
                                            <div className="text-xs text-gray-500 mt-2">Values</div>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {dimValues.slice(0, 40).map((v) => {
                                                    const active = selectedDimValues.includes(v);
                                                    return (
                                                        <button
                                                            key={v}
                                                            className={`rounded-md px-2.5 py-1.5 text-xs font-medium shadow-xs ring-1 ring-inset hover:bg-gray-50 ${
                                                                active ? "bg-gray-100 ring-gray-400" : "bg-white ring-gray-300"
                                                            }`}
                                                            onClick={() => setSelectedDimValues((cur) => (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]))}
                                                        >
                                                            {v}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <div className="mt-2">
                                                <button
                                                    type="button"
                                                    className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50"
                                                    onClick={() => fetchOverview()}
                                                >
                                                    Apply Filter
                                                </button>
                                                {!!selectedDimValues.length && (
                                                    <button
                                                        type="button"
                                                        className="ml-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50"
                                                        onClick={() => {
                                                            setSelectedDimValues([]);
                                                            fetchOverview();
                                                        }}
                                                    >
                                                        Clear
                                                    </button>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div> */}
                                    {/* Attribution coverage + Summary */}
                                    {/* <div className="mt-2 text-xs text-slate-600">
                                    {summary && (
                                        <div className="mb-1">
                                            Summary total: <b>{fmtUSD(summary.total)}</b>
                                        </div>
                                    )}
                                    {attrCoverage && (
                                        <div>
                                            Coverage for {attrCoverage.tagKey}: <b>{fmtUSD(attrCoverage.attributed)}</b> / {fmtUSD(attrCoverage.total)}
                                        </div>
                                    )}
                                </div> */}
                                </>
                            ) : (
                                <>
                                    {/* Compare sidebar (Month vs Month) */}
                                    <div>
                                        <MonthPicker
                                            initialA={monthA}
                                            initialB={monthB}
                                            onApply={(a, b) => {
                                                setMonthA(a);
                                                setMonthB(b);
                                            }}
                                        />
                                    </div>

                                    {/* Group By for Compare */}
                                    <div>
                                        <div className="text-sm font-semibold mb-2">Group By</div>
                                        <div className="grid grid-cols-3 gap-2">
                                            <button
                                                className={`rounded-md px-3 py-2 text-sm font-semibold shadow-xs ring-1 ring-inset hover:bg-gray-50 ${
                                                    groupBy === "REGION" ? "bg-gray-100 ring-gray-400" : "bg-white ring-gray-300"
                                                }`}
                                                onClick={() => setGroupBy("REGION")}
                                            >
                                                Region
                                            </button>
                                            <button
                                                className={`rounded-md px-3 py-2 text-sm font-semibold shadow-xs ring-1 ring-inset hover:bg-gray-50 ${
                                                    groupBy === "INSTANCE_TYPE" ? "bg-gray-100 ring-gray-400" : "bg-white ring-gray-300"
                                                }`}
                                                onClick={() => setGroupBy("INSTANCE_TYPE")}
                                            >
                                                Instance Type
                                            </button>
                                            <button
                                                className={`rounded-md px-3 py-2 text-sm font-semibold shadow-xs ring-1 ring-inset hover:bg-gray-50 ${
                                                    groupBy === "USAGE_TYPE" ? "bg-gray-100 ring-gray-400" : "bg-white ring-gray-300"
                                                }`}
                                                onClick={() => setGroupBy("USAGE_TYPE")}
                                            >
                                                Usage Type
                                            </button>
                                        </div>
                                    </div>

                                    {/* Chart Type */}
                                    <div>
                                        <div className="text-sm font-semibold mb-2">Chart Type</div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                className={`rounded-md px-3 py-2 text-sm font-semibold shadow-xs ring-1 ring-inset hover:bg-gray-50 ${
                                                    chartType === "bar" ? "bg-gray-100 ring-gray-400" : "bg-white ring-gray-300"
                                                }`}
                                                onClick={() => setChartType("bar")}
                                            >
                                                Bar
                                            </button>
                                            <button
                                                className={`rounded-md px-3 py-2 text-sm font-semibold shadow-xs ring-1 ring-inset hover:bg-gray-50 ${
                                                    chartType === "line" ? "bg-gray-100 ring-gray-400" : "bg-white ring-gray-300"
                                                }`}
                                                onClick={() => setChartType("line")}
                                            >
                                                Line
                                            </button>
                                        </div>
                                    </div>

                                    {/* Tag Filters shared */}
                                    <div>
                                        <div className="text-sm font-semibold mb-2">Filter by Tag</div>
                                        <select className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm" value={activeTagKey} onChange={(e) => setActiveTagKey(e.target.value)}>
                                            {tagKeys.map((k) => (
                                                <option key={k} value={k}>
                                                    {k}
                                                </option>
                                            ))}
                                        </select>

                                        {!!tagValues.length && (
                                            <>
                                                <div className="text-xs text-gray-500 mt-2">Values</div>
                                                <div className="flex flex-wrap gap-2 mt-1">
                                                    {tagValues.slice(0, 40).map((v) => {
                                                        const active = selectedTagValues.includes(v);
                                                        return (
                                                            <button
                                                                key={v}
                                                                className={`rounded-md px-2.5 py-1.5 text-xs font-medium shadow-xs ring-1 ring-inset hover:bg-gray-50 ${
                                                                    active ? "bg-gray-100 ring-gray-400" : "bg-white ring-gray-300"
                                                                }`}
                                                                onClick={() => toggleTagValue(v)}
                                                            >
                                                                {v}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                                {/* <div className="mt-2">
                                                <button
                                                    type="button"
                                                    className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50"
                                                    onClick={() => fetchCompare()}
                                                >
                                                    Apply Filter
                                                </button>
                                                {!!selectedTagValues.length && (
                                                    <button
                                                        type="button"
                                                        className="ml-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50"
                                                        onClick={() => {
                                                            setSelectedTagValues([]);
                                                            fetchCompare();
                                                        }}
                                                    >
                                                        Clear
                                                    </button>
                                                )}
                                            </div> */}
                                            </>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </aside>

                    {/* Main content */}
                    <main className="flex-1 space-y-4">
                        {tab === "OVERVIEW" ? (
                            <>
                                {/* Selected Tag Filters */}
                                {!!selectedTagValues.length && (
                                    <div className="flex items-center flex-wrap gap-2 text-xs text-slate-600">
                                        <span className="font-semibold">Tag: {activeTagKey}</span>
                                        {selectedTagValues.map((v) => (
                                            <FilterPill key={v} label={v} onRemove={() => toggleTagValue(v)} />
                                        ))}
                                    </div>
                                )}
                                {/* Chart */}
                                <div className="w-full relative" style={{ height: 420 }}>
                                    {beyondToday && (
                                        <div className="absolute top-0 left-0 right-0 text-center text-xs text-slate-600 border-t border-dashed border-slate-400 py-1 bg-white/70">
                                            Dates in the future are estimated based on trends
                                        </div>
                                    )}
                                    <div className={beyondToday ? "pt-6 h-full" : "h-full"}>
                                        {(() => {
                                            const today = todayISO();
                                            const isFutureIdx = (idx: number) => {
                                                const d = labels[idx];
                                                return d > today;
                                            };
                                            if (chartType === "line") {
                                                // Add dotted segments for future dates
                                                const lineData = {
                                                    labels,
                                                    datasets: (datasets as any).map((ds: any) => ({
                                                        ...ds,
                                                        segment: {
                                                            borderDash: (ctx: any) => (isFutureIdx(ctx.p1DataIndex) ? [4, 4] : undefined),
                                                        },
                                                    })),
                                                };
                                                return (
                                                    <Line
                                                        data={lineData}
                                                        options={{
                                                            maintainAspectRatio: false,
                                                            plugins: { legend: { position: "bottom" } },
                                                            scales: { y: { beginAtZero: true } },
                                                            interaction: { mode: "index", intersect: false },
                                                            elements: { point: { radius: 2 } },
                                                        }}
                                                    />
                                                );
                                            }
                                            // Bar: outline-only for future bars
                                            const barData = {
                                                labels,
                                                datasets: (datasets as any).map((ds: any, i: number) => ({
                                                    label: ds.label,
                                                    data: ds.data,
                                                    backgroundColor: labels.map((_: any, idx: number) => (isFutureIdx(idx) ? "rgba(0,0,0,0)" : COLORS[i % COLORS.length])),
                                                    borderColor: labels.map((_: any, idx: number) => (isFutureIdx(idx) ? "#94a3b8" : COLORS[i % COLORS.length])), // slate-400
                                                    borderWidth: labels.map((_: any, idx: number) => (isFutureIdx(idx) ? 2 : 0)),
                                                })),
                                            } as any;
                                            return (
                                                <Bar
                                                    data={barData}
                                                    options={{
                                                        maintainAspectRatio: false,
                                                        plugins: { legend: { position: "bottom" } },
                                                        scales: { x: { ticks: { maxRotation: 30, minRotation: 0 } }, y: { beginAtZero: true } },
                                                        interaction: { mode: "index", intersect: false },
                                                    }}
                                                />
                                            );
                                        })()}
                                    </div>
                                </div>

                                {/* Table */}
                                <div className="px-4 sm:px-6 lg:px-8">
                                    <div className="mt-8 flow-root">
                                        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                                            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                                                <div className="max-h-96 overflow-y-auto">
                                                    <table className="relative min-w-full divide-y divide-gray-300">
                                                        <thead>
                                                            <tr>
                                                                <th scope="col" className="py-3.5 pr-3 pl-4 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                                                                    {groupBy.split("_").join(" ")}
                                                                </th>
                                                                <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                                                                    Cost
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-200 bg-white">
                                                            {topTotals.map((s, i) => {
                                                                const isMaxAboveAvg = s.value === maxValue && s.value > avgValue;
                                                                return (
                                                                    <tr key={s.name} className={isMaxAboveAvg ? "bg-red-50/40" : undefined}>
                                                                        <td className="py-5 pr-3 pl-4 text-sm text-gray-900 whitespace-nowrap sm:pl-0">
                                                                            <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ background: COLORS[i % COLORS.length] }} />
                                                                            {s.name}
                                                                        </td>
                                                                        <td className={`px-3 py-5 text-sm whitespace-nowrap text-right ${isMaxAboveAvg ? "text-red-600 font-semibold" : "text-gray-900"}`}>
                                                                            {fmtUSD(s.value)}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                            <tr className="bg-gray-50">
                                                                <td className="py-5 pr-3 pl-4 text-sm font-semibold text-gray-900 whitespace-nowrap sm:pl-0">Total</td>
                                                                <td className="px-3 py-5 text-sm whitespace-nowrap text-gray-900 text-right font-semibold">{fmtUSD(total)}</td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Selected Tag Filters */}
                                {!!selectedTagValues.length && (
                                    <div className="flex items-center flex-wrap gap-2 text-xs text-slate-600">
                                        <span className="font-semibold">Tag: {activeTagKey}</span>
                                        {selectedTagValues.map((v) => (
                                            <FilterPill key={v} label={v} onRemove={() => toggleTagValue(v)} />
                                        ))}
                                    </div>
                                )}
                                {/* Compare Chart */}
                                {(() => {
                                    const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
                                    const futureA = monthA > currentMonth;
                                    const futureB = monthB > currentMonth;
                                    const showBanner = futureA || futureB;
                                    return (
                                        <div className="w-full relative" style={{ height: 420 }}>
                                            {showBanner && (
                                                <div className="absolute top-0 left-0 right-0 text-center text-xs text-slate-600 border-t border-dashed border-slate-400 py-1 bg-white/70">
                                                    Future months are estimated based on trends
                                                </div>
                                            )}
                                            <div className={showBanner ? "pt-6 h-full" : "h-full"}>
                                                {chartType === "line" ? (
                                                    <Line
                                                        data={{
                                                            labels: compareBarData.labels,
                                                            datasets: (compareBarData.datasets as any).map((ds: any) => ({
                                                                ...ds,
                                                                segment: {
                                                                    borderDash: () => ((ds.label === monthA && futureA) || (ds.label === monthB && futureB) ? [4, 4] : undefined),
                                                                },
                                                            })),
                                                        }}
                                                        options={{
                                                            maintainAspectRatio: false,
                                                            plugins: { legend: { position: "bottom" } },
                                                            scales: { y: { beginAtZero: true } },
                                                            interaction: { mode: "index", intersect: false },
                                                            elements: { point: { radius: 2 } },
                                                        }}
                                                    />
                                                ) : (
                                                    <Bar
                                                        data={{
                                                            labels: compareBarData.labels,
                                                            datasets: (compareBarData.datasets as any).map((ds: any, idx: number) => {
                                                                const isFuture = (ds.label === monthA && futureA) || (ds.label === monthB && futureB);
                                                                const color = COLORS[idx % COLORS.length];
                                                                return {
                                                                    ...ds,
                                                                    backgroundColor: isFuture ? "rgba(0,0,0,0)" : color,
                                                                    borderColor: isFuture ? "#94a3b8" : color,
                                                                    borderWidth: isFuture ? 2 : 0,
                                                                };
                                                            }),
                                                        }}
                                                        options={{
                                                            maintainAspectRatio: false,
                                                            plugins: { legend: { position: "bottom" } },
                                                            scales: { x: { ticks: { maxRotation: 30, minRotation: 0 } }, y: { beginAtZero: true } },
                                                            interaction: { mode: "index", intersect: false },
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Compare Table */}
                                <div className="px-4 sm:px-6 lg:px-8">
                                    <div className="mt-8 flow-root">
                                        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                                            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                                                <div className="max-h-96 overflow-y-auto">
                                                    <table className="relative min-w-full divide-y divide-gray-300">
                                                        <thead>
                                                            <tr>
                                                                <th className="py-3.5 pr-3 pl-4 text-left text-sm font-semibold text-gray-900 sm:pl-0">{groupBy}</th>
                                                                <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">{monthA}</th>
                                                                <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">{monthB}</th>
                                                                <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Δ</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-200 bg-white">
                                                            {allGroups.map((g, i) => {
                                                                const a = mapA.get(g) ?? 0;
                                                                const b = mapB.get(g) ?? 0;
                                                                const d = b - a;
                                                                return (
                                                                    <tr key={g}>
                                                                        <td className="py-5 pr-3 pl-4 text-sm text-gray-900 whitespace-nowrap sm:pl-0">
                                                                            <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ background: COLORS[i % COLORS.length] }} />
                                                                            {g}
                                                                        </td>
                                                                        <td className="px-3 py-5 text-sm whitespace-nowrap text-gray-900 text-right">{fmtUSD(a)}</td>
                                                                        <td className="px-3 py-5 text-sm whitespace-nowrap text-gray-900 text-right">{fmtUSD(b)}</td>
                                                                        <td className={`px-3 py-5 text-sm whitespace-nowrap text-right ${d >= 0 ? "text-green-600" : "text-red-600"}`}>
                                                                            {d >= 0 ? "▲" : "▼"} {fmtUSD(Math.abs(d))}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                            <tr className="bg-gray-50">
                                                                <td className="py-5 pr-3 pl-4 text-sm font-semibold text-gray-900 whitespace-nowrap sm:pl-0">Total</td>
                                                                <td className="px-3 py-5 text-sm whitespace-nowrap text-gray-900 text-right font-semibold">{fmtUSD(totalsA.reduce((s, x) => s + x.value, 0))}</td>
                                                                <td className="px-3 py-5 text-sm whitespace-nowrap text-gray-900 text-right font-semibold">{fmtUSD(totalsB.reduce((s, x) => s + x.value, 0))}</td>
                                                                <td className="px-3 py-5 text-sm whitespace-nowrap text-gray-900 text-right font-semibold">
                                                                    {fmtUSD(totalsB.reduce((s, x) => s + x.value, 0) - totalsA.reduce((s, x) => s + x.value, 0))}
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </main>
                </div>
            </div>
            {/* Cost Attributions container */}
            <div className="mt-6">
                <section className="rounded-xl border border-gray-200 p-4">
                    <div className="mb-2">
                        <h3 className="text-sm font-semibold text-gray-900">Cost Breakdowns</h3>
                        <p className="text-xs text-gray-600">Breakdown of costs by the selected tag from the sidebar.</p>
                    </div>
                    {!activeTagKey ? (
                        <div className="text-xs text-gray-500">Select a Tag key in the sidebar to see attribution breakdown.</div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Left column: Tag table */}
                            <section className="rounded-xl border border-gray-200 p-4">
                                <div className="text-xs text-gray-600 mb-2">
                                    Tag: <b>{activeTagKey}</b>
                                    {attrCoverage && (
                                        <>
                                            <span className="mx-2 text-gray-400">•</span>
                                            Attributed {fmtUSD(attrCoverage.attributed)} of {fmtUSD(attrCoverage.total)}
                                        </>
                                    )}
                                </div>
                                {attrCoverage ? (
                                    <div className="max-h-72 overflow-y-auto border rounded-lg">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="py-3.5 pr-3 pl-4 text-left text-xs font-semibold text-gray-900 sm:pl-6">Value</th>
                                                    <th className="px-3 py-3.5 text-right text-xs font-semibold text-gray-900">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 bg-white">
                                                {(() => {
                                                    const rows = attrCoverage.breakdown.slice().sort((a, b) => b.amount - a.amount);
                                                    const maxVal = rows.length ? Math.max(...rows.map((r) => r.amount)) : 0;
                                                    return rows.map((row) => {
                                                        const isMax = row.amount === maxVal;
                                                        return (
                                                            <tr key={row.key}>
                                                                <td className="py-3 pr-3 pl-4 text-sm text-gray-900 whitespace-nowrap sm:pl-6">{row.key || "(untagged)"}</td>
                                                                <td className={`px-3 py-3 text-sm whitespace-nowrap text-right ${isMax ? "text-red-600 font-semibold" : "text-gray-900"}`}>{fmtUSD(row.amount)}</td>
                                                            </tr>
                                                        );
                                                    });
                                                })()}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-xs text-gray-500">Loading attribution…</div>
                                )}
                            </section>

                            {/* Right column: Attribution summary */}
                            <section className="rounded-xl border border-gray-200 p-4">
                                {attrCoverage && (
                                    <div className="space-y-3">
                                        <div>
                                            <div className="text-sm font-semibold text-gray-800">Attribution for Tag: '{attrCoverage.tagKey}'</div>
                                            <div className="text-xs text-gray-500">Total cost for the selected period.</div>
                                        </div>
                                        <div className="flex justify-between items-baseline">
                                            <span className="text-sm font-medium text-gray-600">Total</span>
                                            <span className="text-lg font-semibold text-gray-900">{fmtUSD(attrCoverage.total)}</span>
                                        </div>
                                        <div className="w-full flex h-3 rounded-full overflow-hidden bg-gray-200">
                                            <div
                                                className="bg-sky-500"
                                                style={{ width: `${(attrCoverage.attributed / Math.max(1, attrCoverage.total)) * 100}%` }}
                                                title={`Attributed: ${fmtUSD(attrCoverage.attributed)}`}
                                            ></div>
                                            <div
                                                className="bg-slate-400"
                                                style={{ width: `${(attrCoverage.unaccounted / Math.max(1, attrCoverage.total)) * 100}%` }}
                                                title={`Unaccounted: ${fmtUSD(attrCoverage.unaccounted)}`}
                                            ></div>
                                        </div>
                                        <div className="space-y-2 text-xs">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-sky-500"></div>
                                                    <span className="text-gray-700">Attributed</span>
                                                </div>
                                                <span className="font-medium text-gray-800">{fmtUSD(attrCoverage.attributed)}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                                                    <span className="text-gray-700">Unaccounted</span>
                                                </div>
                                                <span className="font-medium text-gray-800">{fmtUSD(attrCoverage.unaccounted)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </section>
                        </div>
                    )}
                </section>
            </div>
        </>
    );
}

export default function CostExplorerChart() {
    return (
        <CostProvider>
            <Inner />
        </CostProvider>
    );
}
