/**
 * MuralDaVergonha — Hall da Vergonha
 * Exibe campanhas com métricas ruins (critical / warning) em cards
 * dramáticos com frases ofensivas e humor negro. Só aparece quando
 * há pelo menos 1 campanha vergonhosa no período.
 */
import { useMemo } from "react";
import { clsx } from "clsx";
import { Flame, Skull, AlertTriangle, Trophy, Zap } from "lucide-react";
import { getSaturation } from "./CriativoTable";

// ─── Pools de frases por tipo de problema ─────────────────────────────────────

const FRASES_FREQ = [
  (c) => `O público viu esse anúncio ${c.frequencia.toFixed(1)}x. Já sabe o texto de cor. E odeia. 😐`,
  (c) => `Frequência ${c.frequencia.toFixed(1)}x — cada impressão a mais é uma pessoa mais furiosa com o cliente. 🤬`,
  (c) => `Com ${c.frequencia.toFixed(1)}x de frequência, esse anúncio virou folclore local. Não no bom sentido. 📜`,
  (c) => `${c.frequencia.toFixed(1)}x de frequência. O público não clicou nas outras vezes, vai clicar agora? Spoiler: não. 🙄`,
  (c) => `Saturação de ${c.frequencia.toFixed(1)}x significa que o cliente tá pagando pra irritar as pessoas. Que estratégia. 🎯`,
];

const FRASES_CTR = [
  (c) => `CTR de ${c.ctr.toFixed(2)}% com R$${(c.verba_gasta||0).toFixed(0)} investido. Isso tem nome e não é bonito. 🫡`,
  (c) => `${c.ctr.toFixed(2)}% de CTR — outdoor em branco na BR-101 às 3h da manhã performaria melhor. 🛣️`,
  (c) => `CTR de ${c.ctr.toFixed(2)}%. Ninguém clicou. Literalmente ninguém. O silêncio é a resposta. 🦗`,
  (c) => `Com ${c.ctr.toFixed(2)}% de CTR, seria mais barato o cliente gritar o nome do plano numa esquina. 📣`,
  (c) => `CTR de ${c.ctr.toFixed(2)}%: o anúncio aparece, o público ignora, a verba some. Ciclo perfeito de fracasso. 🔄`,
];

const FRASES_CPL = [
  (c) => { const cpl = (c.verba_gasta||0) / Math.max(c.cliques_whatsapp||1,1); return `CPL de R$${cpl.toFixed(2)} — mais caro que plano de saúde. A ironia pra clínica é impecável. 🏥`; },
  (c) => { const cpl = (c.verba_gasta||0) / Math.max(c.cliques_whatsapp||1,1); return `R$${cpl.toFixed(2)} por lead: cada paciente custa mais que a própria consulta. Matemática criativa. 💡`; },
  (c) => `Com esse CPL, seria mais barato contratar um vendedor porta a porta. Literalmente. 🚪`,
  (c) => `O CPL tá mais alto que a expectativa do cliente quando contratou essa gestão. 📈`,
];

const FRASES_GENERICAS = [
  () => "Essa campanha é a razão pela qual existem reuniões de emergência às 22h. 📅",
  () => "Se essa campanha fosse paciente, taria em UTI com o monitor bip-bipando. 🏥",
  () => "O algoritmo da Meta colocou essa campanha em observação especial. Não é elogio. 🖤",
  () => "Queimando verba mais rápido do que o cliente consegue perguntar 'e aí, como tá indo?'. 🔥",
  () => "Essa campanha prova uma coisa: dinheiro não compra performance. Só tenta. 💸",
  () => "Não é que tá ruim. É que tá otimizando pra direção errada muito bem. 🎯",
  () => "O dashboard inteiro olha pra essa campanha com julgamento silencioso. 👁️",
  () => "Essa campanha sobreviveu até agora por inércia, não por resultado. 🪨",
  () => "Estatisticamente, dar pause agora é a melhor decisão desta semana. 📊",
  () => "A Meta entrega, o público ignora, a verba vai embora. Repita até zerar o orçamento. 🔁",
];

const FRASES_WARNING = [
  () => "Ainda não é desastre. Mas tá se esforçando bastante pra chegar lá. 🙃",
  () => "Não é pânico ainda. É só preocupação existencial com os resultados. 🤔",
  () => "A tendência é clara, a direção é ruim, e o gestor assistindo. 👀",
  () => "Aviso amigável: o declínio começou. Alguém precisa fazer alguma coisa. 📉",
  () => "Não tá péssimo. Só caminhando com determinação para o péssimo. 🚶",
  () => "Essa campanha tá no caminho certo pra virar material de estudo do que não fazer. 📚",
  () => "Em breve um alerta vermelho vai aparecer aqui. Você foi avisado(a). 🔜",
  () => "Monitoramento ativo: essa campanha tá sob suspeita do sistema. 🔍",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Hash estável por ID de campanha para escolha consistente de frase */
function hashId(str = "") {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  }
  return Math.abs(h);
}

function getFrase(campanha, sat) {
  const freq  = campanha.frequencia || 0;
  const ctr   = campanha.ctr || 0;
  const verba = campanha.verba_gasta || 0;
  const seed  = hashId(campanha.id || campanha.nome || "x");

  let pool;
  if (sat.nivel === "critical") {
    if (freq > 3.5)                   pool = FRASES_FREQ;
    else if (ctr < 0.5 && verba > 30) pool = FRASES_CTR;
    else if ((campanha.cliques_whatsapp || 0) < 3 && verba > 80) pool = FRASES_CPL;
    else                               pool = FRASES_GENERICAS;
  } else {
    pool = FRASES_WARNING;
  }

  const fn = pool[seed % pool.length];
  return fn(campanha);
}

/** Veredicto + tag visual */
function getVeredicto(campanha, sat) {
  const freq = campanha.frequencia || 0;
  const ctr  = campanha.ctr || 0;
  if (sat.nivel === "critical") {
    if (freq > 3.5)    return { label: "PÚBLICO SATURADO", color: "red",   Icon: Flame };
    if (ctr  < 0.5)    return { label: "CTR VERGONHOSO",   color: "red",   Icon: Skull };
    return               { label: "QUEIMANDO VERBA",       color: "red",   Icon: Zap };
  }
  if (freq > 2.5)      return { label: "FREQ. SUSPEITA",   color: "amber", Icon: AlertTriangle };
  return                 { label: "CTR BAIXO",              color: "amber", Icon: AlertTriangle };
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function MuralDaVergonha({ campanhas = [], clientes = [] }) {
  const clienteMap = useMemo(
    () => Object.fromEntries(clientes.map(c => [c.id, c.nome])),
    [clientes],
  );

  const vergonhosos = useMemo(() => {
    return campanhas
      .map(c => ({ ...c, _sat: getSaturation(c) }))
      .filter(c => c._sat.nivel === "critical" || c._sat.nivel === "warning")
      .sort((a, b) => b._sat.score - a._sat.score) // piores primeiro
      .slice(0, 9);
  }, [campanhas]);

  // ── Empty state ──
  if (vergonhosos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3">
        <div className="w-10 h-10 bg-green/10 border border-green/20 rounded-xl flex items-center justify-center">
          <Trophy size={16} className="text-green" />
        </div>
        <p className="text-slate-600 font-mono text-xs text-center">
          Nenhuma campanha vergonhosa no período.<br />
          <span className="text-slate-700">Ou você tá mandando bem, ou os dados ainda não chegaram.</span>
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
      {vergonhosos.map((camp, i) => {
        const sat       = camp._sat;
        const vrd       = getVeredicto(camp, sat);
        const frase     = getFrase(camp, sat);
        const cliente   = clienteMap[camp.cliente_id] || "—";
        const isCrit    = sat.nivel === "critical";
        const isAtivo   = camp.status === "ACTIVE";
        const cpl       = (camp.cliques_whatsapp || 0) > 0
          ? (camp.verba_gasta || 0) / (camp.cliques_whatsapp || 1)
          : null;

        return (
          <div
            key={camp.id || i}
            className={clsx(
              "relative rounded-2xl border p-4 flex flex-col gap-3 overflow-hidden",
              "animate-fade-up",
              isCrit
                ? "bg-[#160808] border-red/20 shadow-[0_0_32px_rgba(239,68,68,0.06)]"
                : "bg-[#120e06] border-amber/15 shadow-[0_0_24px_rgba(245,158,11,0.04)]",
            )}
            style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
          >
            {/* Faixa diagonal decorativa */}
            <div className={clsx(
              "absolute top-0 right-0 w-20 h-20 opacity-[0.04] rounded-bl-full",
              isCrit ? "bg-red" : "bg-amber",
            )} />

            {/* ── Topo: status + veredicto ── */}
            <div className="flex items-start justify-between gap-2">
              {/* Status badge */}
              <span className={clsx(
                "text-[9px] font-mono px-2 py-0.5 rounded border flex-shrink-0 flex items-center gap-1",
                isAtivo
                  ? "text-red/80 border-red/25 bg-red/8"
                  : "text-slate-500 border-slate-700 bg-slate-800/40",
              )}>
                <span className={clsx(
                  "w-1 h-1 rounded-full",
                  isAtivo ? "bg-red animate-pulse" : "bg-slate-600",
                )} />
                {isAtivo ? "ATIVO" : "PAUSADO"}
              </span>

              {/* Veredicto tag */}
              <span className={clsx(
                "text-[8px] font-mono px-2 py-0.5 rounded border flex items-center gap-1 flex-shrink-0",
                isCrit
                  ? "text-red/70 border-red/20 bg-red/[0.07]"
                  : "text-amber/70 border-amber/20 bg-amber/[0.06]",
              )}>
                <vrd.Icon size={8} />
                {vrd.label}
              </span>
            </div>

            {/* ── Nome + cliente ── */}
            <div>
              <p className="text-sm font-mono text-slate-200 leading-snug line-clamp-2">
                {camp.nome || "—"}
              </p>
              <p className="text-[10px] font-mono text-slate-600 mt-0.5 truncate">
                {cliente}
              </p>
            </div>

            {/* ── Métricas vergonhosas ── */}
            <div className={clsx(
              "grid grid-cols-3 gap-2 rounded-xl px-3 py-2",
              isCrit ? "bg-red/[0.05]" : "bg-amber/[0.04]",
            )}>
              {[
                {
                  label: "CTR",
                  value: camp.ctr > 0 ? `${camp.ctr.toFixed(2)}%` : "—",
                  bad: (camp.ctr || 0) < 0.8,
                },
                {
                  label: "FREQ",
                  value: camp.frequencia > 0 ? `${camp.frequencia.toFixed(1)}x` : "—",
                  bad: (camp.frequencia || 0) > 2.5,
                },
                {
                  label: "CPL",
                  value: cpl !== null ? `R$${cpl.toFixed(0)}` : "—",
                  bad: cpl !== null && cpl > 25,
                },
              ].map(({ label, value, bad }) => (
                <div key={label} className="text-center">
                  <p className="text-[8px] font-mono text-slate-600 uppercase tracking-widest mb-0.5">{label}</p>
                  <p className={clsx(
                    "text-xs font-mono font-bold tabular-nums",
                    bad
                      ? isCrit ? "text-red/80" : "text-amber/80"
                      : "text-slate-400",
                  )}>
                    {value}
                  </p>
                </div>
              ))}
            </div>

            {/* ── Frase da vergonha ── */}
            <div className={clsx(
              "rounded-xl px-3 py-2.5 border",
              isCrit
                ? "bg-red/[0.04] border-red/10"
                : "bg-amber/[0.03] border-amber/10",
            )}>
              <p className={clsx(
                "text-[10px] font-mono leading-relaxed",
                isCrit ? "text-red/60" : "text-amber/55",
              )}>
                {frase}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
