import { useParams, Link } from "react-router-dom";
import { useEffect, useState, useCallback, useRef } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useCampanhas } from "../hooks/useCampanhas";
import MetricCard from "../components/MetricCard";
import CriativoTable from "../components/CriativoTable";
import DateRangePicker, { getDefaultRange } from "../components/DateRangePicker";
import AnaliseModal from "../components/AnaliseModal";
import {
  DollarSign, MousePointerClick, TrendingUp, RefreshCw,
  Eye, Users, Activity, BarChart2, ArrowLeft, Sparkles,
} from "lucide-react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

export default function Cliente() {
  const { id } = useParams();
  const [cliente, setCliente] = useState(null);

  // Campanhas do Firestore (fallback)
  const { campanhas: campsFirestore } = useCampanhas(id, "campaign");
  const { campanhas: criativos } = useCampanhas(id, "ad");

  // Estado do período
  const [periodoData, setPeriodoData] = useState(null);
  const [periodoLabel, setPeriodoLabel] = useState("30 dias");
  const [loadingPeriodo, setLoadingPeriodo] = useState(false);
  const [periodoErro, setPeriodoErro] = useState(false);
  const autoFetchedRef = useRef(false);

  // Análise IA
  const [showAnalise, setShowAnalise] = useState(false);
  const [analise, setAnalise] = useState(null);
  const [loadingAnalise, setLoadingAnalise] = useState(false);

  const [syncing, setSyncing] = useState(false);

  // Carrega dados do cliente do Firestore
  useEffect(() => {
    getDoc(doc(db, "clientes", id)).then(d => {
      if (d.exists()) setCliente({ id: d.id, ...d.data() });
    });
  }, [id]);

  // Busca métricas do período via Meta API
  const handleDateChange = useCallback(async (range, label) => {
    setPeriodoLabel(label);
    setLoadingPeriodo(true);
    setPeriodoErro(false);

    try {
      const r = await axios.get(`${API}/insights/periodo`, {
        params: { cliente_id: id, since: range.since, until: range.until },
        timeout: 65000,
      });
      if (r.data?.erro) {
        console.error("[insights/periodo] erro backend:", r.data.erro);
        setPeriodoErro(true);
      } else {
        setPeriodoData(r.data);
      }
    } catch (e) {
      console.error("[insights/periodo]", e);
      setPeriodoErro(true);
    } finally {
      setLoadingPeriodo(false);
    }
  }, [id]);

  // Auto-fetch padrão 30d ao montar
  useEffect(() => {
    if (!autoFetchedRef.current) {
      autoFetchedRef.current = true;
      handleDateChange(getDefaultRange(30), "30 dias");
    }
  }, [handleDateChange]);

  // Métricas do Firestore (fallback quando periodoData é null)
  const verbaFirestore = campsFirestore.reduce((s, c) => s + (c.verba_gasta || 0), 0);
  const wppFirestore = campsFirestore.reduce((s, c) => s + (c.cliques_whatsapp || 0), 0);
  const cliquesFirestore = campsFirestore.reduce((s, c) => s + (c.cliques || 0), 0);
  const impressoesFirestore = campsFirestore.reduce((s, c) => s + (c.impressoes || 0), 0);
  const cplFirestore = wppFirestore > 0 ? verbaFirestore / wppFirestore : 0;
  const ctrFirestore = impressoesFirestore > 0 ? (cliquesFirestore / impressoesFirestore) * 100 : 0;
  const cpmFirestore = impressoesFirestore > 0 ? (verbaFirestore / impressoesFirestore) * 1000 : 0;

  // Exibe dados do período se disponível, senão Firestore
  const display = periodoData ? {
    verba: periodoData.verba || 0,
    impressoes: periodoData.impressoes || 0,
    alcance: periodoData.alcance || 0,
    cliques_wpp: periodoData.cliques_wpp || 0,
    cliques: periodoData.cliques || 0,
    cpl: periodoData.cpl_estimado || 0,
    ctr: periodoData.ctr_medio || 0,
    cpm: periodoData.cpm || 0,
    frequencia: periodoData.frequencia_media || 0,
    n_campanhas: periodoData.n_campanhas || 0,
  } : {
    verba: verbaFirestore,
    impressoes: impressoesFirestore,
    alcance: 0,
    cliques_wpp: wppFirestore,
    cliques: cliquesFirestore,
    cpl: cplFirestore,
    ctr: ctrFirestore,
    cpm: cpmFirestore,
    frequencia: 0,
    n_campanhas: campsFirestore.length,
  };

  const syncCliente = async () => {
    setSyncing(true);
    try { await axios.post(`${API}/sync/cliente/${id}`); }
    finally { setSyncing(false); }
  };

  const analisarComIA = async () => {
    setShowAnalise(true);
    setLoadingAnalise(true);
    setAnalise(null);

    const campsForAI = (periodoData?.campanhas ?? campsFirestore.map(c => ({
      nome: c.nome,
      status: c.status,
      verba: c.verba_gasta || 0,
      impressoes: c.impressoes || 0,
      cliques_wpp: c.cliques_whatsapp || 0,
      ctr: c.ctr || 0,
      cpl_estimado: 0,
      frequencia: 0,
    }))).slice(0, 20);

    try {
      const resp = await axios.post(`${API}/ai/analisar`, {
        cliente_nome: cliente?.nome ?? "Cliente",
        periodo: periodoLabel,
        metricas: {
          verba: display.verba,
          impressoes: display.impressoes,
          alcance: display.alcance,
          cliques_wpp: display.cliques_wpp,
          ctr_medio: display.ctr,
          cpm: display.cpm,
          cpl_estimado: display.cpl,
          frequencia_media: display.frequencia,
          n_campanhas: display.n_campanhas,
        },
        campanhas: campsForAI,
      });
      setAnalise(resp.data.analise ?? resp.data.erro ?? "Erro ao gerar análise.");
    } catch {
      setAnalise("Erro ao conectar com o serviço de IA.");
    } finally {
      setLoadingAnalise(false);
    }
  };

  const fmtNum = n =>
    n > 999999 ? `${(n / 1000000).toFixed(1)}M`
    : n > 999 ? `${(n / 1000).toFixed(1)}k`
    : String(Math.round(n));

  if (!cliente) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="text-green font-mono text-sm animate-pulse">Carregando...</div>
    </div>
  );

  // Normaliza campos dos dois formatos (Firestore vs Meta API)
  const campanhasExibidas = (periodoData?.campanhas ?? campsFirestore).map(c => ({
    id: c.id || c.campaign_id || c.nome,
    nome: c.nome || c.campaign_name || "—",
    status: c.status || "ACTIVE",
    verba_gasta: c.verba ?? c.verba_gasta ?? 0,
    impressoes: c.impressoes || 0,
    cliques_whatsapp: c.cliques_wpp ?? c.cliques_whatsapp ?? 0,
    ctr: c.ctr || 0,
    cpl_estimado: c.cpl_estimado || 0,
  }));

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
            <Link
              to="/"
              className="flex items-center gap-1 text-[10px] font-mono text-slate-600 hover:text-slate-400 transition-colors mb-2"
            >
              <ArrowLeft size={11} /> Dashboard
            </Link>
            <p className="text-xs font-mono text-slate-600 uppercase tracking-widest mb-1">Cliente</p>
            <h1 className="text-2xl font-bold text-slate-100">{cliente.nome}</h1>
            <p className="text-xs font-mono text-slate-600 mt-1">{cliente.ad_account_id}</p>
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
              onClick={syncCliente}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 bg-green/10 border border-green/20 text-green text-xs font-mono rounded-lg hover:bg-green/20 transition-all disabled:opacity-50"
            >
              <RefreshCw size={13} className={syncing ? "animate-spin" : ""} />
              Sync
            </button>
          </div>
        </div>

        {/* Date Picker */}
        <div className="bg-card border border-border rounded-xl px-4 py-3 flex flex-col gap-2">
          <DateRangePicker onChange={handleDateChange} loading={loadingPeriodo} />
          {periodoErro && (
            <p className="text-[10px] font-mono text-red/70 mt-1">
              ⚠ Não foi possível buscar dados do período — exibindo dados do último sync.
              O backend pode estar iniciando (aguarde ~30s e tente novamente).
            </p>
          )}
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
              value={`R$${display.cpl.toFixed(2)}`}
              subtitle="custo por lead"
              color={display.cpl > 0 && display.cpl < 15 ? "green" : display.cpl < 30 ? "amber" : "red"}
              icon={TrendingUp}
              delay={160}
            />
            <MetricCard
              title="Campanhas"
              value={display.n_campanhas}
              subtitle="no período"
              color="default"
              icon={BarChart2}
              delay={240}
            />
          </div>
        </div>

        {/* Alcance & Engajamento */}
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
              value={`${display.ctr.toFixed(2)}%`}
              subtitle="taxa de cliques"
              color={display.ctr > 1.5 ? "green" : display.ctr > 0.8 ? "amber" : "red"}
              icon={Activity}
              delay={160}
            />
            <MetricCard
              title="CPM Médio"
              value={`R$${display.cpm.toFixed(2)}`}
              subtitle="custo por mil impr."
              color="default"
              icon={BarChart2}
              delay={240}
            />
          </div>
        </div>

        {/* Distribuição */}
        <div>
          <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-3">Distribuição</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Frequência Média"
              value={display.frequencia > 0 ? display.frequencia.toFixed(1) : "—"}
              subtitle={display.frequencia > 3 ? "⚠ saturação possível" : "exibições por pessoa"}
              color={display.frequencia > 3 ? "red" : display.frequencia > 2 ? "amber" : "default"}
              icon={Activity}
              delay={0}
            />
            <MetricCard
              title="Cliques Totais"
              value={display.cliques > 0 ? fmtNum(display.cliques) : "—"}
              subtitle="todos os links"
              color="default"
              icon={MousePointerClick}
              delay={80}
            />
            <MetricCard
              title="Conv. WPP"
              value={display.cliques_wpp > 0 && display.cliques > 0
                ? `${((display.cliques_wpp / display.cliques) * 100).toFixed(1)}%`
                : "—"}
              subtitle="cliques → WhatsApp"
              color="default"
              icon={TrendingUp}
              delay={160}
            />
            <MetricCard
              title="CPL Real"
              value="—"
              subtitle="sem dados de conversão"
              color="default"
              icon={DollarSign}
              delay={240}
            />
          </div>
        </div>

        {/* Campanhas */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xs font-mono text-slate-600 uppercase tracking-widest">
              Campanhas — {periodoLabel}
            </h2>
            <span className="text-[10px] font-mono text-slate-600">{campanhasExibidas.length} encontradas</span>
          </div>
          <CriativoTable campanhas={campanhasExibidas} />
        </div>
      </div>
    </>
  );
}
