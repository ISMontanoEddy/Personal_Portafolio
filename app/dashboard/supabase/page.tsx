"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { SupabaseInstance } from "@/types/database";
import {
  Database,
  Plus,
  Play,
  Loader2,
  ExternalLink,
  Code2,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  X,
  ShieldAlert,
  Terminal,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function SupabaseMonitorPage() {
  const [instances, setInstances] = useState<SupabaseInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [pingingAll, setPingingAll] = useState(false);
  const [pingingId, setPingingId] = useState<string | null>(null);

  // Add instance modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [projectRef, setProjectRef] = useState("");
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [anonKey, setAnonKey] = useState("");
  const [keepAliveTable, setKeepAliveTable] = useState("_keep_alive");
  const [submitting, setSubmitting] = useState(false);

  const fetchInstances = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("supabase_instances")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setInstances(data || []);
    } catch (err: any) {
      console.error("Error loading Supabase instances:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstances();
  }, []);

  const handlePingAll = async () => {
    try {
      setPingingAll(true);
      const res = await fetch("/api/supabase/ping", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error executing ping");
      await fetchInstances();
    } catch (err: any) {
      alert("Error al ejecutar Ping All: " + err.message);
    } finally {
      setPingingAll(false);
    }
  };

  const handlePingSingle = async (instanceId: string) => {
    try {
      setPingingId(instanceId);
      const res = await fetch("/api/supabase/ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instanceId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error pinging instance");
      await fetchInstances();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setPingingId(null);
    }
  };

  const handleCreateInstance = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const supabase = createClient();
      const cleanRef = projectRef.trim();
      const cleanUrl = supabaseUrl.trim().replace(/\/+$/, "");

      const { error } = await supabase.from("supabase_instances").insert({
        name,
        account_email: accountEmail,
        project_ref: cleanRef,
        supabase_url: cleanUrl,
        anon_key: anonKey.trim(),
        keep_alive_table: keepAliveTable || "_keep_alive",
        last_status: "pending",
      });

      if (error) throw error;

      // Reset
      setName("");
      setAccountEmail("");
      setProjectRef("");
      setSupabaseUrl("");
      setAnonKey("");
      setKeepAliveTable("_keep_alive");
      setIsAddModalOpen(false);
      fetchInstances();
    } catch (err: any) {
      alert("Error al registrar instancia: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, instanceName: string) => {
    if (!confirm(`¿Eliminar la instancia "${instanceName}" del monitor anti-pausa?`)) return;

    try {
      const supabase = createClient();
      await supabase.from("supabase_instances").delete().eq("id", id);
      fetchInstances();
    } catch (err: any) {
      alert("Error al eliminar: " + err.message);
    }
  };

  // Auto-fill URL when project_ref changes if empty
  const handleRefChange = (val: string) => {
    setProjectRef(val);
    if (!supabaseUrl || supabaseUrl.includes(".supabase.co")) {
      setSupabaseUrl(`https://${val.trim()}.supabase.co`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-800">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            <span>Monitor & Motor Anti-Pausa de Supabase (Multi-Cuenta)</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Evita la pausa automática por 7 días de inactividad ejecutando pings directos contra la API PostgREST y accede con atajos directos al SQL Editor.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePingAll}
            disabled={pingingAll || instances.length === 0}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {pingingAll ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Ejecutando Pings...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Ping All Now</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-medium transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Instancia</span>
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 flex items-start gap-3">
        <Terminal className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
        <div className="text-xs text-zinc-400 leading-relaxed">
          <span className="font-semibold text-zinc-200">¿Cómo funciona el Anti-Pausa? </span>
          Cada ping realiza una consulta <code className="text-emerald-400 font-mono">GET /rest/v1/{'{table}'}?select=*&limit=1</code>{" "}
          utilizando el anon key. Esto registra actividad de I/O y lectura real en PostgreSQL. El cron configurado en{" "}
          <code className="text-zinc-300 font-mono">vercel.json</code> lo ejecuta en segundo plano cada 3 días automáticamente.
        </div>
      </div>

      {/* Instances Table / Cards */}
      {loading ? (
        <div className="text-center py-16 text-zinc-500 text-xs">Cargando instancias de Supabase...</div>
      ) : instances.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl space-y-3">
          <Database className="w-8 h-8 text-zinc-600 mx-auto" />
          <div className="text-sm text-zinc-400">No hay instancias de Supabase registradas.</div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="text-xs text-zinc-300 hover:text-white underline underline-offset-4"
          >
            Registrar la primera instancia de cliente o personal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {instances.map((inst) => (
            <div
              key={inst.id}
              className="glass-panel rounded-xl p-5 border border-zinc-800/80 hover:border-zinc-700/80 transition-all space-y-4"
            >
              {/* Row Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-emerald-400">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-white">{inst.name}</h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                        {inst.project_ref}
                      </span>
                      {/* Status Badge */}
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border flex items-center gap-1 ${
                          inst.last_status === "healthy"
                            ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/50"
                            : inst.last_status === "pending"
                            ? "bg-zinc-800 text-zinc-400 border-zinc-700"
                            : "bg-red-950/40 text-red-400 border-red-800/50"
                        }`}
                      >
                        {inst.last_status === "healthy" ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <AlertTriangle className="w-3 h-3" />
                        )}
                        <span>{inst.last_status || "PENDING"}</span>
                      </span>
                    </div>
                    <div className="text-xs text-zinc-500 font-mono mt-0.5">
                      Cuenta: {inst.account_email} • Tabla Ping: <code className="text-zinc-400">{inst.keep_alive_table}</code>
                    </div>
                  </div>
                </div>

                {/* Right Top Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePingSingle(inst.id)}
                    disabled={pingingId === inst.id || pingingAll}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-mono text-zinc-200 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {pingingId === inst.id ? (
                      <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />
                    ) : (
                      <Play className="w-3 h-3 text-emerald-400 fill-current" />
                    )}
                    <span>Ping Now</span>
                  </button>

                  <button
                    onClick={() => handleDelete(inst.id, inst.name)}
                    className="p-1.5 rounded-lg hover:bg-red-950/40 text-zinc-500 hover:text-red-400 transition-colors"
                    title="Eliminar instancia"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Status and Last Ping Details */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-zinc-400 pt-2 border-t border-zinc-800/60 font-mono gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    <span>
                      Último Ping: {inst.last_ping_at ? formatDate(inst.last_ping_at) : "Nunca ejecutado"}
                    </span>
                  </div>

                  {inst.last_response_time_ms && (
                    <span className="text-zinc-300 bg-zinc-800/80 px-2 py-0.5 rounded">
                      Latencia: {inst.last_response_time_ms}ms
                    </span>
                  )}
                </div>

                {inst.last_error && (
                  <span className="text-red-400 text-[11px] truncate max-w-sm">
                    Error: {inst.last_error}
                  </span>
                )}
              </div>

              {/* Automatic Deep Links */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 flex-wrap gap-2">
                <span className="text-[11px] font-mono text-zinc-500 uppercase">Atajos Profundos:</span>

                <div className="flex items-center gap-2">
                  {/* Table Editor */}
                  <a
                    href={`https://supabase.com/dashboard/project/${inst.project_ref}/editor`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-cyan-400 font-mono transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Table Editor</span>
                  </a>

                  {/* SQL Editor */}
                  <a
                    href={`https://supabase.com/dashboard/project/${inst.project_ref}/sql`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-emerald-400 font-mono transition-colors"
                  >
                    <Code2 className="w-3 h-3" />
                    <span>SQL Editor</span>
                  </a>

                  {/* Auth Users */}
                  <a
                    href={`https://supabase.com/dashboard/project/${inst.project_ref}/auth/users`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-purple-400 font-mono transition-colors"
                  >
                    <Users className="w-3 h-3" />
                    <span>Auth Users</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Register Instance Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-lg rounded-xl bg-[#0e0e11] border border-zinc-800 shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <h2 className="text-sm font-semibold text-white">Registrar Instancia de Supabase</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateInstance} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Nombre Descriptivo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Cliente A - Prod"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Email de la Cuenta *</label>
                  <input
                    type="email"
                    required
                    placeholder="cliente@gmail.com"
                    value={accountEmail}
                    onChange={(e) => setAccountEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Project Ref (20 chars) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="abcdefghijklmnopqrs"
                    value={projectRef}
                    onChange={(e) => handleRefChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Tabla Keep-Alive *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="_keep_alive"
                    value={keepAliveTable}
                    onChange={(e) => setKeepAliveTable(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Supabase URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://abcdefghijklmnopqrs.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Anon Public Key *</label>
                <input
                  type="text"
                  required
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs text-zinc-400 hover:text-zinc-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Registrar Instancia</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
