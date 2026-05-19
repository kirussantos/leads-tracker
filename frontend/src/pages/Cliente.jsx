import { useParams, Link } from "react-router-dom";
import { useEffect, useState, useCallback, useRef } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useCampanhas } from "../hooks/useCampanhas";
import MetricCard from "../components/MetricCard";
import CriativoTable from "../components/CriativoTable";
import CampanhaEditModal from "../components/CampanhaEditModal";
import DateRangePicker, { getDefaultRange } from "../components/DateRangePicker";
import AnaliseModal from "../components/AnaliseModal";
import {
  DollarSign, MousePointerClick, TrendingUp, RefreshCw,
  Eye, Users, Activity, BarChart2, ArrowLeft, Sparkles, AlertCircle, Wifi,
} from "lucide-react";
import { clsx } from "clsx";
import axios from "axios";

const API = (import.meta.env.VITE_API_URL || "").replace(/^﻿/, "").trim();

function SectionDivider({ label, description }) {
  return (
    <div className="flex items-end gap-4 mt-2">
      <div>
        <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-0.5">{label}</p>
        {description && (
          <p className="text-[10px] font-mono text-slate-700">{description}</p>
        )}
      </div>
      <div className="flex-1 h-px bg-border mb-1" />
    </div>
  );
}

export default function Cliente() {
  const { id } = useParams();
  const [cliente, setCliente] = useState(null);

  const { campanhas: campsFirestore } = useCampanhas(id, "campaign");
  const { campanhas: criativos }      = useCampanhas(id, "ad");

  const [periodoData,    setPeriodoData]    = useState(null);
  const [periodoLabel,   setPeriodoLabel]   = useState("30 dias");
  const [loadingPeriodo, setLoadingPeriodo] = useState(false);
  const [periodoErro,    setPeriodoErro]    = useState(false);
  const autoFetchedRef = useRef(false);

  const [showAnalise,    setShowAnalise]    = useState(false);
  const [analise,        setAnalise]        = useState(null);
  const [loadingAnalise, setLoadingAnalise] = useState(false);

  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    getDoc(doc(db, "clientes", id)).then(d => {
      if (d.exists()) setCliente({ id: d.id, ...d.data() });
    });
  }, [id]);

  const handleDateChange = useCallback(async (range, label) => {
    setPeriodoLabel(label);
    setLoadingPeriodo(true);
    setPeriodoErro(false);
    try {
      const r = await axios.get(`${API}/insights/periodo`, {
        params: { cliente_id: id, since: range.since, until: range.until },
        timeout: 65000,
      });
      if (r.data?.erro) { setPeriodoErro(true); }
      else { setPeriodoData(r.data); }
    } catch {
      setPeriodoErro(true);
    } finally {
      setLoadingPeriodo(false);
    }
  }, [id]);

  useEffect(() => {
    if (!autoFetchedRef.current) {
      autoFetchedRef.current = true;
      handleDateChange(getDefaultRange(30), "30 dias");
    }
  }, [handleDateChange]);

  // Firestore fallback metrics
  const verbaF    = campsFirestore.reduce((s, c) => s + (c.verba_gasta || 0), 0);
  const wppF      = campsFirestore.reduce((s, c) => s + (c.cliques_whatsapp || 0), 0);
  const cliquesF  = campsFirestore.reduce((s, c) => s + (c.cliques || 0), 0);
  const impressF  = campsFirestore.reduce((s, c) => s + (c.impressoes || 0), 0);
  const cplF      = wppF > 0 ? verbaF / wppF : 0;
  const ctrF      = impressF > 0 ? (cliquesF / impressF) * 100 : 0;
  const cpmF      = impressF > 0 ? (verbaF / impressF) * 1000 : 0;

  const display = periodoData ? {
    verba:             periodoData.verba || 0,
    impressoes:        periodoData.impressoes || 0,
    alcance:           periodoData.alcance || 0,
    cliques_wpp:       periodoData.cliques_wpp || 0,
    cliques:           periodoData.cliques || 0,
    mensagens_enviadas: periodoData.mensagens_enviadas || 0,
    custo_por_mensagem: periodoData.custo_por_mensagem || 0,
    cpl:               periodoData.cpl_estimado || 0,
    ctr:               periodoData.ctr_medio || 0,
    cpm:               periodoData.cpm || 0,
    frequencia:        periodoData.frequencia_media || 0,
    n_campanhas:       periodoData.n_campanhas || 0,
  } : {
    verba: verbaF, impressoes: impressF, alcance: 0,
    cliques_wpp: wppF, cliques: cliquesF, mensagens_enviadas: 0, custo_por_mensagem: 0,
    cpl: cplF, ctr: ctrF, cpm: cpmF, frequencia: 0, n_campanhas: campsFirestore.length,
  };

  const syncCliente = async () => {
    setSyncing(true);
    try { await axios.post(`${API}/sync/cliente/${id}`); }
    finally { setSyncing(false); }
  };

  const analisarCampanhaIndividual = async (campanha) => {
    const resp = await axios.post(`${API}/ai/campanha`, {
      cliente_nome: cliente?.nome ?? "Cliente",
      periodo: periodoLabel,
      campanha: {
        nome: campanha.nome, status: campanha.status,
        verba_gasta: campanha.verba_gasta || 0, impressoes: campanha.impressoes || 0,
        alcance: campanha.alcance || 0, cliques: campanha.cliques || 0,
        cliques_whatsapp: campanha.cliques_whatsapp || 0, ctr: campanha.ctr || 0,
        cpl_estimado: campanha.cpl_estimado || 0, frequencia: campanha.frequencia || 0, cpc: campanha.cpc || 0,
      },
    });
    if (resp.data?.erro) throw new Error(resp.data.erro);
    return resp.data.analise ?? "Erro ao gerar análise.";
  };

  const [campanhasStatus, setCampanhasStatus] = useState({});

  // ── Campaign edit modal ──────────────────────────────────────────────────────
  const [editingCampanha, setEditingCampanha] = useState(null);

  const toggleCampanhaStatus = async (campaignId, novoStatus) => {
    try {
      await axios.post(`${API}/meta/campanha/status`, {
        cliente_id: id, campaign_id: campaignId, status: novoStatus,
      });
      setCampanhasStatus(prev => ({ ...prev, [campaignId]: novoStatus }));
    } catch {
      alert(`Erro ao ${novoStatus === "PAUSED" ? "pausar" : "ativar"} campanha.`);
    }
  };

  const updateCampanhaBudget = async (campaignId, dailyBudget) => {
    try {
      await axios.post(`${API}/meta/campanha/budget`, {
        cliente_id: id, campaign_id: campaignId, daily_budget: dailyBudget,
      });
    } catch (err) {
      const msg = err?.response?.data?.detail || "Erro ao atualizar orçamento.";
      alert(msg);
      throw err;
    }
  };

  // salvarEdicaoCampanha foi movido para dentro do CampanhaEditModal (faz as chamadas internamente)
  // Aqui só precisamos reagir ao que mudou para atualizar o estado local
  const handleCampanhaSaved = (novoStatus) => {
    if (novoStatus && editingCampanha) {
      setCampanhasStatus(prev => ({ ...prev, [editingCampanha.id]: novoStatus }));
    }
    setEditingCampanha(null);
  };

  const analisarComIA = async () => {
    setShowAnalise(true);
    setLoadingAnalise(true);
    setAnalise(null);
    try {
      const campsForAI = (periodoData?.campanhas ?? campsFirestore.map(c => ({
        nome: c.nome, status: c.status,
        verba: c.verba_gasta || 0, impressoes: c.impressoes || 0,
        cliques_wpp: c.cliques_whatsapp || 0, ctr: c.ctr || 0, cpl_estimado: 0, frequencia: 0,
      }))).slice(0, 20);

      const resp = await axios.post(`${API}/ai/analisar`, {
        cliente_nome: cliente?.nome ?? "Cliente",
        periodo: periodoLabel,
        metricas: {
          verba: display.verba, impressoes: display.impressoes, alcance: display.alcance,
          cliques_wpp: display.cliques_wpp, ctr_medio: display.ctr, cpm: display.cpm,
          cpl_estimado: display.cpl, frequencia_media: display.frequencia, n_campanhas: display.n_campanhas,
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

  const fmtNum = n => n > 999999 ? `${(n / 1000000).toFixed(1)}M` : n > 999 ? `${(n / 1000).toFixed(1)}k` : String(Math.round(n));

  if (!cliente) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="w-10 h-10 border border-green/20 rounded-xl flex items-center justify-center">
        <Wifi size={16} className="text-green/60 animate-pulse" />
      </div>
      <p className="text-slate-600 font-mono text-xs">Carregando dados do cliente...</p>
    </div>
  );

  const campanhasExibidas = (periodoData?.campanhas ?? campsFirestore).map(c => {
    const cid = c.id || c.campaign_id || c.nome;
    return {
      id: cid,
      nome: c.nome || c.campaign_name || "—",
      status: campanhasStatus[cid] ?? c.status ?? "UNKNOWN",
      verba_gasta: c.verba ?? c.verba_gasta ?? 0,
      impressoes: c.impressoes || 0,
      alcance: c.alcance || 0,
      cliques: c.cliques || 0,
      cliques_whatsapp: c.cliques_wpp ?? c.cliques_whatsapp ?? 0,
      ctr: c.ctr || 0,
      cpl_estimado: c.cpl_estimado || 0,
      frequencia: c.frequencia || 0,
      cpc: c.cpc || 0,
    };
  });

  const cplColor = display.cpl > 0 && display.cpl < 15 ? "green" : display.cpl < 30 ? "amber" : "red";
  const cplHint  = display.cpl > 0 ? (display.cpl < 15 ? "✓ excelente" : display.cpl < 30 ? "aceitável — otimize" : "acima da meta") : "sem leads no período";

  return (
    <>
      {showAnalise && (
        <AnaliseModal analise={analise} loading={loadingAnalise} onClose={() => setShowAnalise(false)} />
      )}

      {editingCampanha && (
        <CampanhaEditModal
          campanha={editingCampanha}
          clienteId={id}
          onClose={() => setEditingCampanha(null)}
          onSaved={handleCampanhaSaved}
        />
      )}

      <div className="space-y-7">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-[10px] font-mono text-slate-600 hover:text-slate-400 transition-colors mb-3 group"
            >
              <ArrowLeft size={11} className="group-hover:-translate-x-0.5 transition-transform" />
              Voltar ao Dashboard
            </Link>
            <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-1">Cliente</p>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">{cliente.nome}</h1>
            <p className="text-[10px] font-mono text-slate-600 mt-1">{cliente.ad_account_id} · {periodoLabel}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              onClick={analisarComIA}
              className="flex items-center gap-2 px-4 py-2 bg-amber/10 border border-amber/25 text-amber text-xs font-mono rounded-xl hover:bg-amber/20 hover:border-amber/40 transition-all active:scale-95"
            >
              <Sparkles size={13} />
              Analisar com IA
            </button>
            <button
              onClick={syncCliente}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 bg-green/10 border border-green/20 text-green text-xs font-mono rounded-xl hover:bg-green/20 transition-all disabled:opacity-50 active:scale-95"
            >
              <RefreshCw size={13} className={syncing ? "animate-spin" : ""} />
              {syncing ? "Sincronizando..." : "Sync"}
            </button>
          </div>
        </div>

        {/* ── DatePicker ── */}
        <div className="bg-card border border-border rounded-2xl px-4 py-3 flex flex-col gap-2">
          <DateRangePicker onChange={handleDateChange} loading={loadingPeriodo} />
          {periodoErro && (
            <div className="flex items-center gap-2 mt-1">
              <AlertCircle size={11} className="text-amber flex-shrink-0" />
              <p className="text-[10px] font-mono text-amber/70">
                Não foi possível buscar dados do período — exibindo dados do último sync.
              </p>
            </div>
          )}
        </div>

        {/* ── Hero Metrics ── */}
        <div>
          <SectionDivider
            label="Números que importam"
            description="Os indicadores centrais de resultado para este cliente"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <MetricCard
              variant="hero"
              title="Verba Investida"
              value={`R$${display.verba.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
              subtitle={`em ${periodoLabel}`}
              color="amber"
              icon={DollarSign}
              tooltip="Total investido em anúncios neste período."
              delay={0}
            />
            <MetricCard
              variant="hero"
              title="Leads WhatsApp"
              value={fmtNum(display.cliques_wpp)}
              subtitle="cliques no botão de conversa"
              color="green"
              icon={MousePointerClick}
              tooltip="Pessoas que clicaram para iniciar conversa via WhatsApp."
              delay={80}
            />
            <MetricCard
              variant="hero"
              title="Custo por Lead"
              value={display.cpl > 0 ? `R$${display.cpl.toFixed(2)}` : "—"}
              subtitle={cplHint}
              color={cplColor}
              icon={TrendingUp}
              tooltip="Quanto custa gerar 1 contato. Meta para clínicas: abaixo de R$30."
              delay={160}
            />
            <MetricCard
              variant="hero"
              title="Campanhas"
              value={display.n_campanhas}
              subtitle="no período selecionado"
              color="default"
              icon={BarChart2}
              delay={240}
            />
          </div>
        </div>

        {/* ── Alcance & Engajamento ── */}
        <div>
          <SectionDivider
            label="Alcance & Engajamento"
            description="Desempenho dos anúncios desde a exibição até o clique"
          />
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <MetricCard
              title="Impressões"
              value={fmtNum(display.impressoes)}
              subtitle="exibições totais do anúncio"
              color="default"
              icon={Eye}
              tooltip="Vezes que o anúncio apareceu. Inclui re-exibições para a mesma pessoa."
              delay={0}
            />
            <MetricCard
              title="Alcance Real"
              value={display.alcance > 0 ? fmtNum(display.alcance) : "—"}
              subtitle={display.alcance > 0 ? "pessoas únicas alcançadas" : "selecione um período"}
              color="default"
              icon={Users}
              tooltip="Número de pessoas únicas que viram o anúncio ao menos uma vez."
              delay={80}
            />
            <MetricCard
              title="CTR — Taxa de Cliques"
              value={`${display.ctr.toFixed(2)}%`}
              subtitle={display.ctr >= 1.5 ? "✓ acima da meta (1.5%)" : display.ctr >= 0.8 ? "abaixo do ideal — revise" : "baixo — atenção"}
              color={display.ctr >= 1.5 ? "green" : display.ctr >= 0.8 ? "amber" : "red"}
              icon={Activity}
              tooltip="Percentual de quem viu o anúncio e clicou. Abaixo de 1% indica criativo fraco ou público errado."
              delay={160}
            />
            <MetricCard
              title="CPM — Custo por Mil"
              value={`R$${display.cpm.toFixed(2)}`}
              subtitle="para 1.000 exibições"
              color="default"
              icon={BarChart2}
              tooltip="Indicador de competitividade no leilão do Meta. CPM alto = público muito disputado."
              delay={240}
            />
            <MetricCard
              title="Mensagens Iniciadas"
              value={display.mensagens_enviadas > 0 ? fmtNum(display.mensagens_enviadas) : "—"}
              subtitle={display.mensagens_enviadas > 0 ? "conversas abertas" : "dado não disponível"}
              color={display.mensagens_enviadas > 0 ? "green" : "default"}
              icon={MousePointerClick}
              delay={320}
            />
            <MetricCard
              title="Custo por Mensagem"
              value={display.custo_por_mensagem > 0 ? `R$${display.custo_por_mensagem.toFixed(2)}` : "—"}
              subtitle="spend por conversa iniciada"
              color={display.custo_por_mensagem > 0 && display.custo_por_mensagem < 15 ? "green" : display.custo_por_mensagem < 30 ? "amber" : "default"}
              icon={TrendingUp}
              delay={400}
            />
          </div>
        </div>

        {/* ── Distribuição ── */}
        <div>
          <SectionDivider
            label="Distribuição & Saturação"
            description="Saúde da entrega — público saturado = CPL subindo"
          />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <MetricCard
              title="Frequência Média"
              value={display.frequencia > 0 ? `${display.frequencia.toFixed(1)}x` : "—"}
              subtitle={
                display.frequencia > 3 ? "⚠ saturação — expanda público" :
                display.frequencia > 2 ? "atenção — está subindo" :
                display.frequencia > 0 ? "✓ saudável (entre 1.5 e 3x)" : "selecione um período"
              }
              color={display.frequencia > 3 ? "red" : display.frequencia > 2 ? "amber" : "default"}
              icon={Activity}
              tooltip="Vezes que uma pessoa viu seu anúncio. Acima de 3x = sinal de saturação do público."
              delay={0}
            />
            <MetricCard
              title="Cliques Totais"
              value={display.cliques > 0 ? fmtNum(display.cliques) : "—"}
              subtitle="em todos os destinos do anúncio"
              color="default"
              icon={MousePointerClick}
              delay={80}
            />
            <MetricCard
              title="Conv. → WhatsApp"
              value={
                display.cliques_wpp > 0 && display.cliques > 0
                  ? `${((display.cliques_wpp / display.cliques) * 100).toFixed(1)}%`
                  : "—"
              }
              subtitle="dos cliques foram pro WPP"
              color="default"
              icon={TrendingUp}
              delay={160}
            />
            <MetricCard
              title="CPL Real"
              value="—"
              subtitle="conecte CRM para habilitar"
              color="default"
              icon={DollarSign}
              tooltip="Custo por lead convertido em consulta. Requer integração com sistema de agendamento."
              delay={240}
            />
          </div>
        </div>

        {/* ── Campanhas ── */}
        <div>
          <SectionDivider
            label={`Campanhas — ${periodoLabel}`}
            description={`${campanhasExibidas.length} campanha${campanhasExibidas.length !== 1 ? "s" : ""} encontrada${campanhasExibidas.length !== 1 ? "s" : ""} · pause, ative ou analise individualmente com IA`}
          />
          <div className="bg-card border border-border rounded-2xl p-5 mt-4">
            <CriativoTable
              campanhas={campanhasExibidas}
              onToggleStatus={toggleCampanhaStatus}
              onAnalisarCampanha={analisarCampanhaIndividual}
              onUpdateBudget={updateCampanhaBudget}
              onEditCampanha={setEditingCampanha}
            />
          </div>
        </div>

      </div>
    </>
  );
}
