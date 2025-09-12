import { iso } from "@/app/api/cost/_lib/ce-helpers";
import { instanceSpecs } from "@/app/api/ec2/utils/instanceSpecs";
import fs from "fs";
import path from "path";

const MOCK_TODAY = new Date("2025-09-12T12:00:00Z");

// --- (No changes to types, helpers, or data loading) ---
export type Granularity = "DAILY" | "MONTHLY";
export type Metric = "UnblendedCost" | "AmortizedCost" | "UsageQuantity";
type CEFilter = { And: CEFilter[] } | { Dimensions: { Key: string; Values: string[] } } | { Tags: { Key: string; Values?: string[]; MatchOptions?: string[] } } | undefined;
type GroupDef = { Type: "DIMENSION" | "TAG"; Key: string; includeFuture?: string }; // includeFuture is ignored here
type Instance = {
    region: string;
    instanceId: string;
    type: string;
    state: string;
    availabilityZone?: string;
    launchTime: string; // ISO
    tags: Record<string, string>;
};
function loadInstances(): Instance[] {
    const file = path.join(process.cwd(), "src/app/api/ec2/utils/mock_data", "synthetic-ec2-data.json");
    const raw = fs.readFileSync(file, "utf-8");
    const json = JSON.parse(raw);
    return (json.instances || []) as Instance[];
}
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
function hash32(s: string) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}
function seededFloat(seed: string | number, min = 0, max = 1) {
    const h = typeof seed === "number" ? seed >>> 0 : hash32(seed);
    const r = (h % 10000) / 10000;
    return min + (max - min) * r;
}
function seededBool(seed: string | number, p = 0.5) {
    return seededFloat(seed, 0, 1) < p;
}
type Profile = "Idle" | "Under Utilized" | "Over Utilized" | "Optimal";
function inferProfile(inst: Instance): Profile {
    const family = inst.type.split(".")[0];
    const team = (inst.tags?.["Team"] || "").toLowerCase();
    const project = (inst.tags?.["Project"] || "").toLowerCase();
    let score =
        (family.startsWith("p3") || family.startsWith("g4dn") ? 0.25 : 0) +
        (team.includes("bio") ? 0.15 : 0) +
        (team.includes("ml") ? 0.15 : 0) +
        (project.includes("gene") ? 0.05 : 0) +
        (project.includes("protein") ? 0.05 : 0) +
        seededFloat(inst.instanceId + inst.type, -0.1, 0.1);
    if (score >= 0.25) {
        return seededBool(inst.instanceId + ":over", 0.55) ? "Over Utilized" : "Optimal";
    }
    const r = seededFloat(inst.instanceId, 0, 1);
    if (r < 0.25) return "Idle";
    if (r < 0.55) return "Under Utilized";
    if (r < 0.8) return "Optimal";
    return "Over Utilized";
}
function profileSignals(inst: Instance, profile: Profile) {
    const vCPU = instanceSpecs[inst.type]?.vCPU ?? 2;
    const baseUptime = profile === "Optimal" ? 16 : 24;
    const cpu =
        profile === "Idle"
            ? seededFloat(inst.instanceId + ":cpu", 0.5, 2.5)
            : profile === "Under Utilized"
            ? seededFloat(inst.instanceId + ":cpu", 8, 20)
            : profile === "Over Utilized"
            ? seededFloat(inst.instanceId + ":cpu", 75, 92)
            : seededFloat(inst.instanceId + ":cpu", 40, 60);
    const mem =
        profile === "Idle"
            ? seededFloat(inst.instanceId + ":mem", 4, 10)
            : profile === "Under Utilized"
            ? seededFloat(inst.instanceId + ":mem", 12, 25)
            : profile === "Over Utilized"
            ? seededFloat(inst.instanceId + ":mem", 70, 85)
            : seededFloat(inst.instanceId + ":mem", 50, 70);
    const burstable = /^(t2|t3|t4g)/i.test(inst.type);
    const cpuCredits = burstable && profile === "Over Utilized" ? 0.05 * vCPU * (cpu / 100) : 0;
    return { baseUptime, cpuAvg: cpu, memAvg: mem, cpuCreditRate: cpuCredits };
}
type UsageComponent = { usageType: string; amount: number };
function hoursOverlap(launchISO: string, rangeStartISO: string, rangeEndISO: string) {
    const start = new Date(rangeStartISO).getTime();
    const end = new Date(rangeEndISO).getTime();
    const launch = new Date(launchISO).getTime();
    const s = Math.max(start, launch);
    const e = Math.max(s, end);
    return (e - s) / 3600000;
}
function daysInRange(rangeStartISO: string, rangeEndISO: string) {
    return (new Date(rangeEndISO).getTime() - new Date(rangeStartISO).getTime()) / 86400000;
}
function seededInfra(inst: Instance) {
    const family = inst.type.split(".")[0];
    const spec = instanceSpecs[inst.type];
    const ramGB = spec?.RAM ?? 4;
    const isGPU = /^p|^g/i.test(family);
    const ebsType = isGPU ? "io2" : "gp3";
    const ebsGB = Math.max(isGPU ? ramGB * 4 : ramGB * 2, isGPU ? 200 : 40);
    const ebsIops = ebsType === "io2" ? (seededBool(inst.instanceId + ":iops", 0.6) ? 6000 : 3000) : 0;
    const hasElasticIp = seededBool(inst.instanceId + ":eip", 0.25);
    const elasticIpIdle = hasElasticIp && inferProfile(inst) === "Idle" && seededBool(inst.instanceId + ":eipIdle", 0.7);
    const natGateway = seededBool(inst.instanceId + ":nat", 0.1);
    const alb = seededBool(inst.instanceId + ":alb", 0.12);
    return { ebsType, ebsGB, ebsIops, hasElasticIp, elasticIpIdle, natGateway, alb };
}

// --- THIS FUNCTION IS CORRECT ---
// It ensures MONTHLY and DAILY granularity are consistent. No changes needed here.
function computeComponentsForPeriod(inst: Instance, periodStartISO: string, periodEndISO: string, metric: Metric, usageTypeFilter?: string[], includeFuture?: boolean): UsageComponent[] {
    const spec = instanceSpecs[inst.type] || { pricePerHour: 0, RAM: 4, vCPU: 2, GPU: 0 };
    const profile = inferProfile(inst);
    const signals = profileSignals(inst, profile);
    const infra = seededInfra(inst);
    const allDays = daysBetween(periodStartISO, periodEndISO);
    let totalComputeAmount = 0;
    for (const day of allDays) {
        if (includeFuture === false && new Date(day) > MOCK_TODAY) {
            continue;
        }
        const dayEnd = iso(new Date(new Date(day).getTime() + 24 * 3600 * 1000));
        const dailyOverlapHours = Math.max(0, hoursOverlap(inst.launchTime, day, dayEnd));
        if (dailyOverlapHours <= 0) continue;
        const dailyHoursCap = signals.baseUptime;
        const dailyComputeHours = Math.min(dailyOverlapHours, dailyHoursCap);
        const dailyComputeAmount = metric === "UsageQuantity" ? dailyComputeHours : dailyComputeHours * spec.pricePerHour * seededFloat(inst.instanceId + day, 0.97, 1.05);
        totalComputeAmount += dailyComputeAmount;
    }
    const periodDays = Math.max(0, daysInRange(periodStartISO, periodEndISO));
    const overlapHours = Math.max(0, hoursOverlap(inst.launchTime, periodStartISO, periodEndISO));
    const computeLabel = `BoxUsage:${inst.type}`;
    const gbMonthRate = infra.ebsType === "io2" ? 0.125 : 0.08;
    const ebsCost = metric === "UsageQuantity" ? 0 : infra.ebsGB * gbMonthRate * (periodDays / 30);
    const ebsLabel = infra.ebsType === "io2" && infra.ebsIops > 0 ? "EBS:VolumeUsage.io2" : "EBS:VolumeUsage.gp3";
    const ebsIopsCost = metric === "UsageQuantity" || infra.ebsType !== "io2" || infra.ebsIops <= 0 ? 0 : infra.ebsIops * 0.065 * (periodDays / 30);
    const ebsIopsLabel = "EBS:VolumeP-IOPS.io2";
    const dtGBperDay =
        profile === "Idle"
            ? seededFloat(inst.instanceId + ":dto", 0.2, 1.2)
            : profile === "Under Utilized"
            ? seededFloat(inst.instanceId + ":dto", 1.5, 4.0)
            : profile === "Optimal"
            ? seededFloat(inst.instanceId + ":dto", 6, 14)
            : seededFloat(inst.instanceId + ":dto", 30, 80);
    const dataTransferCost = metric === "UsageQuantity" ? 0 : 0.09 * dtGBperDay * periodDays;
    const dataTransferLabel = "DataTransfer-Out-Bytes";
    const eipCost = metric === "UsageQuantity" || !infra.hasElasticIp ? 0 : (infra.elasticIpIdle ? 0.005 : 0.0) * overlapHours;
    const eipLabel = infra.elasticIpIdle ? "ElasticIP:IdleAddress" : "ElasticIP:InUseAddress";
    const natCost = metric === "UsageQuantity" || !infra.natGateway ? 0 : 0.045 * overlapHours;
    const natLabel = "NatGateway-Hours";
    const cpuCreditsCost = metric === "UsageQuantity" ? 0 : signals.cpuCreditRate * overlapHours;
    const cpuCreditsLabel = "CPUCredits";
    const albCost = metric === "UsageQuantity" || !seededBool(inst.instanceId + ":albUse", 0.18) ? 0 : 0.008 * periodDays;
    const components: UsageComponent[] = [];
    if (totalComputeAmount > 0) components.push({ usageType: computeLabel, amount: totalComputeAmount });
    if (ebsCost > 0) components.push({ usageType: ebsLabel, amount: ebsCost });
    if (ebsIopsCost > 0) components.push({ usageType: ebsIopsLabel, amount: ebsIopsCost });
    if (dataTransferCost > 0) components.push({ usageType: dataTransferLabel, amount: dataTransferCost });
    if (eipCost > 0) components.push({ usageType: eipLabel, amount: eipCost });
    if (natCost > 0) components.push({ usageType: natLabel, amount: natCost });
    if (cpuCreditsCost > 0) components.push({ usageType: cpuCreditsLabel, amount: cpuCreditsCost });
    if (albCost > 0) components.push({ usageType: "LCUUsage", amount: albCost });
    if (usageTypeFilter && usageTypeFilter.length) {
        const set = new Set(usageTypeFilter.map(String));
        return components.filter((c) => set.has(c.usageType));
    }
    return components;
}

// --- (No changes to filters or grouping helpers) ---
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
        if (key === "INSTANCE_FAMILY") return vals.includes(inst.type.split(".")[0]);
        if (key === "USAGE_TYPE") return true;
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
function collectUsageTypeFilterValues(filter: CEFilter): string[] {
    const out: string[] = [];
    if (!filter) return out;
    function walk(f: CEFilter) {
        if (!f) return;
        if ("And" in (f as any)) {
            (f as any).And.forEach(walk);
        } else if ("Dimensions" in (f as any)) {
            const k = (f as any).Dimensions.Key?.toUpperCase?.();
            if (k === "USAGE_TYPE") {
                const vals = (f as any).Dimensions.Values || [];
                for (const v of vals) out.push(String(v));
            }
        }
    }
    walk(filter);
    return out;
}
function rollupBy(keys: string[], inst: Instance, usageTypeForRow?: string): string[] {
    return keys.map((k) => {
        if (k.toUpperCase().startsWith("TAG:")) {
            const tagKey = k.slice(4);
            return inst.tags?.[tagKey] || "(untagged)";
        }
        const up = k.toUpperCase();
        if (up === "REGION") return inst.region;
        if (up === "INSTANCE_TYPE") return inst.type;
        if (up === "INSTANCE_FAMILY") return inst.type.split(".")[0];
        if (up === "USAGE_TYPE") return usageTypeForRow || `BoxUsage:${inst.type}`;
        return "UNKNOWN";
    });
}

export function mockGetCostAndUsage(params: { start: string; end: string; granularity: Granularity; metric: Metric; groupBy?: GroupDef[]; filter?: CEFilter; includeFuture?: boolean }) {
    // By default, behave like the real AWS API: do not include future costs.
    const { start, end, granularity, metric, groupBy = [], filter, includeFuture = false } = params;

    const instances = loadInstances()
        .filter((i) => i.state === "running")
        .filter((i) => matchesFilter(i, filter));

    // Use the 'end' date directly as provided. The client is responsible for
    // providing an exclusive end date, just like with the real AWS API.
    const periods =
        granularity === "DAILY"
            ? daysBetween(start, end).map((d) => ({
                  start: d,
                  end: iso(new Date(new Date(d).getTime() + 24 * 3600 * 1000)),
              }))
            : monthsBetween(start, end);

    const usageTypeFilterVals = collectUsageTypeFilterValues(filter);
    const resultsByTime: any[] = [];

    for (const p of periods) {
        const keyToAmount = new Map<string, number>();
        for (const inst of instances) {
            // Pass the `includeFuture` flag down to the calculation logic.
            const components = computeComponentsForPeriod(inst, p.start, p.end, metric, usageTypeFilterVals.length ? usageTypeFilterVals : undefined, includeFuture);

            if (groupBy.length === 0) {
                const sum = components.reduce((s, c) => s + c.amount, 0);
                keyToAmount.set("__TOTAL__", (keyToAmount.get("__TOTAL__") || 0) + sum);
            } else {
                for (const comp of components) {
                    const keys = rollupBy(
                        groupBy.map((g) => (g.Type === "TAG" ? `TAG:${g.Key}` : g.Key)),
                        inst,
                        comp.usageType
                    ).join("||");
                    keyToAmount.set(keys, (keyToAmount.get(keys) || 0) + comp.amount);
                }
            }
        }
        const periodTotal = Array.from(keyToAmount.values()).reduce((a, b) => a + b, 0);
        if (groupBy.length === 0) {
            resultsByTime.push({
                TimePeriod: { Start: p.start, End: p.end },
                Total: {
                    [metric]: { Amount: String(periodTotal), Unit: metric === "UsageQuantity" ? "Hrs" : "USD" },
                },
                Groups: [],
            });
        } else {
            const groups = Array.from(keyToAmount.entries()).map(([keys, amt]) => ({
                Keys: keys.split("||"),
                Metrics: {
                    [metric]: { Amount: String(amt), Unit: metric === "UsageQuantity" ? "Hrs" : "USD" },
                },
            }));
            resultsByTime.push({
                TimePeriod: { Start: p.start, End: p.end },
                Total: {
                    [metric]: { Amount: String(periodTotal), Unit: metric === "UsageQuantity" ? "Hrs" : "USD" },
                },
                Groups: groups,
            });
        }
    }
    return { ResultsByTime: resultsByTime };
}

// --- (No changes to GetTags or GetDimensionValues) ---

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
export function mockGetDimensionValues(params: { start: string; end: string; key: string }) {
    const { key, start, end } = params;
    const up = key.toUpperCase();
    const instances = loadInstances();
    const vals = new Set<string>();
    if (up === "USAGE_TYPE") {
        const dayStart = daysBetween(start, end)[0] ?? iso(new Date(start));
        const dayEnd = iso(new Date(new Date(dayStart).getTime() + 24 * 3600 * 1000));
        for (const i of instances) {
            const comps = computeComponentsForPeriod(i, dayStart, dayEnd, "UnblendedCost");
            for (const c of comps) vals.add(c.usageType);
        }
    } else {
        for (const i of instances) {
            if (up === "REGION") vals.add(i.region);
            else if (up === "INSTANCE_TYPE") vals.add(i.type);
            else if (up === "INSTANCE_FAMILY") vals.add(i.type.split(".")[0]);
            else if (up === "AVAILABILITY_ZONE") i.availabilityZone && vals.add(i.availabilityZone);
        }
    }
    return {
        DimensionValues: Array.from(vals)
            .sort()
            .map((v) => ({ Value: v })),
    };
}
export function mockFilterPresent(tagKey: string): CEFilter {
    return { Tags: { Key: tagKey, Values: ["*"], MatchOptions: ["EQUALS"] } };
}
export function mockFilterAbsent(tagKey: string): CEFilter {
    return { Tags: { Key: tagKey, MatchOptions: ["ABSENT"] } };
}
