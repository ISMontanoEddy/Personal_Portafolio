"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { VaultCredential, DecryptedCredential } from "@/types/database";
import {
  KeySquare,
  Lock,
  Unlock,
  Shield,
  Plus,
  Copy,
  Check,
  Eye,
  EyeOff,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  FileText,
  KeyRound,
} from "lucide-react";
import { encryptData, decryptData } from "@/lib/cryptoVault";
import { formatDate } from "@/lib/utils";

export default function VaultPage() {
  // Master Password is ONLY in React State (in-memory)
  const [masterPassword, setMasterPassword] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [unlockError, setUnlockError] = useState<string | null>(null);

  const [credentials, setCredentials] = useState<VaultCredential[]>([]);
  const [decryptedMap, setDecryptedMap] = useState<Record<string, { password: string; notes?: string }>>({});
  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});

  // Add credential modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [serviceName, setServiceName] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [notes2FA, setNotes2FA] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchCredentials = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("vault_credentials")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCredentials(data || []);
    } catch (err: any) {
      console.error("Error fetching credentials:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredentials();
  }, []);

  // When master password is entered, decrypt all credentials in the client browser
  const handleUnlockVault = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockError(null);

    if (!passwordInput.trim()) {
      setUnlockError("Ingresa tu contraseña maestra");
      return;
    }

    try {
      const currentPassword = passwordInput;
      const decryptedResults: Record<string, { password: string; notes?: string }> = {};

      // If credentials exist, test decrypting them to verify password
      if (credentials.length > 0) {
        let successCount = 0;
        for (const cred of credentials) {
          try {
            const decPassword = await decryptData(
              cred.encrypted_password,
              cred.iv,
              cred.salt,
              currentPassword
            );

            let decNotes: string | undefined = undefined;
            if (cred.encrypted_notes && cred.notes_iv) {
              try {
                decNotes = await decryptData(
                  cred.encrypted_notes,
                  cred.notes_iv,
                  cred.salt,
                  currentPassword
                );
              } catch {}
            }

            decryptedResults[cred.id] = { password: decPassword, notes: decNotes };
            successCount++;
          } catch {
            // Password tag failed for this entry
          }
        }

        if (successCount === 0 && credentials.length > 0) {
          throw new Error("Contraseña maestra incorrecta. No se pudo descifrar la bóveda.");
        }
      }

      setMasterPassword(currentPassword);
      setDecryptedMap(decryptedResults);
      setPasswordInput("");
    } catch (err: any) {
      setUnlockError(err.message || "Error al desbloquear la bóveda");
    }
  };

  const handleLockVault = () => {
    // Purge master password and plaintexts completely from React State
    setMasterPassword(null);
    setDecryptedMap({});
    setPasswordInput("");
    setRevealedIds({});
  };

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterPassword) return;

    setSaving(true);
    try {
      // 1. Client-Side Encryption using Web Crypto API
      const encPassword = await encryptData(newPassword, masterPassword);

      let encNotes: string | null = null;
      let notesIv: string | null = null;

      if (notes2FA.trim()) {
        const encNotesPayload = await encryptData(notes2FA, masterPassword, encPassword.salt);
        encNotes = encNotesPayload.cipherText;
        notesIv = encNotesPayload.iv;
      }

      // 2. Save only encrypted ciphertext to Supabase
      const supabase = createClient();
      const { data, error } = await supabase
        .from("vault_credentials")
        .insert({
          service_name: serviceName,
          login_email: loginEmail || null,
          encrypted_password: encPassword.cipherText,
          iv: encPassword.iv,
          salt: encPassword.salt,
          recovery_email: recoveryEmail || null,
          encrypted_notes: encNotes,
          notes_iv: notesIv,
        })
        .select()
        .single();

      if (error) throw error;

      // Update state with newly decrypted record
      if (data) {
        setDecryptedMap((prev) => ({
          ...prev,
          [data.id]: { password: newPassword, notes: notes2FA || undefined },
        }));
      }

      // Reset form
      setServiceName("");
      setLoginEmail("");
      setNewPassword("");
      setRecoveryEmail("");
      setNotes2FA("");
      setIsAddModalOpen(false);
      fetchCredentials();
    } catch (err: any) {
      alert("Error al cifrar y guardar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar la credencial "${name}" de la bóveda?`)) return;

    try {
      const supabase = createClient();
      await supabase.from("vault_credentials").delete().eq("id", id);
      setDecryptedMap((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      fetchCredentials();
    } catch (err: any) {
      alert("Error al eliminar: " + err.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-800">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
            <KeySquare className="w-5 h-5 text-purple-400" />
            <span>Bóveda de Credenciales Zero-Knowledge</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Cifrado de extremo a extremo en tu navegador con Web Crypto API (PBKDF2 + AES-256-GCM). La contraseña maestra nunca viaja por la red ni se guarda en almacenamiento persistente.
          </p>
        </div>

        {masterPassword ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-medium transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Credencial</span>
            </button>

            <button
              onClick={handleLockVault}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-950/40 hover:bg-purple-900/50 border border-purple-800/60 text-xs text-purple-300 font-medium transition-colors cursor-pointer"
              title="Purgar contraseña de la memoria y bloquear bóveda"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Bloquear Bóveda</span>
            </button>
          </div>
        ) : null}
      </div>

      {/* Vault Locked State: Unlock Screen */}
      {!masterPassword ? (
        <div className="max-w-md mx-auto my-12 glass-panel rounded-2xl p-8 border border-zinc-800 shadow-2xl text-center space-y-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 text-purple-400 shadow-lg">
            <Lock className="w-7 h-7" />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white">Bóveda Protegida</h2>
            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
              Ingresa tu Contraseña Maestra para derivar la clave criptográfica en memoria y descifrar tus credenciales.
            </p>
          </div>

          {unlockError && (
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/50 text-red-300 text-xs flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{unlockError}</span>
            </div>
          )}

          <form onSubmit={handleUnlockVault} className="space-y-4">
            <div className="relative">
              <input
                type="password"
                required
                autoFocus
                placeholder="Contraseña Maestra..."
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full px-4 py-2.5 text-sm rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-purple-400"
              />
              <KeyRound className="w-4 h-4 text-zinc-600 absolute right-3.5 top-3 pointer-events-none" />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Unlock className="w-4 h-4" />
              <span>Desbloquear Bóveda en Memoria</span>
            </button>
          </form>

          <div className="text-[11px] text-zinc-500 font-mono">
            <span>Algoritmo: PBKDF2 (SHA-256, 250k) • AES-256-GCM</span>
          </div>
        </div>
      ) : (
        /* Vault Unlocked State: Credential List */
        <div className="space-y-4">
          <div className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-purple-950/20 border border-purple-900/40 text-xs text-purple-300 font-mono">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-400" />
              <span>Bóveda Desbloqueada • Clave en Memoria Volátil</span>
            </div>
            <span>{credentials.length} registros protegidos</span>
          </div>

          {credentials.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl space-y-3">
              <KeySquare className="w-8 h-8 text-zinc-600 mx-auto" />
              <div className="text-sm text-zinc-400">Tu bóveda está vacía.</div>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="text-xs text-purple-400 hover:text-purple-300 underline underline-offset-4"
              >
                Agregar la primera credencial de cliente
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {credentials.map((cred) => {
                const dec = decryptedMap[cred.id];
                const isRevealed = revealedIds[cred.id];

                return (
                  <div
                    key={cred.id}
                    className="glass-panel rounded-xl p-4 border border-zinc-800/80 hover:border-zinc-700/80 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-white">{cred.service_name}</h3>
                          {cred.login_email && (
                            <span className="text-[11px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                              {cred.login_email}
                            </span>
                          )}
                          {cred.recovery_email && (
                            <span className="text-[10px] font-mono text-zinc-500">
                              (Recuperación: {cred.recovery_email})
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Copy Password Button */}
                        <button
                          onClick={() => handleCopy(dec?.password || "", `pwd-${cred.id}`)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-mono text-zinc-200 transition-colors cursor-pointer"
                          title="Copiar contraseña al portapapeles"
                        >
                          {copiedField === `pwd-${cred.id}` ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copiada</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copiar Pass</span>
                            </>
                          )}
                        </button>

                        {/* Toggle Reveal Password */}
                        <button
                          onClick={() => toggleReveal(cred.id)}
                          className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                          title={isRevealed ? "Ocultar" : "Mostrar contraseña"}
                        >
                          {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>

                        {/* Delete button */}
                        <button
                          onClick={() => handleDelete(cred.id, cred.service_name)}
                          className="p-1.5 rounded-lg hover:bg-red-950/40 text-zinc-500 hover:text-red-400 transition-colors"
                          title="Eliminar credencial"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Password display area */}
                    <div className="p-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800/80 font-mono text-xs flex items-center justify-between">
                      <span className="text-zinc-400 truncate">
                        {isRevealed ? (
                          dec?.password || "••••••••••••"
                        ) : (
                          "••••••••••••••••••••"
                        )}
                      </span>
                      <span className="text-[10px] text-zinc-600 font-mono">
                        IV: {cred.iv.slice(0, 8)}...
                      </span>
                    </div>

                    {/* 2FA Notes section if present */}
                    {dec?.notes && (
                      <div className="p-2.5 rounded-lg bg-purple-950/20 border border-purple-900/30 text-xs space-y-1">
                        <div className="flex items-center justify-between text-purple-300 font-medium">
                          <span className="flex items-center gap-1.5 text-[11px] font-mono">
                            <FileText className="w-3 h-3 text-purple-400" />
                            <span>Códigos de Respaldo 2FA / Notas Cifradas</span>
                          </span>
                          <button
                            onClick={() => handleCopy(dec.notes || "", `notes-${cred.id}`)}
                            className="text-[10px] text-purple-400 hover:underline flex items-center gap-1"
                          >
                            {copiedField === `notes-${cred.id}` ? "Copiado" : "Copiar"}
                          </button>
                        </div>
                        <p className="font-mono text-zinc-300 text-[11px] whitespace-pre-wrap">
                          {dec.notes}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add Credential Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-lg rounded-xl bg-[#0e0e11] border border-zinc-800 shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <h2 className="text-sm font-semibold text-white">Agregar Credencial a la Bóveda</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCredential} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Servicio / Plataforma *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Gmail / AWS / Vercel"
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Email de Login
                  </label>
                  <input
                    type="text"
                    placeholder="admin@cliente.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-purple-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Contraseña en Claro (Se cifrará antes de enviarse) *
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-purple-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Email de Recuperación
                </label>
                <input
                  type="email"
                  placeholder="recovery@cliente.com"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-purple-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Notas Cifradas (Códigos de Respaldo 2FA, claves OTP, etc.)
                </label>
                <textarea
                  rows={3}
                  placeholder="1234 5678, recovery token..."
                  value={notes2FA}
                  onChange={(e) => setNotes2FA(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-purple-400"
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
                  disabled={saving}
                  className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Cifrar & Guardar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
