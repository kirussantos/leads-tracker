from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from firebase.db import get_db
from meta.client import MetaClient

router = APIRouter(prefix="/meta", tags=["meta"])


class CampanhaStatusRequest(BaseModel):
    cliente_id: str
    campaign_id: str
    status: str  # "PAUSED" ou "ACTIVE"


@router.post("/campanha/status")
def atualizar_status_campanha(body: CampanhaStatusRequest):
    if body.status not in ("PAUSED", "ACTIVE"):
        raise HTTPException(status_code=400, detail="status deve ser 'PAUSED' ou 'ACTIVE'")

    db = get_db()
    doc = db.collection("clientes").document(body.cliente_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    cliente = doc.to_dict()
    mc = MetaClient(cliente["meta_token"], cliente["ad_account_id"])

    try:
        result = mc.update_campaign_status(body.campaign_id, body.status)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Erro Meta API: {str(e)}")

    if result.get("success"):
        return {"ok": True, "campaign_id": body.campaign_id, "status": body.status}
    else:
        raise HTTPException(status_code=502, detail=f"Meta API não confirmou: {result}")
