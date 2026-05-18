"""
Email sender using Gmail SMTP (App Password).
Env vars needed:
  GMAIL_USER         → seu email Gmail (ex: elber@gmail.com)
  GMAIL_APP_PASSWORD → App Password do Google (não a senha normal)
                       Gerar em: myaccount.google.com/apppasswords
"""
import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

GMAIL_USER     = os.getenv("GMAIL_USER", "")
GMAIL_PASSWORD = os.getenv("GMAIL_APP_PASSWORD", "")


def enviar_email(destinatario: str, assunto: str, html: str) -> bool:
    if not GMAIL_USER or not GMAIL_PASSWORD:
        print(f"[EMAIL] Credenciais não configuradas — email não enviado para {destinatario}")
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = assunto
        msg["From"]    = f"Leads Tracker <{GMAIL_USER}>"
        msg["To"]      = destinatario
        msg.attach(MIMEText(html, "html", "utf-8"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=15) as server:
            server.login(GMAIL_USER, GMAIL_PASSWORD)
            server.sendmail(GMAIL_USER, destinatario, msg.as_string())
        print(f"[EMAIL] ✓ Enviado para {destinatario}: {assunto}")
        return True
    except Exception as e:
        print(f"[EMAIL] ✗ Erro ao enviar para {destinatario}: {e}")
        return False


def enviar_para_lista(destinatarios: list[str], assunto: str, html: str) -> int:
    """Envia o mesmo email para uma lista de destinatários. Retorna quantos foram enviados."""
    enviados = 0
    for email in destinatarios:
        if enviar_email(email, assunto, html):
            enviados += 1
    return enviados
