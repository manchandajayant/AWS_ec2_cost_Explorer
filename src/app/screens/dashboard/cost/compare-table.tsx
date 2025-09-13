"use client";
import React, { useMemo } from "react";

export interface CompareTotalItem {
  name: string;
  value: number;
}

export interface CompareTableProps {
  groupByLabel: string;
  monthA: string;
  monthB: string;
  totalsA: CompareTotalItem[];
  totalsB: CompareTotalItem[];
  colors: string[];
}

const fmtUSD = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

export default function CompareTable({ groupByLabel, monthA, monthB, totalsA, totalsB, colors }: CompareTableProps) {
  const { allGroups, mapA, mapB, sumA, sumB } = useMemo(() => {
    const all = Array.from(new Set([...(totalsA || []).map((t) => t.name), ...(totalsB || []).map((t) => t.name)]));
    const mapA = new Map((totalsA || []).map((t) => [t.name, t.value] as const));
    const mapB = new Map((totalsB || []).map((t) => [t.name, t.value] as const));
    const sumA = (totalsA || []).reduce((s, x) => s + x.value, 0);
    const sumB = (totalsB || []).reduce((s, x) => s + x.value, 0);
    return { allGroups: all, mapA, mapB, sumA, sumB };
  }, [totalsA, totalsB]);

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="max-h-96 overflow-y-auto">
              <table className="relative min-w-full divide-y divide-gray-300">
                <thead>
                  <tr>
                    <th className="py-3.5 pr-3 pl-4 text-left text-sm font-semibold text-gray-900 sm:pl-0">{groupByLabel}</th>
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
                          <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ background: colors[i % colors.length] }} />
                          {g}
                        </td>
                        <td className="px-3 py-5 text-sm whitespace-nowrap text-gray-900 text-right">{fmtUSD(a)}</td>
                        <td className="px-3 py-5 text-sm whitespace-nowrap text-gray-900 text-right">{fmtUSD(b)}</td>
                        <td
                          className={`px-3 py-5 text-sm whitespace-nowrap text-right ${
                            d > 0 ? "text-red-600" : d < 0 ? "text-green-600" : "text-gray-900"
                          }`}
                        >
                          {d > 0 ? "▲ " : d < 0 ? "▼ " : ""}
                          {fmtUSD(Math.abs(d))}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-gray-50">
                    <td className="py-5 pr-3 pl-4 text-sm font-semibold text-gray-900 whitespace-nowrap sm:pl-0">Total</td>
                    <td className="px-3 py-5 text-sm whitespace-nowrap text-gray-900 text-right font-semibold">{fmtUSD(sumA)}</td>
                    <td className="px-3 py-5 text-sm whitespace-nowrap text-gray-900 text-right font-semibold">{fmtUSD(sumB)}</td>
                    <td className="px-3 py-5 text-sm whitespace-nowrap text-gray-900 text-right font-semibold">{fmtUSD(sumB - sumA)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
