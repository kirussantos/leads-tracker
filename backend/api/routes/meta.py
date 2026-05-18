from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
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


@router.get("/adset/{adset_id}")
def detalhes_adset(cliente_id: str, adset_id: str):
    """Retorna detalhes de um adset."""
    mc = _get_meta_client(cliente_id)
    try:
        data = mc.get_adset_details(adset_id)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Erro Meta API: {str(e)}")
    return data
