"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Shield, KeyRound, Loader2, ArrowRight, Lock, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        throw signInError;
      }

      if (data?.user) {
        // Redirección completa para garantizar sincronización de cookies en Next.js
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      console.error("Login error:", err);
      let message = err.message || "Error al autenticar. Verifica tus credenciales.";

      if (message.includes("Invalid login credentials")) {
        message = "Credenciales incorrectas. Verifica el correo y la contraseña en Supabase Auth.";
      } else if (message.includes("Email not confirmed")) {
        message = "El correo no está confirmado en Supabase. En Supabase Dashboard -> Authentication -> Users, marca el usuario como 'Confirmed' o crea uno nuevo con 'Auto Confirm'.";
      }

      setError(message);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-[#09090b] relative overflow-hidden">
      {/* Subtle background glow effect (Vercel/Linear style) */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-zinc-800/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 mb-4 shadow-xl shadow-black/40">
            <Shield className="w-6 h-6 text-zinc-100" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">DevOps IDP</h1>
          <p className="text-sm text-zinc-400 mt-1">Centro de Control Privado y Bóveda Zero-Knowledge</p>
        </div>

        <div className="glass-panel rounded-xl p-7 shadow-2xl shadow-black/60 border border-zinc-800">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-zinc-800/60">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span className="text-xs uppercase tracking-wider font-mono text-zinc-400">
              Acceso Restringido • Solo Administrador
            </span>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-950/40 border border-red-800/50 text-red-300 text-xs flex items-start gap-2 leading-relaxed">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@tuempresa.com"
                className="w-full px-3 py-2 text-sm rounded-lg bg-zinc-950/60 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 text-sm rounded-lg bg-zinc-950/60 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-500 transition-colors"
                />
                <KeyRound className="w-4 h-4 text-zinc-600 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-sm transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-900" />
                  <span>Validando acceso...</span>
                </>
              ) : (
                <>
                  <span>Ingresar al Portal</span>
                  <ArrowRight className="w-4 h-4 text-zinc-700 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center text-xs text-zinc-600 font-mono">
          <span>RLS Enforced • Zero-Knowledge Vault • Supabase SSR</span>
        </div>
      </div>
    </main>
  );
}
