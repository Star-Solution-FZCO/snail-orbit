from enum import StrEnum
from typing import TYPE_CHECKING

from beanie import Document, Indexed

from pm.workflows import get_on_change_script, get_scheduled_script

from ._audit import audited_model

if TYPE_CHECKING:
    from .issue import Issue
    from .project import Project

__all__ = (
    'Workflow',
    'WorkflowType',
    'ScheduledWorkflow',
    'OnChangeWorkflow',
)


class WorkflowType(StrEnum):
    ON_CHANGE = 'on_change'
    SCHEDULED = 'scheduled'


@audited_model
class Workflow(Document):
    class Settings:
        name = 'workflows'
        use_revision = True
        use_state_management = True
        state_management_save_previous = True
        is_root = True

    name: str = Indexed(str)
    type: WorkflowType
    description: str | None = None
    script: str


class ScheduledWorkflow(Workflow):
    type: WorkflowType = WorkflowType.SCHEDULED
    schedule: str

    async def run(self, project: 'Project') -> None:
        script = get_scheduled_script(self.script)
        await script.run(project)


class OnChangeWorkflow(Workflow):
    type: WorkflowType = WorkflowType.ON_CHANGE

    async def run(self, issue: 'Issue') -> None:
        script = get_on_change_script(self.script)
        await script.run(issue)
