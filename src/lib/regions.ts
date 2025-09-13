// Utility to provide a list of AWS regions the app should use.
// Priority:
// 1) Explicit env var AWS_REGIONS (comma-separated list)
// 2) Fallback to a curated common regions list

const DEFAULT_REGIONS = [
  "us-east-1",
  "us-east-2",
  "us-west-2",
  "eu-west-1",
  "eu-central-1",
  "ap-south-1",
  "ap-southeast-1",
  "ap-southeast-2",
];

export async function getActiveRegions(): Promise<string[]> {
  const env = process.env.AWS_REGIONS;
  if (env && typeof env === "string") {
    const parts = env
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length) return parts;
  }
  return DEFAULT_REGIONS;
}

export function getDefaultRegion(): string {
  return process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
}

