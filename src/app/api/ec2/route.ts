import { DescribeInstancesCommand, DescribeRegionsCommand, EC2Client } from "@aws-sdk/client-ec2";
import { NextRequest } from "next/server";
import { enrichInstance } from "./utils/processEC2Data";

import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// This method gets all EC2 instances across all regions
export async function GET(_req: NextRequest) {
    try {
        if (process.env.NEXT_PUBLIC_USE_MOCK === "1") {
            const data = await mockData();
            if (data.error) {
                return new Response(JSON.stringify({ error: data.error }), {
                    status: 500,
                });
            }
            return new Response(JSON.stringify(data), {
                status: 200,
                headers: { "content-type": "application/json" },
            });
        }

        const ec2 = new EC2Client({ region: process.env.AWS_REGION || "us-east-1" });
        const getAllRegions = await ec2.send(new DescribeRegionsCommand({}));

        const allRegions = getAllRegions.Regions?.map((r) => r.RegionName).filter(Boolean) ?? [];

        const allInstances: any[] = [];

        for (const region of allRegions) {
            const regionalEC2 = new EC2Client({ region });

            try {
                const result = await regionalEC2.send(new DescribeInstancesCommand({}));
                const instances =
                    result.Reservations?.flatMap((res) =>
                        res.Instances?.map((instance) =>
                            enrichInstance({
                                region,
                                instanceId: instance.InstanceId,
                                type: instance.InstanceType,
                                state: instance.State?.Name,
                                availabilityZone: instance.Placement?.AvailabilityZone,
                                launchTime: instance.LaunchTime,
                                tags: Object.fromEntries((instance.Tags || []).map((tag) => [tag.Key || "", tag.Value || ""])),
                            })
                        )
                    ) ?? [];

                allInstances.push(...instances);
            } catch (err) {
                console.warn(`Error fetching instances from ${region}:`, err);
            }
        }

        return new Response(JSON.stringify({ instances: allInstances }), {
            status: 200,
            headers: { "content-type": "application/json" },
        });
    } catch (err: any) {
        console.error("Top-level error:", err);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
        });
    }
}

// Return EC2 instances from mock file
export async function mockData() {
    try {
        const filePath = path.join(process.cwd(), "src/app/api/ec2/utils/mock_data", "synthetic-ec2-data.json");
        const rawData = fs.readFileSync(filePath, "utf-8");
        const mockData = JSON.parse(rawData);

        const enrichedInstances = mockData.instances.map((instance: any) => enrichInstance(instance));

        return { instances: enrichedInstances };
    } catch (err: any) {
        console.error("Failed to load mock EC2 data:", err);
        return { error: err.message };
    }
}
