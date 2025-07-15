# pylint: disable=import-outside-toplevel
import argparse
import asyncio

__all__ = ('add_tasks_args',)


# pylint: disable=unused-argument
# ruff: noqa: ARG001
def run_worker(args: argparse.Namespace) -> None:
    from taskiq.api import run_receiver_task

    from pm.tasks.app import broker, import_all_tasks

    async def start_worker() -> None:
        import sys

        from pm.logging import configure_logging, get_logger

        configure_logging()
        logger = get_logger('taskiq.worker.startup')

        import_all_tasks()

        logger.info('Starting taskiq worker...')
        logger.info('Registered tasks: %s', list(broker.get_all_tasks().keys()))

        sys.stdout.flush()

        try:
            await run_receiver_task(
                broker=broker,
                sync_workers=4,
                max_async_tasks=100,
                max_prefetch=10,
                validate_params=True,
                propagate_exceptions=True,
                run_startup=True,
            )
        except KeyboardInterrupt:
            logger.info('Worker interrupted by user')
        except Exception as e:
            logger.error('Worker failed with error: %s', e, exc_info=True)
            raise

    asyncio.run(start_worker())


def run_scheduler(args: argparse.Namespace) -> None:
    from taskiq.api import run_scheduler_task

    from pm.tasks.app import import_all_tasks, scheduler

    async def start_scheduler() -> None:
        import sys

        from pm.logging import configure_logging, get_logger

        configure_logging()
        logger = get_logger('taskiq.scheduler.startup')

        import_all_tasks()

        logger.info('Starting taskiq scheduler...')
        logger.info(
            'Registered tasks: %s',
            list(scheduler.broker.get_all_tasks().keys()),
        )

        sys.stdout.flush()

        try:
            await run_scheduler_task(
                scheduler=scheduler,
                run_startup=True,
            )
        except KeyboardInterrupt:
            logger.info('Scheduler interrupted by user')
        except Exception as e:
            logger.error('Scheduler failed with error: %s', e, exc_info=True)
            raise

    asyncio.run(start_scheduler())


def run_notification_processor(args: argparse.Namespace) -> None:
    from pm.tasks.batch_processor import main

    async def start_notification_processor() -> None:
        from pm.logging import configure_logging, get_logger

        configure_logging()
        logger = get_logger('taskiq.notification_processor.startup')

        logger.info('Starting notification batch processor...')

        try:
            await main()
        except KeyboardInterrupt:
            logger.info('Notification processor interrupted by user')
        except Exception as e:
            logger.error(
                'Notification processor failed with error: %s',
                e,
                exc_info=True,
            )
            raise

    asyncio.run(start_notification_processor())


def add_tasks_args(parser: argparse.ArgumentParser) -> None:
    subparsers = parser.add_subparsers(required=True)

    worker_parser = subparsers.add_parser('worker')
    worker_parser.set_defaults(func=run_worker)

    scheduler_parser = subparsers.add_parser('beat')
    scheduler_parser.set_defaults(func=run_scheduler)

    notification_processor_parser = subparsers.add_parser('notification-processor')
    notification_processor_parser.set_defaults(func=run_notification_processor)
