"use client";
import { useUI } from "@/context/ui-context";
import { LayoutDashboard, PanelLeftClose, PanelLeftOpen, Settings, User, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export type NavItem = { href: string; label: string; icon: React.ReactNode };

const navItems: NavItem[] = [
    { href: "/#workspace", label: "Workspace", icon: <LayoutDashboard size={18} /> },
    { href: "/#team", label: "Team Management", icon: <Users size={18} /> },
];

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
    const { sidebarCollapsed: collapsed, toggleSidebar } = useUI();

    return (
        <div className="h-screen overflow-hidden flex flex-col bg-background text-foreground">
            <header className="shrink-0 h-14 border-b flex items-center justify-between px-3 bg-white dark:bg-background w-full">
                <div className="flex items-center gap-2 bg-transparent">
                    <Image src="/ec2ob.png" alt="Tracer" width={65} height={65} className="rounded" />
                    <span className="font-semibold text-[color:var(--sidebar-fg)]">Elastic Observer</span>
                </div>
                <button
                    type="button"
                    aria-label="Account"
                    title="Account"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 dark:border-border text-slate-700 dark:text-foreground hover:bg-slate-100 dark:hover:bg-muted"
                >
                    <User size={16} />
                </button>
            </header>

            <div className="flex flex-1 overflow-hidden">
                <aside
                    className={`shrink-0 h-full overflow-hidden border-r transition-all duration-200 ease-in-out ${
                        collapsed ? "w-16" : "w-64"
                    } bg-[var(--sidebar-bg)] text-[color:var(--sidebar-fg)] border-[color:var(--sidebar-border)] flex flex-col`}
                >
                    <div className="h-14 flex items-center gap-2 px-3 border-b border-[color:var(--sidebar-border)]">
                        {/* <Image src="/ec2ob.png" alt="Elastic Observer" width={18} height={18} className="rounded" /> */}
                        {/* {!collapsed && <span className="font-semibold text-[color:var(--sidebar-fg)]">Elastic Observer</span>} */}
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

                    <div className="mt-auto border-t border-[color:var(--sidebar-border)] p-2">
                        <Link href="/#settings" className="flex items-center gap-3 rounded px-3 py-2 text-sm hover:bg-[var(--sidebar-hover-bg)] text-[color:var(--sidebar-fg)]" title={collapsed ? "Settings" : undefined}>
                            <span className="text-[color:var(--sidebar-fg)] opacity-70">
                                <Settings size={18} />
                            </span>
                            {!collapsed && <span>Settings</span>}
                        </Link>
                    </div>
                </aside>

                <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
                    <div className="flex-1 min-w-0 overflow-y-auto">{children}</div>
                </div>
            </div>
        </div>
    );
}
