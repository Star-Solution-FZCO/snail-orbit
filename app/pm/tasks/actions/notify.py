import logging
from datetime import datetime
from typing import Any, Literal
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
        raise


def sanitize_issue_subject(subject: str) -> str:
    return subject.replace('[', '\\[').replace(']', '\\]')


def _format_field_value(value: Any, field: m.CustomFieldLink) -> str:
    if value is None:
        return 'None'

    if field.type == m.CustomFieldTypeT.USER:
        return value.name
    if field.type == m.CustomFieldTypeT.USER_MULTI:
        return ', '.join([user.name for user in value])
    if field.type in (
        m.CustomFieldTypeT.ENUM,
        m.CustomFieldTypeT.STATE,
        m.CustomFieldTypeT.VERSION,
    ):
        return value.value
    if field.type in (
        m.CustomFieldTypeT.ENUM_MULTI,
        m.CustomFieldTypeT.VERSION_MULTI,
    ):
        return ', '.join([item.value for item in value])
    if field.type == m.CustomFieldTypeT.BOOLEAN:
        return 'True' if value else 'False'
    if field.type == m.CustomFieldTypeT.DATE:
        if isinstance(value, str):
            date_str = value.split('T')[0] if 'T' in value else value
            return datetime.fromisoformat(date_str).strftime('%d %b %Y')
        return value.strftime('%d %b %Y')
    if field.type == m.CustomFieldTypeT.DATETIME:
        if isinstance(value, str):
            return datetime.fromisoformat(value.replace('Z', '+00:00')).strftime(
                '%d %b %Y %H:%M:%S'
            )
        return value.strftime('%d %b %Y %H:%M:%S')

    val_str = str(value)
    return val_str[:47] + '...' if len(val_str) > 50 else val_str


def _format_field_name(field: m.CustomFieldLink | str) -> str:
    if isinstance(field, str):
        return field.title()
    return field.name


def _generate_field_changes_message(field_changes: list[m.IssueFieldChange]) -> str:
    if not field_changes:
        return ''

    changes_lines = []
    for change in field_changes:
        if isinstance(change.field, str) and change.field in ('text', 'subject'):
            continue

        field_name = _format_field_name(change.field)
        old_value = _format_field_value(change.old_value, change.field)
        new_value = _format_field_value(change.new_value, change.field)

        if old_value == new_value:
            continue

        changes_lines.append(f'  {field_name}: {old_value} → {new_value}')

    return '\n' + '\n'.join(changes_lines) if changes_lines else ''


async def notify_by_pararam(
    action: Literal['create', 'update', 'delete'],
    issue_subject: str,
    issue_id_readable: str,
    issue_subscribers: list[str],
    project_id: str,
    author: str | None = None,
    field_changes: list[m.IssueFieldChange] | None = None,
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
        f'({urljoin(CONFIG.PUBLIC_BASE_URL, f"/issues/{issue_id_readable}")}) was {action}d{author_str}'
    )

    if field_changes and action == 'update':
        changes_message = _generate_field_changes_message(field_changes)
        if changes_message:
            message += changes_message

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
    field_changes: list[m.IssueFieldChange] | None = None,
) -> None:
    await setup_database()
    await notify_by_pararam(
        action,
        issue_subject,
        issue_id_readable,
        issue_subscribers,
        project_id,
        author=author,
        field_changes=field_changes,
    )
