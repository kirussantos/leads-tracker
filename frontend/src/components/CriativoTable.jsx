import { clsx } from "clsx";
import { Play, Pause, Loader, BrainCircuit } from "lucide-react";
import { useState } from "react";
import AnaliseModal from "./AnaliseModal";

const statusMap = {
  ACTIVE: { color: "text-green bg-green/10 border-green/20", label: "ATIVO" },
  PAUSED: { color: "text-amber bg-amber/10 border-amber/20", label: "PAUSADO" },
  ARCHIVED: { color: "text-slate-500 bg-slate-500/10 border-slate-500/20", label: "ARQUIVADO" },
  UNKNOWN: { color: "text-slate-500 bg-slate-500/10 border-slate-500/20", label: "—" },
};

function StatusBadge({ status }) {
  const { color, label } = statusMap[status] || statusMap["UNKNOWN"];
  return (
    <span className={clsx("text-[10px] font-mono px-2 py-0.5 rounded border", color)}>{label}</span>
  );
}

function ToggleBtn({ status, campaignId, onToggle }) {
  const [loading, setLoading] = useState(false);

  if (!campaignId || status === "ARCHIVED" || status === "UNKNOWN") return null;

  const isPaused = status === "PAUSED";

  const handleClick = async () => {
    setLoading(true);
    try {
      await onToggle(campaignId, isPaused ? "ACTIVE" : "PAUSED");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      title={isPaused ? "Ativar campanha" : "Pausar campanha"}
      className={clsx(
        "flex items-center justify-center w-7 h-7 rounded-lg border transition-all disabled:opacity-40",
        isPaused
          ? "border-green/30 text-green hover:bg-green/10"
          : "border-amber/30 text-amber hover:bg-amber/10"
      )}
    >
      {loading
        ? <Loader size={12} className="animate-spin" />
        : isPaused
          ? <Play size={12} />
          : <Pause size={12} />
      }
    </button>
  );
}

export default function CriativoTable({ campanhas, onToggleStatus, onAnalisarCampanha }) {
  // Estado do modal de análise individual
  const [analiseState, setAnaliseState] = useState({
    show: false,
    loading: false,
    analise: null,
    campanhaNome: null,
  });

  const handleAnalisar = async (campanha) => {
    setAnaliseState({ show: true, loading: true, analise: null, campanhaNome: campanha.nome });
    try {
      const resultado = await onAnalisarCampanha(campanha);
      setAnaliseState(prev => ({ ...prev, loading: false, analise: resultado }));
    } catch {
      setAnaliseState(prev => ({ ...prev, loading: false, analise: "Erro ao conectar com o serviço de IA." }));
    }
  };

  if (!campanhas.length) return (
    <div className="text-center py-12 text-slate-600 font-mono text-sm">
      Nenhuma campanha encontrada
    </div>
  );

  const hasToggle = typeof onToggleStatus === "function";
  const hasAnalise = typeof onAnalisarCampanha === "function";

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

      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="border-b border-border">
              {[
                "Campanha",
                "Status",
                "Verba",
                "Cliques WPP",
                "CTR",
                "CPL Est.",
                ...(hasToggle ? ["On/Off"] : []),
                ...(hasAnalise ? ["Decisão IA"] : []),
              ].map(h => (
                <th key={h} className="text-left pb-3 pr-4 text-slate-600 uppercase tracking-widest font-normal">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {campanhas.map((ad, i) => (
              <tr
                key={ad.id}
                className="border-b border-border/50 hover:bg-white/[0.02] transition-colors animate-fade-up"
                style={{ animationDelay: `${i * 50}ms`, animationFillMode: "both" }}
              >
                <td className="py-3 pr-4 text-slate-300 max-w-[180px] truncate" title={ad.nome}>{ad.nome}</td>
                <td className="py-3 pr-4"><StatusBadge status={ad.status} /></td>
                <td className="py-3 pr-4 text-amber">R${(ad.verba_gasta || 0).toFixed(2)}</td>
                <td className="py-3 pr-4 text-green font-bold">{ad.cliques_whatsapp || 0}</td>
                <td className="py-3 pr-4 text-slate-400">{(ad.ctr || 0).toFixed(2)}%</td>
                <td className="py-3 pr-4 text-slate-300">R${(ad.cpl_estimado || 0).toFixed(2)}</td>
                {hasToggle && (
                  <td className="py-3 pr-4">
                    <ToggleBtn
                      status={ad.status}
                      campaignId={ad.id}
                      onToggle={onToggleStatus}
                    />
                  </td>
                )}
                {hasAnalise && (
                  <td className="py-3 pr-2">
                    <button
                      onClick={() => handleAnalisar(ad)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-violet-500/10 border border-violet-500/25 text-violet-400 text-[10px] font-mono rounded-lg hover:bg-violet-500/20 hover:border-violet-500/40 transition-all whitespace-nowrap"
                    >
                      <BrainCircuit size={11} />
                      Qual melhor decisão?
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
