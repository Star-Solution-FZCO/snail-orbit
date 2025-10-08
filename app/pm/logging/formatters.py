"""
Universal logging formatters - work with any contextvar structure.

Pure formatters with zero business logic, zero dependencies.
"""

import contextvars
import json
import logging
import traceback
from datetime import UTC, datetime
from typing import Any


class ContextualSimpleFormatter(logging.Formatter):
    """Simple formatter that uses ctx_prefix and ctx_suffix from contextvar."""

    def __init__(
        self,
        context_var: contextvars.ContextVar[dict[str, Any] | None] | None = None,
        prefix_keys: list[str] | None = None,
        suffix_keys: list[str] | None = None,
        fmt: str | None = None,
        **kwargs: Any,
    ) -> None:
        """Initialize formatter.

        Args:
            context_var: ContextVar to pull context from
            prefix_keys: Keys from context dict to include in ctx_prefix
            suffix_keys: Keys from context dict to include in ctx_suffix
            fmt: Standard logging format string
            **kwargs: Standard logging.Formatter arguments
        """
        super().__init__(fmt=fmt, **kwargs)
        self.context_var = context_var
        self.prefix_keys = prefix_keys or []
        self.suffix_keys = suffix_keys or []

    def format(self, record: logging.LogRecord) -> str:
        """Format log record with ctx_prefix and ctx_suffix."""
        # Add context values to record for %(ctx_prefix)s and %(ctx_suffix)s
        record.ctx_prefix = ''
        record.ctx_suffix = ''

        if self.context_var:
            context = self.context_var.get() or {}
            if context:
                # Build prefix from specified keys
                if self.prefix_keys:
                    prefix_parts = [
                        f'{key}={context[key]}'
                        for key in self.prefix_keys
                        if key in context
                    ]
                    if prefix_parts:
                        record.ctx_prefix = ' '.join(prefix_parts) + ' '

                # Build suffix from specified keys
                if self.suffix_keys:
                    suffix_parts = [
                        f'{key}={context[key]}'
                        for key in self.suffix_keys
                        if key in context
                    ]
                    if suffix_parts:
                        record.ctx_suffix = ' ' + ' '.join(suffix_parts)

        # Format with ctx_prefix and ctx_suffix available
        return super().format(record)


class ContextualJSONFormatter(logging.Formatter):
    """JSON formatter that includes context from any contextvar."""

    def __init__(
        self,
        context_var: contextvars.ContextVar[dict[str, Any] | None] | None = None,
        context_key: str = 'context',
    ) -> None:
        """Initialize formatter.

        Args:
            context_var: ContextVar to pull context from
            context_key: Key name for context in JSON output (e.g., 'api', 'task')
        """
        super().__init__()
        self.context_var = context_var
        self.context_key = context_key

    def format(self, record: logging.LogRecord) -> str:
        """Format as JSON with context data."""
        # Base log data
        log_data = {
            'timestamp': datetime.fromtimestamp(record.created, tz=UTC).isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
        }

        # Add exception info if present
        if record.exc_info:
            log_data['exception'] = {
                'type': record.exc_info[0].__name__ if record.exc_info[0] else None,
                'message': str(record.exc_info[1]) if record.exc_info[1] else None,
                'traceback': traceback.format_exception(*record.exc_info),
            }

        # Add context from contextvar
        if self.context_var:
            context = self.context_var.get() or {}
            if context:
                log_data[self.context_key] = context

        # Add any extra fields from record
        excluded_fields = {
            'name',
            'msg',
            'args',
            'levelname',
            'levelno',
            'pathname',
            'filename',
            'module',
            'exc_info',
            'exc_text',
            'stack_info',
            'lineno',
            'funcName',
            'created',
            'msecs',
            'relativeCreated',
            'thread',
            'threadName',
            'processName',
            'process',
            'message',
            'asctime',
        }

        extra_fields = {
            k: v for k, v in record.__dict__.items() if k not in excluded_fields
        }

        if extra_fields:
            log_data['extra'] = extra_fields

        try:
            return json.dumps(log_data, default=str, ensure_ascii=False)
        except Exception as e:  # noqa: BLE001
            # Fallback formatting if JSON fails
            return json.dumps(
                {
                    'timestamp': datetime.now(tz=UTC).isoformat(),
                    'level': 'ERROR',
                    'logger': 'pm.logging.formatters',
                    'message': f'Failed to format log record: {e}',
                    'original_message': str(record.getMessage()),
                },
                default=str,
                ensure_ascii=False,
            )
