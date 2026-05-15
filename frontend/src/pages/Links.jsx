import { useState, useEffect } from "react";
import { useClientes } from "../hooks/useClientes";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase";
import axios from "axios";
import { Link2, Copy, Check } from "lucide-react";

const API = (import.meta.env.VITE_API_URL || "").replace(/^﻿/, "").trim();

export default function Links() {
  const { clientes } = useClientes();
  const [clienteSel, setClienteSel] = useState("");
  const [campanha, setCampanha] = useState("");
  const [criativo, setCriativo] = useState("");
  const [msgCustom, setMsgCustom] = useState("");
  const [resultado, setResultado] = useState(null);
  const [links, setLinks] = useState([]);
  const [copiado, setCopiado] = useState(null);

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
  };

  const copiar = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiado(id);
    setTimeout(() => setCopiado(null), 2000);
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-mono text-slate-600 uppercase tracking-widest mb-1">Rastreamento</p>
        <h1 className="text-2xl font-bold text-slate-100">Gerador de Links</h1>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-xs font-mono text-slate-500 uppercase tracking-widest">Novo Link Rastreado</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-mono text-slate-600 uppercase tracking-widest block mb-2">Cliente</label>
            <select
              value={clienteSel}
              onChange={e => setClienteSel(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm font-mono text-slate-300 focus:border-green/40 focus:outline-none transition-colors"
            >
              <option value="">Selecionar cliente...</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-mono text-slate-600 uppercase tracking-widest block mb-2">Campanha</label>
            <input
              value={campanha}
              onChange={e => setCampanha(e.target.value)}
              placeholder="Ex: Captacao-Consulta"
              className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm font-mono text-slate-300 placeholder-slate-700 focus:border-green/40 focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] font-mono text-slate-600 uppercase tracking-widest block mb-2">Criativo</label>
            <input
              value={criativo}
              onChange={e => setCriativo(e.target.value)}
              placeholder="Ex: Video-Skincare-01"
              className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm font-mono text-slate-300 placeholder-slate-700 focus:border-green/40 focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] font-mono text-slate-600 uppercase tracking-widest block mb-2">Mensagem custom (opcional)</label>
            <input
              value={msgCustom}
              onChange={e => setMsgCustom(e.target.value)}
              placeholder="Deixe vazio para mensagem padrão"
              className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm font-mono text-slate-300 placeholder-slate-700 focus:border-green/40 focus:outline-none transition-colors"
            />
          </div>
        </div>
        <button
          onClick={gerar}
          className="flex items-center gap-2 px-5 py-2.5 bg-green text-base text-xs font-mono font-bold rounded-lg hover:bg-green/90 transition-all"
        >
          <Link2 size={13} />
          Gerar Link
        </button>
      </div>

      {resultado && (
        <div className="bg-card border border-green/20 rounded-xl p-6 animate-fade-up">
          <h3 className="text-xs font-mono text-green uppercase tracking-widest mb-4">Link Gerado</h3>
          <div className="flex gap-6">
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-[10px] font-mono text-slate-600 mb-1">Identificador</p>
                <p className="text-sm font-mono text-slate-300">{resultado.identificador}</p>
              </div>
              <div>
                <p className="text-[10px] font-mono text-slate-600 mb-1">Link</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-mono text-green truncate flex-1">{resultado.link}</p>
                  <button onClick={() => copiar(resultado.link, "link")} className="text-slate-500 hover:text-green transition-colors">
                    {copiado === "link" ? <Check size={14} className="text-green" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>
            {resultado.qr_code_base64 && (
              <div className="flex-shrink-0">
                <p className="text-[10px] font-mono text-slate-600 mb-2">QR Code</p>
                <img
                  src={`data:image/png;base64,${resultado.qr_code_base64}`}
                  alt="QR Code"
                  className="w-24 h-24 rounded-lg border border-border"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {clienteSel && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xs font-mono text-slate-600 uppercase tracking-widest mb-5">Links do Cliente</h2>
          <div className="space-y-3">
            {links.map((link, i) => (
              <div
                key={link.id}
                className="flex items-center justify-between p-4 bg-surface border border-border rounded-lg animate-fade-up hover:border-border/80 transition-colors"
                style={{ animationDelay: `${i * 40}ms`, animationFillMode: "both" }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono text-slate-300 truncate">{link.nome_identificador}</p>
                  <p className="text-[10px] font-mono text-slate-600 mt-0.5">{link.campanha_nome} · {link.criativo_nome}</p>
                </div>
                <div className="flex items-center gap-6 ml-4 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-[10px] font-mono text-slate-600">Cliques</p>
                    <p className="text-sm font-mono text-green font-bold">{link.total_cliques || 0}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-mono text-slate-600">Conversões</p>
                    <p className="text-sm font-mono text-amber font-bold">{link.total_conversoes || 0}</p>
                  </div>
                  <button onClick={() => copiar(link.link_gerado, link.id)} className="text-slate-600 hover:text-green transition-colors">
                    {copiado === link.id ? <Check size={14} className="text-green" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            ))}
            {!links.length && (
              <p className="text-center py-8 text-slate-700 font-mono text-sm">Nenhum link gerado ainda</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
