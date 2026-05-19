import { X, Sparkles, Copy, Check, Zap, TrendingUp, AlertTriangle, Download, FileText, Printer } from "lucide-react";
import { useState } from "react";
import axios from "axios";

const API = (import.meta.env.VITE_API_URL || "").replace(/^﻿/, "").trim();

const VERDICT_STYLES = {
  "ESCALAR":  { bg: "bg-green/10 border-green/30",  text: "text-green",  icon: TrendingUp,    label: "ESCALAR" },
  "OTIMIZAR": { bg: "bg-amber/10 border-amber/30",  text: "text-amber",  icon: Zap,           label: "OTIMIZAR" },
  "PAUSAR":   { bg: "bg-red/10 border-red/30",      text: "text-red",    icon: AlertTriangle, label: "PAUSAR" },
};

function renderLine(line, i) {
  // H2 section header
  if (line.startsWith("## ")) {
    return (
      <h3 key={i} className="text-xs font-bold text-amber uppercase tracking-widest mt-6 mb-3 first:mt-0 flex items-center gap-2">
        <span className="w-3 h-px bg-amber/50 inline-block" />
        {line.replace("## ", "")}
      </h3>
    );
  }
  // H3 subsection
  if (line.startsWith("### ")) {
    return (
      <h4 key={i} className="text-xs font-semibold text-slate-300 mt-4 mb-2">
        {line.replace("### ", "")}
      </h4>
    );
  }
  // H1 — principal section
  if (line.startsWith("# ")) {
    return (
      <h2 key={i} className="text-[11px] font-bold text-amber/90 uppercase tracking-widest mt-7 mb-3 first:mt-0 flex items-center gap-2 border-b border-amber/10 pb-1.5">
        <span className="w-4 h-px bg-amber/40 inline-block" />
        {line.replace("# ", "")}
      </h2>
    );
  }
  // Verdict line
  const verdictMatch = Object.keys(VERDICT_STYLES).find(v => line.includes(`**${v}**`) || line === v);
  if (verdictMatch) {
    const vs = VERDICT_STYLES[verdictMatch];
    const VIcon = vs.icon;
    return (
      <div key={i} className={`flex items-center gap-2 px-4 py-3 rounded-xl border my-3 ${vs.bg}`}>
        <VIcon size={14} className={vs.text} />
        <span className={`text-xs font-mono font-bold ${vs.text}`}>VEREDICTO: {vs.label}</span>
      </div>
    );
  }
  // Bold-only line
  if (line.startsWith("**") && line.endsWith("**")) {
    return (
      <p key={i} className="text-xs font-semibold text-slate-200 mb-1.5 mt-2">
        {line.replace(/\*\*/g, "")}
      </p>
    );
  }
  // Inline bold
  if (line.includes("**")) {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={i} className="text-xs text-slate-300 leading-relaxed mb-1.5">
        {parts.map((part, j) =>
          part.startsWith("**") && part.endsWith("**")
            ? <strong key={j} className="text-slate-100 font-semibold">{part.slice(2, -2)}</strong>
            : part
        )}
      </p>
    );
  }
  // Separator line
  if (/^[━─=]{5,}$/.test(line.trim())) {
    return <hr key={i} className="border-slate-800 my-3" />;
  }
  // Table row
  if (line.startsWith("|")) {
    return (
      <p key={i} className="text-[10px] font-mono text-slate-400 mb-0.5 leading-relaxed pl-1">
        {line}
      </p>
    );
  }
  // Bullet
  if (line.startsWith("• ") || line.startsWith("- ") || line.startsWith("* ")) {
    return (
      <div key={i} className="flex gap-2.5 mb-1.5 pl-2">
        <span className="w-1 h-1 rounded-full bg-amber/60 mt-2 flex-shrink-0" />
        <p className="text-xs text-slate-400 leading-relaxed">{line.replace(/^[•\-\*] /, "")}</p>
      </div>
    );
  }
  // Numbered list
  if (/^\d+\. /.test(line)) {
    const num = line.match(/^(\d+)\. /)[1];
    return (
      <div key={i} className="flex gap-2.5 mb-1.5 pl-2">
        <span className="text-[10px] font-mono text-amber/60 mt-0.5 flex-shrink-0 w-4">{num}.</span>
        <p className="text-xs text-slate-400 leading-relaxed">{line.replace(/^\d+\. /, "")}</p>
      </div>
    );
  }
  // Empty line
  if (line.trim() === "") return <div key={i} className="h-2" />;
  // Normal
  return (
    <p key={i} className="text-xs text-slate-300 leading-relaxed mb-1.5">
      {line}
    </p>
  );
}

export default function AnaliseModal({
  analise,
  loading,
  onClose,
  title      = "Análise com IA",
  subtitle   = null,
  modelo     = null,
  clienteNome = null,
  periodo    = null,
}) {
  const [copied,        setCopied]        = useState(false);
  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const [docxErr,       setDocxErr]       = useState(null);

  function copyText() {
    if (!analise) return;
    navigator.clipboard.writeText(analise);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadPDF() {
    if (!analise) return;
    // Abre conteúdo em nova janela formatada para impressão / "Save as PDF"
    const win = window.open("", "_blank", "width=820,height=1000");
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>${title}${subtitle ? ` — ${subtitle}` : ""}</title>
        <style>
          body { font-family: 'Segoe UI', sans-serif; font-size: 12px; color: #1e293b; margin: 40px; line-height: 1.6; }
          h1 { font-size: 18px; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-top: 24px; }
          h2 { font-size: 14px; color: #334155; margin-top: 20px; text-transform: uppercase; letter-spacing: 0.05em; }
          h3 { font-size: 12px; color: #475569; margin-top: 16px; }
          p  { margin: 4px 0; }
          strong { color: #0f172a; }
          hr { border: none; border-top: 1px solid #e2e8f0; margin: 16px 0; }
          table { border-collapse: collapse; width: 100%; font-size: 11px; margin: 8px 0; }
          td, th { border: 1px solid #e2e8f0; padding: 4px 8px; }
          th { background: #f8fafc; font-weight: 600; }
          .header { background: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 24px; }
          .header h1 { font-size: 20px; margin: 0 0 4px 0; border: none; }
          .header p { color: #64748b; margin: 0; }
          @media print { body { margin: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${title}</h1>
          <p>${clienteNome ? `Cliente: ${clienteNome}` : ""}${periodo ? `  •  Período: ${periodo}` : ""}${modelo ? `  •  Modelo: ${modelo}` : ""}</p>
        </div>
        ${analise
          .split("\n")
          .map(line => {
            if (!line.trim()) return "<br/>";
            if (line.startsWith("# "))   return `<h1>${line.slice(2)}</h1>`;
            if (line.startsWith("## "))  return `<h2>${line.slice(3)}</h2>`;
            if (line.startsWith("### ")) return `<h3>${line.slice(4)}</h3>`;
            if (/^[━─=]{5,}/.test(line.trim())) return "<hr/>";
            const escaped = line.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            const bolded  = escaped.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
            if (line.startsWith("- ") || line.startsWith("• ")) return `<p>• ${bolded.slice(2)}</p>`;
            return `<p>${bolded}</p>`;
          })
          .join("")}
        <script>window.onload = () => { window.print(); }<\/script>
      </body>
      </html>
    `);
    win.document.close();
  }

  async function downloadDocx() {
    if (!analise) return;
    setDownloadingDocx(true);
    setDocxErr(null);
    try {
      const resp = await axios.post(
        `${API}/ai/exportar`,
        {
          titulo:       title,
          cliente_nome: clienteNome ?? "Cliente",
          periodo:      periodo ?? "—",
          analise,
        },
        { responseType: "blob" }
      );
      const url  = window.URL.createObjectURL(new Blob([resp.data]));
      const a    = document.createElement("a");
      a.href     = url;
      const safe = (clienteNome ?? "analise").toLowerCase().replace(/[^\w]/g, "_");
      a.download = `auditoria_${safe}.docx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setDocxErr("Erro ao gerar DOCX. Tente copiar o texto.");
    } finally {
      setDownloadingDocx(false);
    }
  }

  const modeloBadge = modelo ?? "claude-opus-4";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-surface border border-border rounded-t-2xl sm:rounded-2xl w-full max-w-2xl max-h-[88vh] sm:max-h-[82vh] flex flex-col shadow-2xl animate-fade-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-amber/10 flex items-center justify-center flex-shrink-0">
              <Sparkles size={13} className="text-amber" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-200 leading-none mb-0.5">{title}</p>
              {subtitle && (
                <p className="text-[10px] font-mono text-slate-500 truncate">{subtitle}</p>
              )}
            </div>
            <span className="text-[9px] font-mono text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded ml-1 flex-shrink-0 max-w-[120px] truncate" title={modeloBadge}>
              {modeloBadge}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 ml-3 flex-shrink-0">
            {analise && (
              <>
                {/* Copy */}
                <button
                  onClick={copyText}
                  title="Copiar texto"
                  className="flex items-center gap-1 px-2 py-1.5 text-[10px] font-mono text-slate-500 hover:text-slate-300 border border-border rounded-lg transition-all hover:border-border/70"
                >
                  {copied ? <Check size={9} className="text-green" /> : <Copy size={9} />}
                  <span className="hidden sm:inline">{copied ? "Copiado!" : "Copiar"}</span>
                </button>

                {/* PDF */}
                <button
                  onClick={downloadPDF}
                  title="Baixar PDF"
                  className="flex items-center gap-1 px-2 py-1.5 text-[10px] font-mono text-slate-500 hover:text-red/70 border border-border rounded-lg transition-all hover:border-red/30"
                >
                  <Printer size={9} />
                  <span className="hidden sm:inline">PDF</span>
                </button>

                {/* DOCX */}
                <button
                  onClick={downloadDocx}
                  disabled={downloadingDocx}
                  title="Baixar DOCX"
                  className="flex items-center gap-1 px-2 py-1.5 text-[10px] font-mono text-slate-500 hover:text-violet/70 border border-border rounded-lg transition-all hover:border-violet/30 disabled:opacity-50 disabled:cursor-wait"
                >
                  <FileText size={9} />
                  <span className="hidden sm:inline">{downloadingDocx ? "..." : "DOCX"}</span>
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-200 hover:bg-white/5 rounded-lg transition-all"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* DOCX error */}
        {docxErr && (
          <div className="px-5 py-2 text-[10px] font-mono text-red/70 bg-red/5 border-b border-red/10">
            {docxErr}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-5">
              <div className="relative">
                <div className="w-12 h-12 border border-amber/15 rounded-full" />
                <div className="absolute inset-0 w-12 h-12 border border-t-amber border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
                <div className="absolute inset-2 flex items-center justify-center">
                  <Sparkles size={14} className="text-amber/60" />
                </div>
              </div>
              <div className="text-center space-y-1">
                <p className="text-xs font-mono text-slate-400">
                  {subtitle ? `Auditando "${subtitle}"...` : "Auditando campanhas..."}
                </p>
                <p className="text-[10px] font-mono text-slate-600">
                  Consultando modelos de IA especializados
                </p>
              </div>
            </div>
          ) : analise ? (
            <div className="font-mono">
              {analise.split("\n").map((line, i) => renderLine(line, i))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Sparkles size={24} className="text-slate-700" />
              <p className="text-xs text-slate-500 font-mono text-center">Nenhuma análise disponível.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
