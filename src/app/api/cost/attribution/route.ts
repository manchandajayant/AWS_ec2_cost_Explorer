import { GetCostAndUsageCommand } from "@aws-sdk/client-cost-explorer";
import { NextRequest } from "next/server";
import { ce, n, parseCommon } from "../_lib/ce-helpers";
import { mockFilterAbsent, mockGetCostAndUsage } from "../_lib/ce-mock";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const { metric, granularity, start, end, u } = parseCommon(req.url);
        const useMock = u.searchParams.get("mock") === "1" || process.env.MOCK_COST === "1";
        const tagKey = u.searchParams.get("tag") || "Team";

        // total
        const totalRes = useMock
            ? mockGetCostAndUsage({ start, end, granularity, metric })
            : await ce.send(new GetCostAndUsageCommand({ TimePeriod: { Start: start, End: end }, Granularity: granularity, Metrics: [metric] }));
        const total = (totalRes.ResultsByTime || []).reduce((s: number, p: any) => s + n(p.Total?.[metric]?.Amount), 0);

        // breakdown by tag
        const groupBy = [{ Type: "TAG", Key: tagKey } as const];
        const br = useMock
            ? mockGetCostAndUsage({ start, end, granularity, metric, groupBy: groupBy as any })
            : await ce.send(new GetCostAndUsageCommand({ TimePeriod: { Start: start, End: end }, Granularity: granularity, Metrics: [metric], GroupBy: groupBy as any }));
        const breakdown = (br.ResultsByTime || [])
            .flatMap((p: any) => (p.Groups || []).map((g: any) => ({ key: g.Keys?.[0] || "(untagged)", amount: n(g.Metrics?.[metric]?.Amount) })))
            .reduce((acc: Record<string, number>, r: any) => ((acc[r.key] = (acc[r.key] || 0) + r.amount), acc), {});
        const attributed = Object.values(breakdown).reduce((s: number, v: any) => s + v, 0);

        // unaccounted (ABSENT)
        const absentRes = useMock
            ? mockGetCostAndUsage({ start, end, granularity, metric, filter: mockFilterAbsent(tagKey) as any })
            : await ce.send(
                  new GetCostAndUsageCommand({
                      TimePeriod: { Start: start, End: end },
                      Granularity: granularity,
                      Metrics: [metric],
                      Filter: { Tags: { Key: tagKey, MatchOptions: ["ABSENT"] } } as any,
                  })
              );
        const unaccounted = (absentRes.ResultsByTime || []).reduce((s: number, p: any) => s + n(p.Total?.[metric]?.Amount), 0);

        const unit = totalRes.ResultsByTime?.[0]?.Total?.[metric]?.Unit || br.ResultsByTime?.[0]?.Groups?.[0]?.Metrics?.[metric]?.Unit || "USD";

        return new Response(
            JSON.stringify({
                tagKey,
                metric,
                unit,
                granularity,
                timePeriod: { start, end },
                total: Number(total.toFixed(6)),
                attributed: Number(attributed.toFixed(6)),
                unaccounted: Number(unaccounted.toFixed(6)),
                breakdown: Object.entries(breakdown)
                    .map(([key, amount]) => ({ key, amount: Number((amount as number).toFixed(6)) }))
                    .sort((a, b) => b.amount - a.amount),
                source: useMock ? "mock" : "ce",
            }),
            { status: 200, headers: { "content-type": "application/json" } }
        );
    } catch (err: any) {
        console.error("[/api/cost/attribution]", err);
        return new Response(JSON.stringify({ error: err?.message || "Failed" }), { status: 500 });
    }
}
