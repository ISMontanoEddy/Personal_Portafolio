import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  FolderGit2,
  Database,
  KeySquare,
  Activity,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Smartphone,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();

  const [
    { count: totalProjects },
    { data: recentProjects },
    { data: supabaseInstances },
    { count: totalCredentials },
    { data: recentReleases },
  ] = await Promise.all([
    supabase.from("projects").select("*", { count: "exact", head: true }),
    supabase.from("projects").select("*").order("created_at", { ascending: false }).limit(4),
    supabase.from("supabase_instances").select("*").order("name"),
    supabase.from("vault_credentials").select("*", { count: "exact", head: true }),
    supabase.from("mobile_releases").select("*, projects(name)").order("created_at", { ascending: false }).limit(3),
  ]);

  const healthyInstances = (supabaseInstances || []).filter((i) => i.last_status === "healthy").length;
  const totalInstances = supabaseInstances?.length || 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800/80">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white flex items-center gap-2">
            <span>DevOps Control Center</span>
            <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
              v1.0.0
            </span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Plataforma centralizada de gestión de infraestructuras, proyectos web/móvil y bóveda segura.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/supabase"
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-medium transition-colors"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Monitor Supabase</span>
          </Link>

          <Link
            href="/dashboard/vault"
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 text-xs font-medium transition-colors"
          >
            <KeySquare className="w-3.5 h-3.5" />
            <span>Abrir Bóveda</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Projects Metric */}
        <div className="glass-panel rounded-xl p-5 border border-zinc-800/80">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider font-mono">
              Proyectos Registrados
            </span>
            <FolderGit2 className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-semibold text-white">{totalProjects || 0}</div>
          <div className="mt-2 text-[11px] text-zinc-500 flex items-center gap-1">
            <span className="text-emerald-400">Web & Mobile</span> • Con entornos activos
          </div>
        </div>

        {/* Supabase Keep-Alive Health Metric */}
        <div className="glass-panel rounded-xl p-5 border border-zinc-800/80">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider font-mono">
              Supabase Health
            </span>
            <Database className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-semibold text-white flex items-baseline gap-2">
            <span>{healthyInstances}</span>
            <span className="text-sm font-normal text-zinc-500">/ {totalInstances} activas</span>
          </div>
          <div className="mt-2 text-[11px] text-zinc-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            <span>Anti-pausa PostgREST ejecutándose</span>
          </div>
        </div>

        {/* Credentials Metric */}
        <div className="glass-panel rounded-xl p-5 border border-zinc-800/80">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider font-mono">
              Bóveda Zero-Knowledge
            </span>
            <KeySquare className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-semibold text-white">{totalCredentials || 0}</div>
          <div className="mt-2 text-[11px] text-zinc-500 flex items-center gap-1">
            <span className="text-purple-400">AES-256-GCM</span> • Cifrado en navegador
          </div>
        </div>

        {/* APK Releases Metric */}
        <div className="glass-panel rounded-xl p-5 border border-zinc-800/80">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider font-mono">
              Mobile Releases
            </span>
            <Smartphone className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-semibold text-white">{recentReleases?.length || 0}</div>
          <div className="mt-2 text-[11px] text-zinc-500 flex items-center gap-1">
            <span>Storage privado + QR dinámico</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Projects & Supabase Quick Monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Supabase Instances Quick Status */}
        <div className="glass-panel rounded-xl border border-zinc-800/80 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-zinc-100">Instancias Supabase Anti-Pausa</h2>
            </div>
            <Link
              href="/dashboard/supabase"
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <span>Ver todas</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {supabaseInstances && supabaseInstances.length > 0 ? (
              supabaseInstances.slice(0, 5).map((inst) => (
                <div
                  key={inst.id}
                  className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/60 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    {inst.last_status === "healthy" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                    <div className="flex flex-col truncate">
                      <span className="text-xs font-medium text-zinc-200 truncate">{inst.name}</span>
                      <span className="text-[10px] font-mono text-zinc-500 truncate">
                        {inst.project_ref} • {inst.account_email}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {inst.last_response_time_ms && (
                      <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">
                        {inst.last_response_time_ms}ms
                      </span>
                    )}
                    <a
                      href={`https://supabase.com/dashboard/project/${inst.project_ref}/sql`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] font-mono text-zinc-300 transition-colors"
                    >
                      SQL
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-zinc-500">
                No hay instancias registradas. Agrega tu primer proyecto Supabase para evitar pausas por inactividad.
              </div>
            )}
          </div>
        </div>

        {/* Recent Projects */}
        <div className="glass-panel rounded-xl border border-zinc-800/80 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-zinc-300" />
              <h2 className="text-sm font-semibold text-zinc-100">Proyectos Recientes</h2>
            </div>
            <Link
              href="/dashboard/projects"
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <span>Gestionar</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {recentProjects && recentProjects.length > 0 ? (
              recentProjects.map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/60 flex items-center justify-between gap-3"
                >
                  <div className="flex flex-col truncate">
                    <span className="text-xs font-medium text-zinc-200 truncate">{p.name}</span>
                    <span className="text-[10px] text-zinc-500 truncate">
                      {p.client_name ? `Cliente: ${p.client_name} • ` : ""}
                      {p.tech_stack?.join(", ") || "No stack specified"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700/60 text-zinc-300">
                      {p.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-zinc-500">
                No hay proyectos aún. Crea el primero desde la sección de Proyectos.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
