import { redirect } from "next/navigation";
import DashboardPage from "./screens/dashboard/dashboard";

export default function Home() {
    const hasAwsCreds = Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
    const mockAlready = process.env.USE_MOCK === "1" || process.env.NEXT_PUBLIC_USE_MOCK === "1";

    if (!hasAwsCreds && !mockAlready) {
        process.env.USE_MOCK = "1";
        process.env.NEXT_PUBLIC_USE_MOCK = "1";
        redirect("/missing-aws");
    }

    return (
        <main>
            <DashboardPage />
        </main>
    );
}
