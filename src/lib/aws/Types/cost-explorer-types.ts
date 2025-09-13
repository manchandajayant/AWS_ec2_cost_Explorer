import { GroupDefinition } from "@aws-sdk/client-cost-explorer";

export type CostBreakdownResult = {
    ResultsByTime: Array<{
        TimePeriod?: { Start?: string; End?: string };
        Total?: Record<string, { Amount?: string; Unit?: string }>;
        Groups?: Array<{
            Keys?: string[];
            Metrics?: Record<string, { Amount?: string; Unit?: string }>;
        }>;
    }>;
    GroupDefinitions?: GroupDefinition[];
};

export type FilterClause = { type: "DIMENSION"; key: DimensionKey; values: string[] } | { type: "TAG"; key: string; values: string[] };

export type CostQuery = {
    start: string;
    end: string;
    granularity: Granularity;
    groupBy: GroupKey[];
    filters?: FilterClause[];
    metrics?: Metrics[];
};

export type Granularity = "DAILY" | "MONTHLY";
export type GroupKey = "REGION" | "INSTANCE_TYPE" | `TAG:${string}`;
export type DimensionKey = "REGION" | "INSTANCE_TYPE";
export type Metrics = "UnblendedCost";
