import CompareTable from "@/app/screens/dashboard/cost/compare-table";
import { render, screen, within } from "@testing-library/react";

describe("CompareTable sub-screen", () => {
    it("renders rows and delta with arrows and totals", () => {
        render(
            <CompareTable
                groupByLabel="REGION"
                monthA="2025-07"
                monthB="2025-08"
                totalsA={[
                    { name: "us-east-1", value: 100 },
                    { name: "us-west-2", value: 50 },
                ]}
                totalsB={[
                    { name: "us-east-1", value: 150 },
                    { name: "eu-north-1", value: 25 },
                ]}
                colors={["#a", "#b", "#c"]}
            />
        );

        expect(screen.getByText("REGION")).toBeInTheDocument();
        expect(screen.getByText("2025-07")).toBeInTheDocument();
        expect(screen.getByText("2025-08")).toBeInTheDocument();

        const row = screen.getByText("us-east-1").closest("tr")!;
        const cells = within(row).getAllByRole("cell");
        expect(cells[1]).toHaveTextContent("$100");
        expect(cells[2]).toHaveTextContent("$150");
        expect(cells[3]).toHaveTextContent("▲ $50");

        const totalRow = screen.getByText("Total").closest("tr")!;
        const totalCells = within(totalRow).getAllByRole("cell");
        expect(totalCells[1]).toHaveTextContent("$150");
        expect(totalCells[2]).toHaveTextContent("$175");
        expect(totalCells[3]).toHaveTextContent("$25");
    });
});
