"""
Logger setup and configuration utilities.

Pure configuration logic with zero dependencies.
"""

import contextvars
import logging
from typing import Any

from pm.logging.formatters import ContextualJSONFormatter, ContextualSimpleFormatter

SIMPLE_FORMAT = '%(asctime)s %(levelname)s %(name)s pid=%(process)d %(ctx_prefix)s%(message)s%(ctx_suffix)s'


def create_configured_logger(
    logger_name: str | None,
    context_var: contextvars.ContextVar[dict[str, Any] | None] | None = None,
    prefix_keys: list[str] | None = None,
    suffix_keys: list[str] | None = None,
    level: int = logging.INFO,
    format_type: str = 'simple',
    force_reconfigure: bool = False,
) -> logging.Logger:
    """Create a logger with contextual formatting.

    Args:
        logger_name: Name for the logger
        context_var: ContextVar containing logging context
        prefix_keys: Keys from context dict to include in log prefix
        suffix_keys: Keys from context dict to include in log suffix
        level: Logging level
        format_type: 'simple' or 'json'
        force_reconfigure: If True, reconfigure even if handlers exist

    Returns:
        Configured logger
    """
    # Get or create logger
    logger = logging.getLogger(logger_name)

    # Don't add handlers if already configured (unless forced)
    if logger.handlers:
        if not force_reconfigure:
            return logger
        for handler in logger.handlers[:]:
            logger.removeHandler(handler)

    # Create handler
    handler = logging.StreamHandler()
    handler.setLevel(level)

    # Create formatter based on type
    if format_type == 'json':
        formatter = ContextualJSONFormatter(
            context_var=context_var,
            context_key=_get_context_key(logger_name),
        )
    else:
        # Default to simple format
        formatter = ContextualSimpleFormatter(
            context_var=context_var,
            prefix_keys=prefix_keys or [],
            suffix_keys=suffix_keys or [],
            fmt=SIMPLE_FORMAT,
        )

    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.setLevel(level)

    return logger


def _get_context_key(logger_name: str) -> str:
    """Get context key based on logger name.

    Args:
        logger_name: Logger name (e.g., 'api.requests', 'tasks.worker')

    Returns:
        Context key for JSON logs (e.g., 'api', 'tasks')
    """
    # Use first part of logger name as context key
    return logger_name.split('.')[0]
