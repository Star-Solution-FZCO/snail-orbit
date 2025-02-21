from collections.abc import Mapping
from datetime import datetime
from enum import StrEnum
from typing import TYPE_CHECKING, Any

import beanie.operators as bo
from beanie import Document, Indexed

from pm.workflows import get_on_change_script_from_string

from ._audit import audited_model

if TYPE_CHECKING:
    from .issue import Issue

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

    @classmethod
    def search_query(cls, search: str) -> Mapping[str, Any] | bool:
        return bo.RegEx(cls.name, search, 'i')


class ScheduledWorkflow(Workflow):
    type: WorkflowType = WorkflowType.SCHEDULED
    schedule: str
    last_run: datetime | None = None


class OnChangeWorkflow(Workflow):
    type: WorkflowType = WorkflowType.ON_CHANGE

    async def run(self, issue: 'Issue') -> None:
        script = get_on_change_script_from_string(self.script)
        if script:
            await script.run(issue)
