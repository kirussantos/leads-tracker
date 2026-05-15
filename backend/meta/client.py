import json
import requests
from config import META_API_VERSION

BASE_URL = f"https://graph.facebook.com/{META_API_VERSION}"

_INSIGHT_FIELDS = "impressions,reach,clicks,spend,ctr,cpc,frequency,actions,cost_per_action_type"


class MetaClient:
    def __init__(self, token: str, ad_account_id: str):
        self.token = token
        self.ad_account_id = ad_account_id

    def _get(self, endpoint: str, params: dict = {}) -> dict:
        params["access_token"] = self.token
        resp = requests.get(f"{BASE_URL}/{endpoint}", params=params, timeout=30)
        resp.raise_for_status()
        return resp.json()

    def get_campanhas(self, date_preset="last_30d") -> list:
        data = self._get(f"{self.ad_account_id}/campaigns", {
            "fields": "id,name,status",
            "date_preset": date_preset,
            "limit": 100,
        })
        return data.get("data", [])

    def get_insights(self, obj_id: str, date_preset="last_30d") -> dict:
        data = self._get(f"{obj_id}/insights", {
            "fields": _INSIGHT_FIELDS,
            "date_preset": date_preset,
        })
        resultados = data.get("data", [])
        return resultados[0] if resultados else {}

    def get_account_insights_periodo(self, since: str, until: str) -> dict:
        """Totais da conta para um período específico (1 chamada de API)."""
        data = self._get(f"{self.ad_account_id}/insights", {
            "fields": _INSIGHT_FIELDS,
            "time_range": json.dumps({"since": since, "until": until}),
            "level": "account",
        })
        resultados = data.get("data", [])
        return resultados[0] if resultados else {}

    def get_campaign_insights_periodo(self, since: str, until: str) -> list:
        """Insights por campanha para um período específico (1 chamada de API)."""
        data = self._get(f"{self.ad_account_id}/insights", {
            "fields": "campaign_id,campaign_name,spend,impressions,reach,clicks,ctr,cpc,frequency,actions",
            "time_range": json.dumps({"since": since, "until": until}),
            "level": "campaign",
            "limit": 100,
        })
        return data.get("data", [])

    def _post(self, endpoint: str, data: dict = {}) -> dict:
        data["access_token"] = self.token
        resp = requests.post(f"{BASE_URL}/{endpoint}", data=data, timeout=30)
        resp.raise_for_status()
        return resp.json()

    def get_campaign_statuses(self) -> dict:
        """Retorna dict {campaign_id: effective_status} para todos as campanhas da conta."""
        data = self._get(f"{self.ad_account_id}/campaigns", {
            "fields": "id,effective_status",
            "limit": 200,
        })
        return {c["id"]: c.get("effective_status", "UNKNOWN") for c in data.get("data", [])}

    def update_campaign_status(self, campaign_id: str, status: str) -> dict:
        """Pausa ou ativa uma campanha. status deve ser 'PAUSED' ou 'ACTIVE'."""
        return self._post(campaign_id, {"status": status})

    def get_adsets(self, campaign_id: str) -> list:
        data = self._get(f"{campaign_id}/adsets", {"fields": "id,name,status", "limit": 100})
        return data.get("data", [])

    def get_ads(self, adset_id: str) -> list:
        data = self._get(f"{adset_id}/ads", {"fields": "id,name,status", "limit": 100})
        return data.get("data", [])
