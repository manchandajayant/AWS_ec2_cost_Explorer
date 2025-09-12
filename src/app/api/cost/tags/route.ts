import { GetTagsCommand } from "@aws-sdk/client-cost-explorer";
import { NextRequest } from "next/server";
import { ce, parseCommon } from "../_lib/ce-helpers";
import { mockGetTags } from "../_lib/ce-mock";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const { start, end, u } = parseCommon(req.url);
        const key = u.searchParams.get("key") || "Team";
        const useMock = u.searchParams.get("mock") === "1" || process.env.USE_MOCK === "1";

        const res = useMock
            ? mockGetTags({ start, end, tagKey: key })
            : await ce.send(
                  new GetTagsCommand({
                      TimePeriod: { Start: start, End: end },
                      TagKey: key,
                  })
              );

        // Normalize + strip blanks
        const raw = useMock ? res.Tags : res.Tags || [];
        const values = (raw as string[]).filter((v) => typeof v === "string" && v.trim().length > 0).sort();

        return new Response(JSON.stringify({ key, values, source: useMock ? "mock" : "ce" }), {
            status: 200,
            headers: { "content-type": "application/json" },
        });
    } catch (err: any) {
        console.error("[/api/cost/tags]", err);
        return new Response(JSON.stringify({ error: err?.message || "Failed" }), { status: 500 });
    }
}
