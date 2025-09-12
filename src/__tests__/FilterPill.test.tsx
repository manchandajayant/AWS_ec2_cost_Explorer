import { FilterPill } from "@/components/filter-pill";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("FilterPill", () => {
    it("renders label and calls onRemove when clicked", async () => {
        const user = userEvent.setup();
        const onRemove = jest.fn();
        render(<FilterPill label="Region: us-east-1" onRemove={onRemove} />);

        expect(screen.getByText("Region: us-east-1")).toBeInTheDocument();

        const pill = screen.getByText("Region: us-east-1").closest("div")!;
        const removeBtn = within(pill).getByRole("button");
        await user.click(removeBtn);

        expect(onRemove).toHaveBeenCalledTimes(1);
    });
});
