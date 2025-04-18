from celery import Celery
from celery.schedules import crontab

from pm.config import CONFIG

__all__ = ('celery_app',)


celery_app = Celery('wb')
celery_app.conf.broker_url = CONFIG.TASKS_BROKER_URL
celery_app.autodiscover_tasks(
    [
        'pm.tasks.scheduled',
        'pm.tasks.actions',
    ]
)
celery_app.conf.beat_schedule = {}

if CONFIG.WB_SYNC_ENABLED:
    celery_app.conf.beat_schedule['task-wb-sync'] = {
        'task': 'wb_sync',
        'schedule': crontab(
            minute='*/5',
        ),
    }

celery_app.conf.beat_schedule['task-workflow-scheduler'] = {
    'task': 'workflow_scheduler',
    'schedule': crontab(minute='*'),
}
