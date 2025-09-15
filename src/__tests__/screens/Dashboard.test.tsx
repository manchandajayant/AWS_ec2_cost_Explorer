import DashboardPage from "@/app/screens/dashboard/dashboard";
import { GlobalLoadingProvider } from "@/context/global-loading-context";
import type { CostAttribution, CostBreakdown, CostSummary } from "@/types/cost/cost";
import type { EC2InstanceDTO } from "@/types/ec2/EC2InstanceDTO";
import { render, screen } from "@testing-library/react";

const mockInstances: EC2InstanceDTO[] = [
    {
        region: "us-east-1",
        instanceId: "i-123",
        type: "m5.large",
        state: "running",
        availabilityZone: "us-east-1a",
        launchTime: new Date().toISOString(),
        tags: { Team: "ML", Project: "Observer" },
        vCPU: 2,
        RAM: 8,
        GPU: 0,
        pricePerHour: 0.096,
        estimatedCost: 10,
        uptimeHours: 100,
        cpuAvg7d: 12,
        memAvg7d: 24,
    },
];

const mockSummary: CostSummary = {
    metric: "UnblendedCost",
    unit: "USD",
    granularity: "DAILY",
    timePeriod: { start: "2025-09-01", end: "2025-09-13" },
    total: 1000,
    byTime: [
        { start: "2025-09-01", end: "2025-09-02", amount: 100 },
        { start: "2025-09-02", end: "2025-09-03", amount: 120 },
    ],
    source: "mock",
};

const mockBreakdown: CostBreakdown = {
    metric: "UnblendedCost",
    unit: "USD",
    granularity: "DAILY",
    timePeriod: { start: "2025-09-01", end: "2025-09-13" },
    groupBy: ["REGION"],
    rows: [
        { start: "2025-09-01", end: "2025-09-02", keys: ["us-east-1"], amount: 100 },
        { start: "2025-09-02", end: "2025-09-03", keys: ["us-east-1"], amount: 120 },
    ],
    source: "mock",
};

const mockAttr: CostAttribution = {
    tagKey: "Team",
    metric: "UnblendedCost",
    unit: "USD",
    granularity: "DAILY",
    timePeriod: { start: "2025-09-01", end: "2025-09-13" },
    total: 1000,
    attributed: 800,
    unaccounted: 200,
    breakdown: [{ key: "ML", amount: 500 }],
    source: "mock",
};

jest.mock("@/context/ec2-context", () => ({
    Ec2Provider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useEc2: () => ({
        instances: mockInstances,
        loading: false,
        error: null,
        refresh: jest.fn(),
        refreshUtilization: jest.fn(),
        regions: ["us-east-1"],
        instanceTypes: ["m5.large"],
        teams: ["ML"],
        projects: ["Observer"],
    }),
}));

jest.mock("@/context/cost-context", () => ({
    CostProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useCost: () => ({
        getSummary: jest.fn(async () => mockSummary),
        getBreakdown: jest.fn(async () => mockBreakdown),
        getAttribution: jest.fn(async () => mockAttr),
        getDimensions: jest.fn(async () => ({ key: "REGION", values: ["us-east-1"], source: "mock" })),
        getTags: jest.fn(async () => ({ key: "Team", values: ["ML"], source: "mock" })),
        getTagKeys: jest.fn(async () => ({ keys: ["Team", "Project"] })),
        loading: {},
        errors: {},
    }),
}));

describe("Dashboard screen", () => {
    it("renders overview, cost header, and EC2 section", async () => {
        render(
            <GlobalLoadingProvider>
                <DashboardPage />
            </GlobalLoadingProvider>
        );

        // Cost section header
        expect(await screen.findByText(/Costs Attributions/i)).toBeInTheDocument();
        // EC2 table header
        expect(screen.getByText(/EC2 Instances/i)).toBeInTheDocument();
    });
});
