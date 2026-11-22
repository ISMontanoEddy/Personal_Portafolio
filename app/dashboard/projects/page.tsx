"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Project, ProjectStatus, ProjectType } from "@/types/database";
import {
  FolderGit2,
  Plus,
  GitBranch,
  Smartphone,
  ExternalLink,
  Globe,
  Server,
  Layers,
  Search,
  Trash2,
  Edit2,
} from "lucide-react";
import { HttpCheckBadge } from "@/components/projects/http-check-badge";
import { ProjectModal } from "@/components/projects/project-modal";
import { RepositoriesModal } from "@/components/projects/repositories-modal";
import { ReleasesModal } from "@/components/projects/releases-modal";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const [activeRepoProject, setActiveRepoProject] = useState<{ id: string; name: string } | null>(null);
  const [activeReleaseProject, setActiveReleaseProject] = useState<{ id: string; name: string } | null>(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (err: any) {
      console.error("Error loading projects:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar definitivamente el proyecto "${name}" y todos sus repositorios/releases asociados?`)) return;

    try {
      const supabase = createClient();
      await supabase.from("projects").delete().eq("id", id);
      fetchProjects();
    } catch (err: any) {
      alert("Error al eliminar: " + err.message);
    }
  };

  const filteredProjects = projects.filter((p) => {
    const matchesType = filterType === "all" || p.type === filterType;
    const matchesStatus = filterStatus === "all" || p.status === filterStatus;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.client_name && p.client_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.tech_stack?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesType && matchesStatus && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-800">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-zinc-400" />
            <span>Gestión de Proyectos Web & Mobile</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Control de repositorios múltiples (1:N), entornos HTTP en vivo y releases APK con código QR instantáneo.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingProject(null);
            setIsProjectModalOpen(true);
          }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-medium transition-colors shadow-sm self-start cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Proyecto</span>
        </button>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Filtrar por nombre, cliente, stack..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300"
          >
            <option value="all">Todos los tipos</option>
            <option value="web">Web</option>
            <option value="mobile">Mobile (APK)</option>
            <option value="fullstack">Fullstack</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300"
          >
            <option value="all">Todos los estados</option>
            <option value="development">Development</option>
            <option value="production">Production</option>
            <option value="maintenance">Maintenance</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Projects List / Cards */}
      {loading ? (
        <div className="text-center py-16 text-zinc-500 text-xs">Cargando proyectos...</div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl space-y-3">
          <FolderGit2 className="w-8 h-8 text-zinc-600 mx-auto" />
          <div className="text-sm text-zinc-400">No se encontraron proyectos con los filtros actuales.</div>
          <button
            onClick={() => {
              setEditingProject(null);
              setIsProjectModalOpen(true);
            }}
            className="text-xs text-zinc-300 hover:text-white underline underline-offset-4"
          >
            Registrar el primer proyecto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="glass-panel rounded-xl p-5 border border-zinc-800/80 hover:border-zinc-700/80 transition-all space-y-4"
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-semibold text-white tracking-tight">{project.name}</h3>
                    {project.client_name && (
                      <span className="text-[11px] font-mono text-zinc-400 px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/50">
                        {project.client_name}
                      </span>
                    )}
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                      {project.type}
                    </span>
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                        project.status === "production"
                          ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/50"
                          : project.status === "development"
                          ? "bg-cyan-950/40 text-cyan-400 border-cyan-800/50"
                          : "bg-zinc-800 text-zinc-400 border-zinc-700"
                      }`}
                    >
                      {project.status}
                    </span>
                  </div>

                  {project.notes && (
                    <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">{project.notes}</p>
                  )}
                </div>

                {/* Top Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setEditingProject(project);
                      setIsProjectModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                    title="Editar proyecto"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDelete(project.id, project.name)}
                    className="p-1.5 rounded-lg hover:bg-red-950/40 text-zinc-500 hover:text-red-400 transition-colors"
                    title="Eliminar proyecto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Tech Stack Tags */}
              {project.tech_stack && project.tech_stack.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {project.tech_stack.map((tech) => (
                    <span
                      key={tech}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800"
                    >
                      {tech}
                    </span>
                  ))}
                  {project.hosting_provider && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800/60 text-zinc-400 flex items-center gap-1">
                      <Server className="w-2.5 h-2.5" />
                      <span>{project.hosting_provider}</span>
                    </span>
                  )}
                </div>
              )}

              {/* Environments with Live HTTP Health Check */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-800/60">
                {/* Production URL */}
                <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <div className="flex flex-col truncate">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase">PRODUCCIÓN</span>
                      {project.prod_url ? (
                        <a
                          href={project.prod_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-zinc-200 hover:text-white truncate flex items-center gap-1 font-mono"
                        >
                          <span className="truncate">{project.prod_url}</span>
                          <ExternalLink className="w-3 h-3 shrink-0 text-zinc-500" />
                        </a>
                      ) : (
                        <span className="text-xs text-zinc-600 font-mono">No configurada</span>
                      )}
                    </div>
                  </div>
                  {project.prod_url && <HttpCheckBadge url={project.prod_url} />}
                </div>

                {/* Staging URL */}
                <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Globe className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <div className="flex flex-col truncate">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase">STAGING</span>
                      {project.staging_url ? (
                        <a
                          href={project.staging_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-zinc-200 hover:text-white truncate flex items-center gap-1 font-mono"
                        >
                          <span className="truncate">{project.staging_url}</span>
                          <ExternalLink className="w-3 h-3 shrink-0 text-zinc-500" />
                        </a>
                      ) : (
                        <span className="text-xs text-zinc-600 font-mono">No configurada</span>
                      )}
                    </div>
                  </div>
                  {project.staging_url && <HttpCheckBadge url={project.staging_url} />}
                </div>
              </div>

              {/* Bottom Modules Triggers: Multi-Repositories & Mobile Releases */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60">
                <div className="flex items-center gap-2">
                  {/* Multi-Repositories (1:N) */}
                  <button
                    onClick={() => setActiveRepoProject({ id: project.id, name: project.name })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/60 text-xs text-zinc-300 font-medium transition-colors cursor-pointer"
                  >
                    <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Repositorios (1:N)</span>
                  </button>

                  {/* Mobile APK Releases + Instant QR */}
                  {(project.type === "mobile" || project.type === "fullstack") && (
                    <button
                      onClick={() => setActiveReleaseProject({ id: project.id, name: project.name })}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/30 hover:bg-cyan-900/40 border border-cyan-800/40 text-xs text-cyan-300 font-medium transition-colors cursor-pointer"
                    >
                      <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Releases APK & QR</span>
                    </button>
                  )}
                </div>

                <div className="text-[10px] font-mono text-zinc-600">ID: {project.id.slice(0, 8)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Project Create/Edit Modal */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSuccess={fetchProjects}
        initialProject={editingProject}
      />

      {/* Repositories Modal (1:N) */}
      {activeRepoProject && (
        <RepositoriesModal
          isOpen={true}
          onClose={() => setActiveRepoProject(null)}
          projectId={activeRepoProject.id}
          projectName={activeRepoProject.name}
        />
      )}

      {/* Releases APK & QR Modal */}
      {activeReleaseProject && (
        <ReleasesModal
          isOpen={true}
          onClose={() => setActiveReleaseProject(null)}
          projectId={activeReleaseProject.id}
          projectName={activeReleaseProject.name}
        />
      )}
    </div>
  );
}
