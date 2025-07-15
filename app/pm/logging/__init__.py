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
    'LogContext',
    'LoggingMiddleware',
    'configure_logging',
    'create_logging_middleware',
    'get_correlation_id',
    'get_logger',
    'log_context',
    'set_correlation_id',
    'set_project_context',
    'set_task_context',
    'set_user_context',
)

try:
    configure_logging()
except Exception:  # noqa: BLE001
    import logging

    logging.basicConfig(
        level=logging.INFO,
        format='[%(asctime)s][%(name)s][%(levelname)s] %(message)s',
    )
