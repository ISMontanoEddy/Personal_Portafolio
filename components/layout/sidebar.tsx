"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  FolderGit2,
  Database,
  KeySquare,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  userEmail?: string | null;
}

export function Sidebar({ userEmail }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    {
      name: "Resumen",
      href: "/dashboard",
      icon: LayoutDashboard,
      active: pathname === "/dashboard",
    },
    {
      name: "Proyectos",
      href: "/dashboard/projects",
      icon: FolderGit2,
      active: pathname.startsWith("/dashboard/projects"),
    },
    {
      name: "Instancias Supabase",
      href: "/dashboard/supabase",
      icon: Database,
      active: pathname.startsWith("/dashboard/supabase"),
    },
    {
      name: "Bóveda Zero-Knowledge",
      href: "/dashboard/vault",
      icon: KeySquare,
      active: pathname.startsWith("/dashboard/vault"),
    },
  ];

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-zinc-800 bg-[#0c0c0e] transition-all duration-300 ease-in-out shrink-0 select-none",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header / Brand */}
      <div className="flex h-14 items-center justify-between px-3 border-b border-zinc-800/80">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2.5 font-medium text-sm text-zinc-100 px-1">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700/60 shadow-sm">
              <Zap className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold tracking-tight text-white leading-none">DevOps IDP</span>
              <span className="text-[10px] text-zinc-500 font-mono mt-0.5">Control Center</span>
            </div>
          </Link>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-md border border-zinc-800 hover:bg-zinc-800/70 text-zinc-400 hover:text-zinc-200 transition-colors",
            collapsed && "mx-auto"
          )}
          title={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors relative group",
                item.active
                  ? "bg-zinc-800/90 text-white shadow-sm border border-zinc-700/50"
                  : "text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200"
              )}
              title={collapsed ? item.name : undefined}
            >
              <Icon className={cn("h-4 w-4 shrink-0", item.active ? "text-emerald-400" : "text-zinc-400 group-hover:text-zinc-200")} />
              {!collapsed && <span>{item.name}</span>}
              {collapsed && (
                <div className="absolute left-full ml-2 hidden group-hover:flex px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-[11px] text-white whitespace-nowrap z-50 shadow-lg">
                  {item.name}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom User & Sign Out section */}
      <div className="p-2 border-t border-zinc-800/80 space-y-2">
        {!collapsed && (
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-zinc-900/60 border border-zinc-800/50">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <div className="flex flex-col overflow-hidden">
              <span className="text-[10px] text-zinc-500 font-mono leading-none">ADMIN AUTENTICADO</span>
              <span className="text-xs text-zinc-300 truncate font-mono mt-0.5">
                {userEmail || "admin@supabase"}
              </span>
            </div>
          </div>
        )}

        <button
          onClick={handleSignOut}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-xs font-medium text-zinc-400 hover:bg-red-950/30 hover:text-red-300 border border-transparent hover:border-red-900/40 transition-colors",
            collapsed && "justify-center"
          )}
          title="Cerrar Sesión"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
}
