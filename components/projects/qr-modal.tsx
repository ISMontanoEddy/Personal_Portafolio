"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { X, Copy, Check, Download, QrCode } from "lucide-react";

interface QrModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  downloadUrl: string;
  versionName?: string;
}

export function QrModal({
  isOpen,
  onClose,
  title,
  downloadUrl,
  versionName,
}: QrModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(downloadUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-sm rounded-xl bg-[#0e0e11] border border-zinc-800 p-6 shadow-2xl shadow-black/90 space-y-5 text-center relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div>
          <div className="inline-flex p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-cyan-400 mb-2">
            <QrCode className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-white">{title}</h3>
          {versionName && (
            <p className="text-xs font-mono text-zinc-400 mt-0.5">Versión: {versionName}</p>
          )}
        </div>

        {/* QR Code Container */}
        <div className="flex justify-center p-4 rounded-xl bg-white shadow-inner max-w-[220px] mx-auto">
          <QRCodeSVG
            value={downloadUrl}
            size={180}
            level="H"
            includeMargin={true}
          />
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed">
          Escanea el código con la cámara de tu celular para descargar e instalar el archivo APK directamente.
        </p>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-xs font-medium text-zinc-200 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Enlace Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Enlace</span>
              </>
            )}
          </button>

          <a
            href={downloadUrl}
            target="_blank"
            rel="noreferrer"
            download
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar</span>
          </a>
        </div>
      </div>
    </div>
  );
}
