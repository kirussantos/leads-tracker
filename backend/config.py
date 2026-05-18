import os
from dotenv import load_dotenv

load_dotenv()

META_API_VERSION = os.getenv("META_API_VERSION", "v22.0")
BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")
INTERVALO_SYNC_HORAS = int(os.getenv("INTERVALO_SYNC_HORAS", 6))
GOOGLE_SHEETS_CREDENTIALS_JSON = os.getenv("GOOGLE_SHEETS_CREDENTIALS_JSON")
GOOGLE_SPREADSHEET_ID = os.getenv("GOOGLE_SPREADSHEET_ID")
