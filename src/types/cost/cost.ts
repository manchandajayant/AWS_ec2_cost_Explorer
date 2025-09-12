export type Granularity = "DAILY" | "MONTHLY";
export type Metric = "UnblendedCost" | "AmortizedCost" | "UsageQuantity";

export type TimeRange = { start: string; end: string };

export type CostSummary = {
    metric: Metric;
    unit: string;
    granularity: Granularity;
    timePeriod: TimeRange;
    total: number;
    byTime: { start: string; end: string; amount: number }[];
    source?: "mock" | "ce";
};

export type BreakdownRow = {
    start: string;
    end: string;
    keys: string[]; // 1 or 2 keys depending on groupBy
    amount: number;
};

export type CostBreakdown = {
    metric: Metric;
    unit: string;
    granularity: Granularity;
    timePeriod: TimeRange;
    groupBy: string[];
    rows: BreakdownRow[];
    source?: "mock" | "ce";
};

export type CostAttribution = {
    tagKey: string;
    metric: Metric;
    unit: string;
    granularity: Granularity;
    timePeriod: TimeRange;
    total: number;
    attributed: number;
    unaccounted: number;
    breakdown: { key: string; amount: number }[];
    source?: "mock" | "ce";
};

export type DimensionValues = { key: string; values: string[]; source?: "mock" | "ce" };
export type TagValues = { key: string; values: string[]; source?: "mock" | "ce" };

export type BreakdownFilters = Record<string, string[]>; // e.g., {"REGION":["eu-north-1"], "TAG:Team":["ML"]}
