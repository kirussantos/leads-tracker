"""
Verifica campanhas com baixo desempenho e envia alertas por email.

Thresholds (configuráveis via env vars):
  ALERTA_CPL_MAX     → CPL máximo aceitável em R$ (padrão: 30)
  ALERTA_CTR_MIN     → CTR mínimo em % (padrão: 0.8)
  ALERTA_FREQ_MAX    → Frequência máxima (padrão: 3.5)
  ALERTA_GASTO_MIN   → Gasto mínimo p/ considerar campanha relevante em R$ (padrão: 30)
"""
import os
from datetime import datetime, timedelta
from firebase.db import get_db
from meta.client import MetaClient
from meta.insights import _cliques_whatsapp
from mail.sender import enviar_para_lista
from mail.templates import template_alerta_campanhas
import json

CPL_MAX   = float(os.getenv("ALERTA_CPL_MAX",   "30"))
CTR_MIN   = float(os.getenv("ALERTA_CTR_MIN",   "0.8"))
FREQ_MAX  = float(os.getenv("ALERTA_FREQ_MAX",  "3.5"))
GASTO_MIN = float(os.getenv("ALERTA_GASTO_MIN", "30"))


def _get_destinatarios() -> list[str]:
    """Busca os emails de todos os usuários cadastrados no Firebase Auth."""
    try:
        import firebase_admin.auth as fb_auth
        users = fb_auth.list_users()
        return [u.email for u in users.users if u.email]
    except Exception as e:
        print(f"[ALERTAS] Erro ao buscar usuários: {e}")
        return []


def _analisar_campanha(c: dict) -> list[str]:
    """Retorna lista de motivos de alerta para uma campanha. Vazio = campanha saudável."""
    motivos = []
    verba  = c.get("verba", 0)
    cpl    = c.get("cpl_estimado", 0)
    ctr    = c.get("ctr", 0)
    freq   = c.get("frequencia", 0)
    leads  = c.get("cliques_wpp", 0)

    if verba < GASTO_MIN:
        return []  # pouco gasto, não vale alertar

    if cpl > CPL_MAX and leads > 0:
        motivos.append(f"CPL alto: R${cpl:.0f}")
    if ctr < CTR_MIN and ctr > 0:
        motivos.append(f"CTR baixo: {ctr:.2f}%")
    if freq > FREQ_MAX:
        motivos.append(f"Frequência: {freq:.1f}x")
    if verba > 50 and leads == 0:
        motivos.append("Sem leads WhatsApp")

    return motivos


def verificar_e_alertar_cliente(cliente_id: str, cliente: dict) -> dict:
    """Verifica as campanhas de um cliente e envia email se houver problemas."""
    resultado = {"cliente": cliente.get("nome"), "alertas": 0, "enviado": False}

    try:
        mc = MetaClient(cliente["meta_token"], cliente["ad_account_id"])
        until = datetime.today().strftime("%Y-%m-%d")
        since = (datetime.today() - timedelta(days=7)).strftime("%Y-%m-%d")
        campanhas_raw = mc.get_campaign_insights_periodo(since, until)
    except Exception as e:
        print(f"[ALERTAS] Erro ao buscar dados de {cliente.get('nome')}: {e}")
        return resultado

    campanhas_ruins = []
    for c_raw in campanhas_raw:
        actions  = c_raw.get("actions", [])
        leads    = _cliques_whatsapp(actions)
        verba    = float(c_raw.get("spend", 0))
        ctr      = float(c_raw.get("ctr", 0))
        freq     = float(c_raw.get("frequency", 0))
        cpl      = verba / leads if leads > 0 else 0

        campanha_dict = {
            "nome":          c_raw.get("campaign_name", "—"),
            "verba":         verba,
            "cpl_estimado":  cpl,
            "ctr":           ctr,
            "frequencia":    freq,
            "cliques_wpp":   leads,
        }
        motivos = _analisar_campanha(campanha_dict)
        if motivos:
            campanhas_ruins.append({**campanha_dict, "motivos": motivos})

    if not campanhas_ruins:
        print(f"[ALERTAS] {cliente.get('nome')}: tudo ok, sem alertas.")
        return resultado

    resultado["alertas"] = len(campanhas_ruins)
    destinatarios = _get_destinatarios()
    if not destinatarios:
        print(f"[ALERTAS] Sem destinatários configurados.")
        return resultado

    html = template_alerta_campanhas(
        cliente_nome=cliente.get("nome", "Cliente"),
        campanhas_ruins=campanhas_ruins,
        periodo=f"{since} a {until}",
    )
    assunto = f"⚠️ {len(campanhas_ruins)} campanha(s) com baixo desempenho — {cliente.get('nome')}"
    enviados = enviar_para_lista(destinatarios, assunto, html)
    resultado["enviado"] = enviados > 0
    return resultado


def verificar_todos_clientes() -> list[dict]:
    """Verifica todos os clientes ativos e dispara alertas."""
    print("[ALERTAS] Iniciando verificação de campanhas...")
    db = get_db()
    docs = db.collection("clientes").stream()
    resultados = []
    for doc in docs:
        cliente = doc.to_dict()
        if not cliente.get("meta_token") or not cliente.get("ad_account_id"):
            continue
        r = verificar_e_alertar_cliente(doc.id, cliente)
        resultados.append(r)
        print(f"[ALERTAS] {r['cliente']}: {r['alertas']} alertas, email={'sim' if r['enviado'] else 'não'}")
    return resultados
