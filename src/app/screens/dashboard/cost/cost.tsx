"use client";

import CompareChart from "@/app/screens/dashboard/cost/compare-chart";
import CompareTable from "@/app/screens/dashboard/cost/compare-table";
import CostOverview from "@/app/screens/dashboard/cost/cost-overview";
import CostSidebar from "@/app/screens/dashboard/cost/sidebar/cost-sidebar";
import { addDays, last30, todayISO } from "@/app/utils/helpers";
import { FilterPill } from "@/components/filter-pill";
import { CostProvider, useCost } from "@/context/cost-context";
import type { BreakdownRow, CostAttribution, CostBreakdown, CostSummary, Tab } from "@/types/cost/cost";
import { ReactElement, useEffect, useMemo, useState } from "react";
import CostAttributionSection from "./cost-attribution-section";
import { FilterProvider, useFilterSettings } from "./filter-context";
import { Header } from "./header";
import { CostViewSettingsProvider, useCostViewSettings } from "./view-settings-context";

type InnerProps = { start: string; end: string; setStart: (s: string) => void; setEnd: (e: string) => void };

const Inner: React.FC<InnerProps> = ({ start, end, setStart, setEnd }): ReactElement => {
    const { getBreakdown, getTags, getDimensions, getAttribution, getSummary } = useCost();

    const [tab, setTab] = useState<Tab>("OVERVIEW");
    const { groupBy, granularity, topN, chartType, setTopN } = useCostViewSettings();

    const [breakdown, setBreakdown] = useState<CostBreakdown | null>(null);

    const { activeTagKey, activeDimKey, selectedTagValues, setSelectedTagValues, filters } = useFilterSettings();

    const [attrCoverage, setAttrCoverage] = useState<CostAttribution | null>(null);
    const [summary, setSummary] = useState<CostSummary | null>(null);

    const yyyymm = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const [monthA, setMonthA] = useState<string>(yyyymm());
    const [monthB, setMonthB] = useState<string>(yyyymm(new Date(new Date().setMonth(new Date().getMonth() - 1))));
    const [compareA, setCompareA] = useState<CostBreakdown | null>(null);
    const [compareB, setCompareB] = useState<CostBreakdown | null>(null);

    const fetchOverview = async () => {
        const apiEnd = granularity === "DAILY" ? addDays(end, 1) : end;
        const br = await getBreakdown({
            groupBy: [groupBy],
            metric: "UnblendedCost",
            granularity,
            start,
            end: apiEnd,
            includeFuture: shouldIncludeFuture,
            filters,
        });
        setBreakdown(br);
    };

    const monthToRange = (m: string) => {
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
                filters,
            }),
            getBreakdown({
                groupBy: [groupBy],
                metric: "UnblendedCost",
                granularity: "MONTHLY",
                start: rb.start,
                end: rb.end,
                filters,
            }),
        ]);
        setCompareA(aRes);
        setCompareB(bRes);
    };

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

    useEffect(() => {
        (async () => {
            const apiEnd = granularity === "DAILY" ? addDays(end, 1) : end;
            const res = await getSummary({ start, end: apiEnd, granularity, metric: "UnblendedCost", includeFuture: shouldIncludeFuture });
            setSummary(res);
        })();
    }, [start, end, granularity]);

    useEffect(() => {
        if (tab === "OVERVIEW") fetchOverview();
    }, [tab, groupBy, granularity, start, end, activeTagKey, selectedTagValues]);

    useEffect(() => {
        if (tab === "COMPARE") fetchCompare();
    }, [tab, groupBy, monthA, monthB, activeTagKey, selectedTagValues]);

    const handleDateApply = (s: string, e: string) => {
        setStart(s);
        setEnd(e);
    };

    const setSelectedTagValuesSafe = (vals: string[]) => {
        const unique = Array.from(new Set(vals));
        setSelectedTagValues(unique);
    };

    const { labels, datasets, topTotals } = useMemo(() => buildLineSeries(breakdown?.rows ?? [], topN === "ALL" ? Number.MAX_SAFE_INTEGER : topN), [breakdown, topN]);

    const maxTopSelectable = useMemo(() => {
        const totalGroups = topTotals.length || 1;
        return Math.min(100, Math.max(1, totalGroups));
    }, [topTotals]);
    const total = useMemo(() => topTotals.reduce((s, d) => s + d.value, 0), [topTotals]);

    const { maxValue, avgValue } = useMemo(() => {
        if (!topTotals.length) return { maxValue: 0, avgValue: 0 };
        const vals = topTotals.map((t) => t.value);
        const maxValue = Math.max(...vals);
        const avgValue = vals.reduce((a, b) => a + b, 0) / vals.length;
        return { maxValue, avgValue };
    }, [topTotals]);
    const beyondToday = useMemo(() => end > todayISO(), [end]);

    // Derived data
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

    return (
        <>
            <div className="flex flex-col gap-4">
                <Header setTab={setTab} tab={tab} />
                <div className="flex gap-4">
                    {/* Sidebar */}
                        <CostSidebar
                            tab={tab}
                            start={start}
                            end={end}
                            onApplyDateRange={handleDateApply}
                            maxTopSelectable={maxTopSelectable}
                            monthA={monthA}
                            monthB={monthB}
                            onApplyMonths={(a: string, b: string) => {
                                setMonthA(a);
                                setMonthB(b);
                            }}
                        />

                    {/* Main content */}
                    <main className="flex-1 space-y-4">
                        {tab === "OVERVIEW" ? (
                            <>
                                {!!selectedTagValues.length && (
                                    <div className="flex items-center flex-wrap gap-2 text-xs text-slate-600">
                                        <span className="font-semibold">Tag: {activeTagKey}</span>
                                        {selectedTagValues.map((v: string) => (
                                            <FilterPill key={v} label={v} onRemove={() => setSelectedTagValuesSafe(selectedTagValues.filter((x: string) => x !== v))} />
                                        ))}
                                    </div>
                                )}
                                <CostOverview
                                    labels={labels}
                                    datasets={datasets as any}
                                    colors={COLORS}
                                    endISO={end}
                                    groupByLabel={groupBy.split("_").join(" ")}
                                    topTotals={topTotals}
                                    total={total}
                                    maxValue={maxValue}
                                    avgValue={avgValue}
                                />
                            </>
                        ) : (
                            <>
                                {/* Selected Tag Filters */}
                                {!!selectedTagValues.length && (
                                    <div className="flex items-center flex-wrap gap-2 text-xs text-slate-600">
                                        <span className="font-semibold">Tag: {activeTagKey}</span>
                                        {selectedTagValues.map((v: string) => (
                                            <FilterPill key={v} label={v} onRemove={() => setSelectedTagValuesSafe(selectedTagValues.filter((x: string) => x !== v))} />
                                        ))}
                                    </div>
                                )}
                                {/* Compare Chart */}
                                <CompareChart labels={compareBarData.labels} datasets={compareBarData.datasets as any} colors={COLORS} monthA={monthA} monthB={monthB} />

                                {/* Compare Table */}
                                <CompareTable groupByLabel={groupBy} monthA={monthA} monthB={monthB} totalsA={totalsA} totalsB={totalsB} colors={COLORS} />
                            </>
                        )}
                    </main>
                </div>
            </div>
            {/* Cost Attributions container */}
            <CostAttributionSection activeTagKey={activeTagKey} activeDimKey={activeDimKey} attrCoverage={attrCoverage} />
        </>
    );
};

export default function CostExplorerChart() {
    const [start, setStart] = useState<string>(last30().start);
    const [end, setEnd] = useState<string>(last30().end);
    return (
        <CostProvider>
            <CostViewSettingsProvider>
                <GranularityBridge start={start} end={end}>
                    <Inner start={start} end={end} setStart={setStart} setEnd={setEnd} />
                </GranularityBridge>
            </CostViewSettingsProvider>
        </CostProvider>
    );
}

function GranularityBridge({ start, end, children }: { start: string; end: string; children: React.ReactNode }) {
    const { granularity } = useCostViewSettings();
    return (
        <FilterProvider start={start} end={end} granularity={granularity}>
            {children}
        </FilterProvider>
    );
}

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
