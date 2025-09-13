import { fmtUSD } from "@/app/utils/helpers";
import { CostAttribution } from "@/types/cost/cost";

type CostAttributionSectionProps = {
    activeTagKey: string;
    activeDimKey: "REGION" | "INSTANCE_TYPE" | "INSTANCE_FAMILY" | "USAGE_TYPE";
    attrCoverage: CostAttribution | null;
};

const CostAttributionSection: React.FC<CostAttributionSectionProps> = ({ activeTagKey, activeDimKey, attrCoverage }) => {
    return (
        <div className="mt-6">
            <section className="rounded-xl border border-gray-200 p-4">
                <div className="mb-2">
                    <h3 className="text-sm font-semibold text-gray-900">Cost Breakdowns</h3>
                    <p className="text-xs text-gray-600">Breakdown of costs by the selected tag from the sidebar.</p>
                </div>
                {!activeTagKey ? (
                    <div className="text-xs text-gray-500">Select a Tag key in the sidebar to see attribution breakdown.</div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Left column: Tag table */}
                        <section className="rounded-xl border border-gray-200 p-4">
                            <div className="text-xs text-gray-600 mb-2">
                                Tag: <b>{activeTagKey}</b>
                                {attrCoverage && (
                                    <>
                                        <span className="mx-2 text-gray-400">•</span>
                                        Attributed {fmtUSD(attrCoverage.attributed)} of {fmtUSD(attrCoverage.total)}
                                    </>
                                )}
                            </div>
                            {attrCoverage ? (
                                <div className="max-h-72 overflow-y-auto border rounded-lg">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="py-3.5 pr-3 pl-4 text-left text-xs font-semibold text-gray-900 sm:pl-6">Value</th>
                                                <th className="px-3 py-3.5 text-right text-xs font-semibold text-gray-900">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 bg-white">
                                            {(() => {
                                                const rows = attrCoverage.breakdown.slice().sort((a: any, b: any) => b.amount - a.amount);
                                                const maxVal = rows.length ? Math.max(...rows.map((r: any) => r.amount)) : 0;
                                                return rows.map((row: any) => {
                                                    const isMax = row.amount === maxVal;
                                                    return (
                                                        <tr key={row.key}>
                                                            <td className="py-3 pr-3 pl-4 text-sm text-gray-900 whitespace-nowrap sm:pl-6">{row.key || "(untagged)"}</td>
                                                            <td className={`px-3 py-3 text-sm whitespace-nowrap text-right ${isMax ? "text-red-600 font-semibold" : "text-gray-900"}`}>{fmtUSD(row.amount)}</td>
                                                        </tr>
                                                    );
                                                });
                                            })()}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-xs text-gray-500">Loading attribution…</div>
                            )}
                        </section>

                        {/* Right column: Attribution summary */}
                        <section className="rounded-xl border border-gray-200 p-4">
                            {attrCoverage && (
                                <div className="space-y-3">
                                    <div>
                                        <div className="text-sm font-semibold text-gray-800">Attribution for Tag: '{attrCoverage.tagKey}'</div>
                                        <div className="text-xs text-gray-500">Total cost for the selected period.</div>
                                    </div>
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-sm font-medium text-gray-600">Total</span>
                                        <span className="text-lg font-semibold text-gray-900">{fmtUSD(attrCoverage.total)}</span>
                                    </div>
                                    <div className="w-full flex h-3 rounded-full overflow-hidden bg-gray-200">
                                        <div
                                            className="bg-sky-500"
                                            style={{ width: `${(attrCoverage.attributed / Math.max(1, attrCoverage.total)) * 100}%` }}
                                            title={`Attributed: ${fmtUSD(attrCoverage.attributed)}`}
                                        ></div>
                                        <div
                                            className="bg-slate-400"
                                            style={{ width: `${(attrCoverage.unaccounted / Math.max(1, attrCoverage.total)) * 100}%` }}
                                            title={`Unaccounted: ${fmtUSD(attrCoverage.unaccounted)}`}
                                        ></div>
                                    </div>
                                    <div className="space-y-2 text-xs">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-sky-500"></div>
                                                <span className="text-gray-700">Attributed</span>
                                            </div>
                                            <span className="font-medium text-gray-800">{fmtUSD(attrCoverage.attributed)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                                                <span className="text-gray-700">Unaccounted</span>
                                            </div>
                                            <span className="font-medium text-gray-800">{fmtUSD(attrCoverage.unaccounted)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </section>
                    </div>
                )}
            </section>
        </div>
    );
};

export default CostAttributionSection;
