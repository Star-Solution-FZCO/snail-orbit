from pararamio import PararamioBot

from pm.config import CONFIG
from pm.tasks.app import celery_app

__all__ = ('task_send_pararam_message',)


def _send_message(bot: PararamioBot, user_email: str, message: str) -> None:
    try:
        bot.post_private_message_by_user_email(user_email, message)
    except Exception:  # nosec: try_except_pass
        pass


@celery_app.task(name='send_pararam_message')
def task_send_pararam_message(
    user_email: str,
    message: str,
) -> None:
    if not CONFIG.PARARAM_NOTIFICATION_BOT_TOKEN:
        return
    bot = PararamioBot(CONFIG.PARARAM_NOTIFICATION_BOT_TOKEN)
    _send_message(bot, user_email, message)
