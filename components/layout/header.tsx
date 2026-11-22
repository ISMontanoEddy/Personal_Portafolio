"use client";

import { Search, Activity, Terminal } from "lucide-react";

interface HeaderProps {
  onOpenCommandPalette: () => void;
}

export function Header({ onOpenCommandPalette }: HeaderProps) {
  return (
    <header className="h-14 border-b border-zinc-800 bg-[#09090b]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800/80 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs transition-colors shadow-sm group cursor-pointer"
        >
          <Search className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300" />
          <span className="text-zinc-400">Buscar proyectos, atajos, SQL...</span>
          <div className="flex items-center gap-0.5 ml-4">
            <span className="kbd">⌘</span>
            <span className="kbd">K</span>
          </div>
        </button>
      </div>

      <div className="flex items-center gap-4">
        {/* Anti-Pause Cron Status Indicator */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-800/40 text-[11px] font-mono text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Cron Anti-Pausa Activo</span>
        </div>
      </div>
    </header>
  );
}
