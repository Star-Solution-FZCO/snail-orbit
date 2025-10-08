"""
Tasks logging context - contextvar for task-level logging.

Provides contextvar for rich contextual logging within task execution.
"""

import contextvars
from typing import Any

tasks_context: contextvars.ContextVar[dict[str, Any] | None] = contextvars.ContextVar(
    'tasks_context',
    default=None,
)


def set_tasks_logging_context(**kwargs: Any) -> None:
    """Add fields to tasks contextvar for task-level logging.

    Args:
        **kwargs: Context data to add (task_id, task_name, queue_name, etc.)

    Example:
        set_tasks_logging_context(task_id='abc123', task_name='send_email')
        # Tasks will see this context in logs
    """
    current = tasks_context.get() or {}
    updated = current.copy()
    updated.update(kwargs)
    tasks_context.set(updated)
