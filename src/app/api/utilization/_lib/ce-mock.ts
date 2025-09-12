// Deterministic hash → [0, 1)
function hash01(str: string): number {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    // map to [0,1)
    return ((h >>> 0) % 10000) / 10000;
}

type Bucket = "idle" | "under" | "optimal" | "over";

function sampleFromBucket(bucket: Bucket, r: number) {
    const jitter = (span: number) => (r - 0.5) * span;

    if (bucket === "idle") {
        const cpu = 1.5 + 1.5 * r; // ~1.5–3.0%
        const mem = 8 + 4 * r + jitter(1.5); // ~8–12%
        return { cpuAvg: Number(cpu.toFixed(2)), memAvg: Math.max(4, Number(mem.toFixed(2))) };
    }
    if (bucket === "under") {
        const cpu = 6 + 8 * r; // ~6–14%
        const mem = 15 + 8 * r + jitter(2); // ~15–23%
        return { cpuAvg: Number(cpu.toFixed(2)), memAvg: Math.max(8, Number(mem.toFixed(2))) };
    }
    if (bucket === "optimal") {
        const cpu = 28 + 24 * r; // ~28–52%
        const mem = 38 + 18 * r + jitter(3); // ~38–56%
        return { cpuAvg: Number(cpu.toFixed(2)), memAvg: Math.max(20, Number(mem.toFixed(2))) };
    }
    // over
    const cpu = 75 + 18 * r; // ~75–93%
    const mem = 70 + 20 * r + jitter(3); // ~70–90%
    return { cpuAvg: Math.min(99, Number(cpu.toFixed(2))), memAvg: Math.min(98, Number(mem.toFixed(2))) };
}

/**
 * Pick a bucket deterministically from instanceId unless `force` is present.
 * The distribution is skewed towards optimal with some idle/under/over.
 */
export function mockUtilization(instanceId: string, force?: string) {
    const f = (force || "").toLowerCase();
    if (f === "idle" || f === "under" || f === "optimal" || f === "over") {
        const r = hash01(instanceId + ":forced");
        return sampleFromBucket(f as Bucket, r);
    }

    const r = hash01(instanceId);
    // bucket split: 15% idle, 25% under, 45% optimal, 15% over
    let bucket: Bucket;
    if (r < 0.25) bucket = "idle";
    else if (r < 0.5) bucket = "under";
    else if (r < 0.65) bucket = "optimal";
    else bucket = "over";

    return sampleFromBucket(bucket, hash01(instanceId + ":noise"));
}
