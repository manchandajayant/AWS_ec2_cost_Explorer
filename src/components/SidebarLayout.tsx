"use client";
import React from "react";
import Link from "next/link";
import { BarChart3, CircleDollarSign, LayoutDashboard, Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Image from "next/image";
import ThemeToggle from "@/components/ThemeToggle";
import { useUI } from "@/context/UIContext";

type NavItem = { href: string; label: string; icon: React.ReactNode };

const navItems: NavItem[] = [
  { href: "/#instances", label: "Instances", icon: <BarChart3 size={18} /> },
  { href: "/#costs", label: "Costs", icon: <CircleDollarSign size={18} /> },
];

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed: collapsed, toggleSidebar } = useUI();

  return (
    <div className="h-screen overflow-hidden flex bg-background text-foreground">
      <aside
        className={`shrink-0 sticky top-0 h-screen overflow-hidden border-r transition-all duration-200 ease-in-out ${
          collapsed ? "w-16" : "w-64"
        } bg-[var(--sidebar-bg)] text-[color:var(--sidebar-fg)] border-[color:var(--sidebar-border)]`}
      >
        <div className="h-14 flex items-center gap-2 px-3 border-b border-[color:var(--sidebar-border)]">
          <Image src="/tracer-logo.webp" alt="Elastic Observer" width={18} height={18} className="rounded" />
          {!collapsed && <span className="font-semibold text-[color:var(--sidebar-fg)]">Elastic Observer</span>}
          <button
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="ml-auto inline-flex items-center justify-center rounded border px-2 py-1 text-xs hover:bg-[var(--sidebar-hover-bg)] text-[color:var(--sidebar-fg)] border-[color:var(--sidebar-border)]"
            onClick={toggleSidebar}
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
          </button>
        </div>

        <nav className="p-2 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded px-3 py-2 text-sm hover:bg-[var(--sidebar-hover-bg)] text-[color:var(--sidebar-fg)]`}
              title={collapsed ? item.label : undefined}
            >
              <span className="text-[color:var(--sidebar-fg)] opacity-70">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <header className="sticky top-0 z-10 h-14 border-b flex items-center justify-between px-3 bg-white dark:bg-background">
          <div className="flex items-center gap-3">
            <button
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="inline-flex items-center justify-center rounded border px-2 py-1 text-xs hover:bg-slate-100 dark:hover:bg-muted text-slate-700 dark:text-foreground border-slate-300 dark:border-border"
              onClick={toggleSidebar}
              title={collapsed ? "Expand" : "Collapse"}
            >
              <Menu size={16} />
            </button>
            <div className="items-center gap-2 hidden sm:flex">
              <Image src="/tracer-logo.webp" alt="Elastic Observer" width={20} height={20} className="rounded" />
              <span className="text-sm font-semibold text-slate-800 dark:text-foreground">Elastic Observer</span>
            </div>
          </div>
          <ThemeToggle />
        </header>

        <div className="flex-1 min-w-0 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
