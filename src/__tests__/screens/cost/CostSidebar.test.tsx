import CostSidebar from "@/app/screens/dashboard/cost/sidebar/cost-sidebar";
import { CostViewSettingsProvider } from "@/app/screens/dashboard/cost/view-settings-context";
import { render, screen } from "@testing-library/react";

jest.mock("@/components/date-picker", () => ({
    default: ({ onApply }: any) => (
        <div data-testid="date-picker" onClick={() => onApply?.("2025-01-01", "2025-01-31")}>
            DatePicker
        </div>
    ),
}));
jest.mock("@/components/month-picker", () => ({
    default: ({ onApply }: any) => (
        <div data-testid="month-picker" onClick={() => onApply?.("2025-01", "2025-02")}>
            MonthPicker
        </div>
    ),
}));

// Mock filter context values used by sections
jest.mock("@/app/screens/dashboard/cost/filter-context", () => ({
    useFilterSettings: () => ({
        tagKeys: ["Team", "Project"],
        activeTagKey: "Team",
        setActiveTagKey: jest.fn(),
        tagValues: ["ML", "Platform"],
        selectedTagValues: [],
        setSelectedTagValues: jest.fn(),
        activeDimKey: "REGION",
        setActiveDimKey: jest.fn(),
        dimValues: ["us-east-1"],
        selectedDimValues: [],
        setSelectedDimValues: jest.fn(),
        filters: undefined,
    }),
}));

describe("CostSidebar sub-screen", () => {
    it("renders Overview section controls when tab=OVERVIEW", () => {
        render(
            <CostViewSettingsProvider>
                <CostSidebar tab="OVERVIEW" start="2025-01-01" end="2025-01-31" onApplyDateRange={() => {}} maxTopSelectable={50} monthA="2025-01" monthB="2025-02" onApplyMonths={() => {}} />
            </CostViewSettingsProvider>
        );
        expect(screen.getByTestId("date-picker")).toBeInTheDocument();
        expect(screen.getByText(/Granularity/i)).toBeInTheDocument();
        expect(screen.getByText(/Group By/i)).toBeInTheDocument();
        expect(screen.getByText(/Chart Type/i)).toBeInTheDocument();
        expect(screen.getByText(/Top N/i)).toBeInTheDocument();
    });

    it("renders Compare section controls when tab=COMPARE", () => {
        render(
            <CostViewSettingsProvider>
                <CostSidebar tab="COMPARE" start="2025-01-01" end="2025-01-31" onApplyDateRange={() => {}} maxTopSelectable={50} monthA="2025-01" monthB="2025-02" onApplyMonths={() => {}} />
            </CostViewSettingsProvider>
        );
        expect(screen.getByTestId("month-picker")).toBeInTheDocument();
        expect(screen.getByText(/Group By/i)).toBeInTheDocument();
        expect(screen.getByText(/Chart Type/i)).toBeInTheDocument();
    });
});
