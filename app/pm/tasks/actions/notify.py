from typing import Literal
from urllib.parse import urljoin

import beanie.operators as bo
from beanie import PydanticObjectId
from pararamio import PararamioBot

import pm.models as m
from pm.config import CONFIG
from pm.tasks._base import run_task
from pm.tasks.app import celery_app

__all__ = ('task_notify_by_pararam',)


def _send_message(bot: PararamioBot, user_email: str, message: str) -> None:
    try:
        bot.post_private_message_by_user_email(user_email, message)
    except Exception:  # nosec: try_except_pass
        pass


def sanitize_issue_subject(subject: str) -> str:
    return subject.replace('[', '\\[').replace(']', '\\]')


async def notify_by_pararam(
    action: Literal['create', 'update', 'delete'],
    issue_subject: str,
    issue_id_readable: str,
    issue_subscribers: list[str],
    project_id: str,
) -> None:
    if not CONFIG.PARARAM_NOTIFICATION_BOT_TOKEN:
        return
    pararam_bot = PararamioBot(CONFIG.PARARAM_NOTIFICATION_BOT_TOKEN)
    message = (
        f'Issue [{issue_id_readable}: {sanitize_issue_subject(issue_subject)}]'
        f'({urljoin(CONFIG.PUBLIC_BASE_URL, f'/issues/{issue_id_readable}')}) was {action}d.'
    )
    recipients_ids = {PydanticObjectId(u) for u in issue_subscribers}
    if project := await m.Project.find_one(
        m.Project.id == PydanticObjectId(project_id)
    ):
        recipients_ids.update(set(project.subscribers))
    recipients = {
        u.email
        for u in await m.User.find(bo.In(m.User.id, list(recipients_ids))).to_list()
    }
    for recipient in recipients:
        _send_message(pararam_bot, recipient, message)


@celery_app.task(name='notify_by_pararam')
def task_notify_by_pararam(
    action: Literal['create', 'update', 'delete'],
    issue_subject: str,
    issue_id_readable: str,
    issue_subscribers: list[str],
    project_id: str,
) -> None:
    run_task(
        notify_by_pararam(
            action, issue_subject, issue_id_readable, issue_subscribers, project_id
        )
    )
