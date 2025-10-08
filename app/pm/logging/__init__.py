"""
Pure logging toolkit - zero dependencies, pure utility functions.

This module provides universal tools for setting up contextual logging
in any module. No business logic, no global configuration.
"""

import contextvars
import logging
from collections.abc import Sequence
from enum import StrEnum
from typing import Any

from .setup import create_configured_logger

__all__ = [
    'LogFormat',
    'setup_logging',
]


class LogFormat(StrEnum):
    """Log output format options."""

    SIMPLE = 'simple'
    JSON = 'json'


def setup_logging(
    logger_name: str | None = None,
    context_var: contextvars.ContextVar[dict[str, Any] | None] | None = None,
    prefix_keys: Sequence[str] | None = None,
    suffix_keys: Sequence[str] | None = None,
    level: int = logging.INFO,
    format_type: LogFormat = LogFormat.SIMPLE,
    force_reconfigure: bool = False,
) -> logging.Logger:
    """Set up a logger with contextual formatting.

    Pure toolkit function - zero dependencies, zero global state.

    Args:
        logger_name: Name for the logger (e.g., 'api', 'tasks.worker')
        context_var: ContextVar containing logging context dict
        prefix_keys: Keys from context dict to include in log prefix
        suffix_keys: Keys from context dict to include in log suffix
        level: Logging level (use logging.DEBUG, logging.INFO, etc.)
        format_type: Output format (LogFormat.SIMPLE or LogFormat.JSON)
        force_reconfigure: If True, reconfigure even if handlers exist

    Returns:
        Configured logger ready to use

    Example:
        >>> my_context = contextvars.ContextVar('ctx', default={})
        >>> logger = setup_logging('api', my_context, suffix_keys=['user_id', 'request_id'])
        >>> # Context manager handles the contextvar
        >>> logger.info('Request processed')  # Auto includes context suffix
    """
    return create_configured_logger(
        logger_name=logger_name,
        context_var=context_var,
        prefix_keys=prefix_keys or [],
        suffix_keys=suffix_keys or [],
        level=level,
        format_type=format_type,
        force_reconfigure=force_reconfigure,
    )
