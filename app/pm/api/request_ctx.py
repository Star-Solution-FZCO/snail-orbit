from typing import Any

from fastapi import Request

CONTEXT_VAR_KEY = 'ctx'

__all__ = ('get_request_context', 'set_request_context')


def set_request_context(request: Request, **kwargs: Any) -> None:
    """Add fields to Request.state.ctx

    Args:
        request: FastAPI Request object
        **kwargs: Context data to add

    Example:
        set_request_context(request, user_id='456', user_email='test@example.com')
        # Middlewares can access this context after call_next()
    """
    if not hasattr(request.state, 'ctx'):
        request.state.ctx = {}

    request.state.ctx.update(kwargs)


def get_request_context(request: Request) -> dict:
    """Get context from Request.state.

    Args:
        request: FastAPI Request object

    Returns:
        Dict with context, empty if none set
    """
    return getattr(request.state, CONTEXT_VAR_KEY, {})
