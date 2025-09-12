"use client";
import { ModernDatePicker } from "@/components/date-picker";
import MonthPicker from "@/components/month-picker";
import type { Tab } from "@/types/cost/cost";

type Granularity = "DAILY" | "MONTHLY";
type GroupBy = "REGION" | "INSTANCE_TYPE" | "USAGE_TYPE";
type ChartType = "line" | "bar";

export interface CostSidebarProps {
    tab: Tab;
    start: string;
    end: string;
    onApplyDateRange: (start: string, end: string) => void;
    granularity: Granularity;
    setGranularity: (g: Granularity) => void;
    groupBy: GroupBy;
    setGroupBy: (g: GroupBy) => void;
    chartType: ChartType;
    setChartType: (t: ChartType) => void;
    topN: number | "ALL";
    setTopN: (n: number | "ALL") => void;
    maxTopSelectable: number;
    tagKeys: string[];
    activeTagKey: string;
    setActiveTagKey: (k: string) => void;
    tagValues: string[];
    selectedTagValues: string[];
    toggleTagValue: (v: string) => void;
    monthA: string;
    monthB: string;
    onApplyMonths: (a: string, b: string) => void;
}

export default function CostSidebar(props: CostSidebarProps) {
    const {
        tab,
        start,
        end,
        onApplyDateRange,
        granularity,
        setGranularity,
        groupBy,
        setGroupBy,
        chartType,
        setChartType,
        topN,
        setTopN,
        maxTopSelectable,
        tagKeys,
        activeTagKey,
        setActiveTagKey,
        tagValues,
        selectedTagValues,
        toggleTagValue,
        monthA,
        monthB,
        onApplyMonths,
    } = props;

    return (
        <aside className="w-95 shrink-0 space-y-4">
            <div className="p-3 flex flex-col gap-3">
                {tab === "OVERVIEW" ? (
                    <>
                        <ModernDatePicker onApply={onApplyDateRange} initialStart={start} initialEnd={end} />

                        <div>
                            <div className="text-sm font-semibold mb-2">Granularity</div>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    className={`rounded-md px-3 py-2 text-sm shadow-xs ring-1 ring-inset hover:bg-gray-50 ${granularity === "DAILY" ? "bg-gray-100 ring-gray-400" : "bg-white ring-gray-300"}`}
                                    onClick={() => setGranularity("DAILY")}
                                >
                                    Daily
                                </button>
                                <button
                                    className={`rounded-md px-3 py-2 text-sm shadow-xs ring-1 ring-inset hover:bg-gray-50 ${granularity === "MONTHLY" ? "bg-gray-100 ring-gray-400" : "bg-white ring-gray-300"}`}
                                    onClick={() => setGranularity("MONTHLY")}
                                >
                                    Monthly
                                </button>
                            </div>
                        </div>

                        <div>
                            <div className="text-sm font-semibold mb-2">Group By</div>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    className={`rounded-md px-3 py-2 text-sm shadow-xs ring-1 ring-inset hover:bg-gray-50 ${groupBy === "REGION" ? "bg-gray-100 ring-gray-400" : "bg-white ring-gray-300"}`}
                                    onClick={() => setGroupBy("REGION")}
                                >
                                    Region
                                </button>
                                <button
                                    className={`rounded-md px-3 py-2 text-sm shadow-xs ring-1 ring-inset hover:bg-gray-50 ${groupBy === "INSTANCE_TYPE" ? "bg-gray-100 ring-gray-400" : "bg-white ring-gray-300"}`}
                                    onClick={() => setGroupBy("INSTANCE_TYPE")}
                                >
                                    Instance Type
                                </button>
                                <button
                                    className={`rounded-md px-3 py-2 text-sm shadow-xs ring-1 ring-inset hover:bg-gray-50 ${groupBy === "USAGE_TYPE" ? "bg-gray-100 ring-gray-400" : "bg-white ring-gray-300"}`}
                                    onClick={() => setGroupBy("USAGE_TYPE")}
                                >
                                    Usage Type
                                </button>
                            </div>
                        </div>

                        <div>
                            <div className="text-sm font-semibold mb-2">Chart Type</div>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    className={`rounded-md px-3 py-2 text-sm shadow-xs ring-1 ring-inset hover:bg-gray-50 ${chartType === "bar" ? "bg-gray-100 ring-gray-400" : "bg-white ring-gray-300"}`}
                                    onClick={() => setChartType("bar")}
                                >
                                    Bar
                                </button>
                                <button
                                    className={`rounded-md px-3 py-2 text-sm shadow-xs ring-1 ring-inset hover:bg-gray-50 ${chartType === "line" ? "bg-gray-100 ring-gray-400" : "bg-white ring-gray-300"}`}
                                    onClick={() => setChartType("line")}
                                >
                                    Line
                                </button>
                            </div>
                        </div>

                        {/* Top N selector */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-sm font-semibold">Top N</div>
                                <label className="flex items-center gap-2 text-xs text-gray-600">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300"
                                        checked={topN === "ALL"}
                                        onChange={(e) =>
                                            setTopN(e.target.checked ? "ALL" : Math.min(typeof topN === "number" ? topN : 10, maxTopSelectable))
                                        }
                                    />
                                    All
                                </label>
                            </div>
                            <div className="mt-1">
                                <input
                                    type="range"
                                    min={1}
                                    max={maxTopSelectable}
                                    step={1}
                                    value={topN === "ALL" ? maxTopSelectable : topN}
                                    onChange={(e) => setTopN(parseInt(e.target.value, 10))}
                                    disabled={topN === "ALL"}
                                    className="w-full accent-black"
                                />
                                <div className="mt-1 flex justify-between text-[10px] text-gray-500">
                                    <span>1</span>
                                    <span>{maxTopSelectable}</span>
                                </div>
                                <div className="mt-1 text-xs text-gray-600">
                                    Showing top {topN === "ALL" ? "All" : topN} of {maxTopSelectable}
                                </div>
                            </div>
                        </div>

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
                                                    className={`rounded-md px-2.5 py-1.5 text-xs shadow-xs ring-1 ring-inset hover:bg-gray-50 ${active ? "bg-gray-100 ring-gray-400" : "bg-white ring-gray-300"}`}
                                                    onClick={() => toggleTagValue(v)}
                                                >
                                                    {v}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <div>
                            <MonthPicker initialA={monthA} initialB={monthB} onApply={(a: string, b: string) => onApplyMonths(a, b)} />
                        </div>

                        <div>
                            <div className="text-sm font-semibold mb-2">Group By</div>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    className={`rounded-md px-3 py-2 text-sm shadow-xs ring-1 ring-inset hover:bg-gray-50 ${groupBy === "REGION" ? "bg-gray-100 ring-gray-400" : "bg-white ring-gray-300"}`}
                                    onClick={() => setGroupBy("REGION")}
                                >
                                    Region
                                </button>
                                <button
                                    className={`rounded-md px-3 py-2 text-sm shadow-xs ring-1 ring-inset hover:bg-gray-50 ${groupBy === "INSTANCE_TYPE" ? "bg-gray-100 ring-gray-400" : "bg-white ring-gray-300"}`}
                                    onClick={() => setGroupBy("INSTANCE_TYPE")}
                                >
                                    Instance Type
                                </button>
                                <button
                                    className={`rounded-md px-3 py-2 text-sm shadow-xs ring-1 ring-inset hover:bg-gray-50 ${groupBy === "USAGE_TYPE" ? "bg-gray-100 ring-gray-400" : "bg-white ring-gray-300"}`}
                                    onClick={() => setGroupBy("USAGE_TYPE")}
                                >
                                    Usage Type
                                </button>
                            </div>
                        </div>

                        <div>
                            <div className="text-sm font-semibold mb-2">Chart Type</div>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    className={`rounded-md px-3 py-2 text-sm shadow-xs ring-1 ring-inset hover:bg-gray-50 ${chartType === "bar" ? "bg-gray-100 ring-gray-400" : "bg-white ring-gray-300"}`}
                                    onClick={() => setChartType("bar")}
                                >
                                    Bar
                                </button>
                                <button
                                    className={`rounded-md px-3 py-2 text-sm shadow-xs ring-1 ring-inset hover:bg-gray-50 ${chartType === "line" ? "bg-gray-100 ring-gray-400" : "bg-white ring-gray-300"}`}
                                    onClick={() => setChartType("line")}
                                >
                                    Line
                                </button>
                            </div>
                        </div>

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
                                                    className={`rounded-md px-2.5 py-1.5 text-xs shadow-xs ring-1 ring-inset hover:bg-gray-50 ${active ? "bg-gray-100 ring-gray-400" : "bg-white ring-gray-300"}`}
                                                    onClick={() => toggleTagValue(v)}
                                                >
                                                    {v}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>
        </aside>
    );
}
