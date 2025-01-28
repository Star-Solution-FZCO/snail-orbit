from pm.config import CONFIG
from pm.tasks._base import run_task
from pm.tasks.app import celery_app

from .wb_sync import wb_sync
from .workflows import workflow_scheduler

if CONFIG.WB_SYNC_ENABLED:

    @celery_app.task(name='wb_sync')
    def task_wb_sync():
        run_task(wb_sync())


@celery_app.task(name='workflow_scheduler')
def task_workflow_scheduler():
    run_task(workflow_scheduler())
