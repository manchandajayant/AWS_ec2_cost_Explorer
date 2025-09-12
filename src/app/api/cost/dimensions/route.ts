import { GetDimensionValuesCommand } from "@aws-sdk/client-cost-explorer";
import { NextRequest } from "next/server";
import { ce, parseCommon } from "../_lib/ce-helpers";
import { mockGetDimensionValues } from "../_lib/ce-mock";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const { start, end, u } = parseCommon(req.url);
        const key = (u.searchParams.get("key") || "REGION").toUpperCase();
        const useMock = u.searchParams.get("mock") === "1" || process.env.MOCK_COST === "1";

        let values: string[] = [];

        if (useMock) {
            const res = mockGetDimensionValues({ start, end, key });
            values = (res.DimensionValues ?? []).map((v: { Value?: string }) => v.Value).filter((v): v is string => Boolean(v));
        } else {
            const res = await ce.send(
                new GetDimensionValuesCommand({
                    TimePeriod: { Start: start, End: end },
                    Dimension: key as any,
                })
            );
            values = (res.DimensionValues ?? []).map((v) => v.Value).filter((v): v is string => Boolean(v));
        }

        return new Response(JSON.stringify({ key, values, source: useMock ? "mock" : "ce" }), {
            status: 200,
            headers: { "content-type": "application/json" },
        });
    } catch (err: any) {
        console.error("[/api/cost/dimensions]", err);
        return new Response(JSON.stringify({ error: err?.message || "Failed" }), { status: 500 });
    }
}
