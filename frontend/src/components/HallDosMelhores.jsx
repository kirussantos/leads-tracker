/**
 * HallDosMelhores — Pódio das campanhas que estão mandando bem.
 * Frases que inflam o ego do gestor(a) ao máximo. Merecido ou não,
 * o reconhecimento motiva. E às vezes é genuinamente merecido.
 */
import { useMemo } from "react";
import { clsx } from "clsx";
import { Crown, Star, Zap, TrendingUp, Award } from "lucide-react";
import { getSaturation } from "./CriativoTable";

// ─── Pools de frases por tipo de destaque ─────────────────────────────────────

const FRASES_CTR_TOP = [
  (c) => `CTR de ${c.ctr.toFixed(2)}% — o público clicou sem pensar duas vezes. Isso é poder de criativo. ⚡`,
  (c) => `${c.ctr.toFixed(2)}% de CTR. Benchmark do setor: 1.5%. Você: ${c.ctr.toFixed(2)}%. Faz as contas. 🧮`,
  (c) => `CTR de ${c.ctr.toFixed(2)}%: as pessoas viram o anúncio e clicaram antes de terminar de ler. Maestria. 🎭`,
  (c) => `Com ${c.ctr.toFixed(2)}% de CTR, o algoritmo da Meta olha pra essa campanha com carinho. 🥰`,
  (c) => `${c.ctr.toFixed(2)}% de CTR. Não é sorte. É campanha bem feita e gestor(a) que sabe o que faz. 🎯`,
];

const FRASES_CPL_TOP = [
  (c, cpl) => `R$${cpl.toFixed(2)} por lead. Isso não é gestão de tráfego, é arte. Contemporânea. 🎨`,
  (c, cpl) => `CPL de R$${cpl.toFixed(2)} — o cliente nem imagina o presente que tem nesse(a) gestor(a). 🎁`,
  (c, cpl) => `R$${cpl.toFixed(2)} por lead: mais barato que refrigerante no aeroporto. E muito mais valioso. 🥤`,
  (c, cpl) => `CPL de R$${cpl.toFixed(2)}. Quando o cliente perguntar como você consegue isso, diz que é segredo. 🤫`,
  (c, cpl) => `R$${cpl.toFixed(2)} por conversa iniciada. Isso merece print, frame e apresentação na próxima reunião. 🖼️`,
];

const FRASES_ATIVO_TOP = [
  () => "Campanha ativa, CPL no chão, cliente feliz. A santíssima trindade do Meta Ads. 🙏",
  () => "Essa aqui roda sozinha enquanto você faz outras coisas. Automação do sucesso. 🤖",
  () => "Ativa e convertendo. Deixa rolar. Só não toca. Sério, não toca. 🛑",
  () => "Enquanto essa campanha roda, você tá ganhando dinheiro até dormindo. 😴",
  () => "Impressora de leads ligada. Deus abençoe os criativos que funcionam. 🖨️",
];

const FRASES_FREQ_TOP = [
  (c) => `Frequência de ${c.frequencia.toFixed(1)}x — sweet spot perfeito. Aparece o suficiente sem irritar. Requintado. ✨`,
  (c) => `${c.frequencia.toFixed(1)}x de frequência: o público vê, lembra, clica. Fórmula simples executada com maestria. 📐`,
  (c) => `Freq. ${c.frequencia.toFixed(1)}x com CTR alto. Quando frequência e engajamento andam juntos, é porque o criativo presta. 💎`,
];

const FRASES_GENERICAS_TOP = [
  () => "Essa campanha é o motivo pelo qual vale a pena ser gestor(a) de tráfego. 🌟",
  () => "Salva print. Manda pro cliente. Documenta que você fez isso. Você merece o crédito. 📸",
  () => "O algoritmo da Meta sorri toda vez que entrega esse anúncio. É mútuo. 🤝",
  () => "Benchmark? Essa campanha É o benchmark. Outras agências deveriam estudar isso. 📊",
  () => "Rara combinação: campanha boa + gestor(a) bom(a) + cliente que deixa trabalhar. Preserva isso. 🌸",
  () => "O Mark Zuckerberg olharia pra essa campanha e diria 'tá bom'. E ele é difícil de agradar. 🫡",
  () => "Nem todo gestor(a) consegue isso. Você conseguiu. Diferença de talento. 🏅",
  () => "Resultado assim não cai do céu. Alguém aqui trabalhou, testou e acertou. Pode se orgulhar. 💪",
  () => "Campanha saudável num mercado que vive de campanha ruim. Você é a exceção. 🦋",
  () => "Quando o cliente vier reclamar de algo, mostra essa campanha e silencia o argumento. 🤐",
];

// ─── Verdict tags ─────────────────────────────────────────────────────────────

const VEREDICTOS = [
  { test: (c, cpl) => c.ctr > 2.5,                      label: "CTR CAMPEÃO",       Icon: Zap      },
  { test: (c, cpl) => cpl !== null && cpl < 8,           label: "CPL IMBATÍVEL",     Icon: Crown    },
  { test: (c, cpl) => cpl !== null && cpl < 15,          label: "IMPRESSORA DE LEADS", Icon: TrendingUp },
  { test: (c, cpl) => c.frequencia >= 1.5 && c.frequencia <= 2.5, label: "FREQ. PERFEITA", Icon: Star },
  { test: () => true,                                    label: "PERFORMANCE TOP",   Icon: Award    },
];

function getVeredicto(campanha, cpl) {
  return VEREDICTOS.find(v => v.test(campanha, cpl)) ?? VEREDICTOS[VEREDICTOS.length - 1];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hashId(str = "") {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  return Math.abs(h);
}

function getFrase(campanha, cpl) {
  const ctr  = campanha.ctr || 0;
  const freq = campanha.frequencia || 0;
  const seed = hashId(campanha.id || campanha.nome || "x");

  let pool;
  if (ctr > 2.0)                              pool = FRASES_CTR_TOP;
  else if (cpl !== null && cpl < 12)          pool = FRASES_CPL_TOP;
  else if (freq >= 1.5 && freq <= 2.5)        pool = FRASES_FREQ_TOP;
  else if (campanha.status === "ACTIVE")      pool = FRASES_ATIVO_TOP;
  else                                         pool = FRASES_GENERICAS_TOP;

  const fn = pool[seed % pool.length];
  return fn(campanha, cpl);
}

/** Score composto: menor CPL + maior CTR = melhor */
function heroScore(camp) {
  const verba = camp.verba_gasta || 0;
  if (verba < 10) return -1;

  const ctr  = camp.ctr || 0;
  const wpp  = camp.cliques_whatsapp || 0;
  const cpl  = wpp > 0 ? verba / wpp : null;
  const freq = camp.frequencia || 0;

  let score = 0;
  // CTR
  if (ctr >= 3)   score += 40;
  else if (ctr >= 2)   score += 30;
  else if (ctr >= 1.5) score += 20;
  else if (ctr >= 1)   score += 10;
  // CPL
  if (cpl !== null) {
    if (cpl < 8)        score += 40;
    else if (cpl < 12)  score += 30;
    else if (cpl < 20)  score += 20;
    else if (cpl < 30)  score += 10;
  }
  // Frequência no sweet spot
  if (freq >= 1.5 && freq <= 2.5) score += 20;
  else if (freq > 0 && freq <= 3) score += 8;

  return score;
}

const MEDALHAS = ["🥇", "🥈", "🥉"];

// ─── Componente principal ─────────────────────────────────────────────────────

export default function HallDosMelhores({ campanhas = [], clientes = [] }) {
  const clienteMap = useMemo(
    () => Object.fromEntries(clientes.map(c => [c.id, c.nome])),
    [clientes],
  );

  const tops = useMemo(() => {
    return campanhas
      .map(c => {
        const sat   = getSaturation(c);
        const score = heroScore(c);
        const cpl   = (c.cliques_whatsapp || 0) > 0
          ? (c.verba_gasta || 0) / (c.cliques_whatsapp || 1)
          : null;
        return { ...c, _sat: sat, _score: score, _cpl: cpl };
      })
      .filter(c => c._score > 10 && (c._sat.nivel === "ok" || c._sat.nivel === "watch"))
      .sort((a, b) => b._score - a._score)
      .slice(0, 6);
  }, [campanhas]);

  // ── Empty state ──
  if (tops.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3">
        <div className="w-10 h-10 bg-slate-800 border border-border rounded-xl flex items-center justify-center">
          <Crown size={16} className="text-slate-600" />
        </div>
        <p className="text-slate-600 font-mono text-xs text-center">
          Nenhuma campanha top no período ainda.<br />
          <span className="text-slate-700">Dados insuficientes ou período muito curto.</span>
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
      {tops.map((camp, i) => {
        const vrd     = getVeredicto(camp, camp._cpl);
        const frase   = getFrase(camp, camp._cpl);
        const cliente = clienteMap[camp.cliente_id] || "—";
        const isAtivo = camp.status === "ACTIVE";
        const medal   = MEDALHAS[i] ?? null;

        return (
          <div
            key={camp.id || i}
            className={clsx(
              "relative rounded-2xl border p-4 flex flex-col gap-3 overflow-hidden",
              "animate-fade-up",
              i === 0
                ? "bg-[#060f08] border-green/30 shadow-[0_0_40px_rgba(34,197,94,0.08)]"
                : "bg-[#060f08] border-green/15 shadow-[0_0_24px_rgba(34,197,94,0.04)]",
            )}
            style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
          >
            {/* Brilho decorativo no canto */}
            <div className={clsx(
              "absolute top-0 right-0 w-24 h-24 opacity-[0.05] rounded-bl-full",
              i === 0 ? "bg-green" : "bg-green/60",
            )} />

            {/* ── Topo: status + veredicto ── */}
            <div className="flex items-start justify-between gap-2">
              {/* Posição + status */}
              <div className="flex items-center gap-1.5">
                {medal && (
                  <span className="text-base leading-none select-none">{medal}</span>
                )}
                <span className={clsx(
                  "text-[9px] font-mono px-2 py-0.5 rounded border flex items-center gap-1 flex-shrink-0",
                  isAtivo
                    ? "text-green/80 border-green/20 bg-green/[0.07]"
                    : "text-slate-500 border-slate-700 bg-slate-800/40",
                )}>
                  <span className={clsx(
                    "w-1 h-1 rounded-full",
                    isAtivo ? "bg-green animate-pulse-dot" : "bg-slate-600",
                  )} />
                  {isAtivo ? "ATIVO" : "PAUSADO"}
                </span>
              </div>

              {/* Veredicto tag */}
              <span className="text-[8px] font-mono px-2 py-0.5 rounded border flex items-center gap-1 flex-shrink-0 text-green/70 border-green/20 bg-green/[0.06]">
                <vrd.Icon size={8} />
                {vrd.label}
              </span>
            </div>

            {/* ── Nome + cliente ── */}
            <div>
              <p className="text-sm font-mono text-slate-200 leading-snug line-clamp-2">
                {camp.nome || "—"}
              </p>
              <p className="text-[10px] font-mono text-slate-600 mt-0.5 truncate">{cliente}</p>
            </div>

            {/* ── Métricas top ── */}
            <div className="grid grid-cols-3 gap-2 rounded-xl px-3 py-2 bg-green/[0.04]">
              {[
                {
                  label: "CTR",
                  value: camp.ctr > 0 ? `${camp.ctr.toFixed(2)}%` : "—",
                  good: (camp.ctr || 0) >= 1.5,
                },
                {
                  label: "FREQ",
                  value: camp.frequencia > 0 ? `${camp.frequencia.toFixed(1)}x` : "—",
                  good: (camp.frequencia || 0) >= 1.2 && (camp.frequencia || 0) <= 2.5,
                },
                {
                  label: "CPL",
                  value: camp._cpl !== null ? `R$${camp._cpl.toFixed(0)}` : "—",
                  good: camp._cpl !== null && camp._cpl < 20,
                },
              ].map(({ label, value, good }) => (
                <div key={label} className="text-center">
                  <p className="text-[8px] font-mono text-slate-600 uppercase tracking-widest mb-0.5">{label}</p>
                  <p className={clsx(
                    "text-xs font-mono font-bold tabular-nums",
                    good ? "text-green/90" : "text-slate-400",
                  )}>
                    {value}
                  </p>
                </div>
              ))}
            </div>

            {/* ── Frase que infla o ego ── */}
            <div className="rounded-xl px-3 py-2.5 border bg-green/[0.03] border-green/10">
              <p className="text-[10px] font-mono leading-relaxed text-green/55">
                {frase}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
