import { clsx } from "clsx";

const statusMap = {
  ACTIVE: { color: "text-green bg-green/10 border-green/20", label: "ATIVO" },
  PAUSED: { color: "text-amber bg-amber/10 border-amber/20", label: "PAUSADO" },
  ARCHIVED: { color: "text-slate-500 bg-slate-500/10 border-slate-500/20", label: "ARQUIVADO" },
};

function StatusBadge({ status }) {
  const { color, label } = statusMap[status] || statusMap["ARCHIVED"];
  return (
    <span className={clsx("text-[10px] font-mono px-2 py-0.5 rounded border", color)}>{label}</span>
  );
}

export default function CriativoTable({ campanhas }) {
  if (!campanhas.length) return (
    <div className="text-center py-12 text-slate-600 font-mono text-sm">
      Nenhum criativo encontrado
    </div>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-mono">
        <thead>
          <tr className="border-b border-border">
            {["Criativo", "Status", "Verba", "Cliques WPP", "CTR", "CPL Est."].map(h => (
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
