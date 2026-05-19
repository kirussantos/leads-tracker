import { clsx } from "clsx";
import { Play, Pause, Loader, BrainCircuit, Pencil, Check, X, DollarSign, Flame } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import AnaliseModal from "./AnaliseModal";

/* ── Saturation helpers ───────────────────────────────────────────────────── */

/**
 * Calcula o índice de saturação de um criativo baseado em frequência + CTR.
 * Retorna { nivel, score 0-100, label, hint, action }
 */
export function getSaturation(campanha) {
  const freq  = campanha.frequencia  || 0;
  const ctr   = campanha.ctr         || 0;
  const verba = campanha.verba_gasta || 0;

  if (verba < 15 || freq === 0) {
    return { nivel: "unknown", score: 0, label: "—", hint: "Dados insuficientes", action: null };
  }

  // Ambos ruins → saturação clássica (frequência alta + CTR colapsado)
  if (freq > 3.5 && ctr > 0 && ctr < 0.8) {
    return {
      nivel: "critical", score: 100,
      label: "Saturado",
      hint: `Freq. ${freq.toFixed(1)}x + CTR ${ctr.toFixed(2)}% → criativo esgotado`,
      action: "PAUSAR",
    };
  }
  // Frequência sozinha muito alta
  if (freq > 4.0) {
    return {
      nivel: "critical", score: 90,
      label: "Freq. crítica",
      hint: `Freq. ${freq.toFixed(1)}x — público vendo muitas vezes sem clicar`,
      action: "REVISAR",
    };
  }
  // CTR muito baixo com verba significativa
  if (verba > 50 && ctr > 0 && ctr < 0.5) {
    return {
      nivel: "critical", score: 85,
      label: "CTR crítico",
      hint: `CTR ${ctr.toFixed(2)}% — criativo fraco, troque o anúncio`,
      action: "OTIMIZAR",
    };
  }
  // Atenção: frequência subindo OU CTR abaixo do mínimo
  if (freq > 2.5 || (ctr > 0 && ctr < 0.8)) {
    return {
      nivel: "warning", score: 60,
      label: freq > 2.5 ? "Freq. alta" : "CTR baixo",
      hint: `Freq. ${freq.toFixed(1)}x, CTR ${ctr.toFixed(2)}%`,
      action: null,
    };
  }
  // Monitorar: próximo dos limites
  if (freq > 1.8 || (ctr > 0 && ctr < 1.2)) {
    return {
      nivel: "watch", score: 30,
      label: "Monitorar",
      hint: `Freq. ${freq.toFixed(1)}x, CTR ${ctr.toFixed(2)}%`,
      action: null,
    };
  }
  return {
    nivel: "ok", score: 8,
    label: "Saudável",
    hint: `Freq. ${freq.toFixed(1)}x, CTR ${ctr.toFixed(2)}%`,
    action: null,
  };
}

/** Barra de termômetro visual por campanha */
function SaturationBar({ campanha }) {
  const sat = getSaturation(campanha);

  const barColor = {
    critical: "bg-red",
    warning:  "bg-amber",
    watch:    "bg-amber/40",
    ok:       "bg-green",
    unknown:  "bg-slate-700",
  }[sat.nivel] ?? "bg-slate-700";

  const textColor = {
    critical: "text-red",
    warning:  "text-amber",
    watch:    "text-slate-500",
    ok:       "text-green/70",
    unknown:  "text-slate-700",
  }[sat.nivel] ?? "text-slate-700";

  return (
    <div className="w-[72px]" title={sat.hint}>
      <div className="w-full h-1.5 bg-border rounded-full overflow-hidden mb-1">
        <div
          className={clsx(
            "h-full rounded-full transition-all duration-500",
            barColor,
            sat.nivel === "critical" && "animate-pulse",
          )}
          style={{ width: `${sat.score}%` }}
        />
      </div>
      <p className={clsx("text-[9px] font-mono truncate", textColor)}>
        {sat.nivel === "critical" && <Flame size={8} className="inline mr-0.5 mb-0.5" />}
        {sat.label}
      </p>
    </div>
  );
}

const STATUS = {
  ACTIVE:   { dot: "bg-green animate-pulse-dot", badge: "text-green bg-green/10 border-green/20",  label: "ATIVO",    border: "border-l-green/40" },
  PAUSED:   { dot: "bg-amber",                   badge: "text-amber bg-amber/10 border-amber/20",   label: "PAUSADO",  border: "border-l-amber/30" },
  ARCHIVED: { dot: "bg-slate-600",               badge: "text-slate-500 bg-slate-500/10 border-slate-500/20", label: "ARQUIVADO", border: "border-l-slate-700" },
  UNKNOWN:  { dot: "bg-slate-700",               badge: "text-slate-600 bg-transparent border-slate-700/50",  label: "—",        border: "border-l-border" },
};

function ToggleBtn({ status, campaignId, onToggle }) {
  const [loading, setLoading] = useState(false);
  if (!campaignId || status === "ARCHIVED" || status === "UNKNOWN") return null;
  const isPaused = status === "PAUSED";

  const handleClick = async () => {
    setLoading(true);
    try { await onToggle(campaignId, isPaused ? "ACTIVE" : "PAUSED"); }
    finally { setLoading(false); }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      title={isPaused ? "Ativar campanha" : "Pausar campanha"}
      className={clsx(
        "flex items-center justify-center w-8 h-8 rounded-xl border transition-all active:scale-95",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        isPaused
          ? "border-green/30 text-green hover:bg-green/10 hover:border-green/50"
          : "border-amber/30 text-amber hover:bg-amber/10 hover:border-amber/50",
      )}
    >
      {loading
        ? <Loader size={12} className="animate-spin" />
        : isPaused ? <Play size={12} fill="currentColor" /> : <Pause size={12} fill="currentColor" />
      }
    </button>
  );
}

function BudgetEditor({ campaignId, currentBudget, onUpdateBudget }) {
  const [editing, setEditing]   = useState(false);
  const [value,   setValue]     = useState("");
  const [loading, setLoading]   = useState(false);
  const [saved,   setSaved]     = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  if (!campaignId || !onUpdateBudget) return null;

  const startEdit = () => {
    setValue(currentBudget > 0 ? currentBudget.toFixed(2) : "");
    setEditing(true);
  };

  const cancel = () => {
    setEditing(false);
    setValue("");
  };

  const save = async () => {
    const num = parseFloat(value.replace(",", "."));
    if (!num || num <= 0) return cancel();
    setLoading(true);
    try {
      await onUpdateBudget(campaignId, num);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // silently fail — parent handles alerts
    } finally {
      setLoading(false);
      setEditing(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter") save();
    if (e.key === "Escape") cancel();
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-[10px] font-mono text-slate-500">R$</span>
        <input
          ref={inputRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKey}
          placeholder="0.00"
          className="w-16 bg-surface border border-green/30 rounded-lg px-1.5 py-0.5 text-xs font-mono text-green focus:outline-none focus:border-green/60 text-center"
        />
        <button
          onClick={save}
          disabled={loading}
          className="w-6 h-6 flex items-center justify-center rounded-lg bg-green/10 border border-green/30 text-green hover:bg-green/20 transition-all disabled:opacity-40"
        >
          {loading ? <Loader size={10} className="animate-spin" /> : <Check size={10} />}
        </button>
        <button
          onClick={cancel}
          className="w-6 h-6 flex items-center justify-center rounded-lg bg-border/40 border border-border text-slate-500 hover:text-slate-200 transition-all"
        >
          <X size={10} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={startEdit}
      title="Editar orçamento diário"
      className={clsx(
        "flex items-center justify-center w-8 h-8 rounded-xl border transition-all active:scale-95",
        saved
          ? "border-green/40 text-green bg-green/10"
          : "border-border text-slate-600 hover:text-cyan hover:border-cyan/30 hover:bg-cyan/[0.06]",
      )}
    >
      {saved ? <Check size={12} /> : <DollarSign size={12} />}
    </button>
  );
}

function CtrBar({ ctr }) {
  const pct = Math.min((ctr / 4) * 100, 100); // 4% = 100%
  const color = ctr >= 1.5 ? "bg-green" : ctr >= 0.8 ? "bg-amber" : "bg-red";
  return (
    <div className="flex items-center gap-2">
      <div className="w-14 h-1 bg-border rounded-full overflow-hidden">
        <div className={clsx("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className={clsx(
        "text-[10px] font-mono font-bold tabular-nums",
        ctr >= 1.5 ? "text-green" : ctr >= 0.8 ? "text-amber" : "text-slate-500",
      )}>
        {ctr.toFixed(2)}%
      </span>
    </div>
  );
}

export default function CriativoTable({ campanhas = [], onToggleStatus, onAnalisarCampanha, onUpdateBudget, onEditCampanha }) {
  const [analiseState, setAnaliseState] = useState({ show: false, loading: false, analise: null, campanhaNome: null });

  const handleAnalisar = async (campanha) => {
    const sat = getSaturation(campanha);
    setAnaliseState({ show: true, loading: true, analise: null, campanhaNome: campanha.nome });
    try {
      const resultado = await onAnalisarCampanha(campanha, sat);
      setAnaliseState(prev => ({ ...prev, loading: false, analise: resultado }));
    } catch {
      setAnaliseState(prev => ({ ...prev, loading: false, analise: "Erro ao conectar com o serviço de IA." }));
    }
  };

  if (!campanhas.length) return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-10 h-10 rounded-xl bg-border/50 flex items-center justify-center">
        <BrainCircuit size={18} className="text-slate-700" />
      </div>
      <p className="text-slate-600 font-mono text-xs text-center">
        Nenhuma campanha encontrada no período.<br />
        <span className="text-slate-700">Tente selecionar outro intervalo de datas.</span>
      </p>
    </div>
  );

  const hasToggle  = typeof onToggleStatus    === "function";
  const hasAnalise = typeof onAnalisarCampanha === "function";
  const hasBudget  = typeof onUpdateBudget     === "function";
  const hasEdit    = typeof onEditCampanha     === "function";

  const actionsCount = [hasToggle, hasAnalise, hasBudget, hasEdit].filter(Boolean).length;

  return (
    <>
      {analiseState.show && (
        <AnaliseModal
          analise={analiseState.analise}
          loading={analiseState.loading}
          title="Melhor Decisão — IA"
          subtitle={analiseState.campanhaNome}
          onClose={() => setAnaliseState(prev => ({ ...prev, show: false }))}
        />
      )}

      {/* Header row */}
      <div className="flex items-center px-4 pb-2 mb-1 border-b border-border">
        <div className="w-2.5 mr-3 flex-shrink-0" />
        <p className="flex-1 text-[10px] font-mono text-slate-600 uppercase tracking-widest">Campanha</p>
        <div className="flex items-center gap-6 flex-shrink-0">
          <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest w-16 text-right hidden md:block">Verba</p>
          <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest w-14 text-right">Leads</p>
          <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest w-28 hidden lg:block">CTR</p>
          <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest w-[72px] hidden lg:block">Saturação</p>
          <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest w-16 text-right hidden lg:block">CPL</p>
          {actionsCount > 0 && (
            <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest text-right"
               style={{ width: `${actionsCount * 36 + (actionsCount - 1) * 6}px` }}>
              Ações
            </p>
          )}
        </div>
      </div>

      {/* Campaign rows */}
      <div className="space-y-1">
        {campanhas.map((ad, i) => {
          const s = STATUS[ad.status] || STATUS.UNKNOWN;
          const cpl = ad.cpl_estimado || 0;
          const cplColor = cpl > 0 && cpl < 15 ? "text-green" : cpl < 30 ? "text-amber" : cpl > 0 ? "text-red" : "text-slate-600";

          return (
            <div
              key={ad.id || i}
              onClick={hasEdit ? () => onEditCampanha(ad) : undefined}
              className={clsx(
                "flex items-center gap-3 px-4 py-3.5 rounded-xl border border-l-2 transition-all group",
                "hover:bg-white/[0.018] animate-fade-up",
                "border-border",
                s.border,
                hasEdit && "cursor-pointer",
              )}
              style={{ animationDelay: `${i * 40}ms`, animationFillMode: "both" }}
            >
              {/* Status dot */}
              <div className={clsx("w-1.5 h-1.5 rounded-full flex-shrink-0", s.dot)} />

              {/* Campaign name + status badge */}
              <div className="flex-1 min-w-0 flex items-center gap-2">
                <p className="text-sm font-mono text-slate-200 truncate">{ad.nome || "—"}</p>
                <span className={clsx(
                  "hidden sm:inline text-[9px] font-mono px-1.5 py-0.5 rounded border flex-shrink-0",
                  s.badge,
                )}>
                  {s.label}
                </span>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 flex-shrink-0">
                {/* Verba */}
                <div className="text-right w-16 hidden md:block">
                  <p className="text-xs font-mono text-amber font-bold tabular-nums">
                    R${(ad.verba_gasta || 0).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                </div>

                {/* Leads WPP */}
                <div className="text-right w-14">
                  <p className={clsx(
                    "text-xs font-mono font-bold tabular-nums",
                    (ad.cliques_whatsapp || 0) > 0 ? "text-green" : "text-slate-600",
                  )}>
                    {ad.cliques_whatsapp || 0}
                  </p>
                </div>

                {/* CTR bar */}
                <div className="w-28 hidden lg:flex justify-start">
                  <CtrBar ctr={ad.ctr || 0} />
                </div>

                {/* Saturation thermometer */}
                <div className="w-[72px] hidden lg:flex justify-start">
                  <SaturationBar campanha={ad} />
                </div>

                {/* CPL */}
                <div className="text-right w-16 hidden lg:block">
                  <p className={clsx("text-xs font-mono font-bold tabular-nums", cplColor)}>
                    {cpl > 0 ? `R$${cpl.toFixed(2)}` : "—"}
                  </p>
                </div>

                {/* Actions */}
                {actionsCount > 0 && (
                  <div
                    className="flex items-center gap-1.5 justify-end"
                    onClick={e => e.stopPropagation()}
                  >
                    {hasBudget && (
                      <BudgetEditor
                        campaignId={ad.id}
                        currentBudget={ad.daily_budget || 0}
                        onUpdateBudget={onUpdateBudget}
                      />
                    )}
                    {hasEdit && (
                      <div
                        title="Clique na linha para editar"
                        className="flex items-center justify-center w-8 h-8 rounded-xl border border-border/50 text-slate-700 group-hover:text-cyan group-hover:border-cyan/30 transition-all"
                      >
                        <Pencil size={12} />
                      </div>
                    )}
                    {hasToggle && (
                      <ToggleBtn
                        status={ad.status}
                        campaignId={ad.id}
                        onToggle={onToggleStatus}
                      />
                    )}
                    {hasAnalise && (() => {
                      const sat = getSaturation(ad);
                      const aiStyle = {
                        critical: "bg-red/10 border-red/30 text-red hover:bg-red/20 hover:border-red/50",
                        warning:  "bg-amber/10 border-amber/25 text-amber hover:bg-amber/20 hover:border-amber/45",
                        watch:    "bg-violet/10 border-violet/25 text-violet hover:bg-violet/20 hover:border-violet/45",
                        ok:       "bg-violet/10 border-violet/25 text-violet hover:bg-violet/20 hover:border-violet/45",
                        unknown:  "bg-violet/10 border-violet/25 text-violet hover:bg-violet/20 hover:border-violet/45",
                      }[sat.nivel] ?? "bg-violet/10 border-violet/25 text-violet hover:bg-violet/20 hover:border-violet/45";
                      const aiTitle = sat.nivel === "critical"
                        ? `⚠ ${sat.hint} — Analisar com IA`
                        : "Analisar com IA";
                      return (
                        <button
                          onClick={() => handleAnalisar(ad)}
                          title={aiTitle}
                          className={clsx(
                            "flex items-center gap-1.5 px-2.5 py-2 rounded-xl border transition-all active:scale-95",
                            "text-[10px] font-mono whitespace-nowrap",
                            aiStyle,
                            sat.nivel === "critical" && "animate-pulse",
                          )}
                        >
                          <BrainCircuit size={11} />
                          <span className="hidden xl:inline">
                            {sat.nivel === "critical" ? "IA !" : "IA"}
                          </span>
                        </button>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
