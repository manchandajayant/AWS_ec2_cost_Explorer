"use client";
import { ChevronDown, Filter, X } from "lucide-react";
import { FC, useEffect, useMemo, useRef, useState } from "react";

export interface MultiSelectProps {
    label: string;
    options: string[];
    selected: string[];
    onChange: (values: string[]) => void;
}

const MultiSelect: FC<MultiSelectProps> = ({ label, options, selected, onChange }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement | null>(null);

    const isAllSelected = selected.length === 0 || selected.length === options.length;

    const displayChips = useMemo(() => {
        if (isAllSelected) return [];
        return selected.slice(0, 3);
    }, [isAllSelected, selected]);

    const remaining = Math.max(0, selected.length - displayChips.length);

    const toggleOption = (value: string) => {
        if (selected.includes(value)) {
            onChange(selected.filter((v) => v !== value));
        } else {
            onChange([...selected, value]);
        }
    };

    const clearAll = () => onChange([]);
    const selectAll = () => {
        if (selected.length !== options.length) {
            onChange(options);
        }
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEsc);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEsc);
        };
    }, []);

    return (
        <div className="relative inline-block text-left" ref={ref}>
            {/* Trigger */}
            <div
                role="button"
                tabIndex={0}
                onClick={() => setOpen((o) => !o)}
                className="w-full bg-background text-foreground border border-border rounded-md px-3 py-2 text-sm min-w-[260px] flex items-center gap-2 cursor-pointer"
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                <Filter size={14} className="text-muted-foreground" />
                <div className="flex-1 flex items-center gap-1 flex-wrap">
                    <span className="text-muted-foreground mr-1">{label}:</span>
                    {isAllSelected ? (
                        <span className="text-muted-foreground">All</span>
                    ) : (
                        <>
                            {displayChips.map((chip) => (
                                <span
                                    key={chip}
                                    className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 text-xs"
                                >
                                    {chip}
                                    <span
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleOption(chip);
                                        }}
                                        className="cursor-pointer text-muted-foreground hover:text-foreground"
                                        role="button"
                                        aria-label={`Remove ${chip}`}
                                    >
                                        <X size={12} />
                                    </span>
                                </span>
                            ))}
                            {remaining > 0 && (
                                <span className="inline-flex items-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 text-xs">
                                    +{remaining}
                                </span>
                            )}
                        </>
                    )}
                </div>
                <ChevronDown size={14} className="text-muted-foreground" />
            </div>

            {/* Dropdown */}
            {open && (
                <div className="absolute z-10 mt-2 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md shadow p-2 max-h-64 overflow-auto z-40">
                    <div className="flex items-center justify-between px-2 py-1 text-xs text-muted-foreground">
                        <button className="underline hover:text-foreground" onClick={selectAll} type="button">
                            Select all
                        </button>
                        <button className="underline hover:text-foreground" onClick={clearAll} type="button">
                            Clear
                        </button>
                    </div>
                    <div className="h-px my-1 bg-slate-200 dark:bg-slate-700" />
                    {options.map((opt) => {
                        const checked = selected.includes(opt);
                        return (
                            <label key={opt} className="flex items-center gap-2 px-2 py-1 text-sm cursor-pointer rounded hover:bg-slate-50 dark:hover:bg-slate-800/60">
                                <input type="checkbox" className="h-4 w-4 accent-blue-600" checked={checked} onChange={() => toggleOption(opt)} />
                                <span className="truncate" title={opt}>
                                    {opt}
                                </span>
                            </label>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MultiSelect;
