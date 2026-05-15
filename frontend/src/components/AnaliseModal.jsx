import { X, Sparkles, Copy, Check } from "lucide-react";
import { useState } from "react";

function renderAnalise(text) {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("## ")) {
      return (
        <h3 key={i} className="text-sm font-bold text-amber mt-5 mb-2 first:mt-0">
          {line.replace("## ", "")}
        </h3>
      );
    }
    if (line.startsWith("• ") || line.startsWith("- ")) {
      return (
        <p key={i} className="text-slate-300 text-xs leading-relaxed pl-3 mb-1">
          {line}
        </p>
      );
    }
    if (line.startsWith("**") && line.endsWith("**")) {
      return (
        <p key={i} className="text-slate-200 text-xs font-semibold mb-1">
          {line.replace(/\*\*/g, "")}
        </p>
      );
    }
    if (line.trim() === "") return <div key={i} className="h-1" />;
    return (
      <p key={i} className="text-slate-300 text-xs leading-relaxed mb-1">
        {line}
      </p>
    );
  });
}

export default function AnaliseModal({ analise, loading, onClose }) {
  const [copied, setCopied] = useState(false);

  function copyText() {
    if (!analise) return;
    navigator.clipboard.writeText(analise);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-surface border border-border rounded-2xl w-full max-w-2xl max-h-[82vh] flex flex-col shadow-2xl animate-fade-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Sparkles size={15} className="text-amber" />
            <span className="text-sm font-semibold text-slate-200">Análise com IA</span>
            <span className="text-[10px] font-mono text-slate-600 ml-1">claude-opus-4</span>
          </div>
          <div className="flex items-center gap-2">
            {analise && (
              <button
                onClick={copyText}
                className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono text-slate-500 hover:text-slate-300 border border-border rounded-lg transition-all"
              >
                {copied ? <Check size={11} className="text-green" /> : <Copy size={11} />}
                {copied ? "Copiado" : "Copiar"}
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-200 transition-colors p-1"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="relative">
                <div className="w-10 h-10 border-2 border-amber/20 rounded-full" />
                <div className="absolute inset-0 w-10 h-10 border-2 border-t-amber border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
              </div>
              <div className="flex flex-col items-center gap-1">
                <p className="text-xs font-mono text-slate-400">Analisando campanhas com IA...</p>
                <p className="text-[10px] font-mono text-slate-600">Isso pode levar alguns segundos</p>
              </div>
            </div>
          ) : analise ? (
            <div className="font-mono">{renderAnalise(analise)}</div>
          ) : (
            <p className="text-xs text-slate-500 text-center py-12">
              Nenhuma análise disponível.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
