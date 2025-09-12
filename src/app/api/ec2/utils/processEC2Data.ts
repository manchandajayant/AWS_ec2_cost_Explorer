// utils/enrichInstanceWithSpecs.ts
import { EC2InstanceDTO } from "@/types/ec2/EC2InstanceDTO";
import { instanceSpecs } from "./instanceSpecs";

export function enrichInstance(instance: any): EC2InstanceDTO {
    const type = instance.type;
    const specs = instanceSpecs[type] || { vCPU: 0, RAM: 0, GPU: 0, pricePerHour: 0 };

    const launchTime = new Date(instance.launchTime);
    const uptimeHours = Math.floor((Date.now() - launchTime.getTime()) / (1000 * 60 * 60));
    const estimatedCost = Number((uptimeHours * specs.pricePerHour).toFixed(2));

    return {
        region: instance.region,
        instanceId: instance.instanceId,
        type,
        state: instance.state,
        availabilityZone: instance.availabilityZone,
        launchTime: instance.launchTime,
        tags: instance.tags,
        vCPU: specs.vCPU,
        RAM: specs.RAM,
        GPU: specs.GPU,
        pricePerHour: specs.pricePerHour,
        estimatedCost,
        uptimeHours,
    };
}
