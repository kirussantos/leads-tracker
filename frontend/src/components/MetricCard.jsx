import { clsx } from "clsx";

const colorMap = {
  green: "border-green/30 text-green",
  amber: "border-amber/30 text-amber",
  red: "border-red/30 text-red",
  blue: "border-blue/30 text-blue",
  default: "border-border text-slate-300",
};

const glowMap = {
  green: "bg-green",
  amber: "bg-amber",
  red: "bg-red",
  blue: "bg-blue",
  default: "",
};

export default function MetricCard({ title, value, subtitle, color = "default", delay = 0, icon: Icon }) {
  return (
    <div
      className={clsx(
        "relative bg-card border rounded-xl p-5 overflow-hidden",
        "animate-fade-up transition-all duration-300",
        "hover:border-opacity-60 hover:shadow-lg group",
        colorMap[color]
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      <div className={clsx(
        "absolute top-0 right-0 w-24 h-24 rounded-full opacity-5 blur-2xl",
        glowMap[color]
      )} />
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">{title}</span>
        {Icon && <Icon size={16} className="opacity-40 group-hover:opacity-70 transition-opacity" />}
      </div>
      <div className={clsx("text-3xl font-mono font-bold tracking-tight mb-1", colorMap[color])}>
        {value}
      </div>
      {subtitle && (
        <div className="text-xs text-slate-600 font-mono">{subtitle}</div>
      )}
    </div>
  );
}
