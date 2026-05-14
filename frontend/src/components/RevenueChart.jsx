import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 text-xs font-mono shadow-xl">
      <p className="text-slate-400 mb-2">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: R${p.value?.toFixed(2)}
        </p>
      ))}
    </div>
  );
};

export default function RevenueChart({ data }) {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xs font-mono text-slate-500 uppercase tracking-widest">CPL por Cliente</h3>
        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-px bg-green inline-block" />
            <span className="text-slate-500">CPL Real</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-px bg-amber inline-block" />
            <span className="text-slate-500">CPL Estimado</span>
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" vertical={false} />
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
            width={45}
            tickFormatter={v => `R$${v}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="cpl_real"
            stroke="#22c55e"
            strokeWidth={1.5}
            dot={{ fill: "#22c55e", r: 3, strokeWidth: 0 }}
            name="CPL Real"
          />
          <Line
            type="monotone"
            dataKey="cpl_estimado"
            stroke="#f59e0b"
            strokeWidth={1.5}
            dot={{ fill: "#f59e0b", r: 3, strokeWidth: 0 }}
            strokeDasharray="4 4"
            name="CPL Estimado"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
