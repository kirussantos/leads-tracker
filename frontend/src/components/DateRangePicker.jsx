import { useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { clsx } from "clsx";

const PRESETS = [
  { label: "Hoje", days: 0 },
  { label: "7 dias", days: 7 },
  { label: "30 dias", days: 30 },
  { label: "90 dias", days: 90 },
];

function toISO(date) {
  // Usa data local (não UTC) — evita problema de fuso horário no Brasil (UTC-3)
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getDefaultRange(days = 30) {
  const until = new Date();
  const since = new Date();
  if (days > 0) since.setDate(since.getDate() - days);
  return { since: toISO(since), until: toISO(until) };
}

export default function DateRangePicker({ onChange, loading }) {
  const [active, setActive] = useState("30 dias");
  const [showCustom, setShowCustom] = useState(false);
  const [custom, setCustom] = useState({ since: "", until: "" });

  function selectPreset(p) {
    setActive(p.label);
    setShowCustom(false);
    onChange(getDefaultRange(p.days), p.label);
  }

  function applyCustom() {
    if (!custom.since || !custom.until) return;
    setActive("Personalizado");
    setShowCustom(false);
    const label = `${custom.since.split("-").reverse().join("/")} → ${custom.until.split("-").reverse().join("/")}`;
    onChange(custom, label);
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Calendar size={13} className="text-slate-500" />
      <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mr-1">Período</span>

      {PRESETS.map(p => (
        <button
          key={p.label}
          onClick={() => selectPreset(p)}
          className={clsx(
            "px-3 py-1.5 text-xs font-mono rounded-lg border transition-all",
            active === p.label
              ? "bg-green/20 border-green/40 text-green"
              : "bg-transparent border-border text-slate-500 hover:border-slate-500 hover:text-slate-300"
          )}
        >
          {p.label}
        </button>
      ))}

      <div className="relative">
        <button
          onClick={() => setShowCustom(v => !v)}
          className={clsx(
            "flex items-center gap-1 px-3 py-1.5 text-xs font-mono rounded-lg border transition-all",
            active === "Personalizado"
              ? "bg-green/20 border-green/40 text-green"
              : "bg-transparent border-border text-slate-500 hover:border-slate-500 hover:text-slate-300"
          )}
        >
          Personalizado <ChevronDown size={11} />
        </button>

        {showCustom && (
          <div className="absolute top-full left-0 mt-2 z-50 bg-surface border border-border rounded-xl p-4 shadow-2xl flex flex-col gap-3 w-60">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-mono text-slate-500 uppercase">De</label>
              <input
                type="date"
                value={custom.since}
                onChange={e => setCustom(v => ({ ...v, since: e.target.value }))}
                className="bg-card border border-border rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-mono text-slate-500 uppercase">Até</label>
              <input
                type="date"
                value={custom.until}
                onChange={e => setCustom(v => ({ ...v, until: e.target.value }))}
                className="bg-card border border-border rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono"
              />
            </div>
            <button
              onClick={applyCustom}
              className="px-4 py-2 bg-green/20 border border-green/40 text-green text-xs font-mono rounded-lg hover:bg-green/30 transition-all"
            >
              Aplicar
            </button>
          </div>
        )}
      </div>

      {loading && (
        <span className="text-[10px] font-mono text-slate-600 animate-pulse ml-2">
          Buscando dados...
        </span>
      )}
    </div>
  );
}
