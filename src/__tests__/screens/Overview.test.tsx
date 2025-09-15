import Overview from "@/app/screens/dashboard/overview/overview";
import { GlobalLoadingProvider } from "@/context/global-loading-context";
import { render, screen } from "@testing-library/react";

jest.mock("@/context/cost-context", () => ({
    useCost: () => ({
        getSummary: jest.fn(async () => ({
            metric: "UnblendedCost",
            unit: "USD",
            granularity: "DAILY",
            timePeriod: { start: "2025-09-01", end: "2025-09-12" },
            total: 1000,
            byTime: [
                { start: "2025-09-01", end: "2025-09-02", amount: 100 },
                { start: "2025-09-02", end: "2025-09-03", amount: 120 },
            ],
            source: "mock",
        })),
    }),
}));

jest.mock("@/context/ec2-context", () => ({
    useEc2: () => ({ instances: [], loading: false }),
}));

describe("Overview screen", () => {
    it("shows KPI and anomaly banner with mock data enabled", async () => {
        process.env.NEXT_PUBLIC_USE_MOCK = "1";
        render(
            <GlobalLoadingProvider>
                <Overview />
            </GlobalLoadingProvider>
        );

        expect(await screen.findByText(/Daily Burn/i)).toBeInTheDocument();

        expect(await screen.findByText(/You have a spike in costs/i)).toBeInTheDocument();
    });
});
