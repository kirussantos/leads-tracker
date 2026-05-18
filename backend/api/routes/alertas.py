from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from alertas.checker import verificar_todos_clientes, verificar_e_alertar_cliente
from email.sender import enviar_email
from email.templates import template_alerta_campanhas
from firebase.db import get_db

router = APIRouter(prefix="/alertas", tags=["alertas"])


class TesteEmailBody(BaseModel):
    email: str


@router.post("/verificar")
def verificar_alertas():
    """Dispara verificação manual de campanhas e envia alertas."""
    resultados = verificar_todos_clientes()
    total_alertas = sum(r.get("alertas", 0) for r in resultados)
    total_emails  = sum(1 for r in resultados if r.get("enviado"))
    return {
        "clientes_verificados": len(resultados),
        "campanhas_com_problema": total_alertas,
        "emails_enviados": total_emails,
        "detalhes": resultados,
    }


@router.post("/verificar/{cliente_id}")
def verificar_cliente(cliente_id: str):
    """Dispara verificação para um cliente específico."""
    db = get_db()
    doc = db.collection("clientes").document(cliente_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    resultado = verificar_e_alertar_cliente(cliente_id, doc.to_dict())
    return resultado


@router.post("/teste-email")
def teste_email(body: TesteEmailBody):
    """Envia um email de teste para verificar a configuração SMTP."""
    html = template_alerta_campanhas(
        cliente_nome="Cliente Teste",
        campanhas_ruins=[
            {
                "nome": "[EXEMPLO] Campanha com CTR baixo",
                "verba": 320.0,
                "cpl_estimado": 45.0,
                "ctr": 0.45,
                "frequencia": 4.2,
                "cliques_wpp": 7,
                "motivos": ["CPL alto: R$45", "CTR baixo: 0.45%", "Frequência: 4.2x"],
            }
        ],
        periodo="Teste de configuração",
    )
    ok = enviar_email(body.email, "✅ Teste de alerta — leads.tracker", html)
    if ok:
        return {"ok": True, "mensagem": f"Email enviado para {body.email}"}
    raise HTTPException(
        status_code=500,
        detail="Falha ao enviar email. Verifique GMAIL_USER e GMAIL_APP_PASSWORD no Render."
    )


@router.get("/config")
def config_alertas():
    """Retorna os thresholds ativos de alerta."""
    import os
    return {
        "cpl_max":   float(os.getenv("ALERTA_CPL_MAX",   "30")),
        "ctr_min":   float(os.getenv("ALERTA_CTR_MIN",   "0.8")),
        "freq_max":  float(os.getenv("ALERTA_FREQ_MAX",  "3.5")),
        "gasto_min": float(os.getenv("ALERTA_GASTO_MIN", "30")),
        "gmail_configurado": bool(os.getenv("GMAIL_USER") and os.getenv("GMAIL_APP_PASSWORD")),
    }
