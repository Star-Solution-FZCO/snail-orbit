import logging
from datetime import datetime, timezone
from typing import Literal

import redis.asyncio as aioredis
from pydantic import BaseModel, Field

from pm.config import CONFIG
from pm.tasks.actions.notify import notify_by_pararam

__all__ = ('schedule_batched_notification',)

logger = logging.getLogger(__name__)


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


async def schedule_batched_notification(
    action: Literal['create', 'update', 'delete'],
    issue_subject: str,
    issue_id_readable: str,
    issue_subscribers: list[str],
    project_id: str,
    author: str | None = None,
) -> None:
    """Schedule a notification for batching instead of sending immediately."""
    delay_seconds = CONFIG.NOTIFICATION_BATCH_DELAY_SECONDS
    if delay_seconds <= 0:
        await notify_by_pararam(
            action,
            issue_subject,
            issue_id_readable,
            issue_subscribers,
            project_id,
            author,
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
        )
        return

    try:
        redis_client = aioredis.from_url(CONFIG.REDIS_EVENT_BUS_URL)

        # Create batch key combining issue and author for proper grouping
        author_key = author or 'system'
        batch_key = f'notification_batch:{issue_id_readable}:{author_key}'

        now = datetime.now(timezone.utc)

        # Get existing batch or create new one
        existing_batch_data = await redis_client.get(batch_key)

        if existing_batch_data:
            # Update existing batch
            existing_batch = NotificationBatch.model_validate_json(existing_batch_data)
            batch = NotificationBatch(
                issue_id_readable=issue_id_readable,
                issue_subject=issue_subject,  # Update with latest subject
                issue_subscribers=issue_subscribers,  # Update with latest subscribers
                project_id=project_id,
                author=author,
                action=action,  # Update with latest action
                change_count=existing_batch.change_count + 1,
                first_timestamp=existing_batch.first_timestamp,
                last_timestamp=now,
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
            )

        await redis_client.set(batch_key, batch.model_dump_json())

        timer_key = f'notification_timer:{issue_id_readable}:{author_key}'
        await redis_client.setex(timer_key, delay_seconds, '1')

    except Exception as e:
        logger.error('Failed to schedule notification batch: %s', e)
        # Fallback to immediate notification
        await notify_by_pararam(
            action,
            issue_subject,
            issue_id_readable,
            issue_subscribers,
            project_id,
            author,
        )
