import beanie.operators as bo
from beanie import PydanticObjectId

import pm.models as m
from pm.tasks._base import run_task
from pm.tasks.app import celery_app
from pm.workflows import get_scheduled_script_from_string

__all__ = ('task_run_workflows',)


async def run_workflows(
    workflow_script: str,
    project_ids: list[str],
) -> None:
    project_ids_ = [PydanticObjectId(pid) for pid in project_ids]
    script = get_scheduled_script_from_string(workflow_script)
    if script:
        async for project in m.Project.find(bo.In(m.Project.id, project_ids_)):
            await script.run(project)


@celery_app.task(name='run_workflows')
def task_run_workflows(
    workflow_script: str,
    project_ids: list[str],
) -> None:
    run_task(run_workflows(workflow_script, project_ids))
