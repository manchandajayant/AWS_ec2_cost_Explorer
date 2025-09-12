export const instanceSpecs: Record<string, { vCPU: number; RAM: number; GPU: number; pricePerHour: number }> = {
    "m7i-flex.large": { vCPU: 2, RAM: 8, GPU: 0, pricePerHour: 0.0864 },
    "t3.micro": { vCPU: 2, RAM: 1, GPU: 0, pricePerHour: 0.0104 },
    "t3.small": { vCPU: 2, RAM: 2, GPU: 0, pricePerHour: 0.0208 },
    "c5n.4xlarge": { vCPU: 16, RAM: 42, GPU: 0, pricePerHour: 0.952 },

    "t3.medium": { vCPU: 2, RAM: 4, GPU: 0, pricePerHour: 0.0416 },
    "t3.large": { vCPU: 2, RAM: 8, GPU: 0, pricePerHour: 0.0832 },
    "m5.large": { vCPU: 2, RAM: 8, GPU: 0, pricePerHour: 0.096 },
    "m5.xlarge": { vCPU: 4, RAM: 16, GPU: 0, pricePerHour: 0.192 },
    "c5.large": { vCPU: 2, RAM: 4, GPU: 0, pricePerHour: 0.085 },
    "g4dn.xlarge": { vCPU: 4, RAM: 16, GPU: 1, pricePerHour: 0.526 },
    "p3.2xlarge": { vCPU: 8, RAM: 61, GPU: 1, pricePerHour: 3.06 },
};
