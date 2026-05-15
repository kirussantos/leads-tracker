import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { BarChart2, Lock, Mail, Eye, EyeOff, TrendingUp, Zap } from "lucide-react";

const FRASES = [
  "Para quem terceirizou até o relatório pro cliente.",
  "Porque copiar print do Business Manager dá trabalho.",
  "Seu painel de ROI enquanto o cliente pergunta 'cadê o resultado?'",
  "Para gestores que pausam campanha na sexta e somem no fim de semana.",
  "Dashboard dos especialistas em subir verba 5 min antes da reunião.",
  "Faça login antes de cobrar o print da campanha.",
  "Otimização de tráfego. Otimização do seu trabalho também.",
  "Para quem prefere ver CPL cair do que fazer relatório no Excel.",
  "Seus resultados, sem precisar abrir o Business Manager às 23h.",
];

const ERROS = [
  "Senha errada. Nas campanhas também tá assim?",
  "Login falhou. Não é o criativo, é você.",
  "Erro de autenticação. Tenta a mesma energia nos anúncios.",
  "Credenciais inválidas. Pelo menos o CPL da sua campanha tá válido, né?",
  "Acesso negado. Já negou verba pro cliente também?",
];

// Tela de boas-vindas exibida por ~4s após login bem-sucedido
function WelcomeScreen({ onDone }) {
  const [phase, setPhase] = useState("in"); // "in" | "visible" | "out"

  useEffect(() => {
    // Fade in → visível por 3s → fade out → done
    const t1 = setTimeout(() => setPhase("out"), 3500);
    const t2 = setTimeout(() => onDone(), 4200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-base"
      style={{
        opacity: phase === "out" ? 0 : 1,
        transition: phase === "out" ? "opacity 0.7s ease-in-out" : "opacity 0.5s ease-in-out",
      }}
    >
      {/* Brilho de fundo */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-green/[0.04] blur-3xl" />
      </div>

      {/* Foto */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        <div
          className="w-64 h-64 md:w-80 md:h-80 rounded-2xl overflow-hidden border-2 border-green/20 shadow-2xl"
          style={{ boxShadow: "0 0 60px rgba(0,255,120,0.08)" }}
        >
          <img
            src="/elber.png"
            alt="Elber"
            className="w-full h-full object-cover object-center"
          />
        </div>

        {/* Mensagem */}
        <div className="text-center space-y-2">
          <p className="text-2xl md:text-3xl font-bold text-slate-100 tracking-tight">
            Bem vindo preguiçoso 😏
          </p>
          <p className="text-xs font-mono text-slate-600">
            preparando o dashboard...
          </p>
        </div>

        {/* Barra de progresso */}
        <div className="w-48 h-0.5 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-green rounded-full"
            style={{
              width: "100%",
              transform: "scaleX(0)",
              transformOrigin: "left",
              animation: "progress 3.5s linear forwards",
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes progress {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
      `}</style>
    </div>
  );
}

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [fraseIdx, setFraseIdx] = useState(0);
  const [showWelcome, setShowWelcome] = useState(false);

  // Evita que o useEffect de user navegue enquanto a tela de boas-vindas está ativa
  const inWelcomeFlow = useRef(false);

  useEffect(() => {
    if (user && !inWelcomeFlow.current) navigate("/", { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    const t = setInterval(() => {
      setFraseIdx(i => (i + 1) % FRASES.length);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErro("");
    try {
      inWelcomeFlow.current = true; // bloqueia navegação automática do useEffect
      await login(email, senha);
      setLoading(false);
      setShowWelcome(true);
    } catch {
      inWelcomeFlow.current = false;
      setErro(ERROS[Math.floor(Math.random() * ERROS.length)]);
      setLoading(false);
    }
  };

  const handleWelcomeDone = () => {
    inWelcomeFlow.current = false;
    navigate("/", { replace: true });
  };

  return (
    <>
      {/* Tela de boas-vindas (aparece após login) */}
      {showWelcome && <WelcomeScreen onDone={handleWelcomeDone} />}

      <div className="min-h-screen bg-base flex flex-col items-center justify-center px-4 relative overflow-hidden">

        {/* Fundo decorativo */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-120px] left-[-120px] w-[400px] h-[400px] rounded-full bg-green/[0.03] blur-3xl" />
          <div className="absolute bottom-[-100px] right-[-100px] w-[350px] h-[350px] rounded-full bg-amber/[0.04] blur-3xl" />
          <svg className="absolute inset-0 w-full h-full opacity-[0.025]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="#94a3b8" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
        </div>

        {/* Métricas flutuantes */}
        <div className="absolute top-16 left-8 hidden lg:flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2 opacity-40 rotate-[-4deg] select-none">
          <TrendingUp size={12} className="text-green" />
          <span className="text-[10px] font-mono text-slate-400">CTR 3.2% ↑</span>
        </div>
        <div className="absolute top-28 right-12 hidden lg:flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2 opacity-30 rotate-[3deg] select-none">
          <BarChart2 size={12} className="text-amber" />
          <span className="text-[10px] font-mono text-slate-400">CPL R$12,40</span>
        </div>
        <div className="absolute bottom-24 left-16 hidden lg:flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2 opacity-25 rotate-[2deg] select-none">
          <Zap size={12} className="text-green" />
          <span className="text-[10px] font-mono text-slate-400">ROAS 4.8x</span>
        </div>
        <div className="absolute bottom-40 right-8 hidden lg:flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2 opacity-30 rotate-[-3deg] select-none">
          <TrendingUp size={12} className="text-amber" />
          <span className="text-[10px] font-mono text-slate-400">Leads 127</span>
        </div>

        {/* Card principal */}
        <div className="relative z-10 w-full max-w-md">

          {/* Logo / Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green/10 border border-green/20 mb-4">
              <BarChart2 size={26} className="text-green" />
            </div>
            <h1 className="text-2xl font-bold text-slate-100 mb-1">Leads Tracker</h1>
            <p className="text-[10px] font-mono text-green/70 uppercase tracking-widest font-bold">
              FEITO PELO DEUS DO TRÁFEGO ELBER
            </p>
          </div>

          {/* Frase rotativa */}
          <div className="text-center mb-6 min-h-[36px]">
            <p
              key={fraseIdx}
              className="text-xs font-mono text-slate-500 italic animate-fade-up"
            >
              "{FRASES[fraseIdx]}"
            </p>
          </div>

          {/* Formulário */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-2xl">
            <h2 className="text-sm font-semibold text-slate-300 mb-5">
              Acesso restrito <span className="text-[10px] font-mono text-slate-600 ml-1">— só a equipe entra aqui</span>
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="text-[10px] font-mono text-slate-600 uppercase tracking-widest block mb-2">
                  E-mail
                </label>
                <div className="relative">
                  <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    className="w-full bg-surface border border-border rounded-lg pl-9 pr-4 py-2.5 text-sm font-mono text-slate-300 placeholder-slate-700 focus:border-green/40 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Senha */}
              <div>
                <label className="text-[10px] font-mono text-slate-600 uppercase tracking-widest block mb-2">
                  Senha
                </label>
                <div className="relative">
                  <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                  <input
                    type={showSenha ? "text" : "password"}
                    value={senha}
                    onChange={e => setSenha(e.target.value)}
                    placeholder="••••••••••"
                    required
                    className="w-full bg-surface border border-border rounded-lg pl-9 pr-10 py-2.5 text-sm font-mono text-slate-300 placeholder-slate-700 focus:border-green/40 focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSenha(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
                  >
                    {showSenha ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>

              {/* Erro */}
              {erro && (
                <div className="bg-red/5 border border-red/20 rounded-lg px-3 py-2.5 animate-fade-up">
                  <p className="text-[11px] font-mono text-red/80">⚠ {erro}</p>
                </div>
              )}

              {/* Botão */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-green text-base font-mono text-sm font-bold rounded-lg hover:bg-green/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-base/30 border-t-base rounded-full animate-spin" />
                    <span>Calculando seu CPL...</span>
                  </>
                ) : (
                  "Entrar e otimizar"
                )}
              </button>
            </form>

            <p className="text-center text-[10px] font-mono text-slate-700 mt-5">
              Sem acesso? Chama o gestor de tráfego.<br />
              <span className="text-slate-800">Que provavelmente é você mesmo.</span>
            </p>
          </div>

          <p className="text-center text-[10px] font-mono text-slate-800 mt-4">
            v2.0 — Otimizado. Diferente das campanhas às segundas-feiras.
          </p>
        </div>
      </div>
    </>
  );
}
