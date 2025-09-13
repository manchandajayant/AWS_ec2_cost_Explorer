"use client";
import React, { createContext, useContext, useMemo, useState } from "react";
import type { Granularity, GroupBy } from "@/types/cost/cost";

export type ChartType = "line" | "bar";
export type TopN = number | "ALL";

type CostViewSettings = {
  chartType: ChartType;
  setChartType: (t: ChartType) => void;
  topN: TopN;
  setTopN: (n: TopN) => void;
  groupBy: GroupBy;
  setGroupBy: (g: GroupBy) => void;
  granularity: Granularity;
  setGranularity: (g: Granularity) => void;
};

const Ctx = createContext<CostViewSettings | undefined>(undefined);

export function CostViewSettingsProvider({
  children,
  defaultChartType = "bar",
  defaultTopN = 5,
  defaultGroupBy = "REGION",
  defaultGranularity = "MONTHLY",
}: {
  children: React.ReactNode;
  defaultChartType?: ChartType;
  defaultTopN?: TopN;
  defaultGroupBy?: GroupBy;
  defaultGranularity?: Granularity;
}) {
  const [chartType, setChartType] = useState<ChartType>(defaultChartType);
  const [topN, setTopN] = useState<TopN>(defaultTopN);
  const [groupBy, setGroupBy] = useState<GroupBy>(defaultGroupBy);
  const [granularity, setGranularity] = useState<Granularity>(defaultGranularity);

  const value = useMemo<CostViewSettings>(
    () => ({ chartType, setChartType, topN, setTopN, groupBy, setGroupBy, granularity, setGranularity }),
    [chartType, topN, groupBy, granularity]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCostViewSettings(): CostViewSettings {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCostViewSettings must be used within CostViewSettingsProvider");
  return v;
}
