"use client";

import { useState } from "react";
import { Activity, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface HttpCheckBadgeProps {
  url: string;
}

export function HttpCheckBadge({ url }: HttpCheckBadgeProps) {
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<{
    ok?: boolean;
    status?: number;
    responseTimeMs?: number;
    statusText?: string;
  } | null>(null);

  const checkStatus = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setChecking(true);

    try {
      const res = await fetch("/api/projects/health-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ ok: false, status: 0, statusText: "Error de red" });
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={checkStatus}
        disabled={checking}
        className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700/60 text-[10px] text-zinc-300 font-mono transition-colors disabled:opacity-50"
        title="Verificar estado HTTP"
      >
        {checking ? (
          <Loader2 className="w-3 h-3 animate-spin text-zinc-400" />
        ) : (
          <Activity className="w-3 h-3 text-zinc-400" />
        )}
        <span>Ping HTTP</span>
      </button>

      {result && (
        <span
          className={`flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded border ${
            result.ok
              ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/50"
              : "bg-red-950/40 text-red-400 border-red-800/50"
          }`}
        >
          {result.ok ? (
            <CheckCircle2 className="w-3 h-3" />
          ) : (
            <AlertCircle className="w-3 h-3" />
          )}
          <span>
            {result.status || "ERR"} {result.responseTimeMs ? `(${result.responseTimeMs}ms)` : ""}
          </span>
        </span>
      )}
    </div>
  );
}
