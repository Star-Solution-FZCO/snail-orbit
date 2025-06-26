from pm.logging.config import configure_logging
from pm.logging.context import (
    LogContext,
    get_correlation_id,
    get_logger,
    log_context,
    set_correlation_id,
    set_project_context,
    set_task_context,
    set_user_context,
)
from pm.logging.middleware import LoggingMiddleware, create_logging_middleware

__all__ = (
    'configure_logging',
    'LogContext',
    'get_correlation_id',
    'set_correlation_id',
    'set_user_context',
    'set_project_context',
    'set_task_context',
    'log_context',
    'get_logger',
    'LoggingMiddleware',
    'create_logging_middleware',
)

try:
    configure_logging()
except Exception:
    import logging

    logging.basicConfig(
        level=logging.INFO, format='[%(asctime)s][%(name)s][%(levelname)s] %(message)s'
    )
