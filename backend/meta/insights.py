from meta.client import MetaClient
from firebase.db import get_db
from datetime import datetime


def _cliques_whatsapp(actions: list) -> int:
    for a in actions or []:
        if a.get("action_type") in [
            "onsite_conversion.messaging_first_reply",
            "click_to_whatsapp",
            "whatsapp_contact",
        ]:
            return int(a.get("value", 0))
    return 0


def sincronizar_cliente(cliente_id: str, cliente_data: dict) -> int:
    """Sincroniza cliente com Meta API e grava no Firestore. Retorna qtd de registros."""
    db = get_db()
    mc = MetaClient(cliente_data["meta_token"], cliente_data["ad_account_id"])
    registros = 0
    agora = datetime.now()

    try:
        campanhas = mc.get_campanhas()
        for campanha in campanhas:
            insights = mc.get_insights(campanha["id"])
            if not insights:
                continue

            actions = insights.get("actions", [])
            cliques_wpp = _cliques_whatsapp(actions)
            spend = float(insights.get("spend", 0))
            cliques = int(insights.get("clicks", 0))

            camp_ref = db.collection("campanhas").document(
                f"{cliente_id}_{campanha['id']}_campaign"
            )
            camp_ref.set({
                "cliente_id": cliente_id,
                "meta_campaign_id": campanha["id"],
                "meta_ad_id": None,
                "nivel": "campaign",
                "nome": campanha["name"],
                "status": campanha.get("status", "UNKNOWN"),
                "verba_gasta": spend,
                "impressoes": int(insights.get("impressions", 0)),
                "cliques": cliques,
                "cliques_whatsapp": cliques_wpp,
                "ctr": float(insights.get("ctr", 0)),
                "cpc": float(insights.get("cpc", 0)),
                "cpl_estimado": spend / cliques_wpp if cliques_wpp > 0 else 0,
                "atualizado_em": agora,
            }, merge=True)
            registros += 1

            try:
                for adset in mc.get_adsets(campanha["id"]):
                    for ad in mc.get_ads(adset["id"]):
                        insights_ad = mc.get_insights(ad["id"])
                        if not insights_ad:
                            continue

                        actions_ad = insights_ad.get("actions", [])
                        cliques_wpp_ad = _cliques_whatsapp(actions_ad)
                        spend_ad = float(insights_ad.get("spend", 0))

                        ad_ref = db.collection("campanhas").document(
                            f"{cliente_id}_{ad['id']}_ad"
                        )
                        ad_ref.set({
                            "cliente_id": cliente_id,
                            "meta_campaign_id": campanha["id"],
                            "meta_ad_id": ad["id"],
                            "nivel": "ad",
                            "nome": ad["name"],
                            "status": ad.get("status", "UNKNOWN"),
                            "verba_gasta": spend_ad,
                            "cliques": int(insights_ad.get("clicks", 0)),
                            "cliques_whatsapp": cliques_wpp_ad,
                            "ctr": float(insights_ad.get("ctr", 0)),
                            "cpc": float(insights_ad.get("cpc", 0)),
                            "cpl_estimado": spend_ad / cliques_wpp_ad if cliques_wpp_ad > 0 else 0,
                            "atualizado_em": agora,
                        }, merge=True)
                        registros += 1
            except Exception as e:
                print(f"[INSIGHTS] Erro nível ad: {e}")

    except Exception as e:
        print(f"[SYNC] Erro cliente {cliente_id}: {e}")

    print(f"[SYNC] {cliente_data.get('nome')}: {registros} registros")
    return registros


def sincronizar_todos():
    """Sincroniza todos os clientes ativos."""
    db = get_db()
    clientes = db.collection("clientes").where("ativo", "==", True).stream()
    total = 0
    for doc in clientes:
        total += sincronizar_cliente(doc.id, doc.to_dict())
    print(f"[SYNC] Total: {total} registros atualizados")
