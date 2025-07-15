import smtplib
from base64 import b64decode
from collections.abc import Sequence
from email.encoders import encode_base64
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formatdate

from pm.config import CONFIG
from pm.logging import get_logger, log_context
from pm.tasks.app import broker

__all__ = ('task_send_email',)

logger = get_logger(__name__)


def _send_email(
    recipients: Sequence[str],
    subject: str,
    body: str,
    attachments: dict[str, str] | None = None,
) -> None:
    if not CONFIG.SMTP_HOST:
        logger.warning(
            'SMTP host not configured, skipping email',
            extra={
                'event': 'email_skipped',
                'reason': 'smtp_not_configured',
                'recipient_count': len(recipients),
            },
        )
        return

    if not attachments:
        attachments = {}

    logger.info(
        'Sending email',
        extra={
            'event': 'email_send_started',
            'recipient_count': len(recipients),
            'subject': subject,
            'attachment_count': len(attachments),
            'body_length': len(body),
        },
    )

    try:
        if CONFIG.SMTP_SSL_MODE and CONFIG.SMTP_SSL_MODE in ('tls', 'ssl'):
            mail_client: smtplib.SMTP | smtplib.SMTP_SSL = smtplib.SMTP_SSL(
                CONFIG.SMTP_HOST,
                CONFIG.SMTP_PORT,
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
                'Content-Disposition',
                f'attachment; filename="{name}"',
            )
            msg.attach(attachment)
        mail_client.sendmail(CONFIG.SMTP_SENDER, recipients, msg.as_string())
        mail_client.close()

        logger.info(
            'Email sent successfully',
            extra={
                'event': 'email_sent',
                'recipient_count': len(recipients),
                'subject': subject,
            },
        )
    except smtplib.SMTPAuthenticationError as e:
        logger.exception(
            'SMTP authentication failed',
            exc_info=e,
            extra={
                'event': 'email_failed',
                'error_type': 'smtp_auth_failed',
                'smtp_host': CONFIG.SMTP_HOST,
                'smtp_port': CONFIG.SMTP_PORT,
            },
        )
        raise  # Don't retry auth failures
    except smtplib.SMTPServerDisconnected as e:
        logger.warning(
            'SMTP server disconnected',
            exc_info=e,
            extra={
                'event': 'email_failed',
                'error_type': 'smtp_disconnected',
                'smtp_host': CONFIG.SMTP_HOST,
            },
        )
        raise  # Will be retried by taskiq
    except smtplib.SMTPRecipientsRefused as e:
        logger.exception(
            'SMTP recipients refused',
            exc_info=e,
            extra={
                'event': 'email_failed',
                'error_type': 'recipients_refused',
                'recipients': list(recipients),
            },
        )
        raise  # Don't retry invalid recipients
    except (smtplib.SMTPException, OSError) as e:
        logger.exception(
            'SMTP error occurred',
            exc_info=e,
            extra={
                'event': 'email_failed',
                'error_type': 'smtp_error',
                'smtp_host': CONFIG.SMTP_HOST,
            },
        )
        raise  # Will be retried by taskiq
    except Exception as e:
        logger.exception(
            'Unexpected error sending email',
            exc_info=e,
            extra={
                'event': 'email_failed',
                'error_type': 'unexpected_error',
            },
        )
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
    attachments: dict[str, str] | None = None,
) -> None:
    with log_context(
        task_id='send_email',
        task_name='Email Notification',
        recipient_count=len(recipients),
    ):
        logger.info(
            'Email task started',
            extra={
                'event': 'task_started',
                'task_type': 'notification',
                'notification_method': 'email',
                'recipient_count': len(recipients),
                'subject': subject,
            },
        )

        try:
            _send_email(recipients, subject, body, attachments)

            logger.info(
                'Email task completed successfully',
                extra={
                    'event': 'task_completed',
                    'task_type': 'notification',
                    'notification_method': 'email',
                },
            )
        except Exception as e:
            logger.exception(
                'Email task failed',
                exc_info=e,
                extra={
                    'event': 'task_failed',
                    'task_type': 'notification',
                    'notification_method': 'email',
                    'error_type': type(e).__name__,
                },
            )
            raise
