from abc import ABC, abstractmethod
from importlib import import_module
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from pm.models.issue import Issue
    from pm.models.project import Project


__all__ = (
    'ScheduledWorkflowScript',
    'OnChangeWorkflowScript',
    'WorkflowException',
    'get_on_change_script',
    'get_scheduled_script',
)


class WorkflowException(Exception):
    fields_errors: dict[str, str]
    msg: str

    def __init__(self, msg: str, fields_errors: dict[str, str] | None = None):
        self.msg = msg
        self.fields_errors = fields_errors or {}
        super().__init__(msg)


class OnChangeWorkflowScript(ABC):
    @abstractmethod
    async def run(self, issue: 'Issue') -> None:
        pass


class ScheduledWorkflowScript(ABC):
    @abstractmethod
    async def run(self, project: 'Project'):  # todo: should run on the list of projects
        pass


def _import_cls(path: str) -> type[OnChangeWorkflowScript | ScheduledWorkflowScript]:
    module_path, class_name = path.rsplit('.', 1)
    module = import_module(module_path)
    cls = getattr(module, class_name)
    if not issubclass(cls, (OnChangeWorkflowScript, ScheduledWorkflowScript)):
        raise TypeError(
            f'Class {cls} must be a subclass of OnChangeWorkflowScript or ScheduledWorkflowScript'
        )
    return cls


def get_on_change_script(path: str) -> OnChangeWorkflowScript:
    cls = _import_cls(path)
    if not issubclass(cls, OnChangeWorkflowScript):
        raise TypeError(f'Class {cls} must be a subclass of OnChangeWorkflowScript')
    return cls()


def get_scheduled_script(path: str) -> ScheduledWorkflowScript:
    cls = _import_cls(path)
    if not issubclass(cls, ScheduledWorkflowScript):
        raise TypeError(f'Class {cls} must be a subclass of ScheduledWorkflowScript')
    return cls()
