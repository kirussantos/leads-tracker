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
