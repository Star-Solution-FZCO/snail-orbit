"""
API logging context - contextvar for route-level logging.

Provides contextvar for rich contextual logging within routes and dependencies.
Request.state context is handled by pm.api.request_ctx module.
"""

import contextvars
from typing import Any

api_context: contextvars.ContextVar[dict[str, Any] | None] = contextvars.ContextVar(
    'api_context',
    default=None,
)


def set_api_logging_context(**kwargs: Any) -> None:
    """Add fields to API contextvar for route-level logging.

    Args:
        **kwargs: Context data to add (user_id, project_id, method, etc.)

    Example:
        set_api_context(user_id='123', method='POST')
        # Routes and dependencies will see this context in logs
    """
    current = api_context.get() or {}
    updated = current.copy()
    updated.update(kwargs)
    api_context.set(updated)
