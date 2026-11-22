"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  FolderGit2,
  Database,
  ExternalLink,
  Code2,
  Users,
  KeyRound,
  X,
  ArrowRight,
} from "lucide-react";
import { Project, SupabaseInstance } from "@/types/database";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  projects?: Project[];
  supabaseInstances?: SupabaseInstance[];
}

export function CommandPalette({
  isOpen,
  onClose,
  projects = [],
  supabaseInstances = [],
}: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  // Keyboard shortcut listener for Cmd+K / Ctrl+K & Escape
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Trigger open is managed by parent or custom event
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      (p.client_name && p.client_name.toLowerCase().includes(query.toLowerCase())) ||
      p.tech_stack?.some((t) => t.toLowerCase().includes(query.toLowerCase()))
  );

  const filteredInstances = supabaseInstances.filter(
    (i) =>
      i.name.toLowerCase().includes(query.toLowerCase()) ||
      i.account_email.toLowerCase().includes(query.toLowerCase()) ||
      i.project_ref.toLowerCase().includes(query.toLowerCase())
  );

  const handleNavigate = (path: string) => {
    router.push(path);
    onClose();
  };

  const handleOpenExternal = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl rounded-xl bg-[#0e0e11] border border-zinc-800 shadow-2xl shadow-black/80 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-zinc-800/80">
          <Search className="w-4 h-4 text-zinc-400 shrink-0 mr-3" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Escribe para buscar proyectos, atajos de Supabase o credenciales..."
            className="w-full bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-2 space-y-4">
          {/* Quick Navigation Section */}
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 px-3 py-1">
              Navegación Rápida
            </div>
            <div className="space-y-0.5 mt-1">
              <button
                onClick={() => handleNavigate("/dashboard")}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-zinc-300 hover:bg-zinc-800/60 hover:text-white transition-colors text-left"
              >
                <span>Panel Resumen</span>
                <span className="text-[10px] font-mono text-zinc-500">/dashboard</span>
              </button>
              <button
                onClick={() => handleNavigate("/dashboard/projects")}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-zinc-300 hover:bg-zinc-800/60 hover:text-white transition-colors text-left"
              >
                <span>Gestión de Proyectos & APKs</span>
                <span className="text-[10px] font-mono text-zinc-500">/dashboard/projects</span>
              </button>
              <button
                onClick={() => handleNavigate("/dashboard/supabase")}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-zinc-300 hover:bg-zinc-800/60 hover:text-white transition-colors text-left"
              >
                <span>Monitor Supabase Anti-Pausa</span>
                <span className="text-[10px] font-mono text-zinc-500">/dashboard/supabase</span>
              </button>
              <button
                onClick={() => handleNavigate("/dashboard/vault")}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-zinc-300 hover:bg-zinc-800/60 hover:text-white transition-colors text-left"
              >
                <span>Bóveda Zero-Knowledge</span>
                <span className="text-[10px] font-mono text-zinc-500">/dashboard/vault</span>
              </button>
            </div>
          </div>

          {/* Supabase Instances Direct Deep Links */}
          {filteredInstances.length > 0 && (
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 px-3 py-1">
                Atajos Profundos Supabase (SQL, Table Editor, Auth)
              </div>
              <div className="space-y-1 mt-1">
                {filteredInstances.map((inst) => (
                  <div
                    key={inst.id}
                    className="p-2 rounded-lg bg-zinc-900/40 border border-zinc-800/50 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Database className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div className="flex flex-col truncate">
                        <span className="text-xs font-medium text-zinc-200">{inst.name}</span>
                        <span className="text-[10px] font-mono text-zinc-500">{inst.project_ref}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() =>
                          handleOpenExternal(`https://supabase.com/dashboard/project/${inst.project_ref}/sql`)
                        }
                        className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[11px] text-zinc-200 flex items-center gap-1 font-mono transition-colors"
                        title="Abrir SQL Editor"
                      >
                        <Code2 className="w-3 h-3 text-emerald-400" />
                        <span>SQL</span>
                      </button>

                      <button
                        onClick={() =>
                          handleOpenExternal(`https://supabase.com/dashboard/project/${inst.project_ref}/editor`)
                        }
                        className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[11px] text-zinc-200 flex items-center gap-1 font-mono transition-colors"
                        title="Abrir Table Editor"
                      >
                        <ExternalLink className="w-3 h-3 text-cyan-400" />
                        <span>Tablas</span>
                      </button>

                      <button
                        onClick={() =>
                          handleOpenExternal(
                            `https://supabase.com/dashboard/project/${inst.project_ref}/auth/users`
                          )
                        }
                        className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[11px] text-zinc-200 flex items-center gap-1 font-mono transition-colors"
                        title="Abrir Usuarios Auth"
                      >
                        <Users className="w-3 h-3 text-purple-400" />
                        <span>Auth</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects Section */}
          {filteredProjects.length > 0 && (
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 px-3 py-1">
                Proyectos
              </div>
              <div className="space-y-1 mt-1">
                {filteredProjects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleNavigate(`/dashboard/projects`)}
                    className="w-full flex items-center justify-between p-2 rounded-lg bg-zinc-900/30 hover:bg-zinc-800/60 border border-zinc-800/40 text-left transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <FolderGit2 className="w-4 h-4 text-zinc-400" />
                      <div>
                        <div className="text-xs font-medium text-zinc-200">{p.name}</div>
                        {p.client_name && (
                          <div className="text-[10px] text-zinc-500">{p.client_name}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                        {p.type}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between px-4 py-2 bg-zinc-950 border-t border-zinc-800/80 text-[11px] text-zinc-500 font-mono">
          <span>Presiona ESC para salir</span>
          <span>Navegar con ↑ ↓</span>
        </div>
      </div>
    </div>
  );
}
