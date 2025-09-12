import { iso } from "@/app/api/cost/_lib/ce-helpers";
import { instanceSpecs } from "@/app/api/ec2/utils/instanceSpecs";
import fs from "fs";
import path from "path";

/** Types (mirror your helpers) **/
export type Granularity = "DAILY" | "MONTHLY";
export type Metric = "UnblendedCost" | "AmortizedCost" | "UsageQuantity";

type CEFilter = { And: CEFilter[] } | { Dimensions: { Key: string; Values: string[] } } | { Tags: { Key: string; Values?: string[]; MatchOptions?: string[] } } | undefined;

type GroupDef = { Type: "DIMENSION" | "TAG"; Key: string };

type Instance = {
    region: string;
    instanceId: string;
    type: string;
    state: string;
    availabilityZone?: string;
    launchTime: string; // ISO
    tags: Record<string, string>;
};

/** Load synthetic instances once */
function loadInstances(): Instance[] {
    const file = path.join(process.cwd(), "src/app/api/ec2/utils/mock_data", "synthetic-ec2-data.json");
    const raw = fs.readFileSync(file, "utf-8");
    const json = JSON.parse(raw);
    return (json.instances || []) as Instance[];
}

/** Date helpers */
function daysBetween(startISO: string, endISO: string) {
    const res: string[] = [];
    const start = new Date(startISO);
    const end = new Date(endISO);
    for (let d = new Date(start); d < end; d.setUTCDate(d.getUTCDate() + 1)) {
        res.push(iso(d));
    }
    return res;
}

function monthsBetween(startISO: string, endISO: string) {
    const res: { start: string; end: string }[] = [];
    let cur = new Date(startISO);
    const end = new Date(endISO);
    while (cur < end) {
        const mStart = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth(), 1));
        const mEnd = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth() + 1, 1));
        res.push({ start: iso(mStart), end: iso(mEnd) });
        cur = mEnd;
    }
    return res;
}

/** Simple deterministic pseudo-random number based on a seed string */
function seededFloat(seed: string, min = 0.7, max = 1.3) {
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    const r = (h % 1000) / 1000;
    return min + (max - min) * r;
}

/** Apply CE-style filters (dimensions/tags) to an instance list */
function matchesFilter(inst: Instance, filter: CEFilter): boolean {
    if (!filter) return true;
    if ("And" in (filter as any)) {
        return (filter as any).And.every((f: CEFilter) => matchesFilter(inst, f));
    }
    if ("Dimensions" in (filter as any)) {
        const key = (filter as any).Dimensions.Key.toUpperCase();
        const vals = (filter as any).Dimensions.Values || [];
        if (key === "REGION") return vals.includes(inst.region);
        if (key === "INSTANCE_TYPE") return vals.includes(inst.type);
        if (key === "INSTANCE_FAMILY") {
            const fam = inst.type.split(".")[0];
            return vals.includes(fam);
        }
        if (key === "USAGE_TYPE") return true; // synthetic: ignore usage type
        return true;
    }
    if ("Tags" in (filter as any)) {
        const { Key, Values, MatchOptions } = (filter as any).Tags;
        const v = inst.tags?.[Key];
        if (MatchOptions?.includes("ABSENT")) return !v;
        if (!Values || Values.length === 0) return Boolean(v);
        return v ? Values.includes(v) : false;
    }
    return true;
}

/** Core: compute synthetic cost */
function instanceHourlyPrice(inst: Instance): number {
    const spec = instanceSpecs[inst.type];
    return spec?.pricePerHour ?? 0;
}

function instanceActiveHoursInRange(inst: Instance, dayStartISO: string, dayEndISO: string): number {
    // assume instances run 24h/day since launch
    const launch = new Date(inst.launchTime).getTime();
    const start = new Date(dayStartISO).getTime();
    const end = new Date(dayEndISO).getTime();
    const dayHours = 24;
    const started = launch <= end;
    return started ? dayHours : 0;
}

function rollupBy(keys: string[], inst: Instance): string[] {
    return keys.map((k) => {
        if (k.toUpperCase().startsWith("TAG:")) {
            const tagKey = k.slice(4);
            return inst.tags?.[tagKey] || "(untagged)";
        }
        const up = k.toUpperCase();
        if (up === "REGION") return inst.region;
        if (up === "INSTANCE_TYPE") return inst.type;
        if (up === "INSTANCE_FAMILY") return inst.type.split(".")[0];
        if (up === "USAGE_TYPE") return "BoxUsage"; // synthetic label
        return "UNKNOWN";
    });
}

/** Public: mock "GetCostAndUsage" */
export function mockGetCostAndUsage(params: { start: string; end: string; granularity: Granularity; metric: Metric; groupBy?: GroupDef[]; filter?: CEFilter }) {
    const { start, end, granularity, metric, groupBy = [], filter } = params;
    const instances = loadInstances()
        .filter((i) => i.state === "running")
        .filter((i) => matchesFilter(i, filter));
    const periods = granularity === "DAILY" ? daysBetween(start, end).map((d) => ({ start: d, end: iso(new Date(new Date(d).getTime() + 24 * 3600 * 1000)) })) : monthsBetween(start, end);

    const resultsByTime: any[] = [];

    for (const p of periods) {
        const keyToAmount = new Map<string, number>();

        for (const inst of instances) {
            const hours = instanceActiveHoursInRange(inst, p.start, p.end);
            const price = instanceHourlyPrice(inst);
            // Add a deterministic utilization fudge so it isn't flat
            const util = seededFloat(inst.instanceId + p.start, 0.85, 1.15);
            const amount = metric === "UsageQuantity" ? hours : hours * price * util;

            if (groupBy.length === 0) {
                keyToAmount.set("__TOTAL__", (keyToAmount.get("__TOTAL__") || 0) + amount);
            } else {
                const keys = rollupBy(
                    groupBy.map((g) => (g.Type === "TAG" ? `TAG:${g.Key}` : g.Key)),
                    inst
                ).join("||");
                keyToAmount.set(keys, (keyToAmount.get(keys) || 0) + amount);
            }
        }

        if (groupBy.length === 0) {
            resultsByTime.push({
                TimePeriod: { Start: p.start, End: p.end },
                Total: { [metric]: { Amount: String(keyToAmount.get("__TOTAL__") || 0), Unit: metric === "UsageQuantity" ? "Hrs" : "USD" } },
                Groups: [],
            });
        } else {
            const groups = Array.from(keyToAmount.entries()).map(([keys, amt]) => ({
                Keys: keys.split("||"),
                Metrics: { [metric]: { Amount: String(amt), Unit: metric === "UsageQuantity" ? "Hrs" : "USD" } },
            }));
            resultsByTime.push({
                TimePeriod: { Start: p.start, End: p.end },
                Groups: groups,
            });
        }
    }

    return { ResultsByTime: resultsByTime };
}

/** Public: mock "GetTags" */
export function mockGetTags(params: { start: string; end: string; tagKey: string }) {
    const { tagKey } = params;
    const instances = loadInstances();
    const vals = new Set<string>();
    for (const i of instances) {
        const v = i.tags?.[tagKey];
        if (typeof v === "string" && v.trim()) vals.add(v.trim());
    }
    return { Tags: Array.from(vals).sort() };
}

/** Public: mock "GetDimensionValues" */
export function mockGetDimensionValues(params: { start: string; end: string; key: string }) {
    const { key } = params;
    const up = key.toUpperCase();
    const instances = loadInstances();
    const vals = new Set<string>();

    for (const i of instances) {
        if (up === "REGION") vals.add(i.region);
        else if (up === "INSTANCE_TYPE") vals.add(i.type);
        else if (up === "INSTANCE_FAMILY") vals.add(i.type.split(".")[0]);
        else if (up === "USAGE_TYPE") vals.add("BoxUsage");
    }
    return {
        DimensionValues: Array.from(vals)
            .sort()
            .map((v) => ({ Value: v })),
    };
}

/** CE-style wrappers used by attribution route */
export function mockFilterPresent(tagKey: string): CEFilter {
    return { Tags: { Key: tagKey, Values: ["*"], MatchOptions: ["EQUALS"] } };
}
export function mockFilterAbsent(tagKey: string): CEFilter {
    return { Tags: { Key: tagKey, MatchOptions: ["ABSENT"] } };
}
