"""
Email sender usando Resend API (HTTP — sem SMTP, funciona no Render free tier).
Env vars necessárias:
  RESEND_API_KEY → chave da API em resend.com (gratuito: 3.000 emails/mês)
  GMAIL_USER     → endereço exibido como remetente (ex: elberagenciamkt@gmail.com)
                   Nota: no plano free do Resend o "from" precisa ser onboarding@resend.dev
                   ou um domínio verificado. GMAIL_USER é usado como "reply-to".
"""
import os
import resend

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
GMAIL_USER     = os.getenv("GMAIL_USER", "elberagenciamkt@gmail.com")


def _get_from() -> str:
    """Retorna o endereço remetente válido para o Resend."""
    return "Leads Tracker <onboarding@resend.dev>"


def enviar_email(destinatario: str, assunto: str, html: str) -> bool:
    if not RESEND_API_KEY:
        print(f"[EMAIL] RESEND_API_KEY não configurada — email não enviado para {destinatario}")
        return False
    try:
        resend.api_key = RESEND_API_KEY
        resend.Emails.send({
            "from":     _get_from(),
            "to":       [destinatario],
            "reply_to": GMAIL_USER,
            "subject":  assunto,
            "html":     html,
        })
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
