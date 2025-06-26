import json
import logging
import traceback
from datetime import datetime, timezone
from typing import Any

from pm.config import CONFIG

__all__ = (
    'StructuredJSONFormatter',
    'get_structured_log_data',
    'sanitize_log_data',
)


def get_structured_log_data(record: logging.LogRecord) -> dict[str, Any]:
    data = {
        'timestamp': datetime.fromtimestamp(
            record.created, tz=timezone.utc
        ).isoformat(),
        'level': record.levelname,
        'logger': record.name,
        'message': record.getMessage(),
    }

    if record.exc_info:
        data['exception'] = {
            'type': record.exc_info[0].__name__ if record.exc_info[0] else None,
            'message': str(record.exc_info[1]) if record.exc_info[1] else None,
            'traceback': traceback.format_exception(*record.exc_info),
        }

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
        'task_id',
        'task_name',
        'taskName',
    }

    extra_fields = {
        k: v for k, v in record.__dict__.items() if k not in excluded_fields
    }

    if extra_fields:
        data['extra'] = extra_fields

    return data


def sanitize_log_data(data: dict[str, Any]) -> dict[str, Any]:
    sensitive_fields = {'password', 'secret', 'token', 'key', 'auth', 'credentials'}

    def sanitize_value(key: str, value: Any) -> Any:
        if isinstance(key, str) and any(s in key.lower() for s in sensitive_fields):
            return '[REDACTED]'
        if isinstance(value, dict):
            return {k: sanitize_value(k, v) for k, v in value.items()}
        if isinstance(value, list):
            return [sanitize_value(f'{key}[{i}]', v) for i, v in enumerate(value)]
        return value

    return {key: sanitize_value(key, value) for key, value in data.items()}


class StructuredJSONFormatter(logging.Formatter):
    def __init__(
        self, fmt=None, datefmt=None, style='%', validate=True, **_kwargs
    ) -> None:
        super().__init__()

    def format(self, record: logging.LogRecord) -> str:
        try:
            data = get_structured_log_data(record)
            if not CONFIG.DEV_MODE:
                data = sanitize_log_data(data)
            return json.dumps(data, default=str, ensure_ascii=False)
        except Exception as e:
            return json.dumps(
                {
                    'timestamp': datetime.now(tz=timezone.utc).isoformat(),
                    'level': 'ERROR',
                    'logger': 'pm.logging.structured',
                    'message': f'Failed to format log record: {e}',
                },
                default=str,
                ensure_ascii=False,
            )
