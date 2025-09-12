import Dropdown, { type DropdownOption } from "@/components/drop-down";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

type Val = "a" | "b" | "c";

const options: DropdownOption<Val>[] = [
    { label: "Alpha", value: "a" },
    { label: "Beta", value: "b" },
    { label: "Gamma", value: "c" },
];

describe("Dropdown", () => {
    it("opens list and calls onChange when selecting option", async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        render(<Dropdown<Val> label="Pick" value={"a"} options={options} onChange={onChange} />);

        const button = screen.getByRole("button");
        expect(button).toHaveTextContent("Alpha");

        await user.click(button);
        await user.click(screen.getByText("Beta"));

        expect(onChange).toHaveBeenCalledWith("b");
    });
});
