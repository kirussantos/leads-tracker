import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useCampanhas } from "../hooks/useCampanhas";
import MetricCard from "../components/MetricCard";
import CriativoTable from "../components/CriativoTable";
import { DollarSign, MousePointerClick, TrendingUp, RefreshCw } from "lucide-react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

export default function Cliente() {
  const { id } = useParams();
  const [cliente, setCliente] = useState(null);
  const { campanhas: camps } = useCampanhas(id, "campaign");
  const { campanhas: criativos } = useCampanhas(id, "ad");

  useEffect(() => {
    getDoc(doc(db, "clientes", id)).then(d => {
      if (d.exists()) setCliente({ id: d.id, ...d.data() });
    });
  }, [id]);

  const verba = camps.reduce((s, c) => s + (c.verba_gasta || 0), 0);
  const cliques_wpp = camps.reduce((s, c) => s + (c.cliques_whatsapp || 0), 0);
  const cpl = cliques_wpp > 0 ? verba / cliques_wpp : 0;

  const syncCliente = async () => {
    await axios.post(`${API}/sync/cliente/${id}`);
  };

  if (!cliente) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="text-green font-mono text-sm animate-pulse">Carregando...</div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-mono text-slate-600 uppercase tracking-widest mb-1">Cliente</p>
          <h1 className="text-2xl font-bold text-slate-100">{cliente.nome}</h1>
          <p className="text-xs font-mono text-slate-600 mt-1">{cliente.ad_account_id}</p>
        </div>
        <button
          onClick={syncCliente}
          className="flex items-center gap-2 px-4 py-2 bg-green/10 border border-green/20 text-green text-xs font-mono rounded-lg hover:bg-green/20 transition-all"
        >
          <RefreshCw size={13} />
          Sync
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <MetricCard title="Verba Gasta" value={`R$${verba.toFixed(2)}`} color="amber" icon={DollarSign} delay={0} />
        <MetricCard title="Cliques WPP" value={cliques_wpp} color="green" icon={MousePointerClick} delay={80} />
        <MetricCard title="CPL Estimado" value={`R$${cpl.toFixed(2)}`} color="blue" icon={TrendingUp} delay={160} />
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-xs font-mono text-slate-600 uppercase tracking-widest mb-5">Criativos</h2>
        <CriativoTable campanhas={criativos} />
      </div>
    </div>
  );
}
