from fastapi import APIRouter
from pydantic import BaseModel
from firebase.db import get_db, collection_to_list
from datetime import datetime

router = APIRouter(prefix="/clientes", tags=["clientes"])


class ClienteCreate(BaseModel):
    nome: str
    ad_account_id: str
    meta_token: str
    whatsapp_numero: str


@router.post("/")
def criar_cliente(data: ClienteCreate):
    db = get_db()
    ref = db.collection("clientes").document()
    ref.set({
        "nome": data.nome,
        "ad_account_id": data.ad_account_id,
        "meta_token": data.meta_token,
        "whatsapp_numero": data.whatsapp_numero,
        "ativo": True,
        "criado_em": datetime.now(),
    })
    return {"id": ref.id, "mensagem": "Cliente criado"}


@router.get("/")
def listar_clientes():
    db = get_db()
    return collection_to_list(
        db.collection("clientes").where("ativo", "==", True).stream()
    )


@router.delete("/{cliente_id}")
def desativar_cliente(cliente_id: str):
    db = get_db()
    db.collection("clientes").document(cliente_id).update({"ativo": False})
    return {"mensagem": "Cliente desativado"}
