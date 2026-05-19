import { useState, useEffect, useCallback } from "react";
import {
  X, Loader, Check, Play, Pause,
  ChevronDown, ChevronRight,
  Target, Users, DollarSign, Calendar,
} from "lucide-react";
import { clsx } from "clsx";
import axios from "axios";

const API = (import.meta.env.VITE_API_URL || "").replace(/^﻿/, "").trim();

const BID_STRATEGIES = [
  { value: "",                          label: "Padrão (automático)" },
  { value: "LOWEST_COST_WITHOUT_CAP",   label: "Menor custo (sem cap)" },
  { value: "LOWEST_COST_WITH_BID_CAP",  label: "Menor custo com cap de lance" },
  { value: "COST_CAP",                  label: "Cap de custo por resultado" },
  { value: "HIGHEST_VALUE",             label: "Maior valor de conversão" },
];

/* ── Shared UI atoms ──────────────────────────────────────────────────────── */

function SectionTitle({ icon: Icon, label, count }) {
  return (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
      <Icon size={11} className="text-slate-600 flex-shrink-0" />
      <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex-1">{label}</p>
      {count != null && (
        <span className="text-[9px] font-mono text-slate-700">{count} conjunto{count !== 1 ? "s" : ""}</span>
      )}
    </div>
  );
}

function FieldLabel({ children, optional }) {
  return (
    <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-1.5">
      {children}
      {optional && <span className="ml-2 normal-case text-slate-700">(opcional)</span>}
    </p>
  );
}

function TextInput({ value, onChange, placeholder, changed }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={clsx(
        "w-full bg-surface border rounded-xl px-3 py-2 text-sm text-slate-200 font-mono",
        "focus:outline-none transition-colors",
        changed ? "border-green/40" : "border-border focus:border-green/30",
      )}
    />
  );
}

function MoneyInput({ value, onChange, placeholder = "0,00", changed }) {
  return (
    <div className={clsx(
      "flex items-center gap-2 bg-surface border rounded-xl px-3 py-2 transition-colors",
      "focus-within:border-green/30",
      changed ? "border-green/40" : "border-border",
    )}>
      <span className="text-xs font-mono text-slate-500 flex-shrink-0">R$</span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        type="number"
        min="0"
        step="0.01"
        className="flex-1 bg-transparent text-sm text-slate-200 font-mono focus:outline-none"
      />
    </div>
  );
}

function StatusToggle({ status, onChange }) {
  return (
    <div className="flex gap-2">
      {[
        { val: "ACTIVE", Icon: Play,  label: "Ativo",   active: "bg-green/10 border-green/30 text-green",   hover: "hover:border-green/20 hover:text-green/60" },
        { val: "PAUSED", Icon: Pause, label: "Pausado", active: "bg-amber/10 border-amber/30 text-amber",   hover: "hover:border-amber/20 hover:text-amber/60" },
      ].map(({ val, Icon, label, active, hover }) => (
        <button
          key={val}
          onClick={() => onChange(val)}
          className={clsx(
            "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border text-xs font-mono transition-all",
            status === val ? active : `border-border text-slate-600 ${hover}`,
          )}
        >
          <Icon size={10} fill={status === val ? "currentColor" : "none"} />
          {label}
        </button>
      ))}
    </div>
  );
}

function DateTimeInput({ value, onChange, label, optional = true }) {
  return (
    <div>
      <FieldLabel optional={optional}>{label}</FieldLabel>
      <input
        type="datetime-local"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-green/30 transition-colors"
      />
    </div>
  );
}

function SkeletonRow() {
  return <div className="h-10 bg-surface border border-border rounded-xl animate-pulse" />;
}

/* ── AdsetCard ────────────────────────────────────────────────────────────── */

function AdsetCard({ adset, onChangeAdset }) {
  const [open, setOpen] = useState(false);
  const [local, setLocal] = useState({});

  /* Returns the current value: local override → original from API */
  const val = (field, orig) => (local[field] !== undefined ? local[field] : orig);

  const set = (field, value) => {
    const next = { ...local, [field]: value };
    setLocal(next);
    onChangeAdset(adset.id, next);
  };

  /* Targeting helpers — always merges into the full targeting object */
  const currentTargeting = local.targeting !== undefined ? local.targeting : (adset.targeting || {});
  const setTargeting = (tField, tValue) => {
    const next = { ...local, targeting: { ...currentTargeting, [tField]: tValue } };
    setLocal(next);
    onChangeAdset(adset.id, next);
  };

  /* Derived values */
  const nome      = val("nome",         adset.name || "");
  const status    = val("status",       adset.status || "ACTIVE");
  const daily     = val("daily_budget", adset.daily_budget && parseInt(adset.daily_budget) > 0
    ? (parseInt(adset.daily_budget) / 100).toFixed(2) : "");
  const bid       = val("bid_amount",   adset.bid_amount && parseInt(adset.bid_amount) > 0
    ? (parseInt(adset.bid_amount) / 100).toFixed(2) : "");
  const startTime = val("start_time",   adset.start_time  ? adset.start_time.substring(0, 16)  : "");
  const endTime   = val("end_time",     adset.end_time    ? adset.end_time.substring(0, 16)    : "");
  const ageMin    = currentTargeting.age_min ?? 18;
  const ageMax    = currentTargeting.age_max ?? 65;
  const genders   = currentTargeting.genders ?? [];

  const hasChanges = Object.keys(local).length > 0;
  const isActive   = status === "ACTIVE";

  /* Gender selection: [], [1], [2], or [1,2] → normalise [1,2] to [] */
  const genderKey =
    genders.length === 0 || (genders.includes(1) && genders.includes(2)) ? "all"
    : genders.includes(1) ? "male"
    : "female";

  const genderOpts = [
    { key: "all",    label: "Todos",  val: [] },
    { key: "male",   label: "Masc.",  val: [1] },
    { key: "female", label: "Fem.",   val: [2] },
  ];

  return (
    <div className={clsx(
      "rounded-xl border transition-all overflow-hidden",
      hasChanges ? "border-green/25 bg-green/[0.02]" : "border-border",
    )}>
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.025] transition-colors"
      >
        <div className={clsx(
          "w-1.5 h-1.5 rounded-full flex-shrink-0",
          isActive ? "bg-green animate-pulse-dot" : "bg-amber",
        )} />
        <span className="flex-1 min-w-0 text-xs font-mono text-slate-300 truncate">
          {nome || adset.id}
        </span>
        <div className="flex items-center gap-2 flex-shrink-0">
          {hasChanges && (
            <span className="text-[9px] font-mono text-green bg-green/10 border border-green/20 px-1.5 py-0.5 rounded">
              editado
            </span>
          )}
          <span className={clsx("text-[9px] font-mono", isActive ? "text-green" : "text-amber")}>
            {isActive ? "ATIVO" : "PAUSADO"}
          </span>
          {open
            ? <ChevronDown size={11} className="text-slate-600" />
            : <ChevronRight size={11} className="text-slate-600" />
          }
        </div>
      </button>

      {/* Body */}
      {open && (
        <div className="px-4 pb-4 pt-3 space-y-4 border-t border-border/50 bg-black/20">

          {/* Nome */}
          <div>
            <FieldLabel>Nome</FieldLabel>
            <TextInput
              value={nome}
              onChange={v => set("nome", v)}
              placeholder="Nome do conjunto"
              changed={local.nome !== undefined}
            />
          </div>

          {/* Status */}
          <div>
            <FieldLabel>Status</FieldLabel>
            <StatusToggle status={status} onChange={v => set("status", v)} />
          </div>

          {/* Budget + Bid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel optional>Orçamento diário</FieldLabel>
              <MoneyInput
                value={daily}
                onChange={v => set("daily_budget", v)}
                changed={local.daily_budget !== undefined}
              />
            </div>
            <div>
              <FieldLabel optional>Lance máximo</FieldLabel>
              <MoneyInput
                value={bid}
                onChange={v => set("bid_amount", v)}
                placeholder="automático"
                changed={local.bid_amount !== undefined}
              />
            </div>
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-2 gap-3">
            <DateTimeInput value={startTime} onChange={v => set("start_time", v)} label="Início" />
            <DateTimeInput value={endTime}   onChange={v => set("end_time",   v)} label="Término" />
          </div>

          {/* Age range */}
          <div>
            <FieldLabel>Faixa etária</FieldLabel>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-surface border border-border rounded-xl px-3 py-2 flex-1">
                <span className="text-[10px] font-mono text-slate-600 flex-shrink-0">De</span>
                <input
                  type="number" min={13} max={65} value={ageMin}
                  onChange={e => setTargeting("age_min", parseInt(e.target.value) || 18)}
                  className="flex-1 min-w-0 bg-transparent text-sm text-slate-200 font-mono focus:outline-none text-center"
                />
              </div>
              <span className="text-slate-700 text-xs flex-shrink-0">—</span>
              <div className="flex items-center gap-2 bg-surface border border-border rounded-xl px-3 py-2 flex-1">
                <span className="text-[10px] font-mono text-slate-600 flex-shrink-0">Até</span>
                <input
                  type="number" min={13} max={65} value={ageMax}
                  onChange={e => setTargeting("age_max", parseInt(e.target.value) || 65)}
                  className="flex-1 min-w-0 bg-transparent text-sm text-slate-200 font-mono focus:outline-none text-center"
                />
              </div>
            </div>
          </div>

          {/* Gender */}
          <div>
            <FieldLabel>Gênero</FieldLabel>
            <div className="flex gap-2">
              {genderOpts.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setTargeting("genders", opt.val)}
                  className={clsx(
                    "flex-1 py-2 rounded-xl border text-xs font-mono transition-all",
                    genderKey === opt.key
                      ? "bg-cyan/10 border-cyan/30 text-cyan"
                      : "border-border text-slate-600 hover:border-cyan/20 hover:text-cyan/60",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {genderKey === "all" && (
              <p className="text-[9px] font-mono text-slate-700 mt-1">
                Segmentando todos os gêneros
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main CampanhaEditModal ───────────────────────────────────────────────── */

/**
 * Drawer lateral para edição completa de campanha + conjuntos de anúncios.
 *
 * Props:
 *   campanha   — { id, nome, status, ... } (dados do Firestore/período)
 *   clienteId  — ID do cliente no Firebase
 *   onClose    — fecha sem salvar
 *   onSaved    — (novoStatus: string|null) → void  — chamado após salvar com sucesso
 */
export default function CampanhaEditModal({ campanha, clienteId, onClose, onSaved }) {
  /* ── Campaign details (loaded from Meta API) ── */
  const [details,        setDetails]        = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(true);

  /* ── Adsets ── */
  const [adsets,        setAdsets]        = useState([]);
  const [loadingAdsets, setLoadingAdsets] = useState(true);
  const [adsetChanges,  setAdsetChanges]  = useState({});   // { adsetId: changesObj }

  /* ── Campaign field states (pre-filled from API) ── */
  const [nome,           setNome]           = useState(campanha.nome || "");
  const [status,         setStatus]         = useState(campanha.status === "ACTIVE" ? "ACTIVE" : "PAUSED");
  const [dailyBudget,    setDailyBudget]    = useState("");
  const [lifetimeBudget, setLifetimeBudget] = useState("");
  const [bidStrategy,    setBidStrategy]    = useState("");
  const [startTime,      setStartTime]      = useState("");
  const [stopTime,       setStopTime]       = useState("");

  /* ── Save state ── */
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState(null);

  /* ── Load campaign details ── */
  useEffect(() => {
    setLoadingDetails(true);
    axios.get(`${API}/meta/campanha/${campanha.id}`, { params: { cliente_id: clienteId } })
      .then(({ data: d }) => {
        setDetails(d);
        setNome(d.name || campanha.nome || "");
        const st = d.effective_status || d.status || campanha.status;
        setStatus(st === "ACTIVE" ? "ACTIVE" : "PAUSED");
        setDailyBudget(
          d.daily_budget && parseInt(d.daily_budget) > 0
            ? (parseInt(d.daily_budget) / 100).toFixed(2) : "",
        );
        setLifetimeBudget(
          d.lifetime_budget && parseInt(d.lifetime_budget) > 0
            ? (parseInt(d.lifetime_budget) / 100).toFixed(2) : "",
        );
        setBidStrategy(d.bid_strategy || "");
        setStartTime(d.start_time ? d.start_time.substring(0, 16) : "");
        setStopTime((d.stop_time || d.end_time) ? (d.stop_time || d.end_time).substring(0, 16) : "");
      })
      .catch(() => { /* mantém valores do prop */ })
      .finally(() => setLoadingDetails(false));
  }, [campanha.id, clienteId]); // eslint-disable-line

  /* ── Load adsets ── */
  useEffect(() => {
    setLoadingAdsets(true);
    axios.get(`${API}/meta/campanha/${campanha.id}/adsets`, { params: { cliente_id: clienteId } })
      .then(r => setAdsets(Array.isArray(r.data) ? r.data : []))
      .catch(() => setAdsets([]))
      .finally(() => setLoadingAdsets(false));
  }, [campanha.id, clienteId]); // eslint-disable-line

  const handleAdsetChange = useCallback((adsetId, changes) => {
    setAdsetChanges(prev => ({ ...prev, [adsetId]: changes }));
  }, []);

  /* ── Change detection (campaign) ── */
  const origNome    = (details?.name || campanha.nome || "").trim();
  const origStatus  = details?.effective_status || details?.status || campanha.status || "PAUSED";
  const origDaily   = details?.daily_budget && parseInt(details.daily_budget) > 0
    ? (parseInt(details.daily_budget) / 100).toFixed(2) : "";
  const origLife    = details?.lifetime_budget && parseInt(details.lifetime_budget) > 0
    ? (parseInt(details.lifetime_budget) / 100).toFixed(2) : "";
  const origStrat   = details?.bid_strategy || "";
  const origStart   = details?.start_time ? details.start_time.substring(0, 16) : "";
  const origStop    = (details?.stop_time || details?.end_time)
    ? (details.stop_time || details.end_time).substring(0, 16) : "";

  const nomeChanged     = nome.trim() !== origNome;
  const statusChanged   = status !== (origStatus === "ACTIVE" ? "ACTIVE" : "PAUSED");
  const dailyChanged    = dailyBudget !== "" && dailyBudget !== origDaily;
  const lifetimeChanged = lifetimeBudget !== "" && lifetimeBudget !== origLife;
  const stratChanged    = bidStrategy !== origStrat;
  const startChanged    = startTime !== origStart;
  const stopChanged     = stopTime !== origStop;

  const campaignHasChanges = nomeChanged || statusChanged || dailyChanged
    || lifetimeChanged || stratChanged || startChanged || stopChanged;

  const adsetChangeCount = Object.values(adsetChanges)
    .filter(c => c && Object.keys(c).length > 0).length;
  const hasAnyChanges = campaignHasChanges || adsetChangeCount > 0;

  const changesCount = [nomeChanged, statusChanged, dailyChanged, lifetimeChanged,
    stratChanged, startChanged, stopChanged].filter(Boolean).length + adsetChangeCount;

  /* ── Save ── */
  const handleSave = async () => {
    if (!hasAnyChanges) { onClose(); return; }
    setSaving(true);
    setError(null);

    const promises = [];

    if (campaignHasChanges) {
      const payload = { cliente_id: clienteId, campaign_id: campanha.id };
      if (nomeChanged)     payload.nome           = nome.trim();
      if (statusChanged)   payload.status         = status;
      if (dailyChanged)    payload.daily_budget   = parseFloat(dailyBudget);
      if (lifetimeChanged) payload.lifetime_budget = parseFloat(lifetimeBudget);
      if (stratChanged && bidStrategy) payload.bid_strategy = bidStrategy;
      if (startChanged && startTime)   payload.start_time   = startTime;
      if (stopChanged  && stopTime)    payload.stop_time    = stopTime;
      promises.push(axios.post(`${API}/meta/campanha/atualizar`, payload));
    }

    for (const [adsetId, changes] of Object.entries(adsetChanges)) {
      if (!changes || Object.keys(changes).length === 0) continue;
      const payload = { cliente_id: clienteId, adset_id: adsetId };
      if (changes.nome         != null) payload.nome          = changes.nome;
      if (changes.status       != null) payload.status        = changes.status;
      if (changes.daily_budget != null && changes.daily_budget !== "")
        payload.daily_budget = parseFloat(changes.daily_budget);
      if (changes.bid_amount   != null && changes.bid_amount !== "")
        payload.bid_amount = parseFloat(changes.bid_amount);
      if (changes.start_time   != null && changes.start_time !== "")
        payload.start_time = changes.start_time;
      if (changes.end_time     != null && changes.end_time !== "")
        payload.end_time = changes.end_time;
      if (changes.targeting    != null)
        payload.targeting = changes.targeting;
      promises.push(axios.post(`${API}/meta/adset/atualizar`, payload));
    }

    try {
      await Promise.all(promises);
      setSaved(true);
      setTimeout(() => {
        onSaved?.(statusChanged ? status : null);
      }, 1000);
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  /* ── Render ── */
  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer panel */}
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-[520px] bg-card border-l border-border flex flex-col shadow-2xl">

        {/* ── Header ── */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div className="min-w-0 mr-4">
            <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-0.5">
              Meta Ads — Editar campanha
            </p>
            <h2 className="text-sm font-bold text-slate-100 truncate">
              {campanha.nome || campanha.id}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl border border-border text-slate-600 hover:text-slate-300 hover:border-slate-600 transition-all"
          >
            <X size={14} />
          </button>
        </div>

        {/* ── Body (scrollable) ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-7">

          {/* ─ Campanha ─ */}
          <div>
            <SectionTitle icon={Target} label="Campanha" />
            {loadingDetails ? (
              <div className="space-y-3">
                <SkeletonRow /><SkeletonRow /><SkeletonRow />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Nome */}
                <div>
                  <FieldLabel>Nome</FieldLabel>
                  <TextInput
                    value={nome}
                    onChange={setNome}
                    placeholder="Nome da campanha"
                    changed={nomeChanged}
                  />
                </div>

                {/* Status */}
                <div>
                  <FieldLabel>Status</FieldLabel>
                  <StatusToggle status={status} onChange={setStatus} />
                </div>

                {/* Budgets */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel optional>Orçamento diário</FieldLabel>
                    <MoneyInput value={dailyBudget} onChange={setDailyBudget} changed={dailyChanged} />
                    {origDaily && (
                      <p className="text-[9px] font-mono text-slate-700 mt-1">atual: R${origDaily}</p>
                    )}
                  </div>
                  <div>
                    <FieldLabel optional>Orçamento total</FieldLabel>
                    <MoneyInput value={lifetimeBudget} onChange={setLifetimeBudget} changed={lifetimeChanged} />
                    {origLife && (
                      <p className="text-[9px] font-mono text-slate-700 mt-1">atual: R${origLife}</p>
                    )}
                  </div>
                </div>

                {/* Bid strategy */}
                <div>
                  <FieldLabel optional>Estratégia de lance</FieldLabel>
                  <select
                    value={bidStrategy}
                    onChange={e => setBidStrategy(e.target.value)}
                    className={clsx(
                      "w-full bg-surface border rounded-xl px-3 py-2 text-sm text-slate-200 font-mono",
                      "focus:outline-none transition-colors",
                      stratChanged ? "border-green/40" : "border-border focus:border-green/30",
                    )}
                  >
                    {BID_STRATEGIES.map(({ value, label }) => (
                      <option key={value} value={value} className="bg-card">{label}</option>
                    ))}
                  </select>
                </div>

                {/* Schedule */}
                <div className="grid grid-cols-2 gap-3">
                  <DateTimeInput value={startTime} onChange={setStartTime} label="Início da campanha" />
                  <DateTimeInput value={stopTime}  onChange={setStopTime}  label="Término da campanha" />
                </div>

                {/* Objective (read-only info) */}
                {details?.objective && (
                  <div className="flex items-center gap-2 bg-surface border border-border rounded-xl px-3 py-2">
                    <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">Objetivo</span>
                    <span className="text-[10px] font-mono text-slate-500 ml-auto">{details.objective}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ─ Conjuntos de anúncios ─ */}
          <div>
            <SectionTitle
              icon={Users}
              label="Conjuntos de anúncios"
              count={!loadingAdsets ? adsets.length : null}
            />
            {loadingAdsets ? (
              <div className="space-y-2">
                <SkeletonRow /><SkeletonRow />
              </div>
            ) : adsets.length === 0 ? (
              <div className="flex items-center justify-center py-6 text-xs font-mono text-slate-600">
                Nenhum conjunto encontrado para esta campanha
              </div>
            ) : (
              <div className="space-y-2">
                {adsets.map(adset => (
                  <AdsetCard
                    key={adset.id}
                    adset={adset}
                    onChangeAdset={handleAdsetChange}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex-shrink-0 border-t border-border px-6 py-4 space-y-3">
          {error && (
            <div className="flex items-start gap-2 bg-red/5 border border-red/20 rounded-xl px-3 py-2.5">
              <span className="text-red text-xs flex-shrink-0 mt-0.5">✗</span>
              <p className="text-xs font-mono text-red/80 break-words">{error}</p>
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-border text-slate-500 text-xs font-mono hover:text-slate-300 hover:border-slate-600 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || saved}
              className={clsx(
                "flex-1 py-2.5 rounded-xl border text-xs font-mono font-bold transition-all",
                "disabled:opacity-60 active:scale-95",
                saved
                  ? "bg-green/10 border-green/30 text-green"
                  : "bg-green/[0.12] border-green/25 text-green hover:bg-green/20 hover:border-green/40",
              )}
            >
              {saving ? (
                <Loader size={13} className="animate-spin mx-auto" />
              ) : saved ? (
                <span className="flex items-center justify-center gap-1.5">
                  <Check size={12} /> Salvo!
                </span>
              ) : hasAnyChanges ? (
                `Salvar alterações${changesCount > 0 ? ` (${changesCount})` : ""}`
              ) : (
                "Sem alterações"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
