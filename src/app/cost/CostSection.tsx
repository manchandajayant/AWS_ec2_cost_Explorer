"use client";
import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, Filler, Legend, LinearScale, LineElement, PointElement, Title, Tooltip, type ChartData, type ChartOptions } from "chart.js";
import { addDays } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { Bar, Line, Pie } from "react-chartjs-2";

import { FilterPill } from "@/components/FilterPill";
import type { FilterClause, GroupKey } from "@/context/CostExplorerContext";
import { CostExplorerProvider, useCostExplorer } from "@/context/CostExplorerContext";
import { Header } from "./header";
import { SkeletonLoader } from "./skeleton";
import type { ChartTypeOpt, CostSidebarProps, GranularityOpt, MainContentProps } from "./types";

// Register Chart.js once
ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler);

/* ------------------------------ Sidebar ------------------------------ */

const CostSidebar = ({ granularity, setGranularity, setRange, start, end, groupBy, setGroupBy, chartType, setChartType, filters, setFilters, listValues, listTagKeys }: CostSidebarProps) => {
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);

    // Sync local datepicker state from context (context end is exclusive)
    useEffect(() => {
        if (start) setStartDate(new Date(start));
        if (end) setEndDate(addDays(new Date(end), -1));
    }, [start, end]);

    const CHART_TYPES: ChartTypeOpt[] = ["Line", "Bar", "Pie"];

    return (
        <aside className="w-90 bg-slate-50 border-r border-slate-200 p-4 space-y-6">
            <div className="space-y-4">
                <h3 className="font-bold text-slate-800 text-sm">Report parameters</h3>
                {/* Granularity */}
                <div>
                    <label className="text-xs font-bold text-slate-600">Granularity</label>
                    <div className="mt-1 grid grid-cols-2 gap-px rounded-md border border-slate-300">
                        {["DAILY", "MONTHLY"].map((g) => (
                            <button
                                key={g}
                                onClick={() => setGranularity(g as GranularityOpt)}
                                className={`px-2 py-1 text-sm ${granularity === (g as GranularityOpt) ? "bg-slate-700 text-white" : "bg-white hover:bg-slate-100"} first:rounded-l-sm last:rounded-r-sm`}
                            >
                                {g}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Unified Date Range (native inputs) */}
                <div>
                    <label className="text-xs font-bold text-slate-600">Date range</label>
                    <div className="mt-1 flex items-center gap-2">
                        <input
                            type="date"
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-md shadow-sm bg-white text-sm"
                            value={startDate ? startDate.toISOString().slice(0, 10) : ""}
                            onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)}
                        />
                        <span className="text-slate-500 text-sm">to</span>
                        <input
                            type="date"
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-md shadow-sm bg-white text-sm"
                            value={endDate ? endDate.toISOString().slice(0, 10) : ""}
                            onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
                        />
                    </div>
                    <div className="mt-2 flex justify-end">
                        <button
                            onClick={() => {
                                if (startDate && endDate) {
                                    const endExclusive = addDays(endDate, 1);
                                    setRange(startDate.toISOString().slice(0, 10), endExclusive.toISOString().slice(0, 10));
                                }
                            }}
                            className="px-3 py-1.5 text-sm border border-slate-300 rounded-md bg-white hover:bg-slate-50"
                        >
                            Apply
                        </button>
                    </div>
                </div>

                {/* Chart Type: Line / Bar / Pie only */}
                <div>
                    <label className="text-xs font-bold text-slate-600">Chart type</label>
                    <div className="mt-1 grid grid-cols-3 gap-px rounded-md border border-slate-300">
                        {CHART_TYPES.map((c) => (
                            <button
                                key={c}
                                onClick={() => setChartType(c as ChartTypeOpt)}
                                className={`px-2 py-1 text-sm truncate ${chartType === c ? "bg-slate-700 text-white" : "bg-white hover:bg-slate-100"} first:rounded-l-sm last:rounded-r-sm`}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Group by: single choice (Instance Type OR Region) */}
                <div>
                    <label className="text-xs font-bold text-slate-600">Group by</label>
                    <div className="mt-1 grid grid-cols-2 gap-px rounded-md border border-slate-300">
                        {[
                            { label: "Instance Type", key: "INSTANCE_TYPE" as GroupKey },
                            { label: "Region", key: "REGION" as GroupKey },
                        ].map((opt) => (
                            <button
                                key={opt.key}
                                onClick={() => setGroupBy([opt.key])}
                                className={`px-2 py-1 text-sm truncate ${(groupBy || [])[0] === opt.key ? "bg-slate-700 text-white" : "bg-white hover:bg-slate-100"} first:rounded-l-sm last:rounded-r-sm`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">Choose exactly one: Instance Type or Region.</p>
                </div>
            </div>
        </aside>
    );
};

/* --------------------------- Overlay helper -------------------------- */
/**
 * Returns a filled-line overlay series when filters include a TAG of 'project' or 'team'.
 * Expects optional data.tagOverlays[project|team][value] = { timeSeries: [{date, amount}, ...] }.
 * If unavailable or length-mismatch, overlay is omitted.
 */
function getTagOverlaySeries(data: any, filters: FilterClause[] | undefined): { label: string; series: number[] } | null {
    try {
        if (!filters?.length || !data) return null;
        const tagFilter = filters.find((f) => f.type === "TAG" && ["project", "team"].includes(String(f.key).toLowerCase()) && f.values.length > 0);
        if (!tagFilter) return null;

        const tagKey = String(tagFilter.key).toLowerCase();
        const tagVal = tagFilter.values[0];
        const overlayRoot = data?.tagOverlays?.[tagKey]?.[tagVal];

        const baseLen = data?.groups?.[0]?.timeSeries?.length ?? 0;
        const overlaySeries = overlayRoot?.timeSeries?.map((t: any) => t.amount);
        if (!overlaySeries || overlaySeries.length !== baseLen) return null;

        return { label: `${tagKey}:${tagVal}`, series: overlaySeries };
    } catch {
        return null;
    }
}

/* ---------------------------- Main Content --------------------------- */

const MainContent = ({ loading, data, chartType, filters, setFilters }: MainContentProps) => {
    const { groupBy, setGroupBy, start, end, granularity, filters: ctxFilters, listTagKeys, listValues } = useCostExplorer();
    const totalCost: number = data?.totalAmount || 0;

    const labels: string[] = useMemo(
        () =>
            data?.groups?.[0]?.timeSeries?.map((ts: any) =>
                new Date(ts.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                })
            ) || [],
        [data]
    );

    const palette = ["#1d4ed8", "#16a34a", "#f97316", "#c026d3", "#64748b", "#0891b2", "#a16207"];

    // Nested breakdown when grouping by REGION: fetch REGION+INSTANCE_TYPE and aggregate by family
    const [regionFamilyBreakdown, setRegionFamilyBreakdown] = useState<Record<string, { family: string; amount: number }[]>>({});
    const primaryGrouping = (groupBy || [])[0];

    console.log(data);

    // Base chart options (hide axes for Pie)
    const chartOptions: ChartOptions<"line" | "bar" | "pie"> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "bottom" } },
        scales:
            chartType === "Pie"
                ? undefined
                : {
                      x: { grid: { display: false } as any },
                      y: { grid: { borderDash: [4, 4] } as any },
                  },
    };

    // DATA: Line with optional TAG overlay as area
    const lineData: ChartData<"line"> = useMemo(() => {
        const base = {
            labels,
            datasets: (data?.groups || []).map((g: any, i: number) => ({
                label: g.key,
                data: g.timeSeries.map((ts: any) => ts.amount),
                borderColor: palette[i % palette.length],
                backgroundColor: `${palette[i % palette.length]}33`,
                fill: false,
                tension: 0.3,
            })),
        } as ChartData<"line">;

        const ov = getTagOverlaySeries(data, filters);
        if (ov) {
            (base.datasets as any).push({
                type: "line",
                label: ov.label,
                data: ov.series,
                borderColor: "#0ea5e9",
                backgroundColor: "#0ea5e955",
                fill: true, // area
                tension: 0.25,
            });
        }
        return base;
    }, [data, labels, filters]);

    // DATA: Bar with optional TAG overlay as area line
    const barData: ChartData<"bar"> = useMemo(() => {
        const base: any = {
            labels,
            datasets: (data?.groups || []).map((g: any, i: number) => ({
                label: g.key,
                data: g.timeSeries.map((ts: any) => ts.amount),
                backgroundColor: palette[i % palette.length],
                borderColor: palette[i % palette.length],
                borderWidth: 1,
            })),
        };

        const ov = getTagOverlaySeries(data, filters);
        if (ov) {
            base.datasets.push({
                type: "line",
                label: ov.label,
                data: ov.series,
                borderColor: "#0ea5e9",
                backgroundColor: "#0ea5e955",
                fill: true, // render as area over bars
                tension: 0.25,
                yAxisID: "y",
            });
        }
        return base as ChartData<"bar">;
    }, [data, labels, filters]);

    // DATA: Pie (totals per group)
    const pieData: ChartData<"pie"> = useMemo(
        () =>
            ({
                labels: (data?.groups || []).map((g: any) => g.key),
                datasets: [
                    {
                        data: (data?.groups || []).map((g: any) => g.amount),
                        backgroundColor: (data?.groups || []).map((_: any, i: number) => palette[i % palette.length]),
                    },
                ],
            } as ChartData<"pie">),
        [data]
    );

    return (
        <main className="flex-1 bg-white p-6 overflow-auto">
            {/* Active filter chips */}
            {(filters as any)?.length > 0 && (
                <div className="mb-3 flex items-center flex-wrap gap-2">
                    <span className="text-xs font-medium text-slate-600">Filtered by:</span>
                    {(filters as FilterClause[]).map((f, index) => (
                        <FilterPill key={index} label={`${f.type === "TAG" ? `tag:${f.key}` : f.key}: ${f.values.join(", ")}`} onRemove={() => setFilters?.((filters as FilterClause[]).filter((_, i) => i !== index))} />
                    ))}
                </div>
            )}

            <div className="border border-slate-200 rounded-md p-4 h-96">
                {loading ? (
                    <SkeletonLoader type="chart" />
                ) : chartType === "Line" ? (
                    <Line data={lineData} options={chartOptions as any} />
                ) : chartType === "Bar" ? (
                    <Bar data={barData} options={chartOptions as any} />
                ) : (
                    <Pie data={pieData} options={chartOptions as any} />
                )}
            </div>

            {/* Tabular results matching the chart */}
            <div className="mt-6 border border-slate-200 rounded-md">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-800">Results</h3>
                    <span className="text-xs text-slate-600">Total: {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(totalCost)}</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Group</th>
                                <th className="px-4 py-2 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">Cost</th>
                                <th className="px-4 py-2 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">% of Total</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {(data?.groups || [])
                                .slice()
                                .sort((a: any, b: any) => (b.amount || 0) - (a.amount || 0))
                                .flatMap((g: any, idx: number) => {
                                    if (primaryGrouping !== "REGION") {
                                        return [
                                            <tr key={`row-${idx}`} className="hover:bg-slate-50">
                                                <td className="px-4 py-3 whitespace-nowrap text-slate-800">{g.key}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-slate-800 text-right font-mono">
                                                    {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(g.amount || 0)}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-slate-500 text-right">{totalCost > 0 ? (((g.amount || 0) / totalCost) * 100).toFixed(1) : "0.0"}%</td>
                                            </tr>,
                                        ];
                                    }
                                    const region = g.key as string;
                                    const rows: any[] = [
                                        <tr key={`region-${idx}`} className="bg-slate-50/50">
                                            <td className="px-4 py-3 whitespace-nowrap text-slate-900 font-semibold">{region}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-slate-900 text-right font-mono">
                                                {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(g.amount || 0)}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-slate-600 text-right">{totalCost > 0 ? (((g.amount || 0) / totalCost) * 100).toFixed(1) : "0.0"}%</td>
                                        </tr>,
                                    ];
                                    return rows;
                                })}
                        </tbody>
                        <tfoot className="bg-slate-100 font-bold">
                            <tr>
                                <td className="px-4 py-3 text-slate-900">Total</td>
                                <td className="px-4 py-3 text-slate-900 text-right font-mono">{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(totalCost)}</td>
                                <td className="px-4 py-3 text-slate-500 text-right">100.0%</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </main>
    );
};

/* ----------------------------- Wrapper ------------------------------- */

const CostExplorerWired = () => {
    const {
        loading,
        data,
        start,
        end,
        granularity,
        setGranularity, // currently unused here; retained for future
        setRange,
        groupBy,
        setGroupBy,
        filters,
        setFilters,
        listValues,
        listTagKeys,
    } = useCostExplorer();

    const [chartType, setChartType] = useState<ChartTypeOpt>("Line");
    console.log("data", data);
    return (
        <div className="min-h-screen bg-slate-100 font-sans">
            <Header />
            <div className="flex" style={{ height: "calc(100vh - 64px)" }}>
                <CostSidebar
                    granularity={granularity as GranularityOpt}
                    setGranularity={setGranularity as any}
                    setRange={setRange}
                    start={start}
                    end={end}
                    groupBy={groupBy}
                    setGroupBy={setGroupBy}
                    chartType={chartType}
                    setChartType={setChartType}
                    filters={filters as FilterClause[]}
                    setFilters={setFilters as any}
                    listValues={listValues}
                    listTagKeys={listTagKeys}
                />
                <MainContent loading={loading} data={data as any} chartType={chartType} filters={filters as any} setFilters={setFilters as any} />
            </div>
        </div>
    );
};

export default function CostPage() {
    return (
        <main className="p-6">
            <CostExplorerProvider>
                <CostExplorerWired />
            </CostExplorerProvider>
        </main>
    );
}
