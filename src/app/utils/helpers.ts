import { InstanceStatus, SortableKey, UtilCategory } from "@/types/ec2/types";

export const iso = (d: Date) => d.toISOString().slice(0, 10);

export const startOfMonth = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), 1);

export const addDaysISO = (isoDate: string, n: number) => {
    const d = new Date(isoDate);
    d.setDate(d.getDate() + n);
    return iso(d);
};

export const fmtUSD = (n: number) => {
    return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
};

export function badgeClasses(status: InstanceStatus) {
    switch (status) {
        case "Optimal":
            return "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20";
        case "Idle":
            return "bg-red-200 text-red-700 ring-1 ring-inset ring-red-700/30";
        case "Over Utilized":
            return "bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20";
        case "Under Utilized":
            return "bg-red-100 text-red-500 ring-1 ring-inset ring-red-500/20";
        case "Unknown":
            return "bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-500/20";
        default:
            return "bg-gray-100 text-slate-700 ring-1 ring-inset ring-slate-400/30";
    }
}

// Left status bar
export function statusBorderClass(status: InstanceStatus) {
    switch (status) {
        case "Optimal":
            return "border-l-4 border-green-500/70";
        case "Idle":
            return "border-l-4 border-red-500/70";
        case "Over Utilized":
            return "border-l-4 border-yellow-500/70";
        case "Under Utilized":
            return "border-l-4 border-red-400/70";
        case "Unknown":
            return "border-l-4 border-gray-400/70";
        default:
            return "border-l-4 border-slate-300/70";
    }
}

export function pct(n: number | null | undefined) {
    if (typeof n !== "number" || !Number.isFinite(n)) return "N/A";
    const clamped = Math.max(0, Math.min(100, n));
    return `${clamped.toFixed(0)}%`;
}

export function usd(n: number) {
    return `$${Number(n || 0).toFixed(3)}`;
}

// Utilization color helpers based on status label
export function utilBarClass(status: InstanceStatus) {
    switch (status) {
        case "Idle":
        case "Under Utilized":
            return "bg-red-500";
        case "Optimal":
            return "bg-green-500";
        case "Over Utilized":
            return "bg-amber-500"; // dark yellow / orange
        case "Unknown":
        default:
            return "bg-slate-400";
    }
}
export function utilTrackClass(status: InstanceStatus) {
    switch (status) {
        case "Idle":
        case "Under Utilized":
            return "bg-red-100";
        case "Optimal":
            return "bg-green-100";
        case "Over Utilized":
            return "bg-amber-100";
        case "Unknown":
        default:
            return "bg-slate-200";
    }
}
export function utilTextClass(status: InstanceStatus) {
    switch (status) {
        case "Idle":
        case "Under Utilized":
            return "text-red-600";
        case "Optimal":
            return "text-green-600";
        case "Over Utilized":
            return "text-amber-600";
        case "Unknown":
        default:
            return "text-slate-600";
    }
}
export function utilBorderClass(status: InstanceStatus) {
    switch (status) {
        case "Idle":
        case "Under Utilized":
            return "border-red-200";
        case "Optimal":
            return "border-green-200";
        case "Over Utilized":
            return "border-amber-200";
        case "Unknown":
        default:
            return "border-slate-200";
    }
}

export function metricCategory(value: number | null | undefined): UtilCategory {
    const v = typeof value === "number" && Number.isFinite(value) ? value : null;
    if (v === null) return "unknown";
    if (v < 3) return "idle_under"; // idle
    if (v < 40) return "idle_under"; // under-utilized
    if (v > 70) return "over"; // over-utilized
    return "optimal"; // 40-70
}
export function metricBarClassFromValue(value: number | null | undefined) {
    const c = metricCategory(value);
    if (c === "idle_under") return "bg-red-500";
    if (c === "optimal") return "bg-green-500";
    if (c === "over") return "bg-amber-500";
    return "bg-slate-400";
}
export function metricTrackClassFromValue(value: number | null | undefined) {
    const c = metricCategory(value);
    if (c === "idle_under") return "bg-red-100";
    if (c === "optimal") return "bg-green-100";
    if (c === "over") return "bg-amber-100";
    return "bg-slate-200";
}
export function metricTextClassFromValue(value: number | null | undefined) {
    const c = metricCategory(value);
    if (c === "idle_under") return "text-red-600";
    if (c === "optimal") return "text-green-600";
    if (c === "over") return "text-amber-600";
    return "text-slate-600";
}
export function metricBorderClassFromValue(value: number | null | undefined) {
    const c = metricCategory(value);
    if (c === "idle_under") return "border-red-200";
    if (c === "optimal") return "border-green-200";
    if (c === "over") return "border-amber-200";
    return "border-slate-200";
}

export const SORT_OPTIONS: { label: string; value: SortableKey }[] = [
    { label: "Status", value: "statusLabel" },
    { label: "Region", value: "region" },
    { label: "Instance Type", value: "type" },
];

export function parseYYYYMM(s?: string): { year: number; month: number } {
    if (!s) {
        const d = new Date();
        return { year: d.getFullYear(), month: d.getMonth() };
    }
    const [y, m] = s.split("-").map((x) => parseInt(x, 10));
    return { year: isNaN(y) ? new Date().getFullYear() : y, month: isNaN(m) ? new Date().getMonth() : Math.min(11, Math.max(0, (m || 1) - 1)) };
}

export function toYYYYMM(year: number, monthIndex: number): string {
    return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

export const todayISO = () => new Date().toISOString().slice(0, 10);
export const addDays = (iso: string, d: number) => {
    const dt = new Date(iso);
    dt.setDate(dt.getDate() + d);
    return dt.toISOString().slice(0, 10);
};
export const last30 = () => ({ start: addDays(todayISO(), -30), end: todayISO() });
