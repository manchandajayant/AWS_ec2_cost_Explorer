"use client";
import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

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
        <div className="px-4 sm:px-6 lg:px-8">
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
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">vCPU</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">RAM</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">GPU</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">$ / hr</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Uptime (h)</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">CPU avg (7d)</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Mem avg (7d)</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {sorted.map((it: any) => (
                                <tr key={it.id} className="border-b border-border hover:bg-muted/50">
                                    <td className={`px-4 py-3 font-medium text-foreground whitespace-nowrap ${statusBorderClass(it.statusLabel as InstanceStatus)}`}>{it.id}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span title={it.statusReason} className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${badgeClasses(it.statusLabel as InstanceStatus)}`}>
                                            {it.statusLabel}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-foreground whitespace-nowrap">{it.type}</td>
                                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{it.region}</td>
                                    <td className="px-4 py-3 text-foreground whitespace-nowrap">{it.vcpu}</td>
                                    <td className="px-4 py-3 text-foreground whitespace-nowrap">{it.ramGB} GB</td>
                                    <td className="px-4 py-3 text-foreground whitespace-nowrap">{it.gpu ?? 0}</td>
                                    <td className="px-4 py-3 text-foreground whitespace-nowrap">{usd(it.pricePerHour)}</td>
                                    <td className="px-4 py-3 text-foreground whitespace-nowrap">{it.uptimeHours}</td>
                                    <td className="px-4 py-3 text-foreground whitespace-nowrap">{pct(it.cpuAvg7d)}</td>
                                    <td className="px-4 py-3 text-foreground whitespace-nowrap">{pct(it.memAvg7d)}</td>
                                    <td className="px-4 py-3 text-right whitespace-nowrap">
                                        <button
                                            type="button"
                                            className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50"
                                            onClick={() => console.log("Details for", it.id)}
                                        >
                                            Details<span className="sr-only">, {it.id}</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {sorted.length === 0 && (
                                <tr>
                                    <td colSpan={12} className="px-4 py-6 text-center text-muted-foreground">
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
