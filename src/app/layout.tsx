import SidebarLayout from "@/components/SidebarLayout";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { UIProvider } from "@/context/UIContext";
import { GlobalLoadingProvider } from "@/context/GlobalLoadingContext";
import GlobalLoader from "@/components/GlobalLoader";

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
            <head></head>
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
                <ThemeProvider>
                    <UIProvider>
                        <GlobalLoadingProvider>
                            <SidebarLayout>{children}</SidebarLayout>
                            <GlobalLoader />
                        </GlobalLoadingProvider>
                    </UIProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
