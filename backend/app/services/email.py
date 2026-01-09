import aiosmtplib
from email.message import EmailMessage
from app.core.config import settings

async def send_email(to_email: str, subject: str, html_content: str):
    """
    Envoie un email via SMTP (Gmail, Outlook, etc.)
    Configuré dans core/config.py
    """
    message = EmailMessage()
    message["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.SMTP_USER}>"
    message["To"] = to_email
    message["Subject"] = subject
    message.set_content(html_content, subtype="html")

    try:
        if not settings.SMTP_USER or "votre.email" in settings.SMTP_USER:
            print(f"⚠️ [MOCK EMAIL] To: {to_email} | Subject: {subject}")
            print(html_content)
            return

        await aiosmtplib.send(
            message,
            hostname=settings.SMTP_SERVER,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            start_tls=True,
        )
        print(f"✅ Email sent to {to_email}")
    except Exception as e:
        print(f"❌ Failed to send email: {e}")

async def send_reset_password_email(to_email: str, token: str):
    link = f"http://localhost:5173/reset-password?token={token}"
    html = f"""
    <h1>Réinitialisation de mot de passe</h1>
    <p>Vous avez demandé une réinitialisation de votre mot de passe.</p>
    <p>Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe :</p>
    <a href="{link}" style="padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Réinitialiser mon mot de passe</a>
    <p>Ce lien est valide pendant 15 minutes.</p>
    <br>
    <small>Si vous n'avez pas demandé cela, ignorez cet email.</small>
    """
    await send_email(to_email, "Réinitialisation mot de passe", html)
