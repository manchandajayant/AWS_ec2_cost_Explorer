import GlobalLoader from "@/components/global-loader";
import { GlobalLoadingProvider, useGlobalLoading } from "@/context/GlobalLoadingContext";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("GlobalLoader", () => {
    it("shows and hides overlay based on loading state", async () => {
        const user = userEvent.setup();
        renderWithProvider();

        expect(screen.queryByLabelText(/loading/i)).not.toBeInTheDocument();

        await user.click(screen.getByText("begin"));
        expect(await screen.findByLabelText(/loading/i)).toBeInTheDocument();

        await user.click(screen.getByText("end"));
        expect(screen.queryByLabelText(/loading/i)).not.toBeInTheDocument();
    });
});

const Harness = () => {
    const { begin, end } = useGlobalLoading();
    return (
        <div>
            <button onClick={begin}>begin</button>
            <button onClick={end}>end</button>
            <GlobalLoader />
        </div>
    );
};

const renderWithProvider = () => {
    return render(
        <GlobalLoadingProvider>
            <Harness />
        </GlobalLoadingProvider>
    );
};
