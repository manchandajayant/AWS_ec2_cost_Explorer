"use client";
import React from "react";
import { useIsDesktop } from "@/hooks/use-is-desktop";

type Props = {
  children: React.ReactNode;
  minWidth?: number; // px, default 1024 (tailwind lg)
};

export default function ResponsiveGate({ children, minWidth = 1024 }: Props) {
  const isDesktop = useIsDesktop(minWidth);

  if (isDesktop === null) {
    // During hydration detection, avoid mismatch. Render nothing.
    return null;
  }

  if (!isDesktop) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center bg-white text-gray-800">
        <div className="max-w-sm space-y-3">
          <h1 className="text-lg font-semibold">Best Viewed on Desktop</h1>
          <p className="text-sm text-gray-600">
            This app is provisioned for desktop screens. Please switch to a laptop or desktop for the full experience.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

