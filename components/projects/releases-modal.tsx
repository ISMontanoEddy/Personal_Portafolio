"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { MobileRelease, ReleaseEnvironment } from "@/types/database";
import {
  X,
  Plus,
  Upload,
  QrCode,
  Download,
  Loader2,
  Smartphone,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { QrModal } from "./qr-modal";
import { formatBytes, formatDate } from "@/lib/utils";

interface ReleasesModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
}

export function ReleasesModal({
  isOpen,
  onClose,
  projectId,
  projectName,
}: ReleasesModalProps) {
  const [releases, setReleases] = useState<MobileRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // New release form state
  const [versionName, setVersionName] = useState("");
  const [buildNumber, setBuildNumber] = useState(1);
  const [environment, setEnvironment] = useState<ReleaseEnvironment>("release");
  const [changelog, setChangelog] = useState("");
  const [externalApkUrl, setExternalApkUrl] = useState("");
  const [apkFile, setApkFile] = useState<File | null>(null);

  // QR Modal State
  const [selectedQr, setSelectedQr] = useState<{
    url: string;
    version: string;
  } | null>(null);

  const fetchReleases = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("mobile_releases")
        .select("*")
        .eq("project_id", projectId)
        .order("build_number", { ascending: false });

      if (error) throw error;
      setReleases(data || []);
    } catch (err: any) {
      console.error("Error fetching releases:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchReleases();
    }
  }, [isOpen, projectId]);

  if (!isOpen) return null;

  const handleCreateRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      const supabase = createClient();
      let finalApkUrl = externalApkUrl;
      let storagePath: string | null = null;
      let fileSize: number | null = null;

      // If user uploaded an APK file to Supabase Storage
      if (apkFile) {
        fileSize = apkFile.size;
        const fileExt = "apk";
        const fileName = `${projectId}/${Date.now()}_v${versionName}_b${buildNumber}.${fileExt}`;
        storagePath = fileName;

        // Upload to private bucket 'apks'
        const { error: uploadError } = await supabase.storage
          .from("apks")
          .upload(fileName, apkFile, {
            contentType: "application/vnd.android.package-archive",
            upsert: true,
          });

        if (uploadError) throw uploadError;

        // Generate signed URL with long expiry (e.g. 7 days = 604800s)
        const { data: signedData, error: signError } = await supabase.storage
          .from("apks")
          .createSignedUrl(fileName, 604800);

        if (signError) throw signError;
        finalApkUrl = signedData.signedUrl;
      }

      if (!finalApkUrl) {
        throw new Error("Debes subir un archivo APK o proveer una URL externa");
      }

      const { error: insertError } = await supabase.from("mobile_releases").insert({
        project_id: projectId,
        version_name: versionName,
        build_number: Number(buildNumber),
        environment,
        changelog,
        apk_url: finalApkUrl,
        storage_path: storagePath,
        file_size_bytes: fileSize,
      });

      if (insertError) throw insertError;

      // Reset form
      setVersionName("");
      setBuildNumber((prev) => prev + 1);
      setChangelog("");
      setExternalApkUrl("");
      setApkFile(null);
      setShowAddForm(false);
      fetchReleases();
    } catch (err: any) {
      alert(err.message || "Error al crear la versión");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (releaseId: string, storagePath?: string | null) => {
    if (!confirm("¿Seguro que deseas eliminar esta versión de APK?")) return;

    try {
      const supabase = createClient();
      if (storagePath) {
        await supabase.storage.from("apks").remove([storagePath]);
      }
      await supabase.from("mobile_releases").delete().eq("id", releaseId);
      fetchReleases();
    } catch (err: any) {
      alert("Error al eliminar: " + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl rounded-xl bg-[#0e0e11] border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <Smartphone className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-sm font-semibold text-white">Releases Mobile (APKs)</h2>
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

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Top Add Button */}
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full py-2.5 px-4 rounded-lg bg-zinc-900/60 hover:bg-zinc-800/80 border border-dashed border-zinc-700/80 text-xs font-medium text-zinc-300 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>Subir Nueva Versión de APK (.apk)</span>
            </button>
          )}

          {/* New Release Form */}
          {showAddForm && (
            <form
              onSubmit={handleCreateRelease}
              className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
                <span className="text-xs font-semibold text-zinc-200">Nueva Versión APK</span>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-zinc-500 hover:text-zinc-300"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Versión (SemVer)</label>
                  <input
                    type="text"
                    required
                    placeholder="1.0.0"
                    value={versionName}
                    onChange={(e) => setVersionName(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-md bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Build Number</label>
                  <input
                    type="number"
                    required
                    value={buildNumber}
                    onChange={(e) => setBuildNumber(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs rounded-md bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Entorno</label>
                  <select
                    value={environment}
                    onChange={(e) => setEnvironment(e.target.value as ReleaseEnvironment)}
                    className="w-full px-2 py-1.5 text-xs rounded-md bg-zinc-950 border border-zinc-800 text-zinc-100"
                  >
                    <option value="release">Release</option>
                    <option value="debug">Debug</option>
                    <option value="beta">Beta</option>
                    <option value="staging">Staging</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">
                  Subir archivo .apk (Storage Supabase privado)
                </label>
                <input
                  type="file"
                  accept=".apk,application/vnd.android.package-archive"
                  onChange={(e) => setApkFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-zinc-800 file:text-zinc-200 hover:file:bg-zinc-700"
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">
                  O URL externa de descarga (ej. GitHub Releases / CDN)
                </label>
                <input
                  type="url"
                  placeholder="https://github.com/org/repo/releases/download/v1.0.0/app.apk"
                  value={externalApkUrl}
                  onChange={(e) => setExternalApkUrl(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-md bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Changelog / Notas</label>
                <textarea
                  rows={2}
                  placeholder="Corrección de bugs, nueva pantalla de inicio..."
                  value={changelog}
                  onChange={(e) => setChangelog(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-md bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600"
                />
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full py-2 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Subiendo y procesando versión...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Guardar y Publicar Release</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Releases List */}
          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-zinc-500 gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs">Cargando versiones...</span>
              </div>
            ) : releases.length === 0 ? (
              <div className="text-center py-8 text-xs text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
                No hay versiones registradas para este proyecto móvil.
              </div>
            ) : (
              releases.map((rel) => (
                <div
                  key={rel.id}
                  className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3 overflow-hidden">
                    <div className="p-2 rounded-lg bg-zinc-800 border border-zinc-700/60 text-cyan-400 shrink-0">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white font-mono">
                          v{rel.version_name}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800 px-1.5 py-0.2 rounded">
                          Build #{rel.build_number}
                        </span>
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded border border-zinc-700 text-zinc-300">
                          {rel.environment}
                        </span>
                      </div>
                      {rel.changelog && (
                        <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">
                          {rel.changelog}
                        </p>
                      )}
                      <div className="text-[10px] text-zinc-500 mt-1 font-mono flex items-center gap-2">
                        <span>{formatDate(rel.created_at)}</span>
                        {rel.file_size_bytes && (
                          <span>• {formatBytes(rel.file_size_bytes)}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Instant QR Code Button */}
                    <button
                      onClick={() =>
                        setSelectedQr({
                          url: rel.apk_url,
                          version: `v${rel.version_name} (Build ${rel.build_number})`,
                        })
                      }
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-800/50 text-cyan-400 text-xs font-medium transition-colors cursor-pointer"
                      title="Ver Código QR para escanear y descargar con el celular"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>QR</span>
                    </button>

                    {/* Download Button */}
                    <a
                      href={rel.apk_url}
                      target="_blank"
                      rel="noreferrer"
                      download
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                      title="Descargar APK"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDelete(rel.id, rel.storage_path)}
                      className="p-1.5 rounded-lg hover:bg-red-950/40 text-zinc-500 hover:text-red-400 transition-colors"
                      title="Eliminar versión"
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

      {/* Dynamic QR Modal */}
      {selectedQr && (
        <QrModal
          isOpen={true}
          onClose={() => setSelectedQr(null)}
          title={`Descarga APK - ${projectName}`}
          versionName={selectedQr.version}
          downloadUrl={selectedQr.url}
        />
      )}
    </div>
  );
}
