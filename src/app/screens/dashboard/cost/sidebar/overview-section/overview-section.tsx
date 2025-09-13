import { ModernDatePicker } from "@/components/date-picker";
import { useFilterSettings } from "../../filter-context";
import { useCostViewSettings } from "../../view-settings-context";
import { SelectTopNComponent, SetChartTypeComponent, SetGranularityComponent, SetGroupByComponent } from "../selection-components";

/**
 * @author
 * @function @OverviewSection
 **/

const OverviewSection = ({ onApplyDateRange, start, end, maxTopSelectable }: any) => {
    const { chartType, setChartType, topN, setTopN } = useCostViewSettings();
    const { activeTagKey, setActiveTagKey, tagKeys, tagValues, selectedTagValues, setSelectedTagValues } = useFilterSettings();
    return (
        <>
            <ModernDatePicker onApply={onApplyDateRange} initialStart={start} initialEnd={end} />

            <SetGranularityComponent />

            <SetGroupByComponent />

            <SetChartTypeComponent />

            {/* Top N selector */}
            <SelectTopNComponent topN={topN} setTopN={setTopN} maxTopSelectable={maxTopSelectable} />

            <div>
                <div className="text-sm font-semibold mb-2">Filter by Tag</div>
                <select className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm" value={activeTagKey} onChange={(e) => setActiveTagKey(e.target.value)}>
                    {tagKeys.map((k: any) => (
                        <option key={k} value={k}>
                            {k}
                        </option>
                    ))}
                </select>
                {!!tagValues.length && (
                    <>
                        <div className="text-xs text-gray-500 mt-2">Values</div>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {tagValues.slice(0, 40).map((v: string) => {
                                const active = selectedTagValues.includes(v);
                                return (
                                    <button
                                        key={v}
                                        className={`rounded-md px-2.5 py-1.5 text-xs shadow-xs ring-1 ring-inset hover:bg-gray-50 ${active ? "bg-gray-100 ring-gray-400" : "bg-white ring-gray-300"}`}
                                        onClick={() => setSelectedTagValues(active ? selectedTagValues.filter((x: string) => x !== v) : [...selectedTagValues, v])}
                                    >
                                        {v}
                                    </button>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </>
    );
};

export default OverviewSection;
