import { Image, TrendingUp, MousePointerClick } from "lucide-react";
import { clsx } from "clsx";

/**
 * MelhoresCreativos — grid de anúncios top do período com métricas e preview.
 *
 * Props:
 *  criativos — array de {ad_id, ad_name, adset_name, campaign_name, spend,
 *               impressions, clicks, wpp_clicks, ctr, cpl, cpm, frequency,
 *               thumbnail_url, image_url}
 *  loading   — boolean
 */
export default function MelhoresCreativos({ criativos = [], loading }) {
  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div key={i} className="border border-border rounded-xl overflow-hidden animate-pulse">
              <div className="h-32 bg-border/30" />
              <div className="p-3 space-y-2">
                <div className="h-2 bg-border/40 rounded w-3/4" />
                <div className="h-3 bg-border/30 rounded w-full" />
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="h-5 bg-border/20 rounded" />
                  <div className="h-5 bg-border/20 rounded" />
                  <div className="h-5 bg-border/20 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!criativos.length) {
    return (
      <div className="bg-card border border-border rounded-2xl p-10 flex flex-col items-center gap-3">
        <Image size={24} className="text-slate-700" />
        <p className="text-xs font-mono text-slate-500 text-center">
          Nenhum anúncio com dados no período selecionado.
        </p>
      </div>
    );
  }

  const fmtMoney = v => v >= 1000
    ? `R$${(v / 1000).toFixed(1)}k`
    : `R$${v.toFixed(0)}`;

  const top = criativos.slice(0, 12);

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {top.map((c, i) => {
          const thumb = c.thumbnail_url || c.image_url;

          const cplLevel =
            c.cpl === null   ? "default" :
            c.cpl < 15       ? "green" :
            c.cpl < 30       ? "amber" : "red";

          const cplCls = {
            green:   "text-green",
            amber:   "text-amber",
            red:     "text-red",
            default: "text-slate-500",
          }[cplLevel];

          // CTR badge color
          const ctrCls = c.ctr >= 1.5 ? "text-green" : c.ctr >= 0.8 ? "text-amber" : "text-red";

          return (
            <div
              key={c.ad_id || i}
              className={clsx(
                "border border-border rounded-xl overflow-hidden animate-fade-up group",
                "hover:border-amber/25 hover:shadow-[0_0_16px_rgba(251,191,36,0.04)] transition-all",
              )}
              style={{ animationDelay: `${i * 40}ms`, animationFillMode: "both" }}
            >
              {/* Thumbnail */}
              <div className="relative h-32 bg-slate-950 overflow-hidden">
                {thumb ? (
                  <>
                    <img
                      src={thumb}
                      alt={c.ad_name}
                      crossOrigin="anonymous"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={e => {
                        e.currentTarget.style.display = "none";
                        const fb = e.currentTarget.nextElementSibling;
                        if (fb) fb.style.display = "flex";
                      }}
                    />
                    <div className="absolute inset-0 items-center justify-center bg-slate-950" style={{ display: "none" }}>
                      <Image size={22} className="text-slate-700" />
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Image size={22} className="text-slate-700" />
                  </div>
                )}

                {/* Rank badge */}
                <div className="absolute top-2 left-2 w-5 h-5 rounded-md bg-black/70 backdrop-blur-sm flex items-center justify-center">
                  <span className="text-[9px] font-mono font-bold text-amber">#{i + 1}</span>
                </div>

                {/* WPP leads badge */}
                {c.wpp_clicks > 0 && (
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-green/20 backdrop-blur-sm border border-green/30">
                    <span className="text-[9px] font-mono font-bold text-green">
                      {c.wpp_clicks} {c.wpp_clicks === 1 ? "lead" : "leads"}
                    </span>
                  </div>
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-slate-950/80 to-transparent" />
              </div>

              {/* Info */}
              <div className="p-3">
                {/* Hierarquia */}
                <p className="text-[9px] font-mono text-slate-600 truncate mb-0.5">
                  {c.campaign_name}
                  {c.adset_name && c.adset_name !== "—" && (
                    <> · <span className="text-slate-700">{c.adset_name}</span></>
                  )}
                </p>
                <p className="text-xs font-semibold text-slate-200 truncate mb-3" title={c.ad_name}>
                  {c.ad_name}
                </p>

                {/* Métricas */}
                <div className="grid grid-cols-3 gap-1">
                  <div>
                    <p className="text-[8px] font-mono text-slate-700 uppercase tracking-widest mb-0.5">Spend</p>
                    <p className="text-[10px] font-mono font-bold text-amber tabular-nums">
                      {fmtMoney(c.spend)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[8px] font-mono text-slate-700 uppercase tracking-widest mb-0.5">CTR</p>
                    <p className={clsx("text-[10px] font-mono font-bold tabular-nums", ctrCls)}>
                      {c.ctr.toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-[8px] font-mono text-slate-700 uppercase tracking-widest mb-0.5">CPL</p>
                    <p className={clsx("text-[10px] font-mono font-bold tabular-nums", cplCls)}>
                      {c.cpl !== null ? fmtMoney(c.cpl) : "—"}
                    </p>
                  </div>
                </div>

                {/* Linha extra: impressões + frequência */}
                <div className="mt-2 pt-2 border-t border-border flex items-center justify-between">
                  <span className="text-[8px] font-mono text-slate-700">
                    {c.impressions > 999
                      ? `${(c.impressions / 1000).toFixed(1)}k impr.`
                      : `${c.impressions} impr.`}
                  </span>
                  {c.frequency > 0 && (
                    <span className={clsx(
                      "text-[8px] font-mono",
                      c.frequency > 3 ? "text-red/70" : c.frequency > 2 ? "text-amber/70" : "text-slate-600",
                    )}>
                      {c.frequency.toFixed(1)}x freq.
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {criativos.length > 12 && (
        <p className="text-center text-[9px] font-mono text-slate-700 mt-4">
          Exibindo os 12 melhores de {criativos.length} anúncios no período
        </p>
      )}
    </div>
  );
}
