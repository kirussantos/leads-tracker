import json
import os
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
from firebase.db import get_db, collection_to_list

SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]


def get_sheets_service():
    creds_json = os.getenv("GOOGLE_SHEETS_CREDENTIALS_JSON")
    creds_dict = json.loads(creds_json)
    creds = Credentials.from_service_account_info(creds_dict, scopes=SCOPES)
    return build("sheets", "v4", credentials=creds)


def exportar_para_sheets():
    spreadsheet_id = os.getenv("GOOGLE_SPREADSHEET_ID")
    if not spreadsheet_id:
        print("[SHEETS] GOOGLE_SPREADSHEET_ID não configurado")
        return

    db = get_db()
    campanhas = collection_to_list(db.collection("campanhas").stream())

    rows = [["Cliente ID", "Nome", "Nível", "Status", "Verba", "Cliques WPP", "CTR", "CPC", "CPL Estimado"]]
    for c in campanhas:
        rows.append([
            c.get("cliente_id", ""),
            c.get("nome", ""),
            c.get("nivel", ""),
            c.get("status", ""),
            c.get("verba_gasta", 0),
            c.get("cliques_whatsapp", 0),
            c.get("ctr", 0),
            c.get("cpc", 0),
            c.get("cpl_estimado", 0),
        ])

    service = get_sheets_service()
    service.spreadsheets().values().update(
        spreadsheetId=spreadsheet_id,
        range="Campanhas!A1",
        valueInputOption="RAW",
        body={"values": rows},
    ).execute()
    print(f"[SHEETS] {len(rows) - 1} campanhas exportadas")
