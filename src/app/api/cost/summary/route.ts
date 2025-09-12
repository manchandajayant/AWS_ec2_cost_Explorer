import { mockGetCostAndUsage } from "@/app/api/cost/_lib/ce-mock";
import { GetCostAndUsageCommand } from "@aws-sdk/client-cost-explorer";
import { NextRequest } from "next/server";
import { ce, n, parseCommon } from "../_lib/ce-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const { metric, granularity, start, end, u } = parseCommon(req.url);
        const useMock = u.searchParams.get("mock") === "1" || process.env.MOCK_COST === "1";

        const res = useMock
            ? mockGetCostAndUsage({ start, end, granularity, metric })
            : await ce.send(
                  new GetCostAndUsageCommand({
                      TimePeriod: { Start: start, End: end },
                      Granularity: granularity,
                      Metrics: [metric],
                  })
              );

        const byTime = (res.ResultsByTime || []).map((p: any) => ({
            start: p.TimePeriod?.Start || start,
            end: p.TimePeriod?.End || end,
            amount: n(p.Total?.[metric]?.Amount),
        }));
        const total = byTime.reduce((s: number, r: any) => s + r.amount, 0);
        const unit = res.ResultsByTime?.[0]?.Total?.[metric]?.Unit || "USD";

        return new Response(
            JSON.stringify({
                metric,
                unit,
                granularity,
                timePeriod: { start, end },
                total: Number(total.toFixed(6)),
                byTime: byTime.map((pt: any) => ({ ...pt, amount: Number(pt.amount.toFixed(6)) })),
                source: useMock ? "mock" : "ce",
            }),
            { status: 200, headers: { "content-type": "application/json" } }
        );
    } catch (err: any) {
        console.error("[/api/cost/summary]", err);
        return new Response(JSON.stringify({ error: err?.message || "Failed" }), { status: 500 });
    }
}
