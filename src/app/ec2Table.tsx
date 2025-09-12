"use client";
import type { DropdownOption } from "@/components/Dropdown";
import InstancesTable from "@/components/instanceTable";
import { Ec2Provider, useEc2 } from "@/context/EC2Context";
import { useMemo, useState } from "react";

// Define the precise status labels, including "Unknown"
type InstanceStatusLabel = "Idle" | "Under Utilized" | "Optimal" | "Over Utilized" | "Unknown";

export function classifyUtilizationWithUptime(cpuAvg: number, memAvg: number | null, uptimeHours: number, windowHours = 168) {
    if (uptimeHours < 24) {
        return { label: "Unknown" as InstanceStatusLabel, score: null, reason: "Instance < 24h old" };
    }

    const cpuNorm = Math.min(1, cpuAvg / 60);
    const memNorm = memAvg !== null ? Math.min(1, memAvg / 70) : cpuNorm;
    const coverage = Math.min(1, uptimeHours / windowHours);

    const rawScore = 0.6 * cpuNorm + 0.4 * memNorm;
    const adjusted = rawScore * coverage;

    let label: InstanceStatusLabel;
    if (cpuAvg < 3 && uptimeHours > 72) label = "Idle";
    else if (adjusted < 0.4) label = "Under Utilized";
    else if (adjusted > 0.7) label = "Over Utilized";
    else label = "Optimal";

    return {
        label,
        score: Number((adjusted * 100).toFixed(1)),
        reason: `cpu=${cpuAvg.toFixed(1)}%, mem=${memAvg ?? "N/A"}%, coverage=${(coverage * 100).toFixed(1)}%`,
    };
}

function InstancesTableComponent() {
    const { instances, loading, error } = useEc2();
    type SortKey = "status" | "region" | "type";
    const [sortBy, setSortBy] = useState<SortKey>("status");

    // Transform raw instance data to match the DTO expected by the InstancesTable component
    const instancesWithStatus = useMemo(() => {
        return instances.map((instance) => {
            const { label, score, reason } =
                instance.cpuAvg7d !== undefined
                    ? classifyUtilizationWithUptime(instance.cpuAvg7d, instance.memAvg7d ?? null, instance.uptimeHours)
                    : { label: "Unknown" as InstanceStatusLabel, score: null, reason: "No utilization data" };

            // This maps the raw data to the clean DTO, renaming properties as needed.
            return {
                id: instance.instanceId,
                type: instance.type,
                region: instance.region,
                vcpu: instance.vCPU,
                ramGB: instance.RAM,
                gpu: instance.GPU,
                pricePerHour: instance.pricePerHour,
                uptimeHours: instance.uptimeHours,
                cpuAvg7d: instance.cpuAvg7d,
                memAvg7d: instance.memAvg7d,
                statusLabel: label,
                statusScore: score,
                statusReason: reason,
            };
        });
    }, [instances]);

    const sortedInstances = useMemo(() => {
        const list = [...instancesWithStatus];

        if (sortBy === "status") {
            // Priority order for statuses (adjust to surface most important first)
            const order: Record<InstanceStatusLabel, number> = {
                Idle: 0,
                "Under Utilized": 1,
                "Over Utilized": 2,
                Optimal: 3,
                Unknown: 4,
            };
            list.sort((a, b) => order[a.statusLabel] - order[b.statusLabel]);
        } else if (sortBy === "region") {
            list.sort((a, b) => a.region.localeCompare(b.region));
        } else if (sortBy === "type") {
            list.sort((a, b) => a.type.localeCompare(b.type));
        }

        return list;
    }, [instancesWithStatus, sortBy]);

    if (loading) return <div>Loading…</div>;
    if (error) return <div className="text-red-600">Error: {error}</div>;

    const sortOptions: DropdownOption<SortKey>[] = [
        { value: "status", label: "Status" },
        { value: "region", label: "Region" },
        { value: "type", label: "Type" },
    ];

    return (
        <div className="space-y-3">
            {/* <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-base font-semibold text-gray-900">EC2 Instances</h1>
                    <p className="mt-2 text-sm text-gray-700">Inventory with quick health & utilization overview.</p>
                </div>
            </div> */}
            {/* <div className="">
                <Dropdown<SortKey>
                    label="Sort by"
                    value={sortBy}
                    options={sortOptions}
                    onChange={(v) => setSortBy(v)}
                    buttonClassName="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div> */}
            <InstancesTable instances={sortedInstances} />
        </div>
    );
}

export default function Page() {
    return (
        <Ec2Provider endpoint="/api/ec2">
            <InstancesTableComponent />
        </Ec2Provider>
    );
}
