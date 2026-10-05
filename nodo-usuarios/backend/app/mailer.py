import logging
import smtplib
from email.message import EmailMessage

from .config import get_settings

logger = logging.getLogger("uvicorn.error")


def _send(to: str, subject: str, body: str, purpose: str, link: str) -> None:
    settings = get_settings()

    if not settings.smtp_host:
        # Modo desarrollo: sin SMTP configurado, el enlace solo aparece en la consola del backend.
        logger.warning("SMTP no configurado. Enlace de %s para %s: %s", purpose, to, link)
        return

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = settings.smtp_from
    message["To"] = to
    message.set_content(body)
    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as smtp:
            if settings.smtp_starttls:
                smtp.starttls()
            if settings.smtp_user and settings.smtp_password:
                smtp.login(settings.smtp_user, settings.smtp_password)
            smtp.send_message(message)
    except (OSError, smtplib.SMTPException) as error:
        # Solo el tipo de error: el email es un dato personal (RGPD) y algunas excepciones
        # de SMTP, como SMTPRecipientsRefused, lo incluyen en su mensaje.
        logger.error("No se pudo enviar el correo de %s (%s).", purpose, type(error).__name__)


def send_password_reset_email(to: str, name: str, link: str) -> None:
    minutes = get_settings().reset_token_minutes
    _send(to, "Restablece tu contraseña de Nodo", (
        f"Hola, {name}:\n\n"
        f"Hemos recibido una solicitud para restablecer tu contraseña. Abre este enlace para elegir una nueva "
        f"(caduca en {minutes} minutos y solo se puede usar una vez):\n\n{link}\n\n"
        "Si no lo has pedido tú, ignora este mensaje: tu contraseña no cambiará.\n"
    ), "recuperación", link)


def send_invitation_email(to: str, name: str, link: str, hours: int) -> None:
    _send(to, "Te han invitado a Nodo", (
        f"Hola, {name}:\n\n"
        f"Te han dado acceso al panel de administración de Nodo. Abre este enlace para elegir tu contraseña "
        f"y activar tu cuenta (caduca en {hours} horas y solo se puede usar una vez):\n\n{link}\n\n"
        "Si no esperabas esta invitación, ignora este mensaje.\n"
    ), "invitación", link)
