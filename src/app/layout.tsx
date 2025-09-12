import GlobalLoader from "@/components/global-loader";
import SidebarLayout from "@/components/sidebar-layout";
import { GlobalLoadingProvider } from "@/context/GlobalLoadingContext";
import { UIProvider } from "@/context/UIContext";
import ResponsiveGate from "@/components/responsive-gate";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Elastic Observer",
    description: "Elastic Observer by Tracer — EC2 utilization and cost insights",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
                <UIProvider>
                    <GlobalLoadingProvider>
                        <ResponsiveGate>
                            <SidebarLayout>{children}</SidebarLayout>
                            <GlobalLoader />
                        </ResponsiveGate>
                    </GlobalLoadingProvider>
                </UIProvider>
            </body>
        </html>
    );
}
