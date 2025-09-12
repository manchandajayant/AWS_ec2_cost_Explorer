"use client";
import { useTheme } from "@/context/ThemeContext";

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { theme, toggle } = useTheme();

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium bg-background text-foreground hover:opacity-90 border-[color:var(--foreground)] ${className}`}
    >
      <span className="sr-only">Toggle theme</span>
      {isDark ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-4">
          <path d="M21.64 13a1 1 0 0 0-1.05-.14 8 8 0 0 1-10.45-10.5 1 1 0 0 0-.11-1A1 1 0 0 0 8.24 1a10 10 0 1 0 14.52 14.49 1 1 0 0 0-.12-1.49z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-4">
          <path d="M6.76 4.84l-1.8-1.79L3.17 4.84l1.79 1.79zm10.48 14.32l1.79 1.79l1.79-1.79l-1.79-1.79zM1 13h3v-2H1zm19 0h3v-2h-3zM6.76 19.16l-1.8 1.79l1.79 1.79l1.79-1.79zM17.24 4.84l1.79-1.79l-1.79-1.79l-1.79 1.79zM12 4a1 1 0 011 1v1a1 1 0 01-2 0V5a1 1 0 011-1zm0 12a4 4 0 110-8a4 4 0 010 8zm0 3a1 1 0 011 1v1a1 1 0 01-2 0v-1a1 1 0 011-1z" />
        </svg>
      )}
      <span>{isDark ? "Dark" : "Light"}</span>
    </button>
  );
}
