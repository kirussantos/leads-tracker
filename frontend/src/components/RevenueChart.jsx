import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-border rounded-xl p-3.5 text-xs font-mono shadow-2xl backdrop-blur-sm">
      <p className="text-slate-400 mb-2.5 font-semibold">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-slate-400">{p.name}:</span>
          <span style={{ color: p.color }} className="font-bold">
            R${(p.value || 0).toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function RevenueChart({ data }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-0.5">Comparativo</p>
          <h3 className="text-sm font-semibold text-slate-300">CPL por Cliente</h3>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-green rounded-full inline-block" />
            <span className="text-slate-500">CPL Real</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-amber rounded-full inline-block" style={{ backgroundImage: "repeating-linear-gradient(90deg,#f59e0b 0,#f59e0b 3px,transparent 3px,transparent 6px)" }} />
            <span className="text-slate-500">CPL Estimado</span>
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradAmber" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.12} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1c1c2e" vertical={false} />
          <XAxis
            dataKey="nome"
            tick={{ fill: "#334155", fontSize: 10, fontFamily: "JetBrains Mono" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#334155", fontSize: 10, fontFamily: "JetBrains Mono" }}
            axisLine={false}
            tickLine={false}
            width={48}
            tickFormatter={v => `R$${v}`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#1c1c2e", strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey="cpl_real"
            stroke="#22c55e"
            strokeWidth={1.5}
            fill="url(#gradGreen)"
            dot={{ fill: "#22c55e", r: 3, strokeWidth: 0 }}
            name="CPL Real"
          />
          <Area
            type="monotone"
            dataKey="cpl_estimado"
            stroke="#f59e0b"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            fill="url(#gradAmber)"
            dot={{ fill: "#f59e0b", r: 3, strokeWidth: 0 }}
            name="CPL Estimado"
          />
        </AreaChart>
      </ResponsiveContainer>

      {!data.length && (
        <p className="text-center text-slate-700 font-mono text-xs mt-4">
          Nenhum dado disponível para o período selecionado.
        </p>
      )}
    </div>
  );
}
