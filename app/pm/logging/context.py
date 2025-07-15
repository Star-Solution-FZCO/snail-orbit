import contextvars
import logging
import uuid
from collections.abc import Generator
from contextlib import contextmanager
from typing import Any

from beanie import PydanticObjectId

__all__ = (
    'LogContext',
    'get_correlation_id',
    'get_logger',
    'log_context',
    'set_correlation_id',
    'set_project_context',
    'set_task_context',
    'set_user_context',
)


_correlation_id: contextvars.ContextVar[str] = contextvars.ContextVar(
    'correlation_id',
    default='',
)
_user_id: contextvars.ContextVar[str] = contextvars.ContextVar('user_id', default='')
_user_email: contextvars.ContextVar[str] = contextvars.ContextVar(
    'user_email',
    default='',
)
_project_id: contextvars.ContextVar[str] = contextvars.ContextVar(
    'project_id',
    default='',
)
_task_id: contextvars.ContextVar[str] = contextvars.ContextVar('task_id', default='')
_task_name: contextvars.ContextVar[str] = contextvars.ContextVar(
    'task_name',
    default='',
)


class LogContext:
    def __init__(
        self,
        correlation_id: str | None = None,
        user_id: str | PydanticObjectId | None = None,
        user_email: str | None = None,
        project_id: str | PydanticObjectId | None = None,
        **extra: Any,
    ) -> None:
        self.correlation_id = correlation_id or generate_correlation_id()
        self.user_id = str(user_id) if user_id else ''
        self.user_email = user_email or ''
        self.project_id = str(project_id) if project_id else ''
        self.extra = extra

    def to_dict(self) -> dict[str, Any]:
        context = {}
        if self.correlation_id:
            context['correlation_id'] = self.correlation_id
        if self.user_id:
            context['user_id'] = self.user_id
        if self.user_email:
            context['user_email'] = self.user_email
        if self.project_id:
            context['project_id'] = self.project_id
        context.update(self.extra)
        return context


def generate_correlation_id() -> str:
    return str(uuid.uuid4())


def get_correlation_id() -> str:
    return _correlation_id.get('')


def set_correlation_id(correlation_id: str) -> None:
    _correlation_id.set(correlation_id)


def set_user_context(
    user_id: str | PydanticObjectId,
    user_email: str | None = None,
) -> None:
    _user_id.set(str(user_id))
    if user_email:
        _user_email.set(user_email)


def set_project_context(project_id: str | PydanticObjectId) -> None:
    _project_id.set(str(project_id))


def set_task_context(task_id: str, task_name: str | None = None) -> None:
    _task_id.set(task_id)
    if task_name:
        _task_name.set(task_name)


def get_current_context() -> LogContext:
    return LogContext(
        correlation_id=_correlation_id.get(''),
        user_id=_user_id.get(''),
        user_email=_user_email.get(''),
        project_id=_project_id.get(''),
    )


@contextmanager
def log_context(**context: Any) -> Generator[LogContext, None, None]:
    old_correlation_id = _correlation_id.get('')
    old_user_id = _user_id.get('')
    old_user_email = _user_email.get('')
    old_project_id = _project_id.get('')
    old_task_id = _task_id.get('')
    old_task_name = _task_name.get('')

    try:
        log_ctx = LogContext(**context)
        _correlation_id.set(log_ctx.correlation_id)
        _user_id.set(log_ctx.user_id)
        _user_email.set(log_ctx.user_email)
        _project_id.set(log_ctx.project_id)

        if 'task_id' in context:
            _task_id.set(str(context['task_id']))
        if 'task_name' in context:
            _task_name.set(str(context['task_name']))

        yield log_ctx

    finally:
        _correlation_id.set(old_correlation_id)
        _user_id.set(old_user_id)
        _user_email.set(old_user_email)
        _project_id.set(old_project_id)
        _task_id.set(old_task_id)
        _task_name.set(old_task_name)


class ContextualLoggerAdapter(logging.LoggerAdapter):
    def process(self, msg: Any, kwargs: dict[str, Any]) -> tuple[Any, dict[str, Any]]:
        context = get_current_context()
        if 'extra' not in kwargs:
            kwargs['extra'] = {}
        kwargs['extra'].update(context.to_dict())
        return msg, kwargs


def get_logger(name: str) -> ContextualLoggerAdapter:
    if not logging.getLogger().handlers:
        from pm.logging.config import (  # pylint: disable=import-outside-toplevel
            configure_logging,
        )

        configure_logging()

    base_logger = logging.getLogger(name)
    return ContextualLoggerAdapter(base_logger, extra={})
