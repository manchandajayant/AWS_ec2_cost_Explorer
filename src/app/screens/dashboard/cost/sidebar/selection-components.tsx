import { useCostViewSettings } from "../view-settings-context";

export const SetGranularityComponent = () => {
    const { granularity, setGranularity } = useCostViewSettings();
    return (
        <div>
            <div className="text-sm font-semibold mb-2">Granularity</div>
            <div className="grid grid-cols-2 gap-2">
                <button
                    className={`rounded-md px-3 py-2 text-sm shadow-xs ring-1 ring-inset hover:bg-gray-50 ${granularity === "DAILY" ? "bg-gray-100 ring-gray-400" : "bg-white ring-gray-300"}`}
                    onClick={() => setGranularity("DAILY")}
                >
                    Daily
                </button>
                <button
                    className={`rounded-md px-3 py-2 text-sm shadow-xs ring-1 ring-inset hover:bg-gray-50 ${granularity === "MONTHLY" ? "bg-gray-100 ring-gray-400" : "bg-white ring-gray-300"}`}
                    onClick={() => setGranularity("MONTHLY")}
                >
                    Monthly
                </button>
            </div>
        </div>
    );
};

export const SetGroupByComponent = () => {
    const { groupBy, setGroupBy } = useCostViewSettings();
    return (
        <div>
            <div className="text-sm font-semibold mb-2">Group By</div>
            <div className="grid grid-cols-3 gap-2">
                <button
                    className={`rounded-md px-3 py-2 text-sm shadow-xs ring-1 ring-inset hover:bg-gray-50 ${groupBy === "REGION" ? "bg-gray-100 ring-gray-400" : "bg-white ring-gray-300"}`}
                    onClick={() => setGroupBy("REGION")}
                >
                    Region
                </button>
                <button
                    className={`rounded-md px-3 py-2 text-sm shadow-xs ring-1 ring-inset hover:bg-gray-50 ${groupBy === "INSTANCE_TYPE" ? "bg-gray-100 ring-gray-400" : "bg-white ring-gray-300"}`}
                    onClick={() => setGroupBy("INSTANCE_TYPE")}
                >
                    Instance Type
                </button>
                <button
                    className={`rounded-md px-3 py-2 text-sm shadow-xs ring-1 ring-inset hover:bg-gray-50 ${groupBy === "USAGE_TYPE" ? "bg-gray-100 ring-gray-400" : "bg-white ring-gray-300"}`}
                    onClick={() => setGroupBy("USAGE_TYPE")}
                >
                    Usage Type
                </button>
            </div>
        </div>
    );
};

export const SetChartTypeComponent = () => {
    const { chartType, setChartType } = useCostViewSettings();
    return (
        <div>
            <div className="text-sm font-semibold mb-2">Chart Type</div>
            <div className="grid grid-cols-2 gap-2">
                <button
                    className={`rounded-md px-3 py-2 text-sm shadow-xs ring-1 ring-inset hover:bg-gray-50 ${chartType === "bar" ? "bg-gray-100 ring-gray-400" : "bg-white ring-gray-300"}`}
                    onClick={() => setChartType("bar")}
                >
                    Bar
                </button>
                <button
                    className={`rounded-md px-3 py-2 text-sm shadow-xs ring-1 ring-inset hover:bg-gray-50 ${chartType === "line" ? "bg-gray-100 ring-gray-400" : "bg-white ring-gray-300"}`}
                    onClick={() => setChartType("line")}
                >
                    Line
                </button>
            </div>
        </div>
    );
};

export const SelectTopNComponent = ({ topN, setTopN, maxTopSelectable }: any) => {
    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold">Top N</div>
                <label className="flex items-center gap-2 text-xs text-gray-600">
                    <input
                        type="checkbox"
                        className="rounded border-gray-300"
                        checked={topN === "ALL"}
                        onChange={(e) => setTopN(e.target.checked ? "ALL" : Math.min(typeof topN === "number" ? topN : 10, maxTopSelectable))}
                    />
                    All
                </label>
            </div>
            <div className="mt-1">
                <input
                    type="range"
                    min={1}
                    max={maxTopSelectable}
                    step={1}
                    value={topN === "ALL" ? maxTopSelectable : topN}
                    onChange={(e) => setTopN(parseInt(e.target.value, 10))}
                    disabled={topN === "ALL"}
                    className="w-full accent-black"
                />
                <div className="mt-1 flex justify-between text-[10px] text-gray-500">
                    <span>1</span>
                    <span>{maxTopSelectable}</span>
                </div>
                <div className="mt-1 text-xs text-gray-600">
                    Showing top {topN === "ALL" ? "All" : topN} of {maxTopSelectable}
                </div>
            </div>
        </div>
    );
};
