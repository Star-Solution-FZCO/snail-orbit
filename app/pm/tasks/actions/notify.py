from datetime import datetime
from typing import Any, Literal
from urllib.parse import urljoin

import beanie.operators as bo
from beanie import PydanticObjectId
from pararamio import PararamioBot

import pm.models as m
from pm.config import CONFIG
from pm.logging import get_logger, log_context
from pm.tasks._base import setup_database
from pm.tasks.app import broker

__all__ = ('task_notify_by_pararam',)

logger = get_logger(__name__)


def _send_message(bot: PararamioBot, user_email: str, message: str) -> None:
    try:
        bot.post_private_message_by_user_email(user_email, message)
        logger.debug(
            'Pararam notification sent successfully',
            extra={
                'event': 'pararam_notification_sent',
                'recipient_email': user_email,
            },
        )
    except Exception as e:
        logger.error(
            'Failed to send Pararam notification',
            exc_info=e,
            extra={
                'event': 'pararam_notification_failed',
                'recipient_email': user_email,
                'error_type': type(e).__name__,
            },
        )
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
    with log_context(
        issue_id=issue_id_readable, project_id=project_id, task_name='notify_by_pararam'
    ):
        logger.info(
            'Starting Pararam notification task',
            extra={
                'event': 'pararam_notification_started',
                'action': action,
                'author': author,
                'subscriber_count': len(issue_subscribers),
                'field_changes_count': len(field_changes) if field_changes else 0,
            },
        )

        if not CONFIG.PARARAM_NOTIFICATION_BOT_TOKEN:
            logger.warning(
                'Pararam notification bot token not configured, skipping notification',
                extra={
                    'event': 'pararam_notification_skipped',
                    'reason': 'missing_bot_token',
                },
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

        logger.debug(
            'Generated notification message',
            extra={
                'event': 'notification_message_generated',
                'message_length': len(message),
                'has_field_changes': bool(field_changes),
            },
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

        logger.info(
            'Sending Pararam notifications to recipients',
            extra={
                'event': 'pararam_notification_recipients_resolved',
                'recipient_count': len(recipients),
                'recipients': list(recipients),
            },
        )

        sent_count = 0
        for recipient in recipients:
            try:
                _send_message(pararam_bot, recipient, message)
                sent_count += 1
            except Exception as e:
                logger.error(
                    'Failed to send notification to recipient',
                    exc_info=e,
                    extra={
                        'event': 'pararam_notification_recipient_failed',
                        'recipient_email': recipient,
                        'error_type': type(e).__name__,
                    },
                )

        logger.info(
            'Pararam notification task completed',
            extra={
                'event': 'pararam_notification_completed',
                'sent_count': sent_count,
                'total_recipients': len(recipients),
                'success_rate': sent_count / len(recipients) if recipients else 0,
            },
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
    with log_context(
        task_id='notify_by_pararam',
        task_name='Pararam Notification',
        issue_id=issue_id_readable,
        project_id=project_id,
    ):
        logger.info(
            'Task started',
            extra={
                'event': 'task_started',
                'task_type': 'notification',
                'notification_method': 'pararam',
            },
        )

        try:
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

            logger.info(
                'Task completed successfully',
                extra={
                    'event': 'task_completed',
                    'task_type': 'notification',
                    'notification_method': 'pararam',
                },
            )
        except Exception as e:
            logger.error(
                'Task failed',
                exc_info=e,
                extra={
                    'event': 'task_failed',
                    'task_type': 'notification',
                    'notification_method': 'pararam',
                    'error_type': type(e).__name__,
                },
            )
            raise
