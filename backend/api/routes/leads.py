from fastapi import APIRouter
from pydantic import BaseModel
from firebase.db import get_db
from firebase_admin import firestore
from datetime import datetime

router = APIRouter(prefix="/leads", tags=["leads"])


class LeadCreate(BaseModel):
    link_id: str
    cliente_id: str
    nome_lead: str = None
    telefone: str = None
    observacao: str = None


class LeadConversao(BaseModel):
    lead_id: str
    converteu: bool


@router.post("/registrar")
def registrar_lead(data: LeadCreate):
    db = get_db()
    ref = db.collection("leads").document()
    ref.set({
        "link_id": data.link_id,
        "cliente_id": data.cliente_id,
        "nome_lead": data.nome_lead,
        "telefone": data.telefone,
        "observacao": data.observacao,
        "converteu": False,
        "registrado_em": datetime.now(),
    })
    db.collection("links").document(data.link_id).update({
        "total_cliques": firestore.Increment(1)
    })
    return {"id": ref.id, "mensagem": "Lead registrado"}


@router.patch("/conversao")
def marcar_conversao(data: LeadConversao):
    db = get_db()
    db.collection("leads").document(data.lead_id).update({"converteu": data.converteu})
    lead = db.collection("leads").document(data.lead_id).get().to_dict()
    if data.converteu and lead.get("link_id"):
        db.collection("links").document(lead["link_id"]).update({
            "total_conversoes": firestore.Increment(1)
        })
    return {"mensagem": "Conversao atualizada"}
