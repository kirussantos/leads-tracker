from fastapi import APIRouter
from meta.insights import sincronizar_cliente, sincronizar_todos
from firebase.db import get_db

router = APIRouter(prefix="/sync", tags=["sync"])


@router.post("/todos")
def sync_todos():
    sincronizar_todos()
    return {"mensagem": "Sync concluido"}


@router.post("/cliente/{cliente_id}")
def sync_cliente(cliente_id: str):
    db = get_db()
    doc = db.collection("clientes").document(cliente_id).get()
    if not doc.exists:
        return {"erro": "Cliente nao encontrado"}
    registros = sincronizar_cliente(cliente_id, doc.to_dict())
    return {"registros": registros}
