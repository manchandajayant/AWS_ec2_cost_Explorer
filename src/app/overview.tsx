"use client";

import { useCost } from "@/context/CostContext";
import { useEc2 } from "@/context/EC2Context";
import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, LineElement, PointElement, Tooltip } from "chart.js";

import { AlertTriangle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Bar, Line } from "react-chartjs-2";

ChartJS.register(LineElement, PointElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

type DailyPoint = { date: string; amount: number };

function iso(d: Date) {
    return d.toISOString().slice(0, 10);
}
function startOfMonth(d = new Date()) {
    return new Date(d.getFullYear(), d.getMonth(), 1);
}
function addDaysISO(isoDate: string, n: number) {
    const d = new Date(isoDate);
    d.setDate(d.getDate() + n);
    return iso(d);
}

export default function LiveCostOverview() {
    const { getSummary } = useCost();
    const { instances, loading: instLoading } = useEc2();

    const [days, setDays] = useState<7 | 1>(7); // toggle 24h(=1) vs 7d
    const [trend, setTrend] = useState<DailyPoint[]>([]);
    const [mtd, setMtd] = useState<DailyPoint[]>([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const mockMtdData = [
        { date: "2025-09-01", amount: 280.15 },
        { date: "2025-09-02", amount: 275.4 },
        { date: "2025-09-03", amount: 290.8 },
        { date: "2025-09-04", amount: 282.9 },
        { date: "2025-09-05", amount: 295.0 },
        { date: "2025-09-06", amount: 285.5 },
        { date: "2025-09-07", amount: 295.1 },
        { date: "2025-09-08", amount: 275.9 },
        { date: "2025-09-09", amount: 950.7 }, // <-- Spike also included in MTD data
        { date: "2025-09-10", amount: 310.2 },
        { date: "2025-09-11", amount: 305.4 },
        { date: "2025-09-12", amount: 299.8 },
    ];

    // Data for the 7-Day Trend Chart (last 7 days of MTD data)
    const mockTrendDataWithSpike = mockMtdData.slice(-7);

    useEffect(() => {
        setLoading(true);
        // Simulate a brief loading period
        setTimeout(() => {
            setTrend(mockTrendDataWithSpike);
            setMtd(mockMtdData);
            setLoading(false);
        }, 300);
    }, []);

    // useEffect(() => {
    //     (async () => {
    //         setLoading(true);
    //         setErr(null);
    //         try {
    //             // const today = iso(new Date());
    //             // const trendStart = days === 1 ? addDaysISO(today, -1) : addDaysISO(today, -6);
    //             // // Trend window
    //             // const apiEnd = addDaysISO(today, 1);
    //             // const trendRes = await getSummary({ start: trendStart, end: apiEnd, granularity: "DAILY", metric: "UnblendedCost" });
    //             // // Expecting trendRes.byTime: { date, amount }[]
    //             // const byTimeTrend = (trendRes as any).byTime as { date: string; amount: number }[];
    //             // setTrend(byTimeTrend || []);
    //             // // MTD window
    //             // const mtdRes = await getSummary({ start: iso(startOfMonth()), end: today, granularity: "DAILY", metric: "UnblendedCost" });
    //             // const byTimeMTD = (mtdRes as any).byTime as { date: string; amount: number }[];
    //             // setMtd(byTimeMTD || []);
    //             const today = iso(new Date());
    //             const trendStart = days === 1 ? addDaysISO(today, -1) : addDaysISO(today, -6);

    //             // This is the correct, inclusive end date for BOTH calls
    //             const apiEnd = addDaysISO(today, 1);

    //             // Trend window (already correct)
    //             const trendRes = await getSummary({ start: trendStart, end: apiEnd, granularity: "DAILY", metric: "UnblendedCost" });
    //             const byTimeTrend = (trendRes as any).byTime as { date: string; amount: number }[];
    //             setTrend(byTimeTrend || []);

    //             // MTD window (FIXED)
    //             const mtdRes = await getSummary({ start: iso(startOfMonth()), end: apiEnd, granularity: "DAILY", metric: "UnblendedCost" }); // <-- Use apiEnd here too
    //             const byTimeMTD = (mtdRes as any).byTime as { date: string; amount: number }[];
    //             setMtd(byTimeMTD || []);
    //         } catch (e: any) {
    //             setErr(e?.message || "Failed to load costs");
    //         } finally {
    //             setLoading(false);
    //         }
    //     })();
    // }, [days, getSummary]);

    // KPIs
    const { totalMTD, burnRate, projectedMonthly } = useMemo(() => {
        const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
        const today = new Date();
        const dim = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const daysElapsed = Math.max(1, new Date().getDate()); // 1..dim
        const mtdVals = mtd.map((d) => d.amount);
        const total = sum(mtdVals);
        const avg = mtdVals.length ? total / mtdVals.length : 0;
        const proj = daysElapsed ? (total / daysElapsed) * dim : 0;
        return { totalMTD: total, burnRate: avg, projectedMonthly: proj };
    }, [mtd]);

    // Anomaly detection on trend (z-score > 2)
    const chartData = useMemo(() => {
        const labels = trend.map((d) => d.date);
        const values = trend.map((d) => d.amount);
        const mean = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
        const sd = values.length ? Math.sqrt(values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length) : 0;
        const anomalies = values.map((v) => (sd ? (v - mean) / sd > 2 : false));

        return {
            labels,
            datasets: [
                {
                    label: days === 1 ? "24h cost (hourly/daily bins)" : "7d daily cost",
                    data: values,
                    tension: 0.25,
                    pointRadius: anomalies.map((a) => (a ? 5 : 3)),
                    pointBackgroundColor: anomalies.map((a) => (a ? "red" : undefined)),
                    borderWidth: 2,
                    fill: false,
                },
            ],
        };
    }, [trend, days]);

    const chartOptions = useMemo(
        () => ({
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: true, position: "bottom" }, tooltip: { enabled: true } },
            scales: {
                x: { grid: { display: false } },
                y: { grid: { drawBorder: true } },
            },
        }),
        []
    );

    // ----- Instances summary + Utilization split -----
    type InstanceStatusLabel = "Idle" | "Under Utilized" | "Optimal" | "Over Utilized" | "Unknown";
    function classifyUtilizationWithUptime(cpuAvg: number, memAvg: number | null, uptimeHours: number, windowHours = 168) {
        if (uptimeHours < 24) {
            return { label: "Unknown" as InstanceStatusLabel, score: null as number | null };
        }
        const cpuNorm = Math.min(1, cpuAvg / 60);
        const memNorm = memAvg !== null ? Math.min(1, memAvg / 70) : cpuNorm;
        const coverage = Math.min(1, uptimeHours / windowHours);
        const rawScore = 0.6 * cpuNorm + 0.4 * memNorm;
        const adjusted = rawScore * coverage;
        let label: InstanceStatusLabel;
        if (cpuAvg < 3 && uptimeHours > 72) label = "Idle";
        else if (adjusted < 0.4) label = "Under Utilized";
        else if (adjusted > 0.7) label = "Over Utilized";
        else label = "Optimal";
        return { label, score: Number((adjusted * 100).toFixed(1)) };
    }

    const utilOrder: InstanceStatusLabel[] = ["Idle", "Under Utilized", "Optimal", "Over Utilized", "Unknown"];
    const utilColors: Record<InstanceStatusLabel, string> = {
        // Match hues used in Instances table badges/borders
        Idle: "#ef4444", // red-500
        "Under Utilized": "#f87171", // red-400
        Optimal: "#22c55e", // green-500
        "Over Utilized": "#eab308", // yellow-500
        Unknown: "#9ca3af", // gray-400
    };

    const utilCounts = useMemo(() => {
        const counts = new Map<InstanceStatusLabel, number>(utilOrder.map((k) => [k, 0]));
        for (const i of instances) {
            const cpu = typeof (i as any).cpuAvg7d === "number" ? (i as any).cpuAvg7d : 0;
            const mem = typeof (i as any).memAvg7d === "number" ? (i as any).memAvg7d : null;
            const uptime = typeof (i as any).uptimeHours === "number" ? (i as any).uptimeHours : 0;
            const { label } = classifyUtilizationWithUptime(cpu, mem, uptime);
            counts.set(label, (counts.get(label) || 0) + 1);
        }
        return utilOrder.map((k) => counts.get(k) || 0);
    }, [instances]);

    const utilBarData = useMemo(
        () => ({
            labels: utilOrder,
            datasets: [
                {
                    label: "Instances",
                    data: utilCounts,
                    backgroundColor: utilOrder.map((k) => utilColors[k]),
                    borderWidth: 0,
                },
            ],
        }),
        [utilCounts]
    );

    const utilBarOptions = useMemo(
        () => ({
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { x: { grid: { display: false } }, y: { beginAtZero: true, ticks: { precision: 0 } } },
        }),
        []
    );

    const riskyCount = useMemo(() => {
        // utilOrder: ["Idle", "Under Utilized", "Optimal", "Over Utilized", "Unknown"]
        if (!utilCounts?.length) return 0;
        const idle = utilCounts[0] || 0;
        const under = utilCounts[1] || 0;
        const over = utilCounts[3] || 0;
        return idle + under + over;
    }, [utilCounts]);

    if (err) return <div className="p-4 text-red-600 text-sm">Error: {err}</div>;

    return (
        <div className="space-y-3">
            <h2 className="text-base font-semibold text-gray-900">Overview</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Instance Overview (left) */}
                <section className="rounded-xl border border-gray-200 p-4">
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-gray-800">Instance Overview</h2>
                        <div className="text-xs text-gray-500">{instLoading ? "Loading instances…" : "Up to date"}</div>
                    </div>
                    <div className="flex items-end justify-between mb-3">
                        <div>
                            <div className="text-xs text-gray-500">Total Instances</div>
                            <div className="text-2xl font-semibold">{instances.length.toLocaleString()}</div>
                        </div>
                    </div>
                    <div className="h-40">
                        <Bar data={utilBarData} options={utilBarOptions as any} />
                    </div>
                    <div className="mt-3">
                        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                            <AlertTriangle size={16} className="mt-0.5 opacity-80" />
                            <p>
                                You have potentially <b>{riskyCount.toLocaleString()}</b> instances driving your costs up.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Costs Overview (right) */}
                <section className="rounded-xl border border-gray-200 p-4">
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-gray-800">Costs Overview</h2>
                        <div className="text-xs text-gray-500">{loading ? "Refreshing…" : "Up to date"}</div>
                    </div>

                    {/* KPI strip */}
                    <div className="grid grid-cols-3 gap-3 mb-3">
                        <KPI title="Total Cost (MTD)" value={fmtUSD(totalMTD)} hint="Month-to-date" />
                        <KPI title="Daily Burn" value={fmtUSD(burnRate)} hint={days === 1 ? "Avg last 24h" : "Avg last 7d"} />
                        <KPI title="Projected Month" value={fmtUSD(projectedMonthly)} hint="Linear projection" />
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2 mb-3">
                        <button
                            type="button"
                            onClick={() => setDays(1)}
                            className={`rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 ${days === 1 ? "bg-gray-100" : ""}`}
                        >
                            Last 24h
                        </button>
                        <button
                            type="button"
                            onClick={() => setDays(7)}
                            className={`rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 ${days === 7 ? "bg-gray-100" : ""}`}
                        >
                            Last 7d
                        </button>
                    </div>

                    {/* Trend chart */}
                    <div className="h-40 rounded-lg border border-gray-200 p-3">
                        <Line data={chartData} options={chartOptions as any} />
                    </div>

                    {/* Spikes */}
                    <div className="mt-3">
                        <SpikeCallouts data={trend} />
                    </div>
                </section>
            </div>
        </div>
    );
}

function KPI({ title, value, hint }: { title: string; value: string; hint?: string }) {
    return (
        <div className="rounded-xl border border-gray-200 p-4">
            <div className="text-xs text-gray-500">{title}</div>
            <div className="text-2xl font-semibold">{value}</div>
            {hint ? <div className="text-xs text-gray-400 mt-1">{hint}</div> : null}
        </div>
    );
}

function SpikeCallouts({ data }: { data: DailyPoint[] }) {
    if (!data?.length) return null;
    const vals = data.map((d) => d.amount);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const sd = Math.sqrt(vals.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / vals.length);
    const spikes = data.filter((d) => sd && (d.amount - mean) / sd > 2);
    if (!spikes.length) return <div className="text-xs text-gray-500">No anomalies detected based on 2σ threshold.</div>;
    return (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm">
            <div className="font-medium text-amber-800 mb-1">You have a spike in costs in the last in 7 days</div>
            <ul className="list-disc pl-5 text-amber-800">
                {spikes.map((s) => (
                    <li key={s.date}>
                        <span className="font-mono">{s.date}</span> — {fmtUSD(s.amount)}
                    </li>
                ))}
            </ul>
        </div>
    );
}

function fmtUSD(n: number) {
    return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}
