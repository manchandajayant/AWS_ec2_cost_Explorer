import CostOverview from "@/app/screens/dashboard/cost/cost-overview";
import { CostViewSettingsProvider } from "@/app/screens/dashboard/cost/view-settings-context";
import type { SeriesDataset } from "@/types/cost/cost";
import { render, screen } from "@testing-library/react";

const labels = ["2025-09-01", "2025-09-02", "2099-01-01"];
const datasets: SeriesDataset[] = [
    { label: "us-east-1", data: [10, 20, 30], borderColor: "#000", backgroundColor: "#000" },
    { label: "us-west-2", data: [5, 15, 25], borderColor: "#111", backgroundColor: "#111" },
];

describe("CostOverview sub-screen", () => {
    it("renders bar chart and shows future banner when endISO in future", () => {
        render(
            <CostViewSettingsProvider defaultChartType="bar" defaultGranularity="DAILY" defaultGroupBy="REGION">
                <CostOverview
                    labels={labels}
                    datasets={datasets}
                    colors={["#a", "#b"]}
                    endISO={"2099-01-01"}
                    groupByLabel={"REGION"}
                    topTotals={[
                        { name: "us-east-1", value: 60 },
                        { name: "us-west-2", value: 45 },
                    ]}
                    total={105}
                    maxValue={30}
                    avgValue={17.5}
                />
            </CostViewSettingsProvider>
        );

        expect(screen.getByText(/Dates in the future are estimated/i)).toBeInTheDocument();
        expect(screen.getByText("REGION")).toBeInTheDocument();

        expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
    });
});
