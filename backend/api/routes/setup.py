from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from firebase_admin import auth
from firebase.db import get_db  # garante que o app firebase está inicializado

router = APIRouter(prefix="/setup", tags=["setup"])


class CriarAdminRequest(BaseModel):
    secret: str
    email: str
    password: str


@router.post("/criar-admin")
def criar_admin(body: CriarAdminRequest):
    """Cria um usuário no Firebase Auth. Endpoint de uso único — protegido por secret."""
    if body.secret != "feb-setup-2024":
        raise HTTPException(status_code=403, detail="Secret inválido.")

    try:
        user = auth.create_user(
            email=body.email,
            password=body.password,
            email_verified=True,
        )
        return {"ok": True, "uid": user.uid, "email": user.email}
    except auth.EmailAlreadyExistsError:
        return {"ok": True, "info": "Usuário já existe — pode fazer login normalmente."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
