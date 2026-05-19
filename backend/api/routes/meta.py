from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from firebase.db import get_db
from meta.client import MetaClient

router = APIRouter(prefix="/meta", tags=["meta"])


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _get_meta_client(cliente_id: str) -> MetaClient:
    db = get_db()
    doc = db.collection("clientes").document(cliente_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    cliente = doc.to_dict()
    return MetaClient(cliente["meta_token"], cliente["ad_account_id"])


# ─── Schemas ──────────────────────────────────────────────────────────────────

class CampanhaStatusRequest(BaseModel):
    cliente_id: str
    campaign_id: str
    status: str  # "PAUSED" ou "ACTIVE"


class CampanhaBudgetRequest(BaseModel):
    cliente_id: str
    campaign_id: str
    daily_budget: float  # em R$ (ex: 50.00 = R$50,00/dia)


class CampanhaNomeRequest(BaseModel):
    cliente_id: str
    campaign_id: str
    nome: str


class AdsetBudgetRequest(BaseModel):
    cliente_id: str
    adset_id: str
    daily_budget: float  # em R$


class AdsetStatusRequest(BaseModel):
    cliente_id: str
    adset_id: str
    status: str  # "PAUSED" ou "ACTIVE"


class CampanhaAtualizarRequest(BaseModel):
    """Atualização multi-campo de campanha. Apenas os campos presentes são enviados."""
    cliente_id: str
    campaign_id: str
    nome: Optional[str] = None
    status: Optional[str] = None          # ACTIVE | PAUSED
    daily_budget: Optional[float] = None  # R$ (ex: 50.0)
    lifetime_budget: Optional[float] = None
    bid_strategy: Optional[str] = None    # LOWEST_COST_WITHOUT_CAP etc.
    start_time: Optional[str] = None      # ISO 8601 local (datetime-local input)
    stop_time: Optional[str] = None


class AdsetAtualizarRequest(BaseModel):
    """Atualização multi-campo de adset."""
    cliente_id: str
    adset_id: str
    nome: Optional[str] = None
    status: Optional[str] = None
    daily_budget: Optional[float] = None
    lifetime_budget: Optional[float] = None
    bid_amount: Optional[float] = None    # R$ por resultado
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    targeting: Optional[dict] = None      # objeto de targeting completo (age, gênero, etc.)


# ─── Campanhas ────────────────────────────────────────────────────────────────

@router.post("/campanha/status")
def atualizar_status_campanha(body: CampanhaStatusRequest):
    if body.status not in ("PAUSED", "ACTIVE"):
        raise HTTPException(status_code=400, detail="status deve ser 'PAUSED' ou 'ACTIVE'")
    mc = _get_meta_client(body.cliente_id)
    try:
        result = mc.update_campaign_status(body.campaign_id, body.status)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Erro Meta API: {str(e)}")
    if result.get("success"):
        return {"ok": True, "campaign_id": body.campaign_id, "status": body.status}
    raise HTTPException(status_code=502, detail=f"Meta API não confirmou: {result}")


@router.post("/campanha/budget")
def atualizar_budget_campanha(body: CampanhaBudgetRequest):
    """Atualiza o orçamento diário de uma campanha. Envie o valor em R$ (ex: 50.0)."""
    if body.daily_budget <= 0:
        raise HTTPException(status_code=400, detail="daily_budget deve ser maior que zero")
    mc = _get_meta_client(body.cliente_id)
    # Meta API recebe em centavos da moeda local (BRL centavos)
    daily_budget_cents = int(body.daily_budget * 100)
    try:
        result = mc.update_campaign_budget(body.campaign_id, daily_budget_cents)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Erro Meta API: {str(e)}")
    if result.get("success"):
        return {"ok": True, "campaign_id": body.campaign_id, "daily_budget": body.daily_budget}
    raise HTTPException(status_code=502, detail=f"Meta API não confirmou: {result}")


@router.post("/campanha/nome")
def atualizar_nome_campanha(body: CampanhaNomeRequest):
    """Renomeia uma campanha."""
    if not body.nome.strip():
        raise HTTPException(status_code=400, detail="nome não pode ser vazio")
    mc = _get_meta_client(body.cliente_id)
    try:
        result = mc.update_campaign_name(body.campaign_id, body.nome.strip())
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Erro Meta API: {str(e)}")
    if result.get("success"):
        return {"ok": True, "campaign_id": body.campaign_id, "nome": body.nome.strip()}
    raise HTTPException(status_code=502, detail=f"Meta API não confirmou: {result}")


@router.post("/campanha/atualizar")
def atualizar_campanha_multi(body: CampanhaAtualizarRequest):
    """Atualiza múltiplos campos de uma campanha em uma única chamada."""
    mc = _get_meta_client(body.cliente_id)
    fields: dict = {}

    if body.nome is not None:
        if not body.nome.strip():
            raise HTTPException(status_code=400, detail="nome não pode ser vazio")
        fields["name"] = body.nome.strip()
    if body.status is not None:
        if body.status not in ("PAUSED", "ACTIVE"):
            raise HTTPException(status_code=400, detail="status deve ser PAUSED ou ACTIVE")
        fields["status"] = body.status
    if body.daily_budget is not None:
        if body.daily_budget <= 0:
            raise HTTPException(status_code=400, detail="daily_budget deve ser > 0")
        fields["daily_budget"] = int(body.daily_budget * 100)
    if body.lifetime_budget is not None:
        if body.lifetime_budget <= 0:
            raise HTTPException(status_code=400, detail="lifetime_budget deve ser > 0")
        fields["lifetime_budget"] = int(body.lifetime_budget * 100)
    if body.bid_strategy is not None:
        valid = {"LOWEST_COST_WITHOUT_CAP", "LOWEST_COST_WITH_BID_CAP", "COST_CAP", "HIGHEST_VALUE"}
        if body.bid_strategy not in valid:
            raise HTTPException(status_code=400, detail=f"bid_strategy inválida. Use: {valid}")
        fields["bid_strategy"] = body.bid_strategy
    if body.start_time:
        fields["start_time"] = body.start_time
    if body.stop_time:
        fields["stop_time"] = body.stop_time

    if not fields:
        return {"ok": True, "message": "Nenhum campo para atualizar"}

    try:
        result = mc.update_campaign(body.campaign_id, fields)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Erro Meta API: {str(e)}")
    if result.get("success"):
        return {"ok": True, "campaign_id": body.campaign_id, "updated": list(fields.keys())}
    raise HTTPException(status_code=502, detail=f"Meta API não confirmou: {result}")


@router.get("/campanha/{campaign_id}/adsets")
def listar_adsets_campanha(cliente_id: str, campaign_id: str):
    """Lista todos os adsets de uma campanha com campos editáveis (targeting, bid, schedule)."""
    mc = _get_meta_client(cliente_id)
    try:
        data = mc.get_campaign_adsets_full(campaign_id)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Erro Meta API: {str(e)}")
    return data


@router.get("/campanha/{campaign_id}")
def detalhes_campanha(cliente_id: str, campaign_id: str):
    """Retorna detalhes completos de uma campanha (orçamento, status, objetivo)."""
    mc = _get_meta_client(cliente_id)
    try:
        data = mc.get_campaign_details(campaign_id)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Erro Meta API: {str(e)}")
    return data


# ─── Adsets ───────────────────────────────────────────────────────────────────

@router.post("/adset/status")
def atualizar_status_adset(body: AdsetStatusRequest):
    if body.status not in ("PAUSED", "ACTIVE"):
        raise HTTPException(status_code=400, detail="status deve ser 'PAUSED' ou 'ACTIVE'")
    mc = _get_meta_client(body.cliente_id)
    try:
        result = mc.update_campaign_status(body.adset_id, body.status)  # mesmo endpoint POST /{id}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Erro Meta API: {str(e)}")
    if result.get("success"):
        return {"ok": True, "adset_id": body.adset_id, "status": body.status}
    raise HTTPException(status_code=502, detail=f"Meta API não confirmou: {result}")


@router.post("/adset/budget")
def atualizar_budget_adset(body: AdsetBudgetRequest):
    """Atualiza o orçamento diário de um adset. Envie o valor em R$ (ex: 50.0)."""
    if body.daily_budget <= 0:
        raise HTTPException(status_code=400, detail="daily_budget deve ser maior que zero")
    mc = _get_meta_client(body.cliente_id)
    daily_budget_cents = int(body.daily_budget * 100)
    try:
        result = mc.update_adset_budget(body.adset_id, daily_budget_cents)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Erro Meta API: {str(e)}")
    if result.get("success"):
        return {"ok": True, "adset_id": body.adset_id, "daily_budget": body.daily_budget}
    raise HTTPException(status_code=502, detail=f"Meta API não confirmou: {result}")


@router.post("/adset/atualizar")
def atualizar_adset_multi(body: AdsetAtualizarRequest):
    """Atualiza múltiplos campos de um adset (nome, status, orçamento, lance, targeting)."""
    mc = _get_meta_client(body.cliente_id)
    fields: dict = {}

    if body.nome is not None:
        if not body.nome.strip():
            raise HTTPException(status_code=400, detail="nome não pode ser vazio")
        fields["name"] = body.nome.strip()
    if body.status is not None:
        if body.status not in ("PAUSED", "ACTIVE"):
            raise HTTPException(status_code=400, detail="status deve ser PAUSED ou ACTIVE")
        fields["status"] = body.status
    if body.daily_budget is not None:
        if body.daily_budget <= 0:
            raise HTTPException(status_code=400, detail="daily_budget deve ser > 0")
        fields["daily_budget"] = int(body.daily_budget * 100)
    if body.lifetime_budget is not None:
        if body.lifetime_budget <= 0:
            raise HTTPException(status_code=400, detail="lifetime_budget deve ser > 0")
        fields["lifetime_budget"] = int(body.lifetime_budget * 100)
    if body.bid_amount is not None:
        fields["bid_amount"] = int(body.bid_amount * 100) if body.bid_amount > 0 else 0
    if body.start_time:
        fields["start_time"] = body.start_time
    if body.end_time:
        fields["end_time"] = body.end_time
    if body.targeting is not None:
        fields["targeting"] = body.targeting  # MetaClient.update_adset serializa para JSON

    if not fields:
        return {"ok": True, "message": "Nenhum campo para atualizar"}

    try:
        result = mc.update_adset(body.adset_id, fields)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Erro Meta API: {str(e)}")
    if result.get("success"):
        return {"ok": True, "adset_id": body.adset_id, "updated": list(fields.keys())}
    raise HTTPException(status_code=502, detail=f"Meta API não confirmou: {result}")


@router.get("/adset/{adset_id}")
def detalhes_adset(cliente_id: str, adset_id: str):
    """Retorna detalhes de um adset."""
    mc = _get_meta_client(cliente_id)
    try:
        data = mc.get_adset_details(adset_id)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Erro Meta API: {str(e)}")
    return data


# ─── Saldo & Criativos ────────────────────────────────────────────────────────

@router.get("/conta/saldo")
def get_conta_saldo(cliente_id: str):
    """Retorna saldo prepago e metadados da conta de anúncios."""
    db = get_db()
    doc = db.collection("clientes").document(cliente_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    cliente = doc.to_dict()
    mc = MetaClient(cliente["meta_token"], cliente["ad_account_id"])
    try:
        info = mc.get_account_info()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Erro Meta API: {str(e)}")

    # Meta retorna valores em centavos da moeda local (BRL centavos → ÷ 100)
    divisor = 100
    balance       = int(info.get("balance",       0)) / divisor
    amount_spent  = int(info.get("amount_spent",  0)) / divisor
    spend_cap_raw = info.get("spend_cap")
    spend_cap     = int(spend_cap_raw) / divisor if spend_cap_raw and str(spend_cap_raw) != "0" else None

    return {
        "cliente_id":   cliente_id,
        "nome":         cliente.get("nome", "—"),
        "ad_account_id": cliente.get("ad_account_id", "—"),
        "currency":     info.get("currency", "BRL"),
        "balance":      balance,
        "amount_spent": amount_spent,
        "spend_cap":    spend_cap,
    }


@router.get("/conta/criativos")
def get_criativos_periodo(cliente_id: str, since: str, until: str):
    """Retorna os melhores anúncios do período com métricas e preview do criativo."""
    mc = _get_meta_client(cliente_id)
    try:
        insights      = mc.get_ad_insights_periodo(since, until)
        creative_list = mc.get_ads_creative_info()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Erro Meta API: {str(e)}")

    # Mapa ad_id → urls do criativo
    creative_map: dict = {}
    for ad in creative_list:
        creative = ad.get("creative") or {}
        creative_map[ad["id"]] = {
            "thumbnail_url": creative.get("thumbnail_url"),
            "image_url":     creative.get("image_url"),
        }

    result = []
    for row in insights:
        ad_id       = row.get("ad_id", "")
        spend       = float(row.get("spend", 0))
        impressions = int(row.get("impressions", 0))
        clicks      = int(row.get("clicks", 0))
        actions     = row.get("actions") or []

        # Cliques WhatsApp: abarca os principais tipos de evento
        wpp_clicks = sum(
            int(a.get("value", 0))
            for a in actions
            if any(kw in a.get("action_type", "")
                   for kw in ("whatsapp", "messaging_conversation", "click_to_call"))
        )

        ctr       = float(row.get("ctr",       0))
        cpc       = float(row.get("cpc",       0))
        frequency = float(row.get("frequency", 0))
        cpl       = spend / wpp_clicks if wpp_clicks > 0 else None
        cpm       = (spend / impressions * 1000) if impressions > 0 else 0.0

        creative = creative_map.get(ad_id, {})
        result.append({
            "ad_id":         ad_id,
            "ad_name":       row.get("ad_name",       "—"),
            "adset_id":      row.get("adset_id",      ""),
            "adset_name":    row.get("adset_name",    "—"),
            "campaign_id":   row.get("campaign_id",   ""),
            "campaign_name": row.get("campaign_name", "—"),
            "spend":         spend,
            "impressions":   impressions,
            "clicks":        clicks,
            "wpp_clicks":    wpp_clicks,
            "ctr":           ctr,
            "cpc":           cpc,
            "cpl":           cpl,
            "cpm":           cpm,
            "frequency":     frequency,
            "thumbnail_url": creative.get("thumbnail_url"),
            "image_url":     creative.get("image_url"),
        })

    # Ordena por leads WPP desc, depois spend desc
    result.sort(key=lambda x: (-x["wpp_clicks"], -x["spend"]))
    return result[:50]
