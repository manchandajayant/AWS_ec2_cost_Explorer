"use client";
import "@/lib/chart/register";
import { useMemo } from "react";
import { Bar, Line } from "react-chartjs-2";
import { useCostViewSettings } from "./view-settings-context";

type Dataset = { label: string; data: number[] };

export interface CompareChartProps {
  labels: string[];
  datasets: Dataset[];
  colors: string[];
  monthA: string;
  monthB: string;
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

export default function CompareChart({ labels, datasets, colors, monthA, monthB }: CompareChartProps) {
  const { chartType } = useCostViewSettings();
  const { showBanner, futureA, futureB } = useMemo(() => {
    const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
    const futureA = monthA > currentMonth;
    const futureB = monthB > currentMonth;
    return { showBanner: futureA || futureB, futureA, futureB };
  }, [monthA, monthB]);

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
              labels,
              datasets: (datasets as any).map((ds: any) => {
                const dataArr: number[] = (ds.data || []) as number[];
                const spikeIdx = detectSpikes(dataArr);
                const isFuture = (label: string) => (label === monthA && futureA) || (label === monthB && futureB);
                return {
                  ...ds,
                  segment: {
                    borderDash: () => (isFuture(ds.label) ? [4, 4] : undefined),
                  },
                  pointRadius: dataArr.map((_: any, i: number) => (spikeIdx.has(i) && !isFuture(ds.label) ? 3 : 0)),
                  pointHoverRadius: dataArr.map((_: any, i: number) => (spikeIdx.has(i) && !isFuture(ds.label) ? 5 : 0)),
                  pointBackgroundColor: dataArr.map((_: any, i: number) => (spikeIdx.has(i) && !isFuture(ds.label) ? "#ef4444" : "rgba(0,0,0,0)")),
                  pointBorderColor: dataArr.map((_: any, i: number) => (spikeIdx.has(i) && !isFuture(ds.label) ? "#ef4444" : "rgba(0,0,0,0)")),
                };
              }),
            }}
            options={{
              maintainAspectRatio: false,
              plugins: { legend: { position: "bottom" } },
              scales: { y: { beginAtZero: true } },
              interaction: { mode: "index", intersect: false },
              elements: { point: { radius: 0, hoverRadius: 4 } },
            }}
          />
        ) : (
          <Bar
            data={{
              labels,
              datasets: (datasets as any).map((ds: any, idx: number) => {
                const isFuture = (ds.label === monthA && futureA) || (ds.label === monthB && futureB);
                const color = colors[idx % colors.length];
                return {
                  label: ds.label,
                  data: ds.data,
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
}
