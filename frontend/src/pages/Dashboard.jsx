import { useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useClientes } from "../hooks/useClientes";
import { useCampanhas } from "../hooks/useCampanhas";
import MetricCard from "../components/MetricCard";
import RevenueChart from "../components/RevenueChart";
import CriativoTable from "../components/CriativoTable";
import DateRangePicker from "../components/DateRangePicker";
import AnaliseModal from "../components/AnaliseModal";
import {
  DollarSign, Users, MousePointerClick, TrendingUp,
  ArrowRight, RefreshCw, Eye, Sparkles, BarChart2, Activity,
} from "lucide-react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

export default function Dashboard() {
  const { clientes, loading: loadClientes } = useClientes();
  const { campanhas } = useCampanhas(null, "campaign");
  const { campanhas: criativos } = useCampanhas(null, "ad");

  const [periodoData, setPeriodoData] = useState(null);
  const [loadingPeriodo, setLoadingPeriodo] = useState(false);
  const [periodoLabel, setPeriodoLabel] = useState("30 dias");

  const [showAnalise, setShowAnalise] = useState(false);
  const [analise, setAnalise] = useState(null);
  const [loadingAnalise, setLoadingAnalise] = useState(false);

  const [syncing, setSyncing] = useState(false);

  // Firestore-based metrics (sync'd data)
  const metricas = useMemo(() => {
    return clientes.map(cliente => {
      const camps = campanhas.filter(c => c.cliente_id === cliente.id);
      const verba = camps.reduce((s, c) => s + (c.verba_gasta || 0), 0);
      const impressoes = camps.reduce((s, c) => s + (c.impressoes || 0), 0);
      const cliques_wpp = camps.reduce((s, c) => s + (c.cliques_whatsapp || 0), 0);
      const cliques = camps.reduce((s, c) => s + (c.cliques || 0), 0);
      const cpl_estimado = cliques_wpp > 0 ? verba / cliques_wpp : 0;
      const ctr_medio = impressoes > 0 ? (cliques / impressoes) * 100 : 0;
      const cpm = impressoes > 0 ? (verba / impressoes) * 1000 : 0;
      return { ...cliente, verba, impressoes, cliques_wpp, cliques, cpl_estimado, cpl_real: 0, ctr_medio, cpm };
    });
  }, [clientes, campanhas]);

  const firestoreTotais = useMemo(() => ({
    verba: metricas.reduce((s, m) => s + m.verba, 0),
    impressoes: metricas.reduce((s, m) => s + m.impressoes, 0),
    alcance: 0,
    cliques_wpp: metricas.reduce((s, m) => s + m.cliques_wpp, 0),
    cpl_medio: metricas.length > 0
      ? metricas.reduce((s, m) => s + m.cpl_estimado, 0) / metricas.length : 0,
    ctr_medio: metricas.length > 0
      ? metricas.reduce((s, m) => s + m.ctr_medio, 0) / metricas.length : 0,
    cpm_medio: metricas.length > 0
      ? metricas.reduce((s, m) => s + m.cpm, 0) / metricas.length : 0,
    frequencia_media: 0,
  }), [metricas]);

  // When user selects a date range, fetch from Meta API via backend
  const handleDateChange = useCallback(async (range, label) => {
    setPeriodoLabel(label);
    if (!clientes.length) return;
    setLoadingPeriodo(true);
    setPeriodoData(null);

    try {
      const results = await Promise.all(
        clientes.map(c =>
          axios.get(`${API}/insights/periodo`, {
            params: { cliente_id: c.id, since: range.since, until: range.until },
          }).then(r => r.data)
        )
      );

      const agg = results.reduce((acc, r) => ({
        verba: acc.verba + (r.verba || 0),
        impressoes: acc.impressoes + (r.impressoes || 0),
        alcance: acc.alcance + (r.alcance || 0),
        cliques_wpp: acc.cliques_wpp + (r.cliques_wpp || 0),
        cliques: acc.cliques + (r.cliques || 0),
        frequencia_media: Math.max(acc.frequencia_media, r.frequencia_media || 0),
        n_campanhas: acc.n_campanhas + (r.n_campanhas || 0),
        campanhas: [...acc.campanhas, ...(r.campanhas || [])],
      }), { verba: 0, impressoes: 0, alcance: 0, cliques_wpp: 0, cliques: 0, frequencia_media: 0, n_campanhas: 0, campanhas: [] });

      const cpl = agg.cliques_wpp > 0 ? agg.verba / agg.cliques_wpp : 0;
      const ctr = agg.impressoes > 0 ? (agg.cliques / agg.impressoes) * 100 : 0;
      const cpm = agg.impressoes > 0 ? (agg.verba / agg.impressoes) * 1000 : 0;

      setPeriodoData({ ...agg, cpl_estimado: cpl, ctr_medio: ctr, cpm_medio: cpm });
    } catch (e) {
      console.error("[insights/periodo]", e);
    } finally {
      setLoadingPeriodo(false);
    }
  }, [clientes]);

  // Display data: period API data takes priority over Firestore
  const display = periodoData ? {
    verba: periodoData.verba,
    impressoes: periodoData.impressoes,
    alcance: periodoData.alcance,
    cliques_wpp: periodoData.cliques_wpp,
    cpl_medio: periodoData.cpl_estimado,
    ctr_medio: periodoData.ctr_medio,
    cpm_medio: periodoData.cpm_medio,
    frequencia_media: periodoData.frequencia_media,
    n_campanhas: periodoData.n_campanhas,
  } : {
    ...firestoreTotais,
    n_campanhas: campanhas.length,
  };

  const syncTodos = async () => {
    setSyncing(true);
    try { await axios.post(`${API}/sync/todos`); }
    finally { setSyncing(false); }
  };

  const analisarComIA = async () => {
    setShowAnalise(true);
    setLoadingAnalise(true);
    setAnalise(null);

    try {
      const campsForAI = (periodoData?.campanhas ?? campanhas.map(c => ({
        nome: c.nome,
        status: c.status,
        verba: c.verba_gasta || 0,
        impressoes: c.impressoes || 0,
        cliques_wpp: c.cliques_whatsapp || 0,
        ctr: c.ctr || 0,
        cpl_estimado: c.cpl_estimado || 0,
        frequencia: 0,
      }))).slice(0, 20);

      const resp = await axios.post(`${API}/ai/analisar`, {
        cliente_nome: clientes[0]?.nome ?? "Cliente",
        periodo: periodoLabel,
        metricas: {
          verba: display.verba,
          impressoes: display.impressoes,
          alcance: display.alcance,
          cliques_wpp: display.cliques_wpp,
          ctr_medio: display.ctr_medio,
          cpm: display.cpm_medio,
          cpl_estimado: display.cpl_medio,
          frequencia_media: display.frequencia_media,
          n_campanhas: display.n_campanhas,
        },
        campanhas: campsForAI,
      });

      setAnalise(resp.data.analise ?? resp.data.erro ?? "Erro ao gerar análise.");
    } catch {
      setAnalise("Erro ao conectar com o serviço de IA.\n\nVerifique se a variável ANTHROPIC_API_KEY está configurada no Render.");
    } finally {
      setLoadingAnalise(false);
    }
  };

  if (loadClientes) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="text-green font-mono text-sm animate-pulse">Carregando dados...</div>
    </div>
  );

  const fmtNum = n => n > 999999
    ? `${(n / 1000000).toFixed(1)}M`
    : n > 999 ? `${(n / 1000).toFixed(1)}k` : String(n);

  return (
    <>
      {showAnalise && (
        <AnaliseModal
          analise={analise}
          loading={loadingAnalise}
          onClose={() => setShowAnalise(false)}
        />
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-mono text-slate-600 uppercase tracking-widest mb-1">Visão Geral</p>
            <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              onClick={analisarComIA}
              className="flex items-center gap-2 px-4 py-2 bg-amber/10 border border-amber/30 text-amber text-xs font-mono rounded-lg hover:bg-amber/20 transition-all"
            >
              <Sparkles size={13} />
              Analisar com IA
            </button>
            <button
              onClick={syncTodos}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 bg-green/10 border border-green/20 text-green text-xs font-mono rounded-lg hover:bg-green/20 transition-all disabled:opacity-50"
            >
              <RefreshCw size={13} className={syncing ? "animate-spin" : ""} />
              Sync Agora
            </button>
          </div>
        </div>

        {/* Date Range Picker */}
        <div className="bg-card border border-border rounded-xl px-4 py-3">
          <DateRangePicker onChange={handleDateChange} loading={loadingPeriodo} />
        </div>

        {/* Métricas Principais */}
        <div>
          <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-3">Métricas Principais</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Verba Total"
              value={`R$${display.verba.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              subtitle={`período: ${periodoLabel}`}
              color="amber"
              icon={DollarSign}
              delay={0}
            />
            <MetricCard
              title="Cliques WPP"
              value={fmtNum(display.cliques_wpp)}
              subtitle="cliques no WhatsApp"
              color="green"
              icon={MousePointerClick}
              delay={80}
            />
            <MetricCard
              title="CPL Estimado"
              value={`R$${display.cpl_medio.toFixed(2)}`}
              subtitle="custo por lead"
              color={display.cpl_medio > 0 && display.cpl_medio < 15 ? "green" : display.cpl_medio < 30 ? "amber" : "red"}
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
        </div>

        {/* Métricas Estendidas */}
        <div>
          <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-3">Alcance & Engajamento</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Impressões"
              value={fmtNum(display.impressoes)}
              subtitle="total de exibições"
              color="default"
              icon={Eye}
              delay={0}
            />
            <MetricCard
              title="Alcance"
              value={display.alcance > 0 ? fmtNum(display.alcance) : "—"}
              subtitle={display.alcance > 0 ? "pessoas únicas" : "selecione um período"}
              color="default"
              icon={Users}
              delay={80}
            />
            <MetricCard
              title="CTR Médio"
              value={`${display.ctr_medio.toFixed(2)}%`}
              subtitle="taxa de cliques"
              color={display.ctr_medio > 1.5 ? "green" : display.ctr_medio > 0.8 ? "amber" : "red"}
              icon={Activity}
              delay={160}
            />
            <MetricCard
              title="CPM Médio"
              value={`R$${display.cpm_medio.toFixed(2)}`}
              subtitle="custo por mil impr."
              color="default"
              icon={BarChart2}
              delay={240}
            />
          </div>
        </div>

        {/* Métricas Secundárias */}
        <div>
          <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-3">Distribuição</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Frequência Média"
              value={display.frequencia_media > 0 ? display.frequencia_media.toFixed(1) : "—"}
              subtitle={display.frequencia_media > 3 ? "⚠ saturação possível" : "exibições por pessoa"}
              color={display.frequencia_media > 3 ? "red" : display.frequencia_media > 2 ? "amber" : "default"}
              icon={Activity}
              delay={0}
            />
            <MetricCard
              title="Campanhas Ativas"
              value={display.n_campanhas}
              subtitle="no período"
              color="default"
              icon={BarChart2}
              delay={80}
            />
            <MetricCard
              title="Cliques Totais"
              value={periodoData ? fmtNum(periodoData.cliques) : "—"}
              subtitle="todos os links"
              color="default"
              icon={MousePointerClick}
              delay={160}
            />
            <MetricCard
              title="Conv. WPP"
              value={display.cliques_wpp > 0 && periodoData?.cliques > 0
                ? `${((display.cliques_wpp / periodoData.cliques) * 100).toFixed(1)}%`
                : "—"}
              subtitle="cliques → WhatsApp"
              color="blue"
              icon={TrendingUp}
              delay={240}
            />
          </div>
        </div>

        <RevenueChart data={metricas.map(m => ({
          nome: m.nome.split(" ")[0],
          cpl_real: m.cpl_real,
          cpl_estimado: parseFloat(m.cpl_estimado.toFixed(2)),
        }))} />

        {/* Por Cliente */}
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

        {/* Top Criativos */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xs font-mono text-slate-600 uppercase tracking-widest mb-5">
            Top Criativos — Todos os Clientes
          </h2>
          <CriativoTable campanhas={criativos.slice(0, 10)} />
        </div>
      </div>
    </>
  );
}
