from pm.config import CONFIG
from pm.tasks.app import celery_app

from ._base import run_task
from .wb_user_sync import wb_user_sync

if CONFIG.WB_SYNC_ENABLED:

    @celery_app.task(name='wb_user_sync')
    def task_wb_user_sync():
        run_task(wb_user_sync())
