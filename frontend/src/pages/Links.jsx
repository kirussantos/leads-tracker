import { useState, useEffect } from "react";
import { useClientes } from "../hooks/useClientes";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase";
import axios from "axios";
import { Link2, Copy, Check, QrCode, MousePointerClick, TrendingUp, ChevronRight } from "lucide-react";
import { clsx } from "clsx";

const API = (import.meta.env.VITE_API_URL || "").replace(/^﻿/, "").trim();

export default function Links() {
  const { clientes } = useClientes();
  const [clienteSel, setClienteSel] = useState("");
  const [campanha,   setCampanha]   = useState("");
  const [criativo,   setCriativo]   = useState("");
  const [msgCustom,  setMsgCustom]  = useState("");
  const [resultado,  setResultado]  = useState(null);
  const [links,      setLinks]      = useState([]);
  const [copiado,    setCopiado]    = useState(null);
  const [gerando,    setGerando]    = useState(false);

  useEffect(() => {
    if (!clienteSel) return;
    const q = query(collection(db, "links"), where("cliente_id", "==", clienteSel));
    const unsub = onSnapshot(q, snap => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      docs.sort((a, b) => (b.criado_em?.seconds || 0) - (a.criado_em?.seconds || 0));
      setLinks(docs);
    });
    return unsub;
  }, [clienteSel]);

  const gerar = async () => {
    if (!clienteSel || !campanha || !criativo) return;
    setGerando(true);
    try {
      const { data } = await axios.post(`${API}/links/gerar`, {
        cliente_id: clienteSel,
        campanha_nome: campanha,
        criativo_nome: criativo,
        mensagem_custom: msgCustom || null,
      });
      setResultado(data);
      setCampanha("");
      setCriativo("");
      setMsgCustom("");
    } finally {
      setGerando(false);
    }
  };

  const copiar = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiado(id);
    setTimeout(() => setCopiado(null), 2000);
  };

  const clienteNome = clientes.find(c => c.id === clienteSel)?.nome;

  return (
    <div className="space-y-7">

      {/* Header */}
      <div>
        <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-1">Rastreamento</p>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Gerador de Links</h1>
        <p className="text-xs font-mono text-slate-600 mt-1">
          Crie links rastreados para cada anúncio e monitore cliques em tempo real
        </p>
      </div>

      {/* Form */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-7 h-7 bg-green/10 rounded-lg flex items-center justify-center">
            <Link2 size={13} className="text-green" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-200">Novo Link Rastreado</p>
            <p className="text-[10px] font-mono text-slate-600">Gere um link único com QR Code para cada criativo</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          {/* Cliente */}
          <div>
            <label className="text-[10px] font-mono text-slate-600 uppercase tracking-widest block mb-2">
              Cliente *
            </label>
            <select
              value={clienteSel}
              onChange={e => { setClienteSel(e.target.value); setResultado(null); }}
              className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm font-mono text-slate-300 focus:border-green/40 focus:outline-none transition-colors"
            >
              <option value="">Selecionar cliente...</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>

          {/* Campanha */}
          <div>
            <label className="text-[10px] font-mono text-slate-600 uppercase tracking-widest block mb-2">
              Nome da Campanha *
            </label>
            <input
              value={campanha}
              onChange={e => setCampanha(e.target.value)}
              placeholder="Ex: Captacao-Consulta-Maio"
              className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm font-mono text-slate-300 placeholder-slate-700 focus:border-green/40 focus:outline-none transition-colors"
            />
          </div>

          {/* Criativo */}
          <div>
            <label className="text-[10px] font-mono text-slate-600 uppercase tracking-widest block mb-2">
              Nome do Criativo *
            </label>
            <input
              value={criativo}
              onChange={e => setCriativo(e.target.value)}
              placeholder="Ex: Video-Depoimento-Dr-Ana"
              className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm font-mono text-slate-300 placeholder-slate-700 focus:border-green/40 focus:outline-none transition-colors"
            />
          </div>

          {/* Mensagem custom */}
          <div>
            <label className="text-[10px] font-mono text-slate-600 uppercase tracking-widest block mb-2">
              Mensagem WhatsApp <span className="normal-case text-slate-700">(opcional)</span>
            </label>
            <input
              value={msgCustom}
              onChange={e => setMsgCustom(e.target.value)}
              placeholder="Deixe vazio para usar a mensagem padrão"
              className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm font-mono text-slate-300 placeholder-slate-700 focus:border-green/40 focus:outline-none transition-colors"
            />
          </div>
        </div>

        <button
          onClick={gerar}
          disabled={gerando || !clienteSel || !campanha || !criativo}
          className={clsx(
            "flex items-center gap-2 px-5 py-2.5 bg-green text-base text-sm font-mono font-bold rounded-xl",
            "hover:bg-green/90 transition-all active:scale-95",
            "disabled:opacity-40 disabled:cursor-not-allowed",
          )}
        >
          {gerando ? (
            <>
              <div className="w-4 h-4 border-2 border-base/30 border-t-base rounded-full animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <Link2 size={13} />
              Gerar Link
            </>
          )}
        </button>
      </div>

      {/* Resultado */}
      {resultado && (
        <div className="bg-card border border-green/20 rounded-2xl p-6 animate-fade-up shadow-[0_0_30px_rgba(34,197,94,0.04)]">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 bg-green/10 rounded-lg flex items-center justify-center">
              <Check size={13} className="text-green" />
            </div>
            <div>
              <p className="text-sm font-semibold text-green">Link criado com sucesso!</p>
              <p className="text-[10px] font-mono text-slate-600">Pronto para usar nos seus anúncios</p>
            </div>
          </div>

          <div className="flex gap-6 flex-wrap">
            <div className="flex-1 min-w-0 space-y-4">
              <div>
                <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-1.5">Identificador</p>
                <p className="text-sm font-mono text-slate-300 bg-surface rounded-lg px-3 py-2 border border-border">
                  {resultado.identificador}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-1.5">Link rastreado</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-mono text-green truncate flex-1 bg-green/[0.04] border border-green/20 rounded-lg px-3 py-2">
                    {resultado.link}
                  </p>
                  <button
                    onClick={() => copiar(resultado.link, "link")}
                    className="flex items-center gap-1.5 px-3 py-2 bg-surface border border-border rounded-lg text-[10px] font-mono text-slate-400 hover:text-slate-200 hover:border-border/70 transition-all flex-shrink-0"
                  >
                    {copiado === "link" ? <Check size={11} className="text-green" /> : <Copy size={11} />}
                    {copiado === "link" ? "Copiado!" : "Copiar"}
                  </button>
                </div>
              </div>
            </div>

            {resultado.qr_code_base64 && (
              <div className="flex-shrink-0">
                <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-2">QR Code</p>
                <div className="p-2 bg-white rounded-xl border border-border">
                  <img
                    src={`data:image/png;base64,${resultado.qr_code_base64}`}
                    alt="QR Code"
                    className="w-28 h-28 rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Links do cliente */}
      {clienteSel && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-0.5">Histórico</p>
              <h2 className="text-sm font-semibold text-slate-200">
                Links de {clienteNome || "..."}
              </h2>
            </div>
            <span className="text-[10px] font-mono text-slate-600 bg-surface px-2 py-1 rounded-lg border border-border">
              {links.length} link{links.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="space-y-2">
            {links.map((link, i) => (
              <div
                key={link.id}
                className="flex items-center gap-4 p-4 bg-surface border border-border rounded-xl hover:border-border/70 transition-all group animate-fade-up"
                style={{ animationDelay: `${i * 40}ms`, animationFillMode: "both" }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono text-slate-200 font-medium truncate">
                    {link.nome_identificador}
                  </p>
                  <p className="text-[10px] font-mono text-slate-600 mt-0.5">
                    {link.campanha_nome} <ChevronRight size={8} className="inline" /> {link.criativo_nome}
                  </p>
                </div>

                <div className="flex items-center gap-5 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest mb-0.5">Cliques</p>
                    <p className="text-sm font-mono text-green font-bold">{link.total_cliques || 0}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest mb-0.5">Conv.</p>
                    <p className="text-sm font-mono text-amber font-bold">{link.total_conversoes || 0}</p>
                  </div>
                  <button
                    onClick={() => copiar(link.link_gerado, link.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-slate-600 hover:text-green hover:border-green/30 transition-all"
                  >
                    {copiado === link.id ? <Check size={13} className="text-green" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>
            ))}

            {!links.length && (
              <div className="flex flex-col items-center justify-center py-14 gap-3">
                <div className="w-10 h-10 bg-border/30 rounded-xl flex items-center justify-center">
                  <Link2 size={16} className="text-slate-700" />
                </div>
                <p className="text-slate-600 font-mono text-xs text-center">
                  Nenhum link gerado para este cliente ainda.<br />
                  <span className="text-slate-700">Crie um link acima para começar a rastrear.</span>
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
