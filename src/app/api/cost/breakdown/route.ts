import { GetCostAndUsageCommand } from "@aws-sdk/client-cost-explorer";
import { NextRequest } from "next/server";
import { buildFilterFromJSON, ce, n, parseCommon, toGroupByDefs } from "../_lib/ce-helpers";
import { mockGetCostAndUsage } from "../_lib/ce-mock";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const { metric, granularity, start, end, u } = parseCommon(req.url);
        const useMock = u.searchParams.get("mock") === "1" || process.env.MOCK_COST === "1";
        const groupByParam = u.searchParams.get("groupBy") || "REGION";
        const groupDefs = toGroupByDefs(groupByParam);
        const filterJSON = u.searchParams.get("filters") || undefined;
        const filter = buildFilterFromJSON(filterJSON);

        const res = useMock
            ? mockGetCostAndUsage({ start, end, granularity, metric, groupBy: groupDefs as any, filter: filter as any })
            : await ce.send(
                  new GetCostAndUsageCommand({
                      TimePeriod: { Start: start, End: end },
                      Granularity: granularity,
                      Metrics: [metric],
                      GroupBy: groupDefs,
                      Filter: filter,
                  })
              );

        const rows = (res.ResultsByTime || []).flatMap((p: any) =>
            (p.Groups || []).map((g: any) => ({
                start: p.TimePeriod?.Start || start,
                end: p.TimePeriod?.End || end,
                keys: g.Keys || [],
                amount: n(g.Metrics?.[metric]?.Amount),
            }))
        );

        const unit = res.ResultsByTime?.[0]?.Groups?.[0]?.Metrics?.[metric]?.Unit || "USD";

        return new Response(
            JSON.stringify({
                metric,
                unit,
                granularity,
                timePeriod: { start, end },
                groupBy: groupByParam
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .slice(0, 2),
                rows: rows.map((r) => ({ ...r, amount: Number(r.amount.toFixed(6)) })),
                source: useMock ? "mock" : "ce",
            }),
            { status: 200, headers: { "content-type": "application/json" } }
        );
    } catch (err: any) {
        console.error("[/api/cost/breakdown]", err);
        return new Response(JSON.stringify({ error: err?.message || "Failed" }), { status: 500 });
    }
}
