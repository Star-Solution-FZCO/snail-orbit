import logging
from typing import Literal
from urllib.parse import urljoin

import beanie.operators as bo
from beanie import PydanticObjectId
from pararamio import PararamioBot

import pm.models as m
from pm.config import CONFIG
from pm.tasks._base import setup_database
from pm.tasks.app import broker

__all__ = ('task_notify_by_pararam',)

logger = logging.getLogger(__name__)


def _send_message(bot: PararamioBot, user_email: str, message: str) -> None:
    try:
        bot.post_private_message_by_user_email(user_email, message)
        logger.debug('Notification sent successfully to %s', user_email)
    except Exception as e:
        logger.error('Failed to send notification to %s: %s', user_email, e)
        raise  # Let taskiq handle retries


def sanitize_issue_subject(subject: str) -> str:
    return subject.replace('[', '\\[').replace(']', '\\]')


async def notify_by_pararam(
    action: Literal['create', 'update', 'delete'],
    issue_subject: str,
    issue_id_readable: str,
    issue_subscribers: list[str],
    project_id: str,
    author: str | None = None,
) -> None:
    logger.info(
        'Sending notification: issue=%s, action=%s, author=%s, subscribers=%d',
        issue_id_readable,
        action,
        author,
        len(issue_subscribers),
    )

    if not CONFIG.PARARAM_NOTIFICATION_BOT_TOKEN:
        logger.warning(
            'Pararam notification bot token not configured, skipping notification'
        )
        return

    pararam_bot = PararamioBot(CONFIG.PARARAM_NOTIFICATION_BOT_TOKEN)
    author_str = f' by {author}' if author else ''
    message = (
        f'Issue [{issue_id_readable}: {sanitize_issue_subject(issue_subject)}]'
        f'({urljoin(CONFIG.PUBLIC_BASE_URL, f"/issues/{issue_id_readable}")}) was {action}d{author_str}.'
    )

    logger.debug('Notification message: %s', message)

    recipients_ids = {PydanticObjectId(u) for u in issue_subscribers}
    if project := await m.Project.find_one(
        m.Project.id == PydanticObjectId(project_id)
    ):
        recipients_ids.update(set(project.subscribers))
    recipients = {
        u.email
        for u in await m.User.find(bo.In(m.User.id, list(recipients_ids))).to_list()
    }

    logger.info(
        'Sending notification to %d recipients: %s', len(recipients), list(recipients)
    )

    sent_count = 0
    for recipient in recipients:
        try:
            _send_message(pararam_bot, recipient, message)
            sent_count += 1
        except Exception as e:
            logger.error('Failed to send notification to %s: %s', recipient, e)

    logger.info(
        'Successfully sent %d/%d notifications for issue %s',
        sent_count,
        len(recipients),
        issue_id_readable,
    )


@broker.task(
    task_name='notify_by_pararam',
    retry=2,
    retry_delay=30,
)
async def task_notify_by_pararam(
    action: Literal['create', 'update', 'delete'],
    issue_subject: str,
    issue_id_readable: str,
    issue_subscribers: list[str],
    project_id: str,
    author: str | None = None,
) -> None:
    await setup_database()
    await notify_by_pararam(
        action,
        issue_subject,
        issue_id_readable,
        issue_subscribers,
        project_id,
        author=author,
    )
