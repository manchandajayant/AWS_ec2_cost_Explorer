import { CloudWatchClient, GetMetricStatisticsCommand } from "@aws-sdk/client-cloudwatch";
import { getActiveRegions } from "@/lib/regions";

const getRegionFromEnv = (): string => {
  return process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
};

const createClient = (region: string) => new CloudWatchClient({ region });

async function getAverageMetric(
  namespace: string,
  metricName: string,
  dimensions: { Name: string; Value: string }[],
  periodSeconds = 300,
  region?: string
): Promise<number | null> {
  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - periodSeconds * 1000);
  const cmd = new GetMetricStatisticsCommand({
    Namespace: namespace,
    MetricName: metricName,
    Dimensions: dimensions,
    StartTime: startTime,
    EndTime: endTime,
    Period: periodSeconds,
    Statistics: ["Average"],
  });
  try {
    const client = createClient(region || getRegionFromEnv());
    const resp = await client.send(cmd);
    const dp = (resp.Datapoints || []).sort((a, b) => (a.Timestamp && b.Timestamp ? a.Timestamp.getTime() - b.Timestamp.getTime() : 0));
    const last = dp[dp.length - 1];
    const avg = last?.Average;
    return typeof avg === "number" ? avg : null;
  } catch (e) {
    console.error("CloudWatch getAverageMetric error", { namespace, metricName, e });
    return null;
  }
}

export async function fetchInstanceMetrics(instanceId: string, region?: string): Promise<{ cpu: number; ram: number; gpu: number }> {
  if (!region) {
    const all = await getActiveRegions();
    region = all[0] || getRegionFromEnv();
  }
  // CPU utilization from AWS/EC2
  const cpuAvg = await getAverageMetric(
    "AWS/EC2",
    "CPUUtilization",
    [{ Name: "InstanceId", Value: instanceId }],
    300,
    region
  );

  // Memory and GPU metrics are not available by default. Attempt common CWAgent metric names, fallback to 0.
  // CWAgent memory metric example: Namespace "CWAgent", MetricName "mem_used_percent"
  const memAvg = await getAverageMetric(
    "CWAgent",
    "mem_used_percent",
    [{ Name: "InstanceId", Value: instanceId }],
    300,
    region
  );

  // GPU metric placeholder (commonly custom). Try a likely name then fallback.
  const gpuAvg = await getAverageMetric(
    "CWAgent",
    "gpu_utilization",
    [{ Name: "InstanceId", Value: instanceId }],
    300,
    region
  );

  return {
    cpu: Math.max(0, Math.min(100, Math.round((cpuAvg ?? 0) * 10) / 10)),
    ram: Math.max(0, Math.min(100, Math.round((memAvg ?? 0) * 10) / 10)),
    gpu: Math.max(0, Math.min(100, Math.round((gpuAvg ?? 0) * 10) / 10)),
  };
}
