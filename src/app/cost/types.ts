import type { FilterClause, GroupKey } from "@/context/CostExplorerContext";
// ---------- Types ----------
export type GranularityOpt = "DAILY" | "MONTHLY";
export type ChartTypeOpt = "Line" | "Bar" | "Pie";
export type SkeletonKind = "chart" | "table";

export interface TimePoint {
    date: string;
    amount: number;
}

export interface CostGroup {
    key: string;
    amount: number;
    timeSeries: TimePoint[];
}

export interface CostDataShape {
    unit: string;
    groups: CostGroup[];
    totalAmount: number;
}

// Local-only type removed; we consume FilterClause from context

export interface FilterPillProps {
    label: string;
    onRemove: () => void;
}

export interface SkeletonLoaderProps {
    type: SkeletonKind;
}

export interface CostSidebarProps {
    granularity: GranularityOpt;
    setGranularity: (g: GranularityOpt) => void;
    setRange: (start: string, end: string) => void;
    start?: string;
    end?: string;
    groupBy: GroupKey[];
    setGroupBy: (g: GroupKey[]) => void;
    chartType: ChartTypeOpt;
    setChartType: (t: ChartTypeOpt) => void;
    filters: FilterClause[];
    setFilters: (f: FilterClause[]) => void;
    listValues: (key: GroupKey) => Promise<string[]>;
    listTagKeys: () => Promise<string[]>;
}

export interface MainContentProps {
    loading: boolean;
    data: CostDataShape | null;
    chartType: ChartTypeOpt;
    filters: FilterClause[];
    setFilters: React.Dispatch<React.SetStateAction<FilterClause[]>>;
}
