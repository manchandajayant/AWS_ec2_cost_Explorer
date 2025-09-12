"use client";

import { useCost } from "@/context/CostContext";
import { CategoryScale, Chart as ChartJS, Legend, LinearScale, LineElement, PointElement, Tooltip } from "chart.js";

import { useEffect, useMemo, useState } from "react";
import { Line } from "react-chartjs-2";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

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

    const [days, setDays] = useState<7 | 1>(7); // toggle 24h(=1) vs 7d
    const [trend, setTrend] = useState<DailyPoint[]>([]);
    const [mtd, setMtd] = useState<DailyPoint[]>([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            setLoading(true);
            setErr(null);
            try {
                // const today = iso(new Date());
                // const trendStart = days === 1 ? addDaysISO(today, -1) : addDaysISO(today, -6);
                // // Trend window
                // const apiEnd = addDaysISO(today, 1);
                // const trendRes = await getSummary({ start: trendStart, end: apiEnd, granularity: "DAILY", metric: "UnblendedCost" });
                // // Expecting trendRes.byTime: { date, amount }[]
                // const byTimeTrend = (trendRes as any).byTime as { date: string; amount: number }[];
                // setTrend(byTimeTrend || []);
                // // MTD window
                // const mtdRes = await getSummary({ start: iso(startOfMonth()), end: today, granularity: "DAILY", metric: "UnblendedCost" });
                // const byTimeMTD = (mtdRes as any).byTime as { date: string; amount: number }[];
                // setMtd(byTimeMTD || []);
                const today = iso(new Date());
                const trendStart = days === 1 ? addDaysISO(today, -1) : addDaysISO(today, -6);

                // This is the correct, inclusive end date for BOTH calls
                const apiEnd = addDaysISO(today, 1);

                // Trend window (already correct)
                const trendRes = await getSummary({ start: trendStart, end: apiEnd, granularity: "DAILY", metric: "UnblendedCost" });
                const byTimeTrend = (trendRes as any).byTime as { date: string; amount: number }[];
                setTrend(byTimeTrend || []);

                // MTD window (FIXED)
                const mtdRes = await getSummary({ start: iso(startOfMonth()), end: apiEnd, granularity: "DAILY", metric: "UnblendedCost" }); // <-- Use apiEnd here too
                const byTimeMTD = (mtdRes as any).byTime as { date: string; amount: number }[];
                setMtd(byTimeMTD || []);
            } catch (e: any) {
                setErr(e?.message || "Failed to load costs");
            } finally {
                setLoading(false);
            }
        })();
    }, [days, getSummary]);

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

    if (err) return <div className="p-4 text-red-600 text-sm">Error: {err}</div>;

    return (
        <div className="space-y-4">
            {/* KPI strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <KPI title="Total Cost (MTD)" value={fmtUSD(totalMTD)} hint="Month-to-date" />
                <KPI title="Daily Burn Rate" value={fmtUSD(burnRate)} hint={days === 1 ? "Avg last 24h bins" : "Avg last 7d"} />
                <KPI title="Projected Month" value={fmtUSD(projectedMonthly)} hint="Linear projection" />
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => setDays(1)}
                    className={`rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 ${days === 1 ? "bg-gray-100" : ""}`}
                >
                    Last 24h
                </button>
                <button
                    type="button"
                    onClick={() => setDays(7)}
                    className={`rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 ${days === 7 ? "bg-gray-100" : ""}`}
                >
                    Last 7d
                </button>
                <div className="ml-auto text-xs text-gray-500">{loading ? "Refreshing…" : "Up to date"}</div>
            </div>

            {/* Trend chart */}
            <div className="h-56 rounded-xl border border-gray-200 p-3">
                <Line data={chartData} options={chartOptions as any} />
            </div>

            {/* Creative summary: spike callouts */}
            <SpikeCallouts data={trend} />
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
            <div className="font-medium text-amber-800 mb-1">Potential spikes detected</div>
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
