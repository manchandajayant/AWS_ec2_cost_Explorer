"use client";
import { useMemo } from "react";
import { Bar, Line } from "react-chartjs-2";

type ChartType = "line" | "bar";

export type SeriesDataset = {
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
    tension?: number;
    fill?: boolean;
};

export interface CostOverviewProps {
    chartType: ChartType;
    labels: string[];
    datasets: SeriesDataset[];
    colors: string[];
    endISO: string;
    groupByLabel: string;
    topTotals: { name: string; value: number }[];
    total: number;
    maxValue: number;
    avgValue: number;
}

export default function CostOverview({ chartType, labels, datasets, colors, endISO, groupByLabel, topTotals, total, maxValue, avgValue }: CostOverviewProps) {
    const todayISO = () => new Date().toISOString().slice(0, 10);
    const beyondToday = useMemo(() => endISO > todayISO(), [endISO]);

    const chart = useMemo(() => {
        const today = todayISO();
        const isFutureIdx = (idx: number) => (labels[idx] ?? "") > today;

        if (chartType === "line") {
            const lineData = {
                labels,
                datasets: (datasets as any).map((ds: any) => {
                    const dataArr: number[] = (ds.data || []) as number[];
                    const spikeIdx = detectSpikes(dataArr);
                    return {
                        ...ds,
                        segment: {
                            borderDash: (ctx: any) => (isFutureIdx(ctx.p1DataIndex) ? [4, 4] : undefined),
                        },
                        pointRadius: labels.map((_, i) => (spikeIdx.has(i) && !isFutureIdx(i) ? 3 : 0)),
                        pointHoverRadius: labels.map((_, i) => (spikeIdx.has(i) && !isFutureIdx(i) ? 5 : 0)),
                        pointBackgroundColor: labels.map((_, i) => (spikeIdx.has(i) && !isFutureIdx(i) ? "#ef4444" : "rgba(0,0,0,0)")),
                        pointBorderColor: labels.map((_, i) => (spikeIdx.has(i) && !isFutureIdx(i) ? "#ef4444" : "rgba(0,0,0,0)")),
                    };
                }),
            } as any;

            return (
                <Line
                    data={lineData}
                    options={{
                        maintainAspectRatio: false,
                        plugins: { legend: { position: "bottom" } },
                        scales: { y: { beginAtZero: true } },
                        interaction: { mode: "index", intersect: false },
                        elements: { point: { radius: 0, hoverRadius: 4 } },
                    }}
                />
            );
        }

        const barData = {
            labels,
            datasets: (datasets as any).map((ds: any, i: number) => ({
                label: ds.label,
                data: ds.data,
                backgroundColor: labels.map((_, idx: number) => (isFutureIdx(idx) ? "rgba(0,0,0,0)" : colors[i % colors.length])),
                borderColor: labels.map((_, idx: number) => (isFutureIdx(idx) ? "#94a3b8" : colors[i % colors.length])),
                borderWidth: labels.map((_, idx: number) => (isFutureIdx(idx) ? 2 : 0)),
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
    }, [chartType, labels, datasets, colors, endISO]);

    return (
        <>
            <div className="w-full relative" style={{ height: 420 }}>
                {beyondToday && (
                    <div className="absolute top-0 left-0 right-0 text-center text-xs text-slate-600 border-t border-dashed border-slate-400 py-1 bg-white/70">Dates in the future are estimated based on trends</div>
                )}
                <div className={beyondToday ? "pt-6 h-full" : "h-full"}>{chart}</div>
            </div>

            <div className="px-4 sm:px-6 lg:px-8">
                <div className="mt-8 flow-root">
                    <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                            <div className="max-h-96 overflow-y-auto">
                                <table className="relative min-w-full divide-y divide-gray-300">
                                    <thead>
                                        <tr>
                                            <th scope="col" className="py-3.5 pr-3 pl-4 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                                                {groupByLabel}
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
                                                        <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ background: colors[i % colors.length] }} />
                                                        {s.name}
                                                    </td>
                                                    <td className={`px-3 py-5 text-sm whitespace-nowrap text-right ${isMaxAboveAvg ? "text-red-600 font-semibold" : "text-gray-900"}`}>{fmtUSD(s.value)}</td>
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
    );
}

const detectSpikes = (values: number[]): Set<number> => {
    const spikes = new Set<number>();
    if (!Array.isArray(values) || values.length < 3) return spikes;
    for (let i = 1; i < values.length - 1; i++) {
        const v = Number(values[i] ?? 0);
        const prev = Number(values[i - 1] ?? 0);
        const next = Number(values[i + 1] ?? 0);
        const localMean = (prev + next) / 2;
        if (v > prev && v > next && (localMean === 0 ? v > 0 : v >= 1.5 * localMean)) spikes.add(i);
    }
    return spikes;
};

const fmtUSD = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
