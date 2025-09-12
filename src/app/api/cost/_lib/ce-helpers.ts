import { CostExplorerClient, GroupDefinition } from "@aws-sdk/client-cost-explorer";

export type Granularity = "DAILY" | "MONTHLY";
export type Metric = "UnblendedCost" | "AmortizedCost" | "UsageQuantity";

export const DIM_KEYS = new Set(["REGION", "INSTANCE_TYPE", "INSTANCE_FAMILY", "USAGE_TYPE"]);

// CE lives in us-east-1
export const ce = new CostExplorerClient({ region: process.env.AWS_REGION || "us-east-1" });

export const n = (s?: string | null) => {
    const v = parseFloat(s || "0");
    return Number.isFinite(v) ? v : 0;
};

export const iso = (d: Date) => d.toISOString().slice(0, 10);

export function parseCommon(urlStr: string) {
    const u = new URL(urlStr);
    const metric = (u.searchParams.get("metric") || "UnblendedCost") as Metric;
    const granularity = (u.searchParams.get("granularity") || "DAILY").toUpperCase() as Granularity;

    const today = new Date();
    const end = u.searchParams.get("end") || iso(today);
    const start = u.searchParams.get("start") || iso(new Date(today.getTime() - 29 * 86400000));

    return { metric, granularity, start, end, u };
}

// groupBy=REGION,INSTANCE_FAMILY or TAG:Team
export function toGroupByDefs(raw: string): GroupDefinition[] {
    const keys = raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 2);
    return keys.map((k) => (k.toUpperCase().startsWith("TAG:") ? { Type: "TAG", Key: k.slice(4) } : { Type: "DIMENSION", Key: k.toUpperCase() }));
}

export function buildFilterFromJSON(json?: string) {
    if (!json) return undefined;
    const obj = JSON.parse(json) as Record<string, string[]>;
    const and: any[] = [];
    for (const [k, vals] of Object.entries(obj)) {
        if (!vals?.length) continue;
        if (k.toUpperCase().startsWith("TAG:")) {
            and.push({ Tags: { Key: k.slice(4), Values: vals } });
        } else if (DIM_KEYS.has(k.toUpperCase())) {
            and.push({ Dimensions: { Key: k.toUpperCase(), Values: vals } });
        } else {
            throw new Error(`Unsupported filter key: ${k}`);
        }
    }
    if (and.length === 0) return undefined;
    return and.length === 1 ? and[0] : { And: and };
}
