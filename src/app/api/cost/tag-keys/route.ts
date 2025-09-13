import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    // In a real implementation, you could discover tag keys from your data source.
    // For now, read from env or fall back to a sensible default list.
    const env = process.env.COST_TAG_KEYS; // comma-separated
    const keys = (env ? env.split(",").map((s) => s.trim()) : ["Team", "Project"]).filter(Boolean);
    return new Response(JSON.stringify({ keys }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err: any) {
    console.error("[/api/cost/tag-keys]", err);
    return new Response(JSON.stringify({ error: err?.message || "Failed" }), { status: 500 });
  }
}

