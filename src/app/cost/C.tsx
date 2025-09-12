"use client";
import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, LineElement, PointElement, Title, Tooltip, type ChartData } from "chart.js";
import { useMemo, useState } from "react";
import { Bar, Line, Pie } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

type ChartType = "Line" | "Bar" | "Pie";
type Granularity = "DAILY" | "MONTHLY";
type GroupKey = "REGION" | "INSTANCE_TYPE";

export const CostComponent = () => {
    const [granularity, setGranularity] = useState<Granularity>("DAILY");
    const [chartType, setChartType] = useState<ChartType>("Line");
    const [groupBy, setGroupBy] = useState<GroupKey>("REGION");
    const [start, setStart] = useState<string>("");
    const [end, setEnd] = useState<string>("");

    return (
        <div className="min-h-screen bg-slate-100 font-sans">
            <Header />
            <div className="flex" style={{ height: "calc(100vh - 64px)" }}>
                <Sidebar
                    granularity={granularity}
                    setGranularity={setGranularity}
                    chartType={chartType}
                    setChartType={setChartType}
                    groupBy={groupBy}
                    setGroupBy={setGroupBy}
                    start={start}
                    end={end}
                    setStart={setStart}
                    setEnd={setEnd}
                />
                <MainPanel granularity={granularity} chartType={chartType} groupBy={groupBy} start={start} end={end} />
            </div>
        </div>
    );
};

function Header() {
    return (
        <div className="bg-white border-b border-slate-200">
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div>
                        <div className="text-xs text-slate-500">AWS Cost Management / Cost Explorer</div>
                        <h1 className="text-xl font-bold text-slate-800">Cost Explorer</h1>
                    </div>
                </div>
            </div>
        </div>
    );
}

const baseBtn = "type=button rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50";

function Sidebar({
    granularity,
    setGranularity,
    chartType,
    setChartType,
    groupBy,
    setGroupBy,
    start,
    end,
    setStart,
    setEnd,
}: {
    granularity: Granularity;
    setGranularity: (g: Granularity) => void;
    chartType: ChartType;
    setChartType: (c: ChartType) => void;
    groupBy: GroupKey;
    setGroupBy: (g: GroupKey) => void;
    start: string;
    end: string;
    setStart: (s: string) => void;
    setEnd: (s: string) => void;
}) {
    const CHART_TYPES: ChartType[] = ["Line", "Bar", "Pie"];

    const btnClass = (selected: boolean) => `${baseBtn} ${selected ? "!bg-slate-400" : "bg-white"}`;

    return (
        <aside className="w-95 bg-slate-50 border-r border-slate-200 p-4 space-y-6">
            <div className="space-y-4">
                <h3 className="font-bold text-slate-800 text-sm">Report parameters</h3>

                {/* Granularity */}
                <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-600">Granularity</div>
                    <div className="flex gap-2">
                        {["DAILY", "MONTHLY"].map((g, i) => (
                            <button key={i} onClick={() => setGranularity(g as Granularity)} className={btnClass(granularity === g)}>
                                {g}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Date range */}
                <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-600">Date range</div>
                    <div className="flex items-center gap-2">
                        <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white text-sm" />
                        <span className="text-slate-500 text-sm">to</span>
                        <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white text-sm" />
                    </div>
                </div>

                {/* Chart type */}
                <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-600">Chart type</div>
                    <div className="flex gap-2">
                        {CHART_TYPES.map((c) => (
                            <button key={c} onClick={() => setChartType(c)} className={btnClass(chartType === c)}>
                                {c}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Group by */}
                <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-600">Group by</div>
                    <div className="flex gap-2">
                        {[
                            { label: "Instance Type", key: "INSTANCE_TYPE" as GroupKey },
                            { label: "Region", key: "REGION" as GroupKey },
                        ].map((opt) => (
                            <button key={opt.key} onClick={() => setGroupBy(opt.key)} className={btnClass(groupBy === opt.key)}>
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </aside>
    );
}

function Chip({ children }: { children: React.ReactNode }) {
    return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-slate-100 text-slate-700 border border-slate-200">{children}</span>;
}

function MainPanel({ granularity, chartType, groupBy, start, end }: { granularity: Granularity; chartType: ChartType; groupBy: GroupKey; start: string; end: string }) {
    const labels = ["Aug 1", "Aug 2", "Aug 3", "Aug 4", "Aug 5"];
    const sampleData: ChartData<"line" | "bar" | "pie"> = useMemo(() => {
        const baseValues = [120, 90, 140, 70, 110];
        const datasets = [
            {
                label: groupBy,
                data: baseValues,
                backgroundColor: ["#1d4ed8", "#16a34a", "#f97316", "#c026d3", "#0891b2"],
                borderColor: "#1d4ed8",
            },
        ];
        return { labels, datasets } as ChartData<any>;
    }, [groupBy]);

    return (
        <main className="flex-1 bg-white p-6 overflow-auto">
            <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Chip>Granularity: {granularity}</Chip>
                    <Chip>Chart: {chartType}</Chip>
                    <Chip>Group by: {groupBy}</Chip>
                    {start && <Chip>Start: {start}</Chip>}
                    {end && <Chip>End: {end}</Chip>}
                </div>

                <section className="border border-slate-200 rounded-md p-4 h-96 bg-slate-50">
                    {chartType === "Line" && <Line data={sampleData as ChartData<"line">} />}
                    {chartType === "Bar" && <Bar data={sampleData as ChartData<"bar">} />}
                    {chartType === "Pie" && <Pie data={sampleData as ChartData<"pie">} />}
                </section>

                <section className="border border-slate-200 rounded-md">
                    <div className="p-4 bg-slate-50 border-b border-slate-200">
                        <h3 className="font-bold text-sm text-slate-800">Results</h3>
                    </div>
                    <div className="p-4">
                        <div className="h-40 bg-slate-50 rounded flex items-center justify-center text-slate-500 text-sm">Table area (to be implemented)</div>
                    </div>
                </section>
            </div>
        </main>
    );
}
