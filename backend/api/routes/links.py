from fastapi import APIRouter
from pydantic import BaseModel
from urllib.parse import quote
from firebase.db import get_db, collection_to_list
from datetime import datetime
import qrcode
import io
import base64

router = APIRouter(prefix="/links", tags=["links"])


class LinkCreate(BaseModel):
    cliente_id: str
    campanha_nome: str
    criativo_nome: str
    mensagem_custom: str = None


@router.post("/gerar")
def gerar_link(data: LinkCreate):
    db = get_db()
    cliente = db.collection("clientes").document(data.cliente_id).get()
    if not cliente.exists:
        return {"erro": "Cliente não encontrado"}

    c = cliente.to_dict()
    identificador = f"{c['nome']}-{data.campanha_nome}-{data.criativo_nome}".replace(" ", "-")
    mensagem = data.mensagem_custom or f"Ola! Vim pelo anuncio: {data.campanha_nome} | {data.criativo_nome}"
    numero = c["whatsapp_numero"].replace("+", "").replace(" ", "")
    link = f"https://wa.me/{numero}?text={quote(mensagem)}"

    ref = db.collection("links").document()
    ref.set({
        "cliente_id": data.cliente_id,
        "nome_identificador": identificador,
        "campanha_nome": data.campanha_nome,
        "criativo_nome": data.criativo_nome,
        "link_gerado": link,
        "mensagem_preenchida": mensagem,
        "total_cliques": 0,
        "total_conversoes": 0,
        "criado_em": datetime.now(),
    })

    qr = qrcode.make(link)
    buf = io.BytesIO()
    qr.save(buf, format="PNG")
    qr_b64 = base64.b64encode(buf.getvalue()).decode()

    return {"id": ref.id, "identificador": identificador, "link": link, "qr_code_base64": qr_b64}


@router.get("/cliente/{cliente_id}")
def listar_links(cliente_id: str):
    db = get_db()
    return collection_to_list(
        db.collection("links").where("cliente_id", "==", cliente_id).stream()
    )
