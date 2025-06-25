import logging
import smtplib
from base64 import b64decode
from email.encoders import encode_base64
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formatdate
from typing import Dict, Optional, Sequence

from pm.config import CONFIG
from pm.tasks.app import broker

__all__ = ('task_send_email',)

logger = logging.getLogger(__name__)


def _send_email(
    recipients: Sequence[str],
    subject: str,
    body: str,
    attachments: Optional[Dict[str, str]] = None,
) -> None:
    if not CONFIG.SMTP_HOST:
        return
    if not attachments:
        attachments = {}
    try:
        if CONFIG.SMTP_SSL_MODE and CONFIG.SMTP_SSL_MODE in ('tls', 'ssl'):
            mail_client: smtplib.SMTP | smtplib.SMTP_SSL = smtplib.SMTP_SSL(
                CONFIG.SMTP_HOST, CONFIG.SMTP_PORT
            )
        else:
            mail_client = smtplib.SMTP(CONFIG.SMTP_HOST, CONFIG.SMTP_PORT)
        mail_client.ehlo()
        if CONFIG.SMTP_LOGIN:
            mail_client.login(CONFIG.SMTP_LOGIN, CONFIG.SMTP_PASSWORD)
        msg = MIMEMultipart()
        msg['Subject'] = subject
        msg['To'] = ', '.join(recipients)
        msg['From'] = CONFIG.SMTP_SENDER
        msg['Date'] = formatdate()
        msg.attach(MIMEText(body, 'html'))
        for name, data in attachments.items():
            attachment = MIMEBase('application', 'octet-stream')
            attachment.set_payload(b64decode(data.encode()))
            encode_base64(attachment)
            attachment.add_header(
                'Content-Disposition', f'attachment; filename="{name}"'
            )
            msg.attach(attachment)
        mail_client.sendmail(CONFIG.SMTP_SENDER, recipients, msg.as_string())
        mail_client.close()
        logger.info('Email sent successfully to %d recipients', len(recipients))
    except smtplib.SMTPAuthenticationError as e:
        logger.error('SMTP authentication failed: %s', e)
        raise  # Don't retry auth failures
    except smtplib.SMTPServerDisconnected as e:
        logger.warning('SMTP server disconnected: %s', e)
        raise  # Will be retried by taskiq
    except smtplib.SMTPRecipientsRefused as e:
        logger.error('SMTP recipients refused: %s', e)
        raise  # Don't retry invalid recipients
    except (smtplib.SMTPException, OSError) as e:
        logger.error('SMTP error occurred: %s', e)
        raise  # Will be retried by taskiq
    except Exception as e:
        logger.error('Unexpected error sending email: %s', e)
        raise  # Let taskiq handle unexpected errors


@broker.task(
    task_name='send_email',
    retry=3,
    retry_delay=60,
)
def task_send_email(
    recipients: Sequence[str],
    subject: str,
    body: str,
    attachments: Optional[Dict[str, str]] = None,
) -> None:
    _send_email(recipients, subject, body, attachments)
