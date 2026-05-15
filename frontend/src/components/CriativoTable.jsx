import { clsx } from "clsx";
import { Play, Pause, Loader } from "lucide-react";
import { useState } from "react";

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

  // Só exibe botão se tiver campaign_id e status ativo/pausado
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

export default function CriativoTable({ campanhas, onToggleStatus }) {
  if (!campanhas.length) return (
    <div className="text-center py-12 text-slate-600 font-mono text-sm">
      Nenhum criativo encontrado
    </div>
  );

  const hasActions = typeof onToggleStatus === "function";

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-mono">
        <thead>
          <tr className="border-b border-border">
            {["Criativo", "Status", "Verba", "Cliques WPP", "CTR", "CPL Est.", ...(hasActions ? ["Ação"] : [])].map(h => (
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
              <td className="py-3 pr-4 text-slate-300 max-w-[200px] truncate" title={ad.nome}>{ad.nome}</td>
              <td className="py-3 pr-4"><StatusBadge status={ad.status} /></td>
              <td className="py-3 pr-4 text-amber">R${(ad.verba_gasta || 0).toFixed(2)}</td>
              <td className="py-3 pr-4 text-green font-bold">{ad.cliques_whatsapp || 0}</td>
              <td className="py-3 pr-4 text-slate-400">{(ad.ctr || 0).toFixed(2)}%</td>
              <td className="py-3 pr-4 text-slate-300">R${(ad.cpl_estimado || 0).toFixed(2)}</td>
              {hasActions && (
                <td className="py-3 pr-4">
                  <ToggleBtn
                    status={ad.status}
                    campaignId={ad.id}
                    onToggle={onToggleStatus}
                  />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
