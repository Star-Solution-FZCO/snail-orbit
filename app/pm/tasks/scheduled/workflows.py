from datetime import datetime

import beanie.operators as bo
from croniter import croniter

import pm.models as m
from pm.tasks.actions import task_run_workflows
from pm.utils.dateutils import utcnow

__all__ = ('workflow_scheduler',)


def _check_same_minute(dt1: datetime, dt2: datetime) -> bool:
    return dt1.replace(second=0, microsecond=0) == dt2.replace(second=0, microsecond=0)


async def workflow_scheduler() -> None:
    now = utcnow()
    projects = await m.Project.find(
        bo.Eq(m.Project.is_active, True), fetch_links=True
    ).to_list()
    workflow_ids_by_project = {pr.id: {wf.id for wf in pr.workflows} for pr in projects}
    workflows = await m.ScheduledWorkflow.all().to_list()
    for wf in workflows:
        if wf.last_run and _check_same_minute(wf.last_run, now):
            # to avoid running the same workflow twice in the same minute
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
        task_run_workflows.delay(
            workflow_script=wf.script,
            project_ids=projects_to_run,
        )
