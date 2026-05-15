import firebase_admin
from firebase_admin import credentials, firestore
import json
import os

_app = None


def get_db():
    """Retorna cliente Firestore. Inicializa o app na primeira chamada."""
    global _app
    if _app is None:
        creds_json = os.getenv("FIREBASE_CREDENTIALS_JSON")
        creds_dict = json.loads(creds_json)
        cred = credentials.Certificate(creds_dict)
        _app = firebase_admin.initialize_app(cred)
    return firestore.client()


def doc_to_dict(doc) -> dict:
    """Converte DocumentSnapshot para dict com id incluído."""
    if not doc.exists:
        return None
    data = doc.to_dict()
    data["id"] = doc.id
    return data


def collection_to_list(query) -> list[dict]:
    """Converte Query ou StreamGenerator para lista de dicts."""
    return [doc_to_dict(d) for d in query]
