import { Fuel, TrendingDown, AlertTriangle } from "lucide-react";
import { clsx } from "clsx";

/**
 * SaldoContas — exibe o saldo prepago de cada conta e estima quantos dias de
 * anúncio ainda restam com base no ritmo de gasto do período selecionado.
 *
 * Props:
 *  saldos       — array de {cliente_id, nome, balance, currency, spend_cap, amount_spent}
 *  loading      — boolean
 *  periodoData  — objeto com .campanhas[] tagueadas com .cliente_id
 *  periodoRange — {since: "YYYY-MM-DD", until: "YYYY-MM-DD"}
 */
export default function SaldoContas({ saldos = [], loading, periodoData, periodoRange }) {
  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Fuel size={13} className="text-amber/50 animate-pulse" />
          <p className="text-[10px] font-mono text-slate-600">Consultando saldos das contas...</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[0, 1, 2].map(i => (
            <div key={i} className="border border-border rounded-xl p-4 animate-pulse space-y-3">
              <div className="h-2 bg-border/40 rounded w-2/3" />
              <div className="h-1.5 bg-border/30 rounded-full" />
              <div className="grid grid-cols-2 gap-2">
                <div className="h-6 bg-border/30 rounded" />
                <div className="h-6 bg-border/30 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!saldos.length) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 flex items-center gap-3">
        <Fuel size={14} className="text-slate-700 flex-shrink-0" />
        <p className="text-[10px] font-mono text-slate-600">
          Nenhuma conta com saldo disponível no período.
        </p>
      </div>
    );
  }

  // Quantos dias o período representa
  const periodoDias = (() => {
    if (!periodoRange?.since || !periodoRange?.until) return 30;
    const diff = new Date(periodoRange.until) - new Date(periodoRange.since);
    return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
  })();

  const items = saldos.map(s => {
    // Gasto deste cliente no período (soma das campanhas tagueadas com cliente_id)
    const periodoSpend = (periodoData?.campanhas ?? [])
      .filter(c => c.cliente_id === s.cliente_id)
      .reduce((acc, c) => acc + (c.verba ?? c.verba_gasta ?? 0), 0);

    const dailyRate       = periodoSpend / periodoDias;
    const daysRemaining   = dailyRate > 0 ? Math.floor(s.balance / dailyRate) : null;

    // Percentual do tanque: usa spend_cap quando disponível, senão balance + periodoSpend
    const capacity = s.spend_cap || (s.balance + periodoSpend) || s.balance;
    const pct      = capacity > 0 ? Math.min(100, (s.balance / capacity) * 100) : 50;

    return { ...s, periodoSpend, dailyRate, daysRemaining, pct };
  });

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((item, i) => {
          const { daysRemaining, balance, dailyRate, pct, nome } = item;

          const level =
            daysRemaining === null ? "default" :
            daysRemaining <= 0    ? "empty" :
            daysRemaining <= 5    ? "red" :
            daysRemaining <= 14   ? "amber" : "green";

          const colorCls  = { empty: "text-red",   red: "text-red",   amber: "text-amber",  green: "text-green",  default: "text-slate-400" }[level];
          const barCls    = { empty: "bg-red",      red: "bg-red",     amber: "bg-amber",    green: "bg-green",    default: "bg-slate-600"   }[level];
          const borderCls = { empty: "border-red/25", red: "border-red/25", amber: "border-amber/20", green: "border-green/15", default: "border-border" }[level];
          const badgeBg   = { empty: "bg-red/15",   red: "bg-red/10",  amber: "bg-amber/10", green: "bg-green/10", default: "bg-slate-800"   }[level];

          const badgeText =
            level === "empty"   ? "SEM SALDO" :
            daysRemaining === null ? "—" :
            `~${daysRemaining}d`;

          return (
            <div
              key={item.cliente_id || i}
              className={clsx("border rounded-xl p-4 animate-fade-up", borderCls)}
              style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3 gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest mb-0.5">
                    Conta de anúncios
                  </p>
                  <p className="text-xs font-semibold text-slate-200 truncate">{nome}</p>
                </div>
                <div className={clsx("flex-shrink-0 px-2 py-0.5 rounded-lg text-[9px] font-mono font-bold", colorCls, badgeBg)}>
                  {badgeText}
                </div>
              </div>

              {/* Barra de combustível */}
              <div className="h-1.5 bg-border rounded-full mb-3 overflow-hidden">
                <div
                  className={clsx("h-full rounded-full transition-all duration-700", barCls)}
                  style={{ width: `${Math.max(level === "empty" ? 0 : 2, pct)}%` }}
                />
              </div>

              {/* Métricas */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest mb-0.5">Saldo</p>
                  <p className={clsx("text-sm font-mono font-bold tabular-nums", colorCls)}>
                    {balance > 0
                      ? `R$${balance.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : "R$0,00"}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest mb-0.5">Burn/dia</p>
                  <p className="text-sm font-mono font-bold tabular-nums text-slate-300">
                    {dailyRate > 0
                      ? `R$${dailyRate.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : "—"}
                  </p>
                </div>
              </div>

              {/* Alerta crítico */}
              {(level === "red" || level === "empty") && (
                <div className="mt-3 flex items-center gap-1.5">
                  <AlertTriangle size={9} className="text-red flex-shrink-0" />
                  <p className="text-[9px] font-mono text-red/70">
                    {level === "empty"
                      ? "Saldo esgotado — anúncios parados"
                      : "Saldo crítico — recarregue em breve"}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
