import importlib
import inspect
import tempfile
from abc import ABC, abstractmethod
from importlib import import_module
from pathlib import Path
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from pm.models.issue import Issue
    from pm.models.project import Project


__all__ = (
    'OnChangeWorkflowScript',
    'ScheduledWorkflowScript',
    'WorkflowError',
    'get_on_change_script',
    'get_on_change_script_from_string',
    'get_scheduled_script',
    'get_scheduled_script_from_string',
)


class WorkflowError(Exception):
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
    async def run(
        self, project: 'Project'
    ) -> None:  # todo: should run on the list of projects
        pass


def _import_cls(path: str) -> type[OnChangeWorkflowScript | ScheduledWorkflowScript]:
    module_path, class_name = path.rsplit('.', 1)
    module = import_module(module_path)
    cls = getattr(module, class_name)
    if not issubclass(cls, OnChangeWorkflowScript | ScheduledWorkflowScript):
        raise TypeError(
            f'Class {cls} must be a subclass of OnChangeWorkflowScript or ScheduledWorkflowScript',
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


def get_on_change_script_from_string(script: str) -> OnChangeWorkflowScript | None:
    return load_workflow_script(script, OnChangeWorkflowScript)


def get_scheduled_script_from_string(script: str) -> ScheduledWorkflowScript | None:
    return load_workflow_script(script, ScheduledWorkflowScript)


def load_module_from_string(script: str, module_name: str = 'dynamic_module') -> Any:
    with tempfile.NamedTemporaryFile('w', suffix='.py', delete=False) as tmp:
        tmp.write(script)
    try:
        spec = importlib.util.spec_from_file_location(module_name, tmp.name)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        return module
    finally:
        Path(tmp.name).unlink()


def load_workflow_script(
    script: str,
    base_class: type,
) -> OnChangeWorkflowScript | ScheduledWorkflowScript | None:
    module = load_module_from_string(script)
    for obj in vars(module).values():
        if (
            inspect.isclass(obj)
            and issubclass(obj, base_class)
            and obj is not base_class
        ):
            return obj()
    return None
