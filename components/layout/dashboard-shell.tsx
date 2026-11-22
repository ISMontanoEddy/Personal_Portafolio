"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { CommandPalette } from "@/components/command-palette";
import { Project, SupabaseInstance } from "@/types/database";

interface DashboardShellProps {
  children: React.ReactNode;
  userEmail?: string | null;
  projects: Project[];
  supabaseInstances: SupabaseInstance[];
}

export function DashboardShell({
  children,
  userEmail,
  projects,
  supabaseInstances,
}: DashboardShellProps) {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Global Ctrl+K / Cmd+K keydown listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen bg-[#09090b] text-zinc-100 overflow-hidden">
      <Sidebar userEmail={userEmail} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onOpenCommandPalette={() => setIsCommandPaletteOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
      </div>

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        projects={projects}
        supabaseInstances={supabaseInstances}
      />
    </div>
  );
}
