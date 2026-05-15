from fastapi import APIRouter, Query
from firebase.db import get_db
from meta.client import MetaClient
from meta.insights import _cliques_whatsapp, _mensagens_enviadas

router = APIRouter(prefix="/insights", tags=["insights"])


@router.get("/periodo")
def insights_periodo(
    cliente_id: str = Query(...),
    since: str = Query(...),
    until: str = Query(...),
):
    db = get_db()
    doc = db.collection("clientes").document(cliente_id).get()
    if not doc.exists:
        return {"erro": "Cliente não encontrado"}

    cliente = doc.to_dict()
    mc = MetaClient(cliente["meta_token"], cliente["ad_account_id"])

    try:
        account = mc.get_account_insights_periodo(since, until)
        campanhas_raw = mc.get_campaign_insights_periodo(since, until)
    except Exception as e:
        return {"erro": str(e)}

    actions = account.get("actions", [])
    total_wpp = _cliques_whatsapp(actions)
    total_msgs = _mensagens_enviadas(actions)
    total_verba = float(account.get("spend", 0))
    total_impressoes = int(account.get("impressions", 0))
    total_alcance = int(account.get("reach", 0))
    total_cliques = int(account.get("clicks", 0))
    freq_media = float(account.get("frequency", 0))

    cpl = total_verba / total_wpp if total_wpp > 0 else 0
    ctr = (total_cliques / total_impressoes * 100) if total_impressoes > 0 else 0
    cpm = (total_verba / total_impressoes * 1000) if total_impressoes > 0 else 0
    custo_por_msg = total_verba / total_msgs if total_msgs > 0 else 0

    campanhas_lista = []
    for c in campanhas_raw:
        c_actions = c.get("actions", [])
        c_wpp = _cliques_whatsapp(c_actions)
        c_verba = float(c.get("spend", 0))
        c_imp = int(c.get("impressions", 0))
        c_cliques = int(c.get("clicks", 0))
        campanhas_lista.append({
            "id": c.get("campaign_id", ""),
            "nome": c.get("campaign_name", ""),
            "status": "ACTIVE",
            "verba": c_verba,
            "impressoes": c_imp,
            "alcance": int(c.get("reach", 0)),
            "cliques": c_cliques,
            "cliques_wpp": c_wpp,
            "ctr": float(c.get("ctr", 0)),
            "cpc": float(c.get("cpc", 0)),
            "cpl_estimado": c_verba / c_wpp if c_wpp > 0 else 0,
            "frequencia": float(c.get("frequency", 0)),
        })

    campanhas_lista.sort(key=lambda x: x["cliques_wpp"], reverse=True)

    return {
        "verba": total_verba,
        "impressoes": total_impressoes,
        "alcance": total_alcance,
        "cliques": total_cliques,
        "cliques_wpp": total_wpp,
        "mensagens_enviadas": total_msgs,
        "custo_por_mensagem": custo_por_msg,
        "ctr_medio": ctr,
        "cpm": cpm,
        "cpl_estimado": cpl,
        "frequencia_media": freq_media,
        "n_campanhas": len(campanhas_lista),
        "campanhas": campanhas_lista,
    }
