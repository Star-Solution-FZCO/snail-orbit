from urllib.parse import urlparse

from taskiq import TaskiqScheduler
from taskiq.schedule_sources import LabelScheduleSource
from taskiq_aio_pika import AioPikaBroker

from pm.config import CONFIG

__all__ = ('broker', 'scheduler')


def create_broker() -> AioPikaBroker:
    broker_url = CONFIG.TASKS_BROKER_URL
    if not broker_url:
        raise ValueError(
            'TASKS_BROKER_URL must be configured. '
            'Set it in settings.toml or environment variable SNAIL_ORBIT_TASKS_BROKER_URL',
        )

    parsed = urlparse(broker_url)
    if not parsed.scheme or not parsed.netloc:
        raise ValueError(f'Invalid TASKS_BROKER_URL format: {broker_url}')

    if parsed.scheme not in ('amqp', 'amqps'):
        raise ValueError(f'Only AMQP URLs are supported, got: {parsed.scheme}://')

    return AioPikaBroker(
        broker_url,
        max_connection_pool_size=20,
        declare_exchange=True,
        declare_queues=True,
        queue_durable=True,
        delivery_mode=2,
    )


TASK_MODULES = [
    'pm.tasks.actions.notify',
    'pm.tasks.actions.notification_batch',
    'pm.tasks.actions.send_email',
    'pm.tasks.actions.send_pararam_message',
    'pm.tasks.actions.workflows',
    'pm.tasks.scheduled.wb_sync',
    'pm.tasks.scheduled.workflows',
]


def import_all_tasks() -> None:
    """Import all task modules to register them with the broker."""
    # pylint: disable=import-outside-toplevel
    import importlib

    for module_name in TASK_MODULES:
        importlib.import_module(module_name)


# Create Taskiq broker using RabbitMQ
broker = create_broker()

# Create scheduler for cron tasks
scheduler = TaskiqScheduler(
    broker=broker,
    sources=[LabelScheduleSource(broker)],
)
