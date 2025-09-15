import CostExplorerChart from "@/app/screens/dashboard/cost/cost";
import { GlobalLoadingProvider } from "@/context/global-loading-context";
import type { CostAttribution, CostBreakdown, CostSummary } from "@/types/cost/cost";
import { render, screen } from "@testing-library/react";

const mkSummary = (): CostSummary => ({
    metric: "UnblendedCost",
    unit: "USD",
    granularity: "DAILY",
    timePeriod: { start: "2025-09-01", end: "2025-09-12" },
    total: 220,
    byTime: [
        { start: "2025-09-01", end: "2025-09-02", amount: 100 },
        { start: "2025-09-02", end: "2025-09-03", amount: 120 },
    ],
});

const mkBreakdown = (): CostBreakdown => ({
    metric: "UnblendedCost",
    unit: "USD",
    granularity: "DAILY",
    timePeriod: { start: "2025-09-01", end: "2025-09-12" },
    groupBy: ["REGION"],
    rows: [
        { start: "2025-09-01", end: "2025-09-02", keys: ["us-east-1"], amount: 100 },
        { start: "2025-09-02", end: "2025-09-03", keys: ["us-east-1"], amount: 120 },
    ],
});

const mkAttribution = (): CostAttribution => ({
    tagKey: "Team",
    metric: "UnblendedCost",
    unit: "USD",
    granularity: "DAILY",
    timePeriod: { start: "2025-09-01", end: "2025-09-12" },
    total: 220,
    attributed: 200,
    unaccounted: 20,
    breakdown: [{ key: "ML", amount: 150 }],
});

jest.mock("@/context/cost-context", () => ({
    CostProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useCost: () => ({
        getSummary: jest.fn(async () => mkSummary()),
        getBreakdown: jest.fn(async () => mkBreakdown()),
        getAttribution: jest.fn(async () => mkAttribution()),
        getDimensions: jest.fn(async () => ({ key: "REGION", values: ["us-east-1"], source: "mock" })),
        getTags: jest.fn(async () => ({ key: "Team", values: ["ML"], source: "mock" })),
        getTagKeys: jest.fn(async () => ({ keys: ["Team", "Project"] })),
        loading: {},
        errors: {},
    }),
}));

describe("Cost screen", () => {
    it("renders header and default Overview tab", async () => {
        render(
            <GlobalLoadingProvider>
                <CostExplorerChart />
            </GlobalLoadingProvider>
        );

        expect(await screen.findByText(/Costs Attributions/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Overview/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Compare/i })).toBeInTheDocument();
    });
});
