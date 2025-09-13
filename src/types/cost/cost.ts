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

export type Tab = "OVERVIEW" | "COMPARE";

// Type definitions
export interface CalendarState {
    month: number;
    year: number;
}

export interface DateRange {
    start: string;
    end: string;
}

export interface PresetOption {
    label: string;
    days: number;
}

export interface ModernDatePickerProps {
    onApply?: (start: string, end: string) => void;
    initialStart?: string;
    initialEnd?: string;
    disabled?: boolean;
    className?: string;
}

export interface CalendarDropdownProps {
    isStart: boolean;
    calendar: CalendarState;
    start: string;
    end: string;
    onDateSelect: (day: number | null, isStart: boolean) => void;
    onNavigateMonth: (direction: number, isStart: boolean) => void;
}

export type MonthPickerProps = {
    initialA?: string; // YYYY-MM
    initialB?: string; // YYYY-MM
    onApply?: (monthA: string, monthB: string) => void;
    disabled?: boolean;
    className?: string;
};

export interface MultiSelectProps {
    label: string;
    options: string[];
    selected: string[];
    onChange: (values: string[]) => void;
}

export type GroupBy = "REGION" | "INSTANCE_TYPE" | "USAGE_TYPE";
export type ChartType = "line" | "bar";

export interface CostSidebarProps {
    tab: Tab;
    start: string;
    end: string;
    onApplyDateRange: (start: string, end: string) => void;
    maxTopSelectable?: number;
    // Chart/UI settings now provided via context
    monthA: string;
    monthB: string;
    onApplyMonths: (a: string, b: string) => void;
}

export type SeriesDataset = {
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
    tension?: number;
    fill?: boolean;
};

export interface CostOverviewProps {
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
