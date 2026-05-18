import { useState } from "react";
import { X, Loader, Check, Play, Pause } from "lucide-react";
import { clsx } from "clsx";

/**
 * Modal para editar configurações de uma campanha Meta Ads.
 *
 * Props:
 *   campanha   — objeto com { id, nome, status }
 *   onClose    — fecha o modal sem salvar
 *   onSave     — async ({ campaignId, nome, status, budget }) → void
 *                Recebe apenas os campos que foram alterados (null = sem mudança)
 */
export default function CampanhaEditModal({ campanha, onClose, onSave }) {
  const [nome,   setNome]   = useState(campanha.nome || "");
  const [status, setStatus] = useState(
    campanha.status === "ACTIVE" ? "ACTIVE" : "PAUSED",
  );
  const [budget,  setBudget]  = useState("");
  const [loading, setLoading] = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState(null);

  const nomeChanged   = nome.trim() !== (campanha.nome || "").trim();
  const statusChanged = status !== campanha.status;
  const budgetVal     = budget ? parseFloat(budget.replace(",", ".")) : null;
  const budgetChanged = budgetVal && budgetVal > 0;
  const hasChanges    = nomeChanged || statusChanged || budgetChanged;

  const handleSave = async () => {
    if (!hasChanges) { onClose(); return; }
    setLoading(true);
    setError(null);
    try {
      await onSave({
        campaignId: campanha.id,
        nome:   nomeChanged   ? nome.trim()    : null,
        status: statusChanged ? status         : null,
        budget: budgetChanged ? budgetVal      : null,
      });
      setSaved(true);
      setTimeout(() => onClose(), 1100);
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || "Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* panel */}
      <div className="relative bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl animate-fade-up">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-0.5">
              Meta Ads
            </p>
            <h2 className="text-sm font-bold text-slate-100">Editar Campanha</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl border border-border text-slate-600 hover:text-slate-300 hover:border-slate-600 transition-all"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">

          {/* Campanha atual (read-only) */}
          <div>
            <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-1.5">
              Campanha
            </p>
            <p className="text-[11px] font-mono text-slate-500 bg-surface border border-border rounded-xl px-3 py-2 truncate">
              {campanha.nome || campanha.id}
            </p>
          </div>

          {/* Nome */}
          <div>
            <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-1.5">
              Novo nome
              <span className="ml-2 normal-case text-slate-700">(opcional)</span>
            </p>
            <input
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder={campanha.nome || "Nome da campanha"}
              className={clsx(
                "w-full bg-surface border rounded-xl px-3 py-2 text-sm text-slate-200 font-mono",
                "focus:outline-none transition-colors",
                nomeChanged ? "border-green/40" : "border-border focus:border-green/30",
              )}
            />
          </div>

          {/* Status */}
          <div>
            <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-1.5">
              Status
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setStatus("ACTIVE")}
                className={clsx(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-mono transition-all",
                  status === "ACTIVE"
                    ? "bg-green/10 border-green/30 text-green"
                    : "border-border text-slate-600 hover:border-green/20 hover:text-green/60",
                )}
              >
                <Play size={11} fill={status === "ACTIVE" ? "currentColor" : "none"} />
                Ativar
              </button>
              <button
                onClick={() => setStatus("PAUSED")}
                className={clsx(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-mono transition-all",
                  status === "PAUSED"
                    ? "bg-amber/10 border-amber/30 text-amber"
                    : "border-border text-slate-600 hover:border-amber/20 hover:text-amber/60",
                )}
              >
                <Pause size={11} fill={status === "PAUSED" ? "currentColor" : "none"} />
                Pausar
              </button>
            </div>
          </div>

          {/* Orçamento diário */}
          <div>
            <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-1.5">
              Orçamento diário
              <span className="ml-2 normal-case text-slate-700">(deixe em branco para não alterar)</span>
            </p>
            <div className="flex items-center gap-2 bg-surface border border-border rounded-xl px-3 py-2 focus-within:border-green/30 transition-colors">
              <span className="text-xs font-mono text-slate-500 flex-shrink-0">R$</span>
              <input
                value={budget}
                onChange={e => setBudget(e.target.value)}
                placeholder="0,00"
                type="number"
                min="1"
                step="0.01"
                className="flex-1 bg-transparent text-sm text-slate-200 font-mono focus:outline-none"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 bg-red/5 border border-red/20 rounded-xl px-3 py-2.5">
              <span className="text-red text-xs flex-shrink-0 mt-0.5">✗</span>
              <p className="text-xs font-mono text-red/80">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border text-slate-500 text-xs font-mono hover:text-slate-300 hover:border-slate-600 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading || saved}
            className={clsx(
              "flex-1 py-2.5 rounded-xl border text-xs font-mono font-bold transition-all",
              "disabled:opacity-60 active:scale-95",
              saved
                ? "bg-green/10 border-green/30 text-green"
                : "bg-green/[0.12] border-green/25 text-green hover:bg-green/20 hover:border-green/40",
            )}
          >
            {loading ? (
              <Loader size={13} className="animate-spin mx-auto" />
            ) : saved ? (
              <span className="flex items-center justify-center gap-1.5">
                <Check size={12} /> Salvo!
              </span>
            ) : (
              hasChanges ? "Salvar alterações" : "Sem alterações"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
