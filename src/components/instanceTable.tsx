"use client";
import { ChevronDown, MoreHorizontal, Cpu, HardDrive, CircuitBoard, Gauge, Clock, DollarSign } from "lucide-react";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";

type InstanceStatus = "Under Utilized" | "Optimal" | "Over Utilized" | "Idle" | "Unknown";

function badgeClasses(status: InstanceStatus) {
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
function statusBorderClass(status: InstanceStatus) {
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

function pct(n: number | null | undefined) {
    if (typeof n !== "number" || !Number.isFinite(n)) return "N/A";
    const clamped = Math.max(0, Math.min(100, n));
    return `${clamped.toFixed(0)}%`;
}
function usd(n: number) {
    return `$${Number(n || 0).toFixed(3)}`;
}

// Utilization color helpers based on status label
function utilBarClass(status: InstanceStatus) {
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
function utilTrackClass(status: InstanceStatus) {
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
function utilTextClass(status: InstanceStatus) {
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
function utilBorderClass(status: InstanceStatus) {
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

// Metric-specific color helpers (mixed cases):
// Red for idle/under, green for optimal, amber for over.
type UtilCategory = "idle_under" | "optimal" | "over" | "unknown";
function metricCategory(value: number | null | undefined): UtilCategory {
    const v = typeof value === "number" && Number.isFinite(value) ? value : null;
    if (v === null) return "unknown";
    if (v < 3) return "idle_under"; // idle
    if (v < 40) return "idle_under"; // under-utilized
    if (v > 70) return "over"; // over-utilized
    return "optimal"; // 40-70
}
function metricBarClassFromValue(value: number | null | undefined) {
    const c = metricCategory(value);
    if (c === "idle_under") return "bg-red-500";
    if (c === "optimal") return "bg-green-500";
    if (c === "over") return "bg-amber-500";
    return "bg-slate-400";
}
function metricTrackClassFromValue(value: number | null | undefined) {
    const c = metricCategory(value);
    if (c === "idle_under") return "bg-red-100";
    if (c === "optimal") return "bg-green-100";
    if (c === "over") return "bg-amber-100";
    return "bg-slate-200";
}
function metricTextClassFromValue(value: number | null | undefined) {
    const c = metricCategory(value);
    if (c === "idle_under") return "text-red-600";
    if (c === "optimal") return "text-green-600";
    if (c === "over") return "text-amber-600";
    return "text-slate-600";
}
function metricBorderClassFromValue(value: number | null | undefined) {
    const c = metricCategory(value);
    if (c === "idle_under") return "border-red-200";
    if (c === "optimal") return "border-green-200";
    if (c === "over") return "border-amber-200";
    return "border-slate-200";
}

// ---------- Multi-sort controls ----------
type SortableKey = "statusLabel" | "region" | "type";
type Direction = "asc" | "desc";

const SORT_OPTIONS: { label: string; value: SortableKey }[] = [
    { label: "Status", value: "statusLabel" },
    { label: "Region", value: "region" },
    { label: "Instance Type", value: "type" },
];

// Basic multiselect with checkboxes (selection order = priority)
function MultiSelect({ label, options, selected, onChange }: { label: string; options: { label: string; value: SortableKey }[]; selected: SortableKey[]; onChange: (values: SortableKey[]) => void }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const onDoc = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, []);
    const toggle = (v: SortableKey) => {
        if (selected.includes(v)) onChange(selected.filter((x) => x !== v));
        else onChange([...selected, v]);
    };
    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm text-left flex justify-between items-center text-slate-700 hover:bg-slate-50"
            >
                <span>
                    {label}
                    {selected.length > 0 ? ` (${selected.length})` : ""}
                </span>
                <ChevronDown size={16} className={`transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            {open && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {options.map((opt) => (
                        <label key={opt.value} className="px-3 py-2 text-sm hover:bg-slate-100 cursor-pointer flex items-center text-slate-700">
                            <input type="checkbox" className="mr-2" checked={selected.includes(opt.value)} onChange={() => toggle(opt.value)} />
                            {opt.label}
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function InstancesTable({ instances }: { instances: any[] }) {
    // Multi-sort state
    const [sortKeys, setSortKeys] = useState<SortableKey[]>(["statusLabel"]); // default by Status
    const [directions, setDirections] = useState<Record<SortableKey, Direction>>({
        statusLabel: "asc",
        region: "asc",
        type: "asc",
    });
    // Expandable details rows
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const toggleExpanded = (id: string) => setExpanded((e) => ({ ...e, [id]: !e[id] }));

    // Simple progress bar for percentages with customizable colors
    const Bar = ({ value, barClass = "bg-blue-500", trackClass = "bg-slate-200" }: { value: number | null | undefined; barClass?: string; trackClass?: string }) => {
        const v = typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : null;
        return (
            <div className={`h-2 w-full rounded-full ${trackClass}`}>
                {v !== null && <div className={`h-2 rounded-full ${barClass}`} style={{ width: `${v}%` }} />}
            </div>
        );
    };

    const moveUp = (k: SortableKey) => {
        const i = sortKeys.indexOf(k);
        if (i > 0) {
            const next = [...sortKeys];
            [next[i - 1], next[i]] = [next[i], next[i - 1]];
            setSortKeys(next);
        }
    };
    const moveDown = (k: SortableKey) => {
        const i = sortKeys.indexOf(k);
        if (i !== -1 && i < sortKeys.length - 1) {
            const next = [...sortKeys];
            [next[i + 1], next[i]] = [next[i], next[i + 1]];
            setSortKeys(next);
        }
    };
    const toggleDir = (k: SortableKey) => setDirections((d) => ({ ...d, [k]: d[k] === "asc" ? "desc" : "asc" }));

    const sorted = useMemo(() => {
        const arr = [...instances];
        const normalizeStatus = (s: string): number => {
            // deterministic status order for textual sort: Idle < Under Utilized < Optimal < Over Utilized < Unknown
            const order: Record<string, number> = {
                Idle: 0,
                "Under Utilized": 1,
                Optimal: 2,
                "Over Utilized": 3,
                Unknown: 4,
            };
            return order[s] ?? 99;
        };
        const cmp = (a: any, b: any, key: SortableKey): number => {
            let av = a[key];
            let bv = b[key];
            if (key === "statusLabel") {
                av = normalizeStatus(av);
                bv = normalizeStatus(bv);
            } else {
                av = String(av ?? "").toLowerCase();
                bv = String(bv ?? "").toLowerCase();
            }
            if (av < bv) return -1;
            if (av > bv) return 1;
            return 0;
        };
        arr.sort((a, b) => {
            for (const key of sortKeys) {
                const dir = directions[key] === "asc" ? 1 : -1;
                const r = cmp(a, b, key) * dir;
                if (r !== 0) return r;
            }
            return 0;
        });
        return arr;
    }, [instances, sortKeys, directions]);

    return (
        <div className="bg-white rounded-xl shadow-md p-3">
            {/* Header */}
            <div className="sm:flex sm:items-center mb-4">
                <div className="sm:flex-auto">
                    <h1 className="text-base font-semibold text-foreground">EC2 Instances</h1>
                    <p className="mt-2 text-sm text-muted-foreground">Inventory of instances with status, specs, cost rate, uptime, and 7-day utilization.</p>
                </div>
            </div>

            {/* Sorting controls */}
            <div className="mb-4 bg-card border rounded-lg p-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <MultiSelect label="Sort by (pick 1–3)" options={SORT_OPTIONS} selected={sortKeys} onChange={setSortKeys} />
                    <div className="md:col-span-2 flex items-center flex-wrap gap-2">
                        {sortKeys.map((k, i) => (
                            <div key={k} className="flex items-center gap-2 border border-slate-300 rounded-full pl-2 pr-1 py-1 bg-white" title={`Priority ${i + 1}`}>
                                <span className="text-xs text-slate-600">{SORT_OPTIONS.find((o) => o.value === k)?.label}</span>
                                <button type="button" className="rounded-md px-2 py-0.5 text-xs bg-slate-100 hover:bg-slate-200" onClick={() => toggleDir(k)}>
                                    {directions[k] === "asc" ? "A→Z" : "Z→A"}
                                </button>
                                <div className="flex">
                                    <button type="button" className="rounded-l-md px-2 py-0.5 text-xs bg-slate-100 hover:bg-slate-200" onClick={() => moveUp(k)} disabled={i === 0}>
                                        ▲
                                    </button>
                                    <button type="button" className="rounded-r-md px-2 py-0.5 text-xs bg-slate-100 hover:bg-slate-200" onClick={() => moveDown(k)} disabled={i === sortKeys.length - 1}>
                                        ▼
                                    </button>
                                </div>
                            </div>
                        ))}
                        {sortKeys.length === 0 && <span className="text-xs text-slate-500">No sort selected — showing original order.</span>}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-card border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-gray-50">
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ID</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Region</th>
                                <th className="px-4 py-3 text-right"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {sorted.map((it: any) => (
                                <Fragment key={it.id}>
                                <tr className="border-b border-border hover:bg-muted/50">
                                        <td className={`px-4 py-3 font-medium text-foreground whitespace-nowrap ${statusBorderClass(it.statusLabel as InstanceStatus)}`}>{it.id}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span title={it.statusReason} className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${badgeClasses(it.statusLabel as InstanceStatus)}`}>
                                                {it.statusLabel}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-foreground whitespace-nowrap">{it.type}</td>
                                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{it.region}</td>
                                        <td className="px-4 py-3 text-right whitespace-nowrap">
                                            <button
                                                type="button"
                                                aria-label={`Details for ${it.id}`}
                                                className="rounded-md p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                                onClick={() => toggleExpanded(it.id)}
                                            >
                                                <MoreHorizontal size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                    {expanded[it.id] && (
                                        <tr className="border-b border-border bg-gray-50/60">
                                            <td colSpan={5} className="px-4 py-3">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                                    <div className="flex items-center gap-3 rounded-md border bg-white px-3 py-2 border-indigo-200">
                                                        <Cpu size={16} className="text-indigo-600" />
                                                        <div className="text-sm"><div className="text-muted-foreground">vCPU</div><div className="font-medium text-foreground">{it.vcpu}</div></div>
                                                    </div>
                                                    <div className="flex items-center gap-3 rounded-md border bg-white px-3 py-2 border-emerald-200">
                                                        <HardDrive size={16} className="text-emerald-600" />
                                                        <div className="text-sm"><div className="text-muted-foreground">RAM</div><div className="font-medium text-foreground">{it.ramGB} GB</div></div>
                                                    </div>
                                                    <div className="flex items-center gap-3 rounded-md border bg-white px-3 py-2 border-purple-200">
                                                        <CircuitBoard size={16} className="text-purple-600" />
                                                        <div className="text-sm"><div className="text-muted-foreground">GPU</div><div className="font-medium text-foreground">{it.gpu ?? 0}</div></div>
                                                    </div>
                                                    <div className="flex items-center gap-3 rounded-md border bg-white px-3 py-2 border-amber-200">
                                                        <DollarSign size={16} className="text-amber-600" />
                                                        <div className="text-sm"><div className="text-muted-foreground">$ / hr</div><div className="font-medium text-foreground">{usd(it.pricePerHour)}</div></div>
                                                    </div>
                                                    <div className="flex items-center gap-3 rounded-md border bg-white px-3 py-2 border-sky-200">
                                                        <Clock size={16} className="text-sky-600" />
                                                        <div className="text-sm"><div className="text-muted-foreground">Uptime (h)</div><div className="font-medium text-foreground">{it.uptimeHours}</div></div>
                                                    </div>
                                                    <div className={`rounded-md border bg-white px-3 py-2 ${metricBorderClassFromValue(it.cpuAvg7d)}`}>
                                                        <div className="flex items-center gap-2 text-sm mb-1"><Gauge size={16} className={metricTextClassFromValue(it.cpuAvg7d)} /><span className="text-muted-foreground">CPU avg (7d)</span><span className="ml-auto font-medium text-foreground">{pct(it.cpuAvg7d)}</span></div>
                                                        <Bar value={typeof it.cpuAvg7d === "number" ? it.cpuAvg7d : null} barClass={metricBarClassFromValue(it.cpuAvg7d)} trackClass={metricTrackClassFromValue(it.cpuAvg7d)} />
                                                    </div>
                                                    <div className={`rounded-md border bg-white px-3 py-2 ${metricBorderClassFromValue(it.memAvg7d)}`}>
                                                        <div className="flex items-center gap-2 text-sm mb-1"><Gauge size={16} className={metricTextClassFromValue(it.memAvg7d)} /><span className="text-muted-foreground">Mem avg (7d)</span><span className="ml-auto font-medium text-foreground">{pct(it.memAvg7d)}</span></div>
                                                        <Bar value={typeof it.memAvg7d === "number" ? it.memAvg7d : null} barClass={metricBarClassFromValue(it.memAvg7d)} trackClass={metricTrackClassFromValue(it.memAvg7d)} />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            ))}
                            {sorted.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                                        No instances to display.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
