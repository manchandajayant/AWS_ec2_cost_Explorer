"use client";
import InstancesTable from "@/components/instanceTable";
import { Ec2Provider, useEc2 } from "@/context/EC2Context";
import { InstanceStatusLabel, SortKey } from "@/types/ec2/types";
import { ReactElement, useMemo, useState } from "react";

const EC2TableComponent: React.FC = (): ReactElement => {
    const { instances, loading, error } = useEc2();

    const [sortBy, setSortBy] = useState<SortKey>("status");

    const instancesWithStatus = useMemo(() => {
        return instances.map((instance) => {
            const { label, score, reason } =
                instance.cpuAvg7d !== undefined
                    ? classifyUtilizationWithUptime(instance.cpuAvg7d, instance.memAvg7d ?? null, instance.uptimeHours)
                    : { label: "Unknown" as InstanceStatusLabel, score: null, reason: "No utilization data" };

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
            const order: Record<InstanceStatusLabel, number> = StatusLabel;
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

    return (
        <div className="space-y-3">
            <InstancesTable instances={sortedInstances} />
        </div>
    );
};

const Page: React.FC = (): ReactElement => {
    return (
        <Ec2Provider endpoint="/api/ec2">
            <EC2TableComponent />
        </Ec2Provider>
    );
};

export const classifyUtilizationWithUptime = (cpuAvg: number, memAvg: number | null, uptimeHours: number, windowHours = 168) => {
    if (uptimeHours < 24) ({ label: "Unknown" as InstanceStatusLabel, score: null, reason: "Instance < 24h old" });

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
};

const StatusLabel: Record<InstanceStatusLabel, number> = {
    Idle: 0,
    "Under Utilized": 1,
    "Over Utilized": 2,
    Optimal: 3,
    Unknown: 4,
};

export default Page;
