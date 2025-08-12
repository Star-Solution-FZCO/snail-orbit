#!/usr/bin/env python3
"""Event-driven batch processor for notifications using Redis pub/sub."""

import asyncio

import redis.asyncio as aioredis
from pydantic import ValidationError

from pm.config import CONFIG
from pm.logging import get_logger, log_context
from pm.tasks._base import setup_database
from pm.tasks.actions.notification_batch import NotificationBatch
from pm.tasks.actions.notify import task_notify_by_pararam
from pm.tasks.app import broker, import_all_tasks

logger = get_logger(__name__)

TIMER_KEY_PARTS_COUNT = 2


async def process_expired_batch(timer_key: str) -> None:
    """Process a batch when its timer expires."""
    try:
        if not timer_key.startswith('notification_timer:'):
            return

        key_parts = timer_key[len('notification_timer:') :].split(':', 1)
        if len(key_parts) != TIMER_KEY_PARTS_COUNT:
            logger.warning(
                'Invalid timer key format',
                extra={
                    'event': 'batch_timer_invalid_format',
                    'timer_key': timer_key,
                },
            )
            return

        issue_id_readable, author = key_parts
        batch_key = f'notification_batch:{issue_id_readable}:{author}'

        with log_context(
            issue_id=issue_id_readable,
            batch_author=author,
            task_name='process_expired_batch',
        ):
            redis_client = aioredis.from_url(CONFIG.REDIS_EVENT_BUS_URL)
            batch_data = await redis_client.get(batch_key)

            if not batch_data:
                logger.warning(
                    'No batch data found for expired timer',
                    extra={
                        'event': 'batch_data_not_found',
                        'timer_key': timer_key,
                        'batch_key': batch_key,
                    },
                )
                return

            batch = NotificationBatch.model_validate_json(batch_data)

            logger.info(
                'Processing expired notification batch',
                extra={
                    'event': 'batch_processing_started',
                    'change_count': batch.change_count,
                    'action': batch.action,
                },
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
                comment_changes=batch.comment_changes,
            )

            logger.info(
                'Queued notification task for expired batch',
                extra={
                    'event': 'batch_notification_queued',
                    'subscriber_count': len(batch.issue_subscribers),
                },
            )

    except ValidationError as e:
        logger.exception(
            'Invalid batch data for timer',
            exc_info=e,
            extra={
                'event': 'batch_validation_error',
                'timer_key': timer_key,
            },
        )
    except Exception as e:
        logger.exception(
            'Failed to process expired batch',
            exc_info=e,
            extra={
                'event': 'batch_processing_error',
                'timer_key': timer_key,
            },
        )


async def listen_for_expiration_events() -> None:
    """Listen for Redis key expiration events and process expired batches."""
    if not CONFIG.REDIS_EVENT_BUS_URL:
        logger.warning(
            'Redis not configured, batch processor disabled',
            extra={
                'event': 'batch_processor_disabled',
                'reason': 'redis_not_configured',
            },
        )
        return

    if CONFIG.NOTIFICATION_BATCH_DELAY_SECONDS <= 0:
        logger.info(
            'Batching disabled, processor stopping',
            extra={
                'event': 'batch_processor_disabled',
                'reason': 'batching_disabled',
                'delay_seconds': CONFIG.NOTIFICATION_BATCH_DELAY_SECONDS,
            },
        )
        return

    max_retries = 5
    retry_delay = 5

    for attempt in range(max_retries):
        redis_client = None
        pubsub = None

        try:
            if attempt > 0:
                logger.info(
                    'Reconnecting to Redis',
                    extra={
                        'event': 'redis_reconnection_attempt',
                        'attempt': attempt + 1,
                        'max_retries': max_retries,
                    },
                )

            redis_client = aioredis.from_url(CONFIG.REDIS_EVENT_BUS_URL)
            await redis_client.ping()

            pubsub = redis_client.pubsub()
            await pubsub.subscribe('__keyevent@0__:expired')

            logger.info(
                'Listening for Redis key expiration events',
                extra={
                    'event': 'batch_processor_listening',
                    'redis_url': CONFIG.REDIS_EVENT_BUS_URL,
                },
            )

            async for message in pubsub.listen():
                if message['type'] == 'message':
                    expired_key = message['data'].decode('utf-8')

                    if expired_key.startswith('notification_timer:'):
                        try:
                            await process_expired_batch(expired_key)
                        except Exception as e:
                            logger.exception(
                                'Error processing expired batch',
                                exc_info=e,
                                extra={
                                    'event': 'batch_processing_error',
                                    'expired_key': expired_key,
                                },
                            )

        except (TimeoutError, ConnectionError, OSError) as e:
            logger.warning(
                'Redis connection lost',
                exc_info=e,
                extra={
                    'event': 'redis_connection_lost',
                    'attempt': attempt + 1,
                },
            )

            if attempt < max_retries - 1:
                logger.info(
                    'Retrying Redis connection',
                    extra={
                        'event': 'redis_connection_retry',
                        'retry_delay_seconds': retry_delay,
                    },
                )
                await asyncio.sleep(retry_delay)
                retry_delay = min(retry_delay * 2, 60)
            else:
                logger.exception(
                    'Max Redis connection retries reached',
                    extra={
                        'event': 'redis_connection_max_retries',
                        'max_retries': max_retries,
                    },
                )
                raise

        except Exception as e:
            logger.exception(
                'Unexpected error in pub/sub listener',
                exc_info=e,
                extra={
                    'event': 'batch_processor_unexpected_error',
                },
            )
            raise

        finally:
            if pubsub:
                try:
                    await pubsub.unsubscribe('__keyevent@0__:expired')
                except (ConnectionError, TimeoutError, OSError) as e:  # nosec B110
                    logger.debug(
                        'Error unsubscribing from Redis pub/sub',
                        exc_info=e,
                        extra={'event': 'redis_unsubscribe_error'},
                    )

            if redis_client:
                try:
                    await redis_client.close()
                except (ConnectionError, TimeoutError, OSError) as e:  # nosec B110
                    logger.debug(
                        'Error closing Redis connection',
                        exc_info=e,
                        extra={'event': 'redis_close_error'},
                    )


async def main() -> None:
    """Main batch processor."""
    with log_context(
        task_name='batch_processor',
        component='notification_batch_processor',
    ):
        logger.info(
            'Starting notification batch processor',
            extra={
                'event': 'batch_processor_startup',
                'delay_seconds': CONFIG.NOTIFICATION_BATCH_DELAY_SECONDS,
            },
        )

        try:
            import_all_tasks()
            await broker.startup()
            await setup_database()

            delay_seconds = CONFIG.NOTIFICATION_BATCH_DELAY_SECONDS
            logger.info(
                'Batch processor ready',
                extra={
                    'event': 'batch_processor_ready',
                    'delay_seconds': delay_seconds,
                },
            )

            await listen_for_expiration_events()
        except KeyboardInterrupt:
            logger.info(
                'Batch processor interrupted, shutting down',
                extra={'event': 'batch_processor_interrupted'},
            )
        except Exception as e:
            logger.exception(
                'Fatal error in batch processor',
                exc_info=e,
                extra={'event': 'batch_processor_fatal_error'},
            )
            raise
        finally:
            try:
                await broker.shutdown()
                logger.info(
                    'Batch processor broker shutdown complete',
                    extra={'event': 'batch_processor_shutdown'},
                )
            except (ConnectionError, TimeoutError, RuntimeError) as e:
                logger.warning(
                    'Error during broker shutdown',
                    exc_info=e,
                    extra={'event': 'batch_processor_shutdown_error'},
                )


if __name__ == '__main__':
    from pm.logging import configure_logging

    configure_logging()
    asyncio.run(main())
