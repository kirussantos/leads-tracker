import json
import os
import requests as http_requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from firebase_admin import auth
from firebase.db import get_db  # garante que o app firebase está inicializado

router = APIRouter(prefix="/setup", tags=["setup"])

SECRET = "feb-setup-2024"


def _get_access_token() -> str:
    """Gera um access token OAuth2 usando o service account do Firebase."""
    from google.oauth2 import service_account
    from google.auth.transport.requests import Request

    creds_json = os.getenv("FIREBASE_CREDENTIALS_JSON")
    creds_dict = json.loads(creds_json)
    credentials = service_account.Credentials.from_service_account_info(
        creds_dict,
        scopes=["https://www.googleapis.com/auth/cloud-platform"],
    )
    credentials.refresh(Request())
    return credentials.token


def _enable_email_password_provider(project_id: str) -> dict:
    """Ativa Email/Senha como provedor de login via Identity Platform REST API."""
    token = _get_access_token()
    url = f"https://identitytoolkit.googleapis.com/admin/v2/projects/{project_id}/config"
    resp = http_requests.patch(
        url,
        json={"signIn": {"email": {"enabled": True, "passwordRequired": True}}},
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        params={"updateMask": "signIn.email.enabled,signIn.email.passwordRequired"},
        timeout=15,
    )
    return resp.json()


class CriarAdminRequest(BaseModel):
    secret: str
    email: str
    password: str


@router.post("/criar-admin")
def criar_admin(body: CriarAdminRequest):
    """Cria usuário admin e ativa Email/Senha no Firebase Auth."""
    if body.secret != SECRET:
        raise HTTPException(status_code=403, detail="Secret inválido.")

    # 1. Ativa o provedor Email/Senha
    try:
        creds_json = os.getenv("FIREBASE_CREDENTIALS_JSON")
        project_id = json.loads(creds_json).get("project_id", "leads-tracker-d3d96")
        provider_result = _enable_email_password_provider(project_id)
    except Exception as e:
        provider_result = {"erro_provider": str(e)}

    # 2. Cria (ou confirma existência de) usuário
    try:
        user = auth.create_user(
            email=body.email,
            password=body.password,
            email_verified=True,
        )
        user_result = {"uid": user.uid, "email": user.email, "novo": True}
    except auth.EmailAlreadyExistsError:
        user_result = {"info": "Usuário já existe.", "novo": False}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao criar usuário: {str(e)}")

    return {"ok": True, "provider": provider_result, "usuario": user_result}


@router.post("/ativar-email-provider")
def ativar_email_provider(secret: str):
    """Ativa Email/Senha sem criar usuário — endpoint auxiliar."""
    if secret != SECRET:
        raise HTTPException(status_code=403, detail="Secret inválido.")
    try:
        creds_json = os.getenv("FIREBASE_CREDENTIALS_JSON")
        project_id = json.loads(creds_json).get("project_id", "leads-tracker-d3d96")
        result = _enable_email_password_provider(project_id)
        return {"ok": True, "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/adicionar-dominio")
def adicionar_dominio(secret: str, dominio: str):
    """Adiciona um domínio à lista de authorized domains do Firebase Auth."""
    if secret != SECRET:
        raise HTTPException(status_code=403, detail="Secret inválido.")
    try:
        creds_json = os.getenv("FIREBASE_CREDENTIALS_JSON")
        project_id = json.loads(creds_json).get("project_id", "leads-tracker-d3d96")
        token = _get_access_token()
        base_url = f"https://identitytoolkit.googleapis.com/admin/v2/projects/{project_id}/config"
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

        # Busca domínios atuais
        current = http_requests.get(base_url, headers=headers, timeout=15).json()
        existing = current.get("authorizedDomains", [])

        if dominio in existing:
            return {"ok": True, "info": f"{dominio} já estava na lista.", "dominios": existing}

        updated = existing + [dominio]
        result = http_requests.patch(
            base_url,
            json={"authorizedDomains": updated},
            headers=headers,
            params={"updateMask": "authorizedDomains"},
            timeout=15,
        ).json()
        return {"ok": True, "dominios": result.get("authorizedDomains", updated)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
