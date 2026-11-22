"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Project, ProjectStatus, ProjectType } from "@/types/database";
import { X, Loader2, Plus, Sparkles } from "lucide-react";

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialProject?: Project | null;
}

export function ProjectModal({
  isOpen,
  onClose,
  onSuccess,
  initialProject,
}: ProjectModalProps) {
  const isEditing = !!initialProject;

  const [name, setName] = useState(initialProject?.name || "");
  const [clientName, setClientName] = useState(initialProject?.client_name || "");
  const [type, setType] = useState<ProjectType>(initialProject?.type || "fullstack");
  const [status, setStatus] = useState<ProjectStatus>(initialProject?.status || "development");
  const [techStackInput, setTechStackInput] = useState(initialProject?.tech_stack?.join(", ") || "");
  const [prodUrl, setProdUrl] = useState(initialProject?.prod_url || "");
  const [stagingUrl, setStagingUrl] = useState(initialProject?.staging_url || "");
  const [hostingProvider, setHostingProvider] = useState(initialProject?.hosting_provider || "Vercel");
  const [notes, setNotes] = useState(initialProject?.notes || "");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const supabase = createClient();
      const tech_stack = techStackInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = {
        name,
        client_name: clientName || null,
        type,
        status,
        tech_stack,
        prod_url: prodUrl || null,
        staging_url: stagingUrl || null,
        hosting_provider: hostingProvider || null,
        notes: notes || null,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("projects")
          .update(payload)
          .eq("id", initialProject.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("projects").insert(payload);
        if (error) throw error;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl rounded-xl bg-[#0e0e11] border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-white">
            {isEditing ? "Editar Proyecto" : "Registrar Nuevo Proyecto"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Nombre del Proyecto *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="E-Commerce Core"
                className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Cliente / Organización</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Acme Corp"
                className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Tipo de Proyecto</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ProjectType)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              >
                <option value="web">Web Application</option>
                <option value="mobile">Mobile Application (APK)</option>
                <option value="fullstack">Fullstack / Monorepo</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Estado</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              >
                <option value="development">Development</option>
                <option value="production">Production</option>
                <option value="maintenance">Maintenance</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Tech Stack (Separado por comas)
            </label>
            <input
              type="text"
              value={techStackInput}
              onChange={(e) => setTechStackInput(e.target.value)}
              placeholder="Next.js, Supabase, Tailwind, React Native, Expo"
              className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">URL Producción</label>
              <input
                type="url"
                value={prodUrl}
                onChange={(e) => setProdUrl(e.target.value)}
                placeholder="https://app.tuempresa.com"
                className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono placeholder:text-zinc-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">URL Staging</label>
              <input
                type="url"
                value={stagingUrl}
                onChange={(e) => setStagingUrl(e.target.value)}
                placeholder="https://staging.tuempresa.com"
                className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono placeholder:text-zinc-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Hosting Provider</label>
            <input
              type="text"
              value={hostingProvider}
              onChange={(e) => setHostingProvider(e.target.value)}
              placeholder="Vercel / Cloudflare / AWS / Coolify"
              className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Notas / Documentación</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Arquitectura, accesos, requerimientos especiales..."
              className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs text-zinc-400 hover:text-zinc-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-medium transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isEditing ? "Guardar Cambios" : "Crear Proyecto"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
