"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ProjectRepository } from "@/types/database";
import { X, Plus, GitBranch, ExternalLink, Trash2, Loader2 } from "lucide-react";

interface RepositoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
}

export function RepositoriesModal({
  isOpen,
  onClose,
  projectId,
  projectName,
}: RepositoriesModalProps) {
  const [repos, setRepos] = useState<ProjectRepository[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // New repo form
  const [label, setLabel] = useState("Frontend");
  const [repoUrl, setRepoUrl] = useState("");
  const [branch, setBranch] = useState("main");
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchRepos = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("project_repositories")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setRepos(data || []);
    } catch (err: any) {
      console.error("Error fetching repositories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRepos();
    }
  }, [isOpen, projectId]);

  if (!isOpen) return null;

  const handleAddRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.from("project_repositories").insert({
        project_id: projectId,
        label,
        repo_url: repoUrl,
        branch,
      });

      if (error) throw error;

      setRepoUrl("");
      setBranch("main");
      setShowAddForm(false);
      fetchRepos();
    } catch (err: any) {
      alert("Error al agregar repositorio: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (repoId: string) => {
    if (!confirm("¿Eliminar este repositorio del proyecto?")) return;

    try {
      const supabase = createClient();
      await supabase.from("project_repositories").delete().eq("id", repoId);
      fetchRepos();
    } catch (err: any) {
      alert("Error al eliminar: " + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl rounded-xl bg-[#0e0e11] border border-zinc-800 shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-sm font-semibold text-white">Repositorios Asociados</h2>
              <p className="text-xs text-zinc-400">{projectName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full py-2.5 px-4 rounded-lg bg-zinc-900/60 hover:bg-zinc-800/80 border border-dashed border-zinc-700/80 text-xs font-medium text-zinc-300 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Vincular Nuevo Repositorio (1:N)</span>
            </button>
          )}

          {showAddForm && (
            <form onSubmit={handleAddRepo} className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Etiqueta</label>
                  <select
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs rounded-md bg-zinc-950 border border-zinc-800 text-zinc-100"
                  >
                    <option value="Frontend">Frontend</option>
                    <option value="Backend">Backend</option>
                    <option value="Mobile">Mobile</option>
                    <option value="API">API Gateway</option>
                    <option value="Infra/DevOps">Infra / DevOps</option>
                    <option value="Monorepo">Monorepo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Rama por Defecto</label>
                  <input
                    type="text"
                    required
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-md bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">URL del Repositorio</label>
                <input
                  type="url"
                  required
                  placeholder="https://github.com/empresa/proyecto-frontend"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-md bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono placeholder:text-zinc-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {submitting ? "Guardando..." : "Guardar Repositorio"}
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {loading ? (
              <div className="py-6 text-center text-xs text-zinc-500">Cargando repositorios...</div>
            ) : repos.length === 0 ? (
              <div className="py-6 text-center text-xs text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
                No hay repositorios vinculados aún.
              </div>
            ) : (
              repos.map((r) => (
                <div
                  key={r.id}
                  className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/70 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-emerald-400 border border-zinc-700/60 uppercase">
                      {r.label}
                    </span>
                    <span className="text-xs text-zinc-300 font-mono truncate">{r.repo_url}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">({r.branch})</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={r.repo_url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                      title="Abrir en GitHub/GitLab"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="p-1.5 rounded hover:bg-red-950/40 text-zinc-500 hover:text-red-400 transition-colors"
                      title="Eliminar repositorio"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
