import { useState, useEffect } from "react";

export default function WelcomeScreen({ onDone }) {
  const [phase, setPhase] = useState("in"); // "in" | "out"

  useEffect(() => {
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
        pointerEvents: "all",
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
