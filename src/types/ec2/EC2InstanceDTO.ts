export interface EC2InstanceDTO {
    region: string;
    instanceId: string;
    type: string;
    state: string;
    availabilityZone?: string;
    launchTime: string;
    tags: Record<string, string>;
    vCPU: number;
    RAM: number;
    GPU: number;
    pricePerHour: number;
    estimatedCost: number;
    uptimeHours: number;
    cpuAvg7d?: number;
    memAvg7d?: number | null;
}
