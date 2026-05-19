import { clsx } from "clsx";
import { Play, Pause, Loader, BrainCircuit, Pencil, Check, X, DollarSign, Flame } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import AnaliseModal from "./AnaliseModal";

/* ── Saturation helpers ───────────────────────────────────────────────────── */

/**
 * Calcula o índice de saturação de um criativo baseado em frequência + CTR.
 * Retorna { nivel, score 0-100, label, hint, action }
 */
export function getSaturation(campanha) {
  const freq  = campanha.frequencia  || 0;
  const ctr   = campanha.ctr         || 0;
  const verba = campanha.verba_gasta || 0;

  if (verba < 15 || freq === 0) {
    return { nivel: "unknown", score: 0, label: "—", hint: "Dados insuficientes", action: null };
  }

  // Ambos ruins → saturação clássica (frequência alta + CTR colapsado)
  if (freq > 3.5 && ctr > 0 && ctr < 0.8) {
    return {
      nivel: "critical", score: 100,
      label: "Saturado",
      hint: `Freq. ${freq.toFixed(1)}x + CTR ${ctr.toFixed(2)}% → criativo esgotado`,
      action: "PAUSAR",
    };
  }
  // Frequência sozinha muito alta
  if (freq > 4.0) {
    return {
      nivel: "critical", score: 90,
      label: "Freq. crítica",
      hint: `Freq. ${freq.toFixed(1)}x — público vendo muitas vezes sem clicar`,
      action: "REVISAR",
    };
  }
  // CTR muito baixo com verba significativa
  if (verba > 50 && ctr > 0 && ctr < 0.5) {
    return {
      nivel: "critical", score: 85,
      label: "CTR crítico",
      hint: `CTR ${ctr.toFixed(2)}% — criativo fraco, troque o anúncio`,
      action: "OTIMIZAR",
    };
  }
  // Atenção: frequência subindo OU CTR abaixo do mínimo
  if (freq > 2.5 || (ctr > 0 && ctr < 0.8)) {
    return {
      nivel: "warning", score: 60,
      label: freq > 2.5 ? "Freq. alta" : "CTR baixo",
      hint: `Freq. ${freq.toFixed(1)}x, CTR ${ctr.toFixed(2)}%`,
      action: null,
    };
  }
  // Monitorar: próximo dos limites
  if (freq > 1.8 || (ctr > 0 && ctr < 1.2)) {
    return {
      nivel: "watch", score: 30,
      label: "Monitorar",
      hint: `Freq. ${freq.toFixed(1)}x, CTR ${ctr.toFixed(2)}%`,
      action: null,
    };
  }
  return {
    nivel: "ok", score: 8,
    label: "Saudável",
    hint: `Freq. ${freq.toFixed(1)}x, CTR ${ctr.toFixed(2)}%`,
    action: null,
  };
}

/** Barra de termômetro visual por campanha */
function SaturationBar({ campanha }) {
  const sat = getSaturation(campanha);

  const barColor = {
    critical: "bg-red",
    warning:  "bg-amber",
    watch:    "bg-amber/40",
    ok:       "bg-green",
    unknown:  "bg-slate-700",
  }[sat.nivel] ?? "bg-slate-700";

  const textColor = {
    critical: "text-red",
    warning:  "text-amber",
    watch:    "text-slate-500",
    ok:       "text-green/70",
    unknown:  "text-slate-700",
  }[sat.nivel] ?? "text-slate-700";

  return (
    <div className="w-[72px]" title={sat.hint}>
      <div className="w-full h-1.5 bg-border rounded-full overflow-hidden mb-1">
        <div
          className={clsx(
            "h-full rounded-full transition-all duration-500",
            barColor,
            sat.nivel === "critical" && "animate-pulse",
          )}
          style={{ width: `${sat.score}%` }}
        />
      </div>
      <p className={clsx("text-[9px] font-mono truncate", textColor)}>
        {sat.nivel === "critical" && <Flame size={8} className="inline mr-0.5 mb-0.5" />}
        {sat.label}
      </p>
    </div>
  );
}

const STATUS = {
  ACTIVE:   { dot: "bg-green animate-pulse-dot", badge: "text-green bg-green/10 border-green/20",  label: "ATIVO",    border: "border-l-green/40" },
  PAUSED:   { dot: "bg-amber",                   badge: "text-amber bg-amber/10 border-amber/20",   label: "PAUSADO",  border: "border-l-amber/30" },
  ARCHIVED: { dot: "bg-slate-600",               badge: "text-slate-500 bg-slate-500/10 border-slate-500/20", label: "ARQUIVADO", border: "border-l-slate-700" },
  UNKNOWN:  { dot: "bg-slate-700",               badge: "text-slate-600 bg-transparent border-slate-700/50",  label: "—",        border: "border-l-border" },
};

/* ── Ticker messages for bad campaigns ───────────────────────────────────── */

const TICKER_CRITICAL = [
  "🔴 CRIATIVO SATURADO — pode pausar que eu já não aguento mais",
  "💸 dinheiro sendo incinerado em tempo real, parabéns pela coragem",
  "📉 o público decorou esse anúncio na memória e ainda não clicou",
  "🤡 CTR tão baixo que até outdoor em branco performa melhor",
  "😱 o cliente vai ligar perguntando por que o resultado caiu, boa sorte com a resposta",
  "🔥 criativo esgotado, público cansado, verba evaporando — tudo bem?",
  "💀 essa campanha tá funcionando igual carro sem combustível: muito barulho, nenhum destino",
  "🧛 mais um dia rodando isso e o orçamento vai pedir demissão",
  "📢 ALERTA DE GESTOR CORAJOSO: ainda não pausou, hein",
  "🚨 frequência nas alturas — eles te odeiam e você sabe disso",
  "😵 o público já viu esse anúncio tantas vezes que sabe o texto de cor",
  "🪦 aqui jaz o CPL do cliente — morto por negligência",
  "🎪 que espetáculo de campanha — só não no sentido bom",
  "🤦 esse anúncio tá mais cansado do que você numa segunda-feira",
  "⚰️ R.I.P. budget — pausar teria sido tão simples",
];

const TICKER_WARNING = [
  "⚠️ oi, só passando pra avisar que essa campanha tá começando a dar bode",
  "👀 frequência subindo, CTR descendo — clássico sinal de que vai piorar",
  "😬 não tá péssimo ainda, mas tá claramente a caminho",
  "📊 o benchmark de CTR fica envergonhado quando olha pra essa campanha",
  "🤔 'vou deixar mais um pouco' — você, provavelmente, agora mesmo",
  "🌡️ termômetro de criativo subindo, vai chegar no crítico e aí lembra de mim",
  "😏 tá bem... mas por quanto tempo? tick tock",
  "🎯 a frequência tá mandando um recado: o público já conhece demais esse anúncio",
  "🐢 campanha desacelerando — não por conta própria",
  "🍿 assistindo o CTR cair em câmera lenta — interessante escolha de gestão",
  "📉 cada dia que passa esse anúncio convence menos gente. coincidência? não.",
  "🙃 tudo bem, tudo ótimo, campanha ótima, números... menos ótimos",
];

const SEP = "   ⬥   ";

function buildTickerText(msgs) {
  return msgs.join(SEP) + SEP;
}

const TICKER_WATCH = [
  "👀 de olhinho nessa campanha... não faz bobagem",
  "📊 os números tão... okays. por enquanto",
  "🧐 tá monitorada. não tire os olhos por muito tempo",
  "🫣 não tô dizendo que tá ruim... mas também não tô dizendo que tá ótimo",
  "⏱️ dando tempo pra essa campanha se redimir. o relógio corre",
  "🤨 'tá no limite' não é o mesmo que 'tá bem'",
  "🔔 lembrete suave: essa aqui merece atenção, não abandono",
  "📌 marcada pra acompanhamento — você já viu os números hoje?",
  "🙃 não tá queimando dinheiro ainda. ênfase no 'ainda'",
  "🐢 indo devagar... lento demais pra ser ignorada",
  "📡 sinal fraco detectado. monitore antes de chegar no vermelho",
  "🎯 atenção moderada requerida — não é drama, é cuidado",
  "🔍 CTR um pouquinho tímido... nada urgente. ainda.",
  "🫥 invisível não significa inexistente — olha pra ela de vez em quando",
  "📉 não é alarme, é só um lembrete de que isso pode escalar",
];

/** Ticker que rola horizontalmente abaixo de campanhas com métricas ruins ou em monitoramento */
function TickerBad({ campanha }) {
  const sat = getSaturation(campanha);
  const isCritical = sat.nivel === "critical";
  const isWarning  = sat.nivel === "warning";
  const isWatch    = sat.nivel === "watch";

  // Só aparece para campanhas ACTIVE com atenção necessária
  if (campanha.status !== "ACTIVE" || (!isCritical && !isWarning && !isWatch)) return null;

  const msgs     = isCritical ? TICKER_CRITICAL : isWarning ? TICKER_WARNING : TICKER_WATCH;
  const text     = buildTickerText(msgs);
  const bgClass  = isCritical ? "bg-red/[0.06] border-red/20"
                 : isWarning  ? "bg-amber/[0.05] border-amber/15"
                 :              "bg-violet/[0.04] border-violet/10";
  const txtClass = isCritical ? "text-red/60"
                 : isWarning  ? "text-amber/50"
                 :              "text-violet/40";
  const animCls  = isCritical ? "animate-ticker"
                 : isWarning  ? "animate-ticker-slow"
                 :              "animate-ticker-vslow";

  return (
    <div className={`overflow-hidden border-t ${bgClass} rounded-b-xl`}>
      <div className={`flex whitespace-nowrap ${animCls}`}>
        {/* duplicado para o loop seamless */}
        <span className={`text-[9px] font-mono tracking-wide py-1 px-4 ${txtClass} flex-shrink-0`}>
          {text}{text}
        </span>
      </div>
    </div>
  );
}

const MSGS_SAUDAVEL = [
  "Não mexe nessa campanha seu merdinha 🫵",
  "Tá indo bem demais pra você bagunçar. Sai daqui! 😤",
  "CPL bom, leads chegando. Vai pausar por quê? Ego? 🧠",
  "Essa campanha tá te amando. Vai trair ela assim? 💔",
  "Se você pausar isso eu conto pro cliente. 📢",
  "Dinheiro entrando. Você com vontade de apertar botão. Clássico. 🤡",
  "Essa aqui roda sozinha. Você só atrapalha. 🚀",
  "Para. Pensa. Tira a mão daí. 🛑",
  "ALERTA: mão coçando sem motivo detectada ⚠️",
  "Gestor(a) de tráfego ou sabotador(a)? Escolha um. 🎯",
  "Essa campanha nunca fez nada de errado pra você. 🥺",
  "Vai mexer no que tá bom? Típico. 💀",
  "A Meta tá feliz. O cliente tá feliz. Só você não. Por quê? 😭",
  "Campanha = impressora de dinheiro. Você = mão travessa. 🖨️💸",
  "Isso aqui é zona proibida. Passa o mouse e vai embora. 🚧",
  "Se pausar, você vai ter que explicar pro cliente. Cuidado. 😬",
];

const MSGS_REATIVAR = [
  "PARA. Essa campanha foi pausada por um motivo. 🚨",
  "Você quer reativar... isso? Sério? 🤡",
  "Reativar CPL alto = queimar verba = cliente furioso. Boa sorte. 💸",
  "Ei. Pensa bem antes de apertar esse botão. Por favor. 🙏",
  "O público já odiava esse anúncio antes de pausar. Nada mudou. 😬",
  "Vai reativar? Tudo bem. Mas não diz que não foi avisado(a). ⚠️",
  "Você tá de brincadeira, né? Não tá? 😰",
  "O cliente não sabe que você tá prestes a fazer isso, né? 🤫",
  "Antes de clicar, respira fundo. Conta até 10. Agora desiste. 🛑",
  "Esse botão revive campanha morta. Algumas coisas deveriam ficar mortas. 💀",
  "CTR no chão, verba alta, cliente estressado — e você quer ligar de novo? 😵",
  "Reativar isso é basicamente pedir pro cliente te ligar às 23h. 📱",
  "A campanha tá pausada, o orçamento agradece. Não arruíne isso. 🌸",
  "Ok, mas quando der errado (e vai), lembra que você escolheu isso. 🫵",
  "Gestor que reativa campanha ruim aprende na hora. Na hora mais cara. 🔥",
  "Eu, o sistema e o cliente vamos te julgar. Todos. Simultaneamente. 👀",
  "EI! OI! ALÔÔ! Essa campanha foi PAUSADA por MOTIVO. Para aí! 📢",
  "Salvando verba ou sabotando o cliente? Porque parece a segunda opção. 🤨",
];

function ToggleBtn({ status, campaignId, onToggle, satNivel }) {
  const [loading,  setLoading]  = useState(false);
  const [showTip,  setShowTip]  = useState(false);
  const [tipMsg,   setTipMsg]   = useState("");
  const [tipKind,  setTipKind]  = useState("ok"); // "ok" | "reativar"

  if (!campaignId || status === "ARCHIVED" || status === "UNKNOWN") return null;
  const isPaused    = status === "PAUSED";
  const isHealthy   = !isPaused && (satNivel === "ok" || satNivel === "watch");
  const isBadPaused = isPaused  && (satNivel === "warning" || satNivel === "critical");

  const handleClick = async () => {
    setLoading(true);
    try { await onToggle(campaignId, isPaused ? "ACTIVE" : "PAUSED"); }
    finally { setLoading(false); }
  };

  const handleMouseEnter = () => {
    if (isHealthy) {
      setTipKind("ok");
      setTipMsg(MSGS_SAUDAVEL[Math.floor(Math.random() * MSGS_SAUDAVEL.length)]);
      setShowTip(true);
    } else if (isBadPaused) {
      setTipKind("reativar");
      setTipMsg(MSGS_REATIVAR[Math.floor(Math.random() * MSGS_REATIVAR.length)]);
      setShowTip(true);
    }
  };

  // Estilos do balão por tipo
  const tipBg     = tipKind === "reativar" ? "bg-[#1e0f0f]"        : "bg-[#1a1a2e]";
  const tipBorder = tipKind === "reativar" ? "border-red/40"        : "border-violet/30";
  const tipText   = tipKind === "reativar" ? "text-red/90"          : "text-slate-100";
  const tipArrowB = tipKind === "reativar" ? "border-red/40"        : "border-violet/30";
  const tipArrowC = tipKind === "reativar" ? "bg-[#1e0f0f]"        : "bg-[#1a1a2e]";

  return (
    <div className="relative" onMouseLeave={() => setShowTip(false)}>
      {showTip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 z-50 pointer-events-none animate-fade-up">
          <div className={`${tipBg} border ${tipBorder} rounded-xl px-3 py-2 shadow-xl shadow-black/50 max-w-[260px]`}>
            <p className={`text-[11px] font-mono ${tipText} leading-snug`}>{tipMsg}</p>
          </div>
          {/* arrow */}
          <div className={`mx-auto w-2.5 h-2.5 ${tipArrowC} border-r border-b ${tipArrowB} rotate-45 -mt-[5px]`} />
        </div>
      )}
      <button
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        disabled={loading}
        title={isPaused ? "Ativar campanha" : "Pausar campanha"}
        className={clsx(
          "flex items-center justify-center w-8 h-8 rounded-xl border transition-all active:scale-95",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          isPaused
            ? "border-green/30 text-green hover:bg-green/10 hover:border-green/50"
            : "border-amber/30 text-amber hover:bg-amber/10 hover:border-amber/50",
        )}
      >
        {loading
          ? <Loader size={12} className="animate-spin" />
          : isPaused ? <Play size={12} fill="currentColor" /> : <Pause size={12} fill="currentColor" />
        }
      </button>
    </div>
  );
}

function BudgetEditor({ campaignId, currentBudget, onUpdateBudget }) {
  const [editing, setEditing]   = useState(false);
  const [value,   setValue]     = useState("");
  const [loading, setLoading]   = useState(false);
  const [saved,   setSaved]     = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  if (!campaignId || !onUpdateBudget) return null;

  const startEdit = () => {
    setValue(currentBudget > 0 ? currentBudget.toFixed(2) : "");
    setEditing(true);
  };

  const cancel = () => {
    setEditing(false);
    setValue("");
  };

  const save = async () => {
    const num = parseFloat(value.replace(",", "."));
    if (!num || num <= 0) return cancel();
    setLoading(true);
    try {
      await onUpdateBudget(campaignId, num);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // silently fail — parent handles alerts
    } finally {
      setLoading(false);
      setEditing(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter") save();
    if (e.key === "Escape") cancel();
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-[10px] font-mono text-slate-500">R$</span>
        <input
          ref={inputRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKey}
          placeholder="0.00"
          className="w-16 bg-surface border border-green/30 rounded-lg px-1.5 py-0.5 text-xs font-mono text-green focus:outline-none focus:border-green/60 text-center"
        />
        <button
          onClick={save}
          disabled={loading}
          className="w-6 h-6 flex items-center justify-center rounded-lg bg-green/10 border border-green/30 text-green hover:bg-green/20 transition-all disabled:opacity-40"
        >
          {loading ? <Loader size={10} className="animate-spin" /> : <Check size={10} />}
        </button>
        <button
          onClick={cancel}
          className="w-6 h-6 flex items-center justify-center rounded-lg bg-border/40 border border-border text-slate-500 hover:text-slate-200 transition-all"
        >
          <X size={10} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={startEdit}
      title="Editar orçamento diário"
      className={clsx(
        "flex items-center justify-center w-8 h-8 rounded-xl border transition-all active:scale-95",
        saved
          ? "border-green/40 text-green bg-green/10"
          : "border-border text-slate-600 hover:text-cyan hover:border-cyan/30 hover:bg-cyan/[0.06]",
      )}
    >
      {saved ? <Check size={12} /> : <DollarSign size={12} />}
    </button>
  );
}

function CtrBar({ ctr }) {
  const pct = Math.min((ctr / 4) * 100, 100); // 4% = 100%
  const color = ctr >= 1.5 ? "bg-green" : ctr >= 0.8 ? "bg-amber" : "bg-red";
  return (
    <div className="flex items-center gap-2">
      <div className="w-14 h-1 bg-border rounded-full overflow-hidden">
        <div className={clsx("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className={clsx(
        "text-[10px] font-mono font-bold tabular-nums",
        ctr >= 1.5 ? "text-green" : ctr >= 0.8 ? "text-amber" : "text-slate-500",
      )}>
        {ctr.toFixed(2)}%
      </span>
    </div>
  );
}

export default function CriativoTable({ campanhas = [], onToggleStatus, onAnalisarCampanha, onUpdateBudget, onEditCampanha, clienteNome = null, periodo = null }) {
  const [analiseState, setAnaliseState] = useState({ show: false, loading: false, analise: null, modelo: null, campanhaNome: null });

  const handleAnalisar = async (campanha) => {
    const sat = getSaturation(campanha);
    setAnaliseState({ show: true, loading: true, analise: null, modelo: null, campanhaNome: campanha.nome });
    try {
      const resultado = await onAnalisarCampanha(campanha, sat);
      // Suporta tanto string simples (legado) quanto { analise, modelo }
      if (resultado && typeof resultado === "object") {
        setAnaliseState(prev => ({ ...prev, loading: false, analise: resultado.analise ?? "Sem análise.", modelo: resultado.modelo ?? null }));
      } else {
        setAnaliseState(prev => ({ ...prev, loading: false, analise: resultado }));
      }
    } catch {
      setAnaliseState(prev => ({ ...prev, loading: false, analise: "Erro ao conectar com o serviço de IA." }));
    }
  };

  if (!campanhas.length) return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-10 h-10 rounded-xl bg-border/50 flex items-center justify-center">
        <BrainCircuit size={18} className="text-slate-700" />
      </div>
      <p className="text-slate-600 font-mono text-xs text-center">
        Nenhuma campanha encontrada no período.<br />
        <span className="text-slate-700">Tente selecionar outro intervalo de datas.</span>
      </p>
    </div>
  );

  const hasToggle  = typeof onToggleStatus    === "function";
  const hasAnalise = typeof onAnalisarCampanha === "function";
  const hasBudget  = typeof onUpdateBudget     === "function";
  const hasEdit    = typeof onEditCampanha     === "function";

  const actionsCount = [hasToggle, hasAnalise, hasBudget, hasEdit].filter(Boolean).length;

  return (
    <>
      {analiseState.show && (
        <AnaliseModal
          analise={analiseState.analise}
          loading={analiseState.loading}
          title="Auditoria de Campanha — IA"
          subtitle={analiseState.campanhaNome}
          modelo={analiseState.modelo}
          clienteNome={clienteNome}
          periodo={periodo}
          onClose={() => setAnaliseState(prev => ({ ...prev, show: false }))}
        />
      )}

      {/* Header row */}
      <div className="flex items-center px-4 pb-2 mb-1 border-b border-border">
        <div className="w-2.5 mr-3 flex-shrink-0" />
        <p className="flex-1 text-[10px] font-mono text-slate-600 uppercase tracking-widest">Campanha</p>
        <div className="flex items-center gap-6 flex-shrink-0">
          <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest w-16 text-right hidden md:block">Verba</p>
          <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest w-14 text-right">Leads</p>
          <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest w-28 hidden lg:block">CTR</p>
          <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest w-[72px] hidden lg:block">Saturação</p>
          <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest w-16 text-right hidden lg:block">CPL</p>
          {actionsCount > 0 && (
            <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest text-right"
               style={{ width: `${actionsCount * 36 + (actionsCount - 1) * 6}px` }}>
              Ações
            </p>
          )}
        </div>
      </div>

      {/* Campaign rows */}
      <div className="space-y-1">
        {campanhas.map((ad, i) => {
          const s = STATUS[ad.status] || STATUS.UNKNOWN;
          const cpl = ad.cpl_estimado || 0;
          const cplColor = cpl > 0 && cpl < 15 ? "text-green" : cpl < 30 ? "text-amber" : cpl > 0 ? "text-red" : "text-slate-600";

          return (
            <div
              key={ad.id || i}
              className="animate-fade-up"
              style={{ animationDelay: `${i * 40}ms`, animationFillMode: "both" }}
            >
            <div
              onClick={hasEdit ? () => onEditCampanha(ad) : undefined}
              className={clsx(
                "flex items-center gap-3 px-4 py-3.5 border border-l-2 transition-all group",
                "hover:bg-white/[0.018]",
                "border-border",
                s.border,
                hasEdit && "cursor-pointer",
                // rounded: se tem ticker abaixo, só arredonda o topo
                (ad.status === "ACTIVE" && ["critical","warning","watch"].includes(getSaturation(ad).nivel))
                  ? "rounded-t-xl"
                  : "rounded-xl",
              )}
            >
              {/* Status dot */}
              <div className={clsx("w-1.5 h-1.5 rounded-full flex-shrink-0", s.dot)} />

              {/* Campaign name + status badge */}
              <div className="flex-1 min-w-0 flex items-center gap-2">
                <p className="text-sm font-mono text-slate-200 truncate">{ad.nome || "—"}</p>
                <span className={clsx(
                  "hidden sm:inline text-[9px] font-mono px-1.5 py-0.5 rounded border flex-shrink-0",
                  s.badge,
                )}>
                  {s.label}
                </span>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 flex-shrink-0">
                {/* Verba */}
                <div className="text-right w-16 hidden md:block">
                  <p className="text-xs font-mono text-amber font-bold tabular-nums">
                    R${(ad.verba_gasta || 0).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                </div>

                {/* Leads WPP */}
                <div className="text-right w-14">
                  <p className={clsx(
                    "text-xs font-mono font-bold tabular-nums",
                    (ad.cliques_whatsapp || 0) > 0 ? "text-green" : "text-slate-600",
                  )}>
                    {ad.cliques_whatsapp || 0}
                  </p>
                </div>

                {/* CTR bar */}
                <div className="w-28 hidden lg:flex justify-start">
                  <CtrBar ctr={ad.ctr || 0} />
                </div>

                {/* Saturation thermometer */}
                <div className="w-[72px] hidden lg:flex justify-start">
                  <SaturationBar campanha={ad} />
                </div>

                {/* CPL */}
                <div className="text-right w-16 hidden lg:block">
                  <p className={clsx("text-xs font-mono font-bold tabular-nums", cplColor)}>
                    {cpl > 0 ? `R$${cpl.toFixed(2)}` : "—"}
                  </p>
                </div>

                {/* Actions */}
                {actionsCount > 0 && (
                  <div
                    className="flex items-center gap-1.5 justify-end"
                    onClick={e => e.stopPropagation()}
                  >
                    {hasBudget && (
                      <BudgetEditor
                        campaignId={ad.id}
                        currentBudget={ad.daily_budget || 0}
                        onUpdateBudget={onUpdateBudget}
                      />
                    )}
                    {hasEdit && (
                      <div
                        title="Clique na linha para editar"
                        className="flex items-center justify-center w-8 h-8 rounded-xl border border-border/50 text-slate-700 group-hover:text-cyan group-hover:border-cyan/30 transition-all"
                      >
                        <Pencil size={12} />
                      </div>
                    )}
                    {hasToggle && (
                      <ToggleBtn
                        status={ad.status}
                        campaignId={ad.id}
                        onToggle={onToggleStatus}
                        satNivel={getSaturation(ad).nivel}
                      />
                    )}
                    {hasAnalise && (() => {
                      const sat = getSaturation(ad);
                      const aiStyle = {
                        critical: "bg-red/10 border-red/30 text-red hover:bg-red/20 hover:border-red/50",
                        warning:  "bg-amber/10 border-amber/25 text-amber hover:bg-amber/20 hover:border-amber/45",
                        watch:    "bg-violet/10 border-violet/25 text-violet hover:bg-violet/20 hover:border-violet/45",
                        ok:       "bg-violet/10 border-violet/25 text-violet hover:bg-violet/20 hover:border-violet/45",
                        unknown:  "bg-violet/10 border-violet/25 text-violet hover:bg-violet/20 hover:border-violet/45",
                      }[sat.nivel] ?? "bg-violet/10 border-violet/25 text-violet hover:bg-violet/20 hover:border-violet/45";
                      const aiTitle = sat.nivel === "critical"
                        ? `⚠ ${sat.hint} — Analisar com IA`
                        : "Analisar com IA";
                      return (
                        <button
                          onClick={() => handleAnalisar(ad)}
                          title={aiTitle}
                          className={clsx(
                            "flex items-center gap-1.5 px-2.5 py-2 rounded-xl border transition-all active:scale-95",
                            "text-[10px] font-mono whitespace-nowrap",
                            aiStyle,
                            sat.nivel === "critical" && "animate-pulse",
                          )}
                        >
                          <BrainCircuit size={11} />
                          <span className="hidden xl:inline">
                            {sat.nivel === "critical" ? "IA !" : "IA"}
                          </span>
                        </button>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
            <TickerBad campanha={ad} />
            </div>
          );
        })}
      </div>
    </>
  );
}
