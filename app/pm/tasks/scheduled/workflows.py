from datetime import datetime

import beanie.operators as bo
from croniter import croniter

import pm.models as m
from pm.tasks._base import setup_database
from pm.tasks.actions import task_run_workflows
from pm.tasks.app import broker
from pm.utils.dateutils import utcnow

__all__ = ('workflow_scheduler',)


def _check_same_minute(dt1: datetime, dt2: datetime) -> bool:
    return dt1.replace(second=0, microsecond=0) == dt2.replace(second=0, microsecond=0)


async def _workflow_scheduler() -> None:
    now = utcnow()
    projects = await m.Project.find(
        bo.Eq(m.Project.is_active, True), fetch_links=True
    ).to_list()
    workflow_ids_by_project = {pr.id: {wf.id for wf in pr.workflows} for pr in projects}
    workflows = await m.ScheduledWorkflow.all().to_list()
    for wf in workflows:
        if wf.last_run and _check_same_minute(wf.last_run, now):
            continue
        if not croniter.match(wf.schedule, now):
            continue
        projects_to_run = [
            str(pr.id) for pr in projects if wf.id in workflow_ids_by_project[pr.id]
        ]
        if not projects_to_run:
            continue
        wf.last_run = now
        await wf.save_changes()
        await task_run_workflows.kiq(
            workflow_script=wf.script,
            project_ids=projects_to_run,
        )


@broker.task(
    schedule=[{'cron': '* * * * *'}],
    task_name='workflow_scheduler',
)
async def workflow_scheduler() -> None:
    await setup_database()
    await _workflow_scheduler()
