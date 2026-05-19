import { clsx } from "clsx";
import { useState } from "react";
import { Info } from "lucide-react";

const tokens = {
  green: {
    border:   "border-green/20 hover:border-green/40",
    value:    "text-green",
    iconBg:   "bg-green/10",
    iconText: "text-green",
    glow:     "hover:shadow-[0_0_28px_rgba(34,197,94,0.07)]",
    dot:      "bg-green",
    corner:   "bg-green",
  },
  amber: {
    border:   "border-amber/20 hover:border-amber/40",
    value:    "text-amber",
    iconBg:   "bg-amber/10",
    iconText: "text-amber",
    glow:     "hover:shadow-[0_0_28px_rgba(245,158,11,0.07)]",
    dot:      "bg-amber",
    corner:   "bg-amber",
  },
  red: {
    border:   "border-red/20 hover:border-red/40",
    value:    "text-red",
    iconBg:   "bg-red/10",
    iconText: "text-red",
    glow:     "hover:shadow-[0_0_28px_rgba(239,68,68,0.07)]",
    dot:      "bg-red",
    corner:   "bg-red",
  },
  blue: {
    border:   "border-blue/20 hover:border-blue/40",
    value:    "text-blue",
    iconBg:   "bg-blue/10",
    iconText: "text-blue",
    glow:     "hover:shadow-[0_0_28px_rgba(59,130,246,0.07)]",
    dot:      "bg-blue",
    corner:   "bg-blue",
  },
  violet: {
    border:   "border-violet/20 hover:border-violet/40",
    value:    "text-violet",
    iconBg:   "bg-violet/10",
    iconText: "text-violet",
    glow:     "hover:shadow-[0_0_28px_rgba(139,92,246,0.07)]",
    dot:      "bg-violet",
    corner:   "bg-violet",
  },
  default: {
    border:   "border-border hover:border-border/70",
    value:    "text-slate-100",
    iconBg:   "bg-white/[0.04]",
    iconText: "text-slate-400",
    glow:     "",
    dot:      "bg-slate-500",
    corner:   "",
  },
};

export default function MetricCard({
  title,
  value,
  subtitle,
  color = "default",
  delay = 0,
  icon: Icon,
  tooltip,
  variant = "default",  // "default" | "hero"
}) {
  const [tipVisible, setTipVisible] = useState(false);
  const t = tokens[color] || tokens.default;

  return (
    <div
      className={clsx(
        "relative bg-card border rounded-2xl overflow-hidden group",
        "animate-fade-up transition-all duration-300 cursor-default",
        variant === "hero" ? "p-6" : "p-4",
        t.border,
        t.glow,
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      {/* Corner ambient glow */}
      {color !== "default" && (
        <div className={clsx(
          "absolute -top-8 -right-8 w-28 h-28 rounded-full blur-3xl opacity-[0.07]",
          "transition-opacity duration-500 group-hover:opacity-[0.14]",
          t.corner,
        )} />
      )}

      {/* Top row: label + info + icon */}
      <div className="flex items-start justify-between mb-3 gap-2 relative">
        <div className="flex items-center gap-1.5 min-w-0">
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest leading-snug truncate">
            {title}
          </p>
          {tooltip && (
            <div className="relative flex-shrink-0">
              <Info
                size={10}
                className="text-slate-700 hover:text-slate-400 cursor-help transition-colors"
                onMouseEnter={() => setTipVisible(true)}
                onMouseLeave={() => setTipVisible(false)}
              />
              {tipVisible && (
                <div className="absolute left-0 top-5 z-50 w-52 bg-surface border border-border rounded-xl p-3 shadow-2xl animate-fade-in">
                  <p className="text-[10px] text-slate-400 font-mono leading-relaxed">{tooltip}</p>
                </div>
              )}
            </div>
          )}
        </div>
        {Icon && (
          <div className={clsx(
            "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-opacity",
            "group-hover:opacity-90",
            t.iconBg,
          )}>
            <Icon size={13} className={t.iconText} />
          </div>
        )}
      </div>

      {/* Value */}
      <div className={clsx(
        "font-mono font-bold tracking-tight leading-none mb-2 relative",
        variant === "hero" ? "text-4xl" : "text-[1.7rem]",
        t.value,
      )}>
        {value}
      </div>

      {/* Subtitle / context */}
      {subtitle && (
        <div className="flex items-center gap-1.5 relative">
          <span className={clsx("w-1 h-1 rounded-full flex-shrink-0 opacity-50", t.dot)} />
          <p className="text-[10px] font-mono text-slate-600 leading-snug">{subtitle}</p>
        </div>
      )}
    </div>
  );
}
