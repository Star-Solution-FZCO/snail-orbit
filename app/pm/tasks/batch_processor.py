#!/usr/bin/env python3
"""Event-driven batch processor for notifications using Redis pub/sub."""

import asyncio
import logging

import redis.asyncio as aioredis
from pydantic import ValidationError

from pm.config import CONFIG
from pm.tasks._base import setup_database
from pm.tasks.actions.notification_batch import NotificationBatch
from pm.tasks.actions.notify import task_notify_by_pararam
from pm.tasks.app import broker, import_all_tasks

logger = logging.getLogger(__name__)


async def process_expired_batch(timer_key: str) -> None:
    """Process a batch when its timer expires."""
    try:
        if not timer_key.startswith('notification_timer:'):
            return

        key_parts = timer_key[len('notification_timer:') :].split(':', 1)
        if len(key_parts) != 2:
            logger.warning('Invalid timer key format: %s', timer_key)
            return

        issue_id_readable, author = key_parts
        batch_key = f'notification_batch:{issue_id_readable}:{author}'

        redis_client = aioredis.from_url(CONFIG.REDIS_EVENT_BUS_URL)
        batch_data = await redis_client.get(batch_key)

        if not batch_data:
            logger.warning('No batch data found for expired timer: %s', timer_key)
            return

        batch = NotificationBatch.model_validate_json(batch_data)

        logger.info(
            'Processing expired batch for issue %s by %s (%d changes)',
            batch.issue_id_readable,
            batch.author or 'system',
            batch.change_count,
        )

        await redis_client.delete(batch_key)

        await task_notify_by_pararam.kiq(
            batch.action,
            batch.issue_subject,
            batch.issue_id_readable,
            batch.issue_subscribers,
            batch.project_id,
            author=batch.author,
            field_changes=batch.field_changes,
        )

        logger.info(
            'Queued notification task for expired batch %s by %s',
            batch.issue_id_readable,
            batch.author or 'system',
        )

    except ValidationError as e:
        logger.error('Invalid batch data for timer %s: %s', timer_key, e)
    except Exception as e:
        logger.error('Failed to process expired batch %s: %s', timer_key, e)


async def listen_for_expiration_events() -> None:
    """Listen for Redis key expiration events and process expired batches."""
    if not CONFIG.REDIS_EVENT_BUS_URL:
        logger.warning('Redis not configured, batch processor disabled')
        return

    if CONFIG.NOTIFICATION_BATCH_DELAY_SECONDS <= 0:
        logger.info('Batching disabled (delay <= 0), processor stopping')
        return

    max_retries = 5
    retry_delay = 5

    for attempt in range(max_retries):
        redis_client = None
        pubsub = None

        try:
            if attempt > 0:
                logger.info(
                    'Reconnecting to Redis (attempt %d/%d)', attempt + 1, max_retries
                )

            redis_client = aioredis.from_url(CONFIG.REDIS_EVENT_BUS_URL)
            await redis_client.ping()

            pubsub = redis_client.pubsub()
            await pubsub.subscribe('__keyevent@0__:expired')

            logger.info('Listening for Redis key expiration events')
            print('Listening for Redis key expiration events...', flush=True)
            attempt = 0

            async for message in pubsub.listen():
                if message['type'] == 'message':
                    expired_key = message['data'].decode('utf-8')

                    if expired_key.startswith('notification_timer:'):
                        try:
                            await process_expired_batch(expired_key)
                        except Exception as e:
                            logger.error(
                                'Error processing expired batch %s: %s', expired_key, e
                            )

        except (ConnectionError, OSError, asyncio.TimeoutError) as e:
            logger.warning('Redis connection lost: %s', e)

            if attempt < max_retries - 1:
                logger.info('Retrying in %d seconds', retry_delay)
                await asyncio.sleep(retry_delay)
                retry_delay = min(retry_delay * 2, 60)
            else:
                logger.error('Max Redis connection retries reached')
                raise

        except Exception as e:
            logger.error('Unexpected error in pub/sub listener: %s', e)
            raise

        finally:
            if pubsub:
                try:
                    await pubsub.unsubscribe('__keyevent@0__:expired')
                except Exception as e:  # nosec B110
                    logger.debug('Error unsubscribing from Redis pub/sub: %s', e)

            if redis_client:
                try:
                    await redis_client.close()
                except Exception as e:  # nosec B110
                    logger.debug('Error closing Redis connection: %s', e)


async def main() -> None:
    """Main batch processor."""
    print('Starting notification batch processor...', flush=True)
    logger.info('Starting notification batch processor')

    try:
        import_all_tasks()
        await broker.startup()
        await setup_database()

        delay_seconds = CONFIG.NOTIFICATION_BATCH_DELAY_SECONDS
        logger.info('Batch processor ready with %d second delay', delay_seconds)
        print(f'Batch processor ready with {delay_seconds} second delay', flush=True)

        await listen_for_expiration_events()
    except KeyboardInterrupt:
        logger.info('Batch processor interrupted, shutting down')
    except Exception as e:
        logger.exception('Fatal error in batch processor: %s', e)
        print(f'Fatal error: {e}', flush=True)
        raise
    finally:
        try:
            await broker.shutdown()
        except Exception as e:
            logger.warning('Error during broker shutdown: %s', e)


if __name__ == '__main__':
    logging.basicConfig(
        level=logging.INFO, format='[%(asctime)s][%(name)s][%(levelname)s] %(message)s'
    )
    asyncio.run(main())
