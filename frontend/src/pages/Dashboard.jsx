import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useClientes } from "../hooks/useClientes";
import { useCampanhas } from "../hooks/useCampanhas";
import MetricCard from "../components/MetricCard";
import RevenueChart from "../components/RevenueChart";
import CriativoTable from "../components/CriativoTable";
import { DollarSign, Users, MousePointerClick, TrendingUp, ArrowRight, RefreshCw } from "lucide-react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

export default function Dashboard() {
  const { clientes, loading: loadClientes } = useClientes();
  const { campanhas } = useCampanhas(null, "campaign");
  const { campanhas: criativos } = useCampanhas(null, "ad");

  const metricas = useMemo(() => {
    return clientes.map(cliente => {
      const camps = campanhas.filter(c => c.cliente_id === cliente.id);
      const verba = camps.reduce((s, c) => s + (c.verba_gasta || 0), 0);
      const cliques_wpp = camps.reduce((s, c) => s + (c.cliques_whatsapp || 0), 0);
      const cpl_estimado = cliques_wpp > 0 ? verba / cliques_wpp : 0;
      return { ...cliente, verba, cliques_wpp, cpl_estimado, cpl_real: 0 };
    });
  }, [clientes, campanhas]);

  const totais = useMemo(() => ({
    verba: metricas.reduce((s, m) => s + m.verba, 0),
    cliques_wpp: metricas.reduce((s, m) => s + m.cliques_wpp, 0),
    cpl_medio: metricas.length > 0
      ? metricas.reduce((s, m) => s + m.cpl_estimado, 0) / metricas.length
      : 0,
  }), [metricas]);

  const syncTodos = async () => {
    await axios.post(`${API}/sync/todos`);
  };

  if (loadClientes) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="text-green font-mono text-sm animate-pulse">Carregando dados...</div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-mono text-slate-600 uppercase tracking-widest mb-1">Visão Geral</p>
          <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
        </div>
        <button
          onClick={syncTodos}
          className="flex items-center gap-2 px-4 py-2 bg-green/10 border border-green/20 text-green text-xs font-mono rounded-lg hover:bg-green/20 transition-all"
        >
          <RefreshCw size={13} />
          Sync Agora
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Verba Total"
          value={`R$${totais.verba.toFixed(2)}`}
          subtitle="últimos 30 dias"
          color="amber"
          icon={DollarSign}
          delay={0}
        />
        <MetricCard
          title="Cliques WPP"
          value={totais.cliques_wpp}
          subtitle="total de cliques"
          color="green"
          icon={MousePointerClick}
          delay={80}
        />
        <MetricCard
          title="CPL Médio"
          value={`R$${totais.cpl_medio.toFixed(2)}`}
          subtitle="estimado"
          color="blue"
          icon={TrendingUp}
          delay={160}
        />
        <MetricCard
          title="Clientes"
          value={clientes.length}
          subtitle="contas ativas"
          color="default"
          icon={Users}
          delay={240}
        />
      </div>

      <RevenueChart data={metricas.map(m => ({
        nome: m.nome.split(" ")[0],
        cpl_real: m.cpl_real,
        cpl_estimado: parseFloat(m.cpl_estimado.toFixed(2)),
      }))} />

      <div>
        <h2 className="text-xs font-mono text-slate-600 uppercase tracking-widest mb-4">Por Cliente</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {metricas.map((m, i) => (
            <Link
              key={m.id}
              to={`/cliente/${m.id}`}
              className="block bg-card border border-border rounded-xl p-5 hover:border-green/30 transition-all group animate-fade-up"
              style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-semibold text-slate-200 text-sm">{m.nome}</p>
                  <p className="text-xs font-mono text-slate-600 mt-0.5">{m.ad_account_id}</p>
                </div>
                <ArrowRight size={14} className="text-slate-700 group-hover:text-green group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-[10px] font-mono text-slate-600 uppercase mb-1">Verba</p>
                  <p className="text-sm font-mono text-amber font-bold">R${m.verba.toFixed(0)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono text-slate-600 uppercase mb-1">Cliques WPP</p>
                  <p className="text-sm font-mono text-green font-bold">{m.cliques_wpp}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono text-slate-600 uppercase mb-1">CPL Est.</p>
                  <p className="text-sm font-mono text-slate-300 font-bold">R${m.cpl_estimado.toFixed(2)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-xs font-mono text-slate-600 uppercase tracking-widest mb-5">Top Criativos — Todos os Clientes</h2>
        <CriativoTable campanhas={criativos.slice(0, 10)} />
      </div>
    </div>
  );
}
