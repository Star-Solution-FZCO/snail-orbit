import logging
from datetime import UTC, datetime
from typing import Literal
from uuid import UUID

import redis.asyncio as aioredis
from pydantic import BaseModel, Field

import pm.models as m
from pm.config import CONFIG
from pm.tasks.actions.notify import notify_by_pararam
from pm.tasks.types import CommentChange

__all__ = ('schedule_batched_notification',)

logger = logging.getLogger(__name__)


def _merge_field_changes(
    existing_changes: list[m.IssueFieldChange], new_changes: list[m.IssueFieldChange]
) -> list[m.IssueFieldChange]:
    """Merge field changes, keeping the latest change for each field."""
    if not new_changes:
        return existing_changes

    if not existing_changes:
        return new_changes[:]

    merged_changes: dict[str, m.IssueFieldChange] = {}

    for change in existing_changes:
        key = change.field if isinstance(change.field, str) else str(change.field.id)  # type: ignore[union-attr]
        merged_changes[key] = change

    for change in new_changes:
        key = change.field if isinstance(change.field, str) else str(change.field.id)  # type: ignore[union-attr]

        if key in merged_changes:
            existing_change = merged_changes[key]
            merged_changes[key] = m.IssueFieldChange(
                field=change.field,
                old_value=existing_change.old_value,
                new_value=change.new_value,
            )
        else:
            merged_changes[key] = change

    return list(merged_changes.values())


def _merge_comment_changes(
    existing_changes: list[CommentChange], new_changes: list[CommentChange]
) -> list[CommentChange]:
    """Merge comment changes, keeping the latest change for each comment."""
    if not new_changes:
        return existing_changes

    if not existing_changes:
        return new_changes[:]

    merged_changes: dict[UUID, CommentChange] = {}

    for change in existing_changes:
        merged_changes[change.comment_id] = change

    for change in new_changes:
        merged_changes[change.comment_id] = change

    return list(merged_changes.values())


def _merge_mentions(existing_mentions: list[str], new_mentions: list[str]) -> list[str]:
    """Merge mention lists, removing duplicates."""
    if not new_mentions:
        return existing_mentions

    if not existing_mentions:
        return new_mentions[:]

    return list(set(existing_mentions + new_mentions))


class NotificationBatch(BaseModel):
    """Model for batched notification data stored in Redis."""

    issue_id_readable: str = Field(description='Human-readable issue ID')
    issue_subject: str = Field(description='Issue subject/title')
    issue_subscribers: list[str] = Field(description='List of subscriber IDs')
    project_id: str = Field(description='Project ID')
    author: str | None = Field(description='Author of the changes')

    action: Literal['create', 'update', 'delete'] = Field(
        description='Latest action type'
    )
    change_count: int = Field(description='Number of changes in this batch')
    first_timestamp: datetime = Field(description='Timestamp of first change')
    last_timestamp: datetime = Field(description='Timestamp of latest change')
    field_changes: list[m.IssueFieldChange] = Field(
        default_factory=list, description='Accumulated field changes in this batch'
    )
    comment_changes: list[CommentChange] = Field(
        default_factory=list, description='Accumulated comment changes in this batch'
    )
    new_mentions: list[str] = Field(
        default_factory=list, description='List of newly mentioned email addresses'
    )


async def schedule_batched_notification(
    action: Literal['create', 'update', 'delete'],
    issue_subject: str,
    issue_id_readable: str,
    issue_subscribers: list[str],
    project_id: str,
    author: str | None = None,
    field_changes: list[m.IssueFieldChange] | None = None,
    comment_changes: list[CommentChange] | None = None,
    new_mentions: list[str] | None = None,
) -> None:
    """Schedule a notification for batching instead of sending immediately."""
    field_changes = field_changes or []
    comment_changes = comment_changes or []
    new_mentions = new_mentions or []

    delay_seconds = CONFIG.NOTIFICATION_BATCH_DELAY_SECONDS
    if delay_seconds <= 0:
        await notify_by_pararam(
            action,
            issue_subject,
            issue_id_readable,
            issue_subscribers,
            project_id,
            author,
            field_changes,
            comment_changes,
            new_mentions,
        )
        return

    if not CONFIG.REDIS_EVENT_BUS_URL:
        logger.warning('Redis not configured, falling back to immediate notification')
        await notify_by_pararam(
            action,
            issue_subject,
            issue_id_readable,
            issue_subscribers,
            project_id,
            author,
            field_changes,
            comment_changes,
            new_mentions,
        )
        return

    try:
        redis_client = aioredis.from_url(CONFIG.REDIS_EVENT_BUS_URL)

        author_key = author or 'system'
        batch_key = f'notification_batch:{issue_id_readable}:{author_key}'
        now = datetime.now(UTC)
        existing_batch_data = await redis_client.get(batch_key)

        if existing_batch_data:
            existing_batch = NotificationBatch.model_validate_json(existing_batch_data)
            merged_field_changes = _merge_field_changes(
                existing_batch.field_changes, field_changes
            )
            merged_comment_changes = _merge_comment_changes(
                existing_batch.comment_changes, comment_changes
            )
            merged_mentions = _merge_mentions(existing_batch.new_mentions, new_mentions)
            batch = NotificationBatch(
                issue_id_readable=issue_id_readable,
                issue_subject=issue_subject,
                issue_subscribers=issue_subscribers,
                project_id=project_id,
                author=author,
                action=action,
                change_count=existing_batch.change_count + 1,
                first_timestamp=existing_batch.first_timestamp,
                last_timestamp=now,
                field_changes=merged_field_changes,
                comment_changes=merged_comment_changes,
                new_mentions=merged_mentions,
            )
        else:
            batch = NotificationBatch(
                issue_id_readable=issue_id_readable,
                issue_subject=issue_subject,
                issue_subscribers=issue_subscribers,
                project_id=project_id,
                author=author,
                action=action,
                change_count=1,
                first_timestamp=now,
                last_timestamp=now,
                field_changes=field_changes,
                comment_changes=comment_changes,
                new_mentions=new_mentions,
            )

        await redis_client.set(batch_key, batch.model_dump_json())

        timer_key = f'notification_timer:{issue_id_readable}:{author_key}'
        await redis_client.setex(timer_key, delay_seconds, '1')

    except Exception:
        logger.exception('Failed to schedule notification batch')
        await notify_by_pararam(
            action,
            issue_subject,
            issue_id_readable,
            issue_subscribers,
            project_id,
            author,
            field_changes,
            comment_changes,
            new_mentions,
        )
