"use client";
import type { CostSidebarProps } from "@/types/cost/cost";
import { CompareSection } from "./compare-section/compare-section";
import OverviewSection from "./overview-section/overview-section";

export default function CostSidebar({
    tab,
    start,
    end,
    onApplyDateRange,
    maxTopSelectable,
    monthA,
    monthB,
    onApplyMonths,
}: CostSidebarProps) {
    return (
        <aside className="w-95 shrink-0 space-y-4">
            <div className="p-3 flex flex-col gap-3">
                {tab === "OVERVIEW" ? (
                    <OverviewSection
                        onApplyDateRange={onApplyDateRange}
                        start={start}
                        end={end}
                        maxTopSelectable={maxTopSelectable ?? 50}
                    />
                ) : (
                    <CompareSection
                        monthA={monthA}
                        monthB={monthB}
                        onApplyMonths={onApplyMonths}
                    />
                )}
            </div>
        </aside>
    );
}
