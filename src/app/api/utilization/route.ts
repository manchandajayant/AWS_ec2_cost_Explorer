import { CloudWatchClient, GetMetricDataCommand } from "@aws-sdk/client-cloudwatch";
import { NextRequest } from "next/server";
import { mockUtilization } from "./_lib/ce-mock";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const instanceId = url.searchParams.get("instanceId");
        const region = url.searchParams.get("region") || process.env.AWS_REGION || "us-east-1";
        const days = Math.max(7, Number(url.searchParams.get("days") || 7));
        const useMock = url.searchParams.get("mock") === "1" || process.env.USE_MOCK === "1";
        const force = url.searchParams.get("force") || undefined;

        if (!instanceId) {
            return new Response(JSON.stringify({ error: "instanceId is required" }), { status: 400 });
        }

        if (useMock) {
            const { cpuAvg, memAvg } = mockUtilization(instanceId, force);
            return new Response(
                JSON.stringify({
                    instanceId,
                    region,
                    windowDays: days,
                    periodSec: 300,
                    cpu: { average: cpuAvg, unit: "%" },
                    memory: { average: memAvg, unit: "%", available: true },
                    source: "mock",
                }),
                { status: 200, headers: { "content-type": "application/json" } }
            );
        }

        const cw = new CloudWatchClient({ region });
        const end = new Date();
        const start = new Date(end.getTime() - days * 24 * 3600 * 1000);
        const periodSec = 300;

        const cmd = new GetMetricDataCommand({
            StartTime: start,
            EndTime: end,
            ScanBy: "TimestampAscending",
            MetricDataQueries: [
                {
                    Id: "cpu_avg",
                    ReturnData: true,
                    MetricStat: {
                        Metric: {
                            Namespace: "AWS/EC2",
                            MetricName: "CPUUtilization",
                            Dimensions: [{ Name: "InstanceId", Value: instanceId }],
                        },
                        Period: periodSec,
                        Stat: "Average",
                    },
                },
                {
                    Id: "mem_avg",
                    ReturnData: true,
                    MetricStat: {
                        Metric: {
                            Namespace: "CWAgent",
                            MetricName: "mem_used_percent",
                            Dimensions: [{ Name: "InstanceId", Value: instanceId }],
                        },
                        Period: periodSec,
                        Stat: "Average",
                    },
                },
            ],
        });

        const res = await cw.send(cmd);
        const cpuVals = res.MetricDataResults?.find((r) => r.Id === "cpu_avg")?.Values ?? [];
        const memVals = res.MetricDataResults?.find((r) => r.Id === "mem_avg")?.Values;

        const avg = (arr: number[]) => (arr.length ? Number((arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(2)) : 0);

        return new Response(
            JSON.stringify({
                instanceId,
                region,
                windowDays: days,
                periodSec,
                cpu: { average: avg(cpuVals), unit: "%" },
                memory: { average: memVals && memVals.length ? avg(memVals) : null, unit: "%", available: !!(memVals && memVals.length) },
                source: "cloudwatch",
            }),
            { status: 200, headers: { "content-type": "application/json" } }
        );
    } catch (err: any) {
        console.error("[/api/metrics/utilization] error:", err);
        return new Response(JSON.stringify({ error: err?.message || "Failed" }), { status: 500 });
    }
}
