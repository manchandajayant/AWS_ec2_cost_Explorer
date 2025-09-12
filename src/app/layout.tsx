import GlobalLoader from "@/components/GlobalLoader";
import SidebarLayout from "@/components/SidebarLayout";
import { GlobalLoadingProvider } from "@/context/GlobalLoadingContext";
import { UIProvider } from "@/context/UIContext";
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
                        <SidebarLayout>{children}</SidebarLayout>
                        <GlobalLoader />
                    </GlobalLoadingProvider>
                </UIProvider>
            </body>
        </html>
    );
}
