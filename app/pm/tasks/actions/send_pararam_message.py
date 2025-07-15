import logging

from pararamio import PararamioBot

from pm.config import CONFIG
from pm.tasks.app import broker

__all__ = ('task_send_pararam_message',)

logger = logging.getLogger(__name__)


def _send_message(bot: PararamioBot, user_email: str, message: str) -> None:
    try:
        bot.post_private_message_by_user_email(user_email, message)
        logger.info('Pararam message sent successfully to %s', user_email)
    except Exception:
        logger.exception('Failed to send Pararam message to %s', user_email)
        raise  # Let taskiq handle retries


@broker.task(
    task_name='send_pararam_message',
    retry=3,
    retry_delay=30,
)
def task_send_pararam_message(
    user_email: str,
    message: str,
) -> None:
    if not CONFIG.PARARAM_NOTIFICATION_BOT_TOKEN:
        logger.warning(
            'Pararam notification bot token not configured, skipping message',
        )
        return
    bot = PararamioBot(CONFIG.PARARAM_NOTIFICATION_BOT_TOKEN)
    _send_message(bot, user_email, message)
