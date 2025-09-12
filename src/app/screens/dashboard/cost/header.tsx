import { Tab } from "@/types/cost/cost";
import { FC } from "react";

export const Header: FC<{
    setTab: (tab: Tab) => void;
    tab: Tab;
}> = ({ setTab, tab }) => (
    <>
        <div className="mb-1">
            <h2 className="text-base font-semibold text-gray-900">Costs Attributions</h2>
            <p className="text-sm text-gray-600">Find in detail costs breakup by your deployment regions, instance type, and custom tags.</p>
        </div>

        <div className="flex items-center gap-2">
            <button
                type="button"
                className={`rounded-md px-3 py-2 text-sm font-semibold shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 ${tab === "OVERVIEW" ? "bg-gray-100" : "bg-white"}`}
                onClick={() => setTab("OVERVIEW")}
            >
                Overview
            </button>
            <button
                type="button"
                className={`rounded-md px-3 py-2 text-sm font-semibold shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 ${tab === "COMPARE" ? "bg-gray-100" : "bg-white"}`}
                onClick={() => setTab("COMPARE")}
            >
                Compare
            </button>
        </div>
    </>
);
