import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useClientes } from "../hooks/useClientes";
import { useCampanhas } from "../hooks/useCampanhas";
import MetricCard from "../components/MetricCard";
import RevenueChart from "../components/RevenueChart";
import CriativoTable from "../components/CriativoTable";
import DateRangePicker, { getDefaultRange } from "../components/DateRangePicker";
import AnaliseModal from "../components/AnaliseModal";
import MuralDaVergonha from "../components/MuralDaVergonha";
import HallDosMelhores from "../components/HallDosMelhores";
import SaldoContas from "../components/SaldoContas";
import {
  DollarSign, Users, MousePointerClick, TrendingUp,
  ArrowRight, RefreshCw, Eye, Sparkles, BarChart2, Activity,
  AlertCircle, Wifi,
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

export default function Dashboard() {
  const { clientes, loading: loadClientes } = useClientes();
  const { campanhas } = useCampanhas(null, "campaign");
  const { campanhas: criativos } = useCampanhas(null, "ad");

  const [periodoData,    setPeriodoData]    = useState(null);
  const [loadingPeriodo, setLoadingPeriodo] = useState(false);
  const [periodoLabel,   setPeriodoLabel]   = useState("30 dias");
  const [periodoRange,   setPeriodoRange]   = useState(getDefaultRange(30));
  const [periodoErro,    setPeriodoErro]    = useState(false);

  const [saldos,        setSaldos]        = useState([]);
  const [loadingSaldos, setLoadingSaldos] = useState(false);

  const [showAnalise,    setShowAnalise]    = useState(false);
  const [analise,        setAnalise]        = useState(null);
  const [analiseModelo,  setAnaliseModelo]  = useState(null);
  const [loadingAnalise, setLoadingAnalise] = useState(false);

  const [syncing, setSyncing] = useState(false);
  const autoFetchedRef = useRef(false);

  const metricas = useMemo(() => {
    return clientes.map(cliente => {
      const camps       = campanhas.filter(c => c.cliente_id === cliente.id);
      const verba       = camps.reduce((s, c) => s + (c.verba_gasta || 0), 0);
      const impressoes  = camps.reduce((s, c) => s + (c.impressoes || 0), 0);
      const cliques_wpp = camps.reduce((s, c) => s + (c.cliques_whatsapp || 0), 0);
      const cliques     = camps.reduce((s, c) => s + (c.cliques || 0), 0);
      const cpl_estimado = cliques_wpp > 0 ? verba / cliques_wpp : 0;
      const ctr_medio   = impressoes > 0 ? (cliques / impressoes) * 100 : 0;
      const cpm         = impressoes > 0 ? (verba / impressoes) * 1000 : 0;
      return { ...cliente, verba, impressoes, cliques_wpp, cliques, cpl_estimado, cpl_real: 0, ctr_medio, cpm };
    });
  }, [clientes, campanhas]);

  const firestoreTotais = useMemo(() => ({
    verba:          metricas.reduce((s, m) => s + m.verba, 0),
    impressoes:     metricas.reduce((s, m) => s + m.impressoes, 0),
    alcance:        0,
    cliques_wpp:    metricas.reduce((s, m) => s + m.cliques_wpp, 0),
    cpl_medio:      metricas.length > 0 ? metricas.reduce((s, m) => s + m.cpl_estimado, 0) / metricas.length : 0,
    ctr_medio:      metricas.length > 0 ? metricas.reduce((s, m) => s + m.ctr_medio, 0) / metricas.length : 0,
    cpm_medio:      metricas.length > 0 ? metricas.reduce((s, m) => s + m.cpm, 0) / metricas.length : 0,
    frequencia_media: 0,
  }), [metricas]);

  const handleDateChange = useCallback(async (range, label) => {
    setPeriodoLabel(label);
    setPeriodoRange(range);
    if (!clientes.length) return;
    setLoadingPeriodo(true);
    setPeriodoErro(false);

    // Busca saldos em paralelo (não bloqueia o fetch de período)
    setLoadingSaldos(true);
    Promise.all(
      clientes.map(c =>
        axios.get(`${API}/meta/conta/saldo`, { params: { cliente_id: c.id }, timeout: 20000 })
          .then(r => ({ ...r.data, cliente_id: c.id }))
          .catch(() => null)
      )
    ).then(results => {
      setSaldos(results.filter(Boolean));
      setLoadingSaldos(false);
    });

    try {
      const results = await Promise.all(
        clientes.map(c =>
          axios.get(`${API}/insights/periodo`, {
            params: { cliente_id: c.id, since: range.since, until: range.until },
            timeout: 65000,
          }).then(r => ({ ...r.data, _cliente_id: c.id }))
        )
      );
      const agg = results.reduce((acc, r) => ({
        verba:              acc.verba + (r.verba || 0),
        impressoes:         acc.impressoes + (r.impressoes || 0),
        alcance:            acc.alcance + (r.alcance || 0),
        cliques_wpp:        acc.cliques_wpp + (r.cliques_wpp || 0),
        cliques:            acc.cliques + (r.cliques || 0),
        mensagens_enviadas: acc.mensagens_enviadas + (r.mensagens_enviadas || 0),
        frequencia_media:   Math.max(acc.frequencia_media, r.frequencia_media || 0),
        n_campanhas:        acc.n_campanhas + (r.n_campanhas || 0),
        // tagueia cada campanha com o cliente_id para lookup de nome nos halls
        campanhas: [
          ...acc.campanhas,
          ...(r.campanhas || []).map(c => ({ ...c, cliente_id: r._cliente_id })),
        ],
      }), { verba: 0, impressoes: 0, alcance: 0, cliques_wpp: 0, cliques: 0, mensagens_enviadas: 0, frequencia_media: 0, n_campanhas: 0, campanhas: [] });

      const cpl          = agg.cliques_wpp > 0 ? agg.verba / agg.cliques_wpp : 0;
      const ctr          = agg.impressoes > 0 ? (agg.cliques / agg.impressoes) * 100 : 0;
      const cpm          = agg.impressoes > 0 ? (agg.verba / agg.impressoes) * 1000 : 0;
      const custo_por_msg = agg.mensagens_enviadas > 0 ? agg.verba / agg.mensagens_enviadas : 0;
      setPeriodoData({ ...agg, cpl_estimado: cpl, ctr_medio: ctr, cpm_medio: cpm, custo_por_mensagem: custo_por_msg });
    } catch {
      setPeriodoErro(true);
    } finally {
      setLoadingPeriodo(false);
    }
  }, [clientes]);

  useEffect(() => {
    if (clientes.length > 0 && !autoFetchedRef.current) {
      autoFetchedRef.current = true;
      handleDateChange(getDefaultRange(30), "30 dias");
    }
  }, [clientes, handleDateChange]);

  const display = periodoData ? {
    verba:             periodoData.verba,
    impressoes:        periodoData.impressoes,
    alcance:           periodoData.alcance,
    cliques_wpp:       periodoData.cliques_wpp,
    mensagens_enviadas: periodoData.mensagens_enviadas || 0,
    custo_por_mensagem: periodoData.custo_por_mensagem || 0,
    cpl_medio:         periodoData.cpl_estimado,
    ctr_medio:         periodoData.ctr_medio,
    cpm_medio:         periodoData.cpm_medio,
    frequencia_media:  periodoData.frequencia_media,
    n_campanhas:       periodoData.n_campanhas,
  } : {
    ...firestoreTotais,
    mensagens_enviadas: 0,
    custo_por_mensagem: 0,
    n_campanhas: campanhas.length,
  };

  // Campanhas normalizadas para os halls — usa dados do período (com frequencia) quando disponível,
  // com fallback para Firestore após a próxima sync que já grava frequencia.
  const campanhasHalls = useMemo(() => {
    if (periodoData?.campanhas?.length) {
      return periodoData.campanhas.map(c => ({
        ...c,
        // normaliza nomes de campo: período usa 'verba' e 'cliques_wpp', Firestore usa os outros
        verba_gasta:      c.verba        ?? c.verba_gasta       ?? 0,
        cliques_whatsapp: c.cliques_wpp  ?? c.cliques_whatsapp  ?? 0,
        frequencia:       c.frequencia   ?? 0,
        ctr:              c.ctr          ?? 0,
        cpl_estimado:     c.cpl_estimado ?? 0,
      }));
    }
    return campanhas; // Firestore (frequencia disponível após próxima sync)
  }, [periodoData, campanhas]);

  const syncTodos = async () => {
    setSyncing(true);
    try { await axios.post(`${API}/sync/todos`); }
    finally { setSyncing(false); }
  };

  const analisarComIA = async () => {
    setShowAnalise(true);
    setLoadingAnalise(true);
    setAnalise(null);
    setAnaliseModelo(null);
    try {
      // Monta lista completa de campanhas com todas as métricas
      const campsForAI = (periodoData?.campanhas
        ? periodoData.campanhas.map(c => {
            const verba = c.verba ?? c.verba_gasta ?? 0;
            const imp   = c.impressoes ?? 0;
            const wpp   = c.cliques_wpp ?? c.cliques_whatsapp ?? 0;
            return {
              nome:        c.nome || "—",
              status:      c.status || "UNKNOWN",
              verba,
              impressoes:  imp,
              alcance:     c.alcance ?? 0,
              cliques:     c.cliques ?? 0,
              cliques_wpp: wpp,
              ctr:         c.ctr ?? 0,
              cpl_estimado: wpp > 0 ? verba / wpp : 0,
              frequencia:  c.frequencia ?? 0,
              cpm:         imp > 0 ? (verba / imp * 1000) : 0,
              cpc:         c.cpc ?? 0,
            };
          })
        : campanhas.map(c => ({
            nome: c.nome, status: c.status,
            verba: c.verba_gasta || 0, impressoes: c.impressoes || 0,
            alcance: c.alcance || 0, cliques: c.cliques || 0,
            cliques_wpp: c.cliques_whatsapp || 0, ctr: c.ctr || 0,
            cpl_estimado: c.cpl_estimado || 0, frequencia: c.frequencia || 0,
            cpm: c.impressoes > 0 ? (c.verba_gasta / c.impressoes * 1000) : 0,
            cpc: c.cpc || 0,
          }))
      ).slice(0, 30);

      const resp = await axios.post(`${API}/ai/analisar`, {
        cliente_nome: clientes.length === 1 ? clientes[0]?.nome : `${clientes.length} clientes`,
        periodo: periodoLabel,
        metricas: {
          verba:              display.verba,
          impressoes:         display.impressoes,
          alcance:            display.alcance,
          cliques_wpp:        display.cliques_wpp,
          mensagens_enviadas: display.mensagens_enviadas,
          ctr_medio:          display.ctr_medio,
          cpm:                display.cpm_medio,
          cpl_estimado:       display.cpl_medio,
          custo_por_mensagem: display.custo_por_mensagem,
          frequencia_media:   display.frequencia_media,
          n_campanhas:        display.n_campanhas,
        },
        campanhas: campsForAI,
      });
      setAnalise(resp.data.analise ?? resp.data.erro ?? "Erro ao gerar análise.");
      setAnaliseModelo(resp.data.modelo ?? null);
    } catch {
      setAnalise("Erro ao conectar com o serviço de IA.\n\nVerifique a configuração das APIs no servidor.");
    } finally {
      setLoadingAnalise(false);
    }
  };

  if (loadClientes) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="w-10 h-10 border border-green/20 rounded-xl flex items-center justify-center">
        <Wifi size={16} className="text-green/60 animate-pulse" />
      </div>
      <p className="text-slate-600 font-mono text-xs">Carregando dados do painel...</p>
    </div>
  );

  const fmtNum = n => n > 999999 ? `${(n / 1000000).toFixed(1)}M` : n > 999 ? `${(n / 1000).toFixed(1)}k` : String(Math.round(n));
  const cplColor = display.cpl_medio > 0 && display.cpl_medio < 15 ? "green" : display.cpl_medio < 30 ? "amber" : "red";
  const cplHint  = display.cpl_medio > 0 ? (display.cpl_medio < 15 ? "✓ excelente para clínicas" : display.cpl_medio < 30 ? "aceitável — otimize" : "acima da meta — revise") : "sem leads no período";

  return (
    <>
      {showAnalise && (
        <AnaliseModal
          analise={analise}
          loading={loadingAnalise}
          onClose={() => setShowAnalise(false)}
          title="Auditoria Completa — Meta Ads"
          modelo={analiseModelo}
          clienteNome={clientes.length === 1 ? clientes[0]?.nome : `${clientes.length} clientes`}
          periodo={periodoLabel}
        />
      )}

      <div className="space-y-7">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-1">
              Agência FEB Bandeirinha
            </p>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Dashboard</h1>
            <p className="text-xs font-mono text-slate-600 mt-0.5">
              Visão consolidada de todos os clientes · {periodoLabel}
            </p>
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
              onClick={syncTodos}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 bg-green/10 border border-green/20 text-green text-xs font-mono rounded-xl hover:bg-green/20 hover:border-green/35 transition-all disabled:opacity-50 active:scale-95"
            >
              <RefreshCw size={13} className={syncing ? "animate-spin" : ""} />
              {syncing ? "Sincronizando..." : "Sync Agora"}
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
                Não foi possível buscar dados do período — exibindo dados do último sync. Aguarde ~30s e tente novamente.
              </p>
            </div>
          )}
        </div>

        {/* ── Hero Metrics ── */}
        <div>
          <SectionDivider
            label="Números que importam"
            description="Os 3 indicadores centrais do seu ROI no período"
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <MetricCard
              variant="hero"
              title="Verba Investida"
              value={`R$${display.verba.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
              subtitle={`total gasto em ${periodoLabel}`}
              color="amber"
              icon={DollarSign}
              tooltip="Total investido em anúncios no período selecionado. Inclui todos os clientes ativos."
              delay={0}
            />
            <MetricCard
              variant="hero"
              title="Leads WhatsApp"
              value={fmtNum(display.cliques_wpp)}
              subtitle="pessoas que clicaram em conversar"
              color="green"
              icon={MousePointerClick}
              tooltip="Cliques no botão de WhatsApp dos anúncios. Representa intenção real de contato."
              delay={80}
            />
            <MetricCard
              variant="hero"
              title="Custo por Lead"
              value={display.cpl_medio > 0 ? `R$${display.cpl_medio.toFixed(2)}` : "—"}
              subtitle={cplHint}
              color={cplColor}
              icon={TrendingUp}
              tooltip="Quanto custa gerar 1 contato via WhatsApp. Meta para clínicas de saúde: abaixo de R$30."
              delay={160}
            />
          </div>
        </div>

        {/* ── Alcance & Funil ── */}
        <div>
          <SectionDivider
            label="Alcance & Funil"
            description="Como o seu anúncio está performando desde a exibição até o clique"
          />
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <MetricCard
              title="Impressões"
              value={fmtNum(display.impressoes)}
              subtitle="vezes que o anúncio foi exibido"
              color="default"
              icon={Eye}
              tooltip="Número total de vezes que o anúncio apareceu na tela do usuário — inclui repetições."
              delay={0}
            />
            <MetricCard
              title="Alcance Real"
              value={display.alcance > 0 ? fmtNum(display.alcance) : "—"}
              subtitle={display.alcance > 0 ? "pessoas únicas impactadas" : "selecione um período"}
              color="default"
              icon={Users}
              tooltip="Pessoas únicas que viram o anúncio. Diferente de impressões: cada pessoa contada uma vez."
              delay={80}
            />
            <MetricCard
              title="Taxa de Cliques (CTR)"
              value={`${display.ctr_medio.toFixed(2)}%`}
              subtitle={display.ctr_medio >= 1.5 ? "✓ acima da meta de 1.5%" : display.ctr_medio >= 0.8 ? "abaixo do ideal — revise criativos" : "baixo — atenção urgente"}
              color={display.ctr_medio >= 1.5 ? "green" : display.ctr_medio >= 0.8 ? "amber" : "red"}
              icon={Activity}
              tooltip="Percentual de pessoas que clicaram no anúncio. Meta saudável para saúde: acima de 1.5%."
              delay={160}
            />
            <MetricCard
              title="CPM — Custo por Mil"
              value={`R$${display.cpm_medio.toFixed(2)}`}
              subtitle="custo para alcançar 1.000 pessoas"
              color="default"
              icon={BarChart2}
              tooltip="Quanto você paga para exibir o anúncio 1.000 vezes. Indica a competitividade do leilão."
              delay={240}
            />
            <MetricCard
              title="Mensagens Iniciadas"
              value={display.mensagens_enviadas > 0 ? fmtNum(display.mensagens_enviadas) : "—"}
              subtitle={display.mensagens_enviadas > 0 ? "conversas abertas via anúncio" : "dado não disponível no período"}
              color={display.mensagens_enviadas > 0 ? "green" : "default"}
              icon={MousePointerClick}
              tooltip="Quantas pessoas enviaram mensagem diretamente pelo botão do anúncio."
              delay={320}
            />
            <MetricCard
              title="Custo por Mensagem"
              value={display.custo_por_mensagem > 0 ? `R$${display.custo_por_mensagem.toFixed(2)}` : "—"}
              subtitle={display.custo_por_mensagem > 0 ? "por conversa iniciada" : "sem dados de mensagem"}
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
            description="Saúde da entrega — evite saturar o público"
          />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <MetricCard
              title="Frequência Média"
              value={display.frequencia_media > 0 ? display.frequencia_media.toFixed(1) + "x" : "—"}
              subtitle={
                display.frequencia_media > 3 ? "⚠ saturação — expanda o público" :
                display.frequencia_media > 2 ? "fique de olho — está subindo" :
                display.frequencia_media > 0 ? "✓ saudável — entre 1.5x e 3x" : "selecione um período"
              }
              color={display.frequencia_media > 3 ? "red" : display.frequencia_media > 2 ? "amber" : "default"}
              icon={Activity}
              tooltip="Quantas vezes, em média, uma pessoa viu seu anúncio. Acima de 3x = risco de saturação e CPL subindo."
              delay={0}
            />
            <MetricCard
              title="Campanhas no Período"
              value={display.n_campanhas}
              subtitle="campanhas com dados retornados"
              color="default"
              icon={BarChart2}
              delay={80}
            />
            <MetricCard
              title="Cliques Totais"
              value={periodoData ? fmtNum(periodoData.cliques) : "—"}
              subtitle="em todos os links do anúncio"
              color="default"
              icon={MousePointerClick}
              delay={160}
            />
            <MetricCard
              title="Conv. → WhatsApp"
              value={
                display.cliques_wpp > 0 && periodoData?.cliques > 0
                  ? `${((display.cliques_wpp / periodoData.cliques) * 100).toFixed(1)}%`
                  : "—"
              }
              subtitle="dos cliques viram conversa"
              color={
                display.cliques_wpp > 0 && periodoData?.cliques > 0 &&
                (display.cliques_wpp / periodoData.cliques) > 0.5 ? "green" : "default"
              }
              icon={TrendingUp}
              tooltip="Taxa de conversão: quantos dos cliques no anúncio foram direto para o WhatsApp."
              delay={240}
            />
          </div>
        </div>

        {/* ── Chart ── */}
        <RevenueChart data={metricas.map(m => ({
          nome: m.nome.split(" ")[0],
          cpl_real: m.cpl_real,
          cpl_estimado: parseFloat(m.cpl_estimado.toFixed(2)),
        }))} />

        {/* ── Hall dos Melhores + Mural da Vergonha ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

          {/* Hall dos Melhores */}
          <div>
            <div className="flex items-end gap-3 mb-0">
              <div>
                <p className="text-[10px] font-mono text-green/50 uppercase tracking-widest mb-0.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green/60 animate-pulse-dot inline-block" />
                  Hall dos Melhores
                </p>
                <p className="text-[10px] font-mono text-slate-700">
                  Campanhas que estão mandando bem. Mérito real, elogio exagerado.
                </p>
              </div>
              <div className="flex-1 h-px bg-green/10 mb-1" />
            </div>
            <HallDosMelhores campanhas={campanhasHalls} clientes={clientes} />
          </div>

          {/* Mural da Vergonha */}
          <div>
            <div className="flex items-end gap-3 mb-0">
              <div>
                <p className="text-[10px] font-mono text-red/50 uppercase tracking-widest mb-0.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red/60 animate-pulse inline-block" />
                  Mural da Vergonha
                </p>
                <p className="text-[10px] font-mono text-slate-700">
                  Campanhas com métricas vergonhosas. Sem julgamento. Só dados.
                </p>
              </div>
              <div className="flex-1 h-px bg-red/10 mb-1" />
            </div>
            <MuralDaVergonha campanhas={campanhasHalls} clientes={clientes} />
          </div>

        </div>

        {/* ── Fôlego das Contas ── */}
        {(loadingSaldos || saldos.length > 0) && (
          <div>
            <SectionDivider
              label="Fôlego das Contas"
              description="Saldo prepago restante e estimativa de duração com base no ritmo atual de gasto"
            />
            <div className="mt-4">
              <SaldoContas
                saldos={saldos}
                loading={loadingSaldos}
                periodoData={periodoData}
                periodoRange={periodoRange}
              />
            </div>
          </div>
        )}

        {/* ── Por Cliente ── */}
        <div>
          <SectionDivider
            label="Por Cliente"
            description="Clique para ver campanhas, criativos e análise individual"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
            {metricas.map((m, i) => {
              const perf = m.cpl_estimado > 0 && m.cpl_estimado < 30 ? "green" : m.cpl_estimado < 50 ? "amber" : "red";
              const perfLabel = m.cpl_estimado > 0 && m.cpl_estimado < 30 ? "Bom desempenho" : m.cpl_estimado < 50 ? "Atenção" : "Precisa otimizar";
              return (
                <Link
                  key={m.id}
                  to={`/cliente/${m.id}`}
                  className={clsx(
                    "block bg-card border border-border rounded-2xl p-5 group",
                    "hover:border-green/25 hover:shadow-[0_0_24px_rgba(34,197,94,0.04)]",
                    "transition-all animate-fade-up",
                  )}
                  style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
                >
                  {/* Client header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={clsx(
                          "w-1.5 h-1.5 rounded-full flex-shrink-0",
                          perf === "green" ? "bg-green animate-pulse-dot" :
                          perf === "amber" ? "bg-amber" : "bg-red",
                        )} />
                        <span className={clsx(
                          "text-[9px] font-mono uppercase tracking-widest",
                          perf === "green" ? "text-green/70" : perf === "amber" ? "text-amber/70" : "text-red/70",
                        )}>
                          {perfLabel}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-100 text-sm truncate">{m.nome}</p>
                      <p className="text-[10px] font-mono text-slate-600 mt-0.5 truncate">{m.ad_account_id}</p>
                    </div>
                    <ArrowRight
                      size={14}
                      className="text-slate-700 group-hover:text-green group-hover:translate-x-0.5 transition-all mt-1 flex-shrink-0"
                    />
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-border mb-4" />

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest mb-1">Verba</p>
                      <p className="text-sm font-mono text-amber font-bold tabular-nums">
                        R${m.verba.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest mb-1">Leads WPP</p>
                      <p className="text-sm font-mono text-green font-bold">{m.cliques_wpp}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest mb-1">CPL</p>
                      <p className={clsx(
                        "text-sm font-mono font-bold tabular-nums",
                        perf === "green" ? "text-green" : perf === "amber" ? "text-amber" : "text-red",
                      )}>
                        {m.cpl_estimado > 0 ? `R$${m.cpl_estimado.toFixed(2)}` : "—"}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}

            {metricas.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-10 h-10 bg-border/30 rounded-xl flex items-center justify-center">
                  <Users size={16} className="text-slate-700" />
                </div>
                <p className="text-slate-600 font-mono text-xs text-center">
                  Nenhum cliente cadastrado ainda.<br />
                  <span className="text-slate-700">Adicione clientes via painel admin.</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Top Criativos ── */}
        <div>
          <SectionDivider
            label="Top Criativos"
            description="Os anúncios com maior volume de dados em todos os clientes"
          />
          <div className="bg-card border border-border rounded-2xl p-5 mt-4">
            <CriativoTable campanhas={criativos.slice(0, 10)} />
          </div>
        </div>

      </div>
    </>
  );
}
