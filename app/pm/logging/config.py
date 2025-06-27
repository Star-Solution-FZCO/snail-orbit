import logging
import logging.config
from enum import StrEnum
from typing import Any

from pm.config import CONFIG

__all__ = ('configure_logging', 'get_logger')


class LogLevelT(StrEnum):
    DEBUG = 'DEBUG'
    INFO = 'INFO'
    WARNING = 'WARNING'
    ERROR = 'ERROR'
    CRITICAL = 'CRITICAL'


class LogFormatT(StrEnum):
    JSON = 'json'
    SIMPLE = 'simple'


def get_log_level() -> str:
    level = getattr(CONFIG, 'LOG_LEVEL', 'INFO').upper()
    return level if level in LogLevelT else LogLevelT.INFO


def get_log_format() -> str:
    default_format = LogFormatT.SIMPLE if CONFIG.DEV_MODE else LogFormatT.JSON
    format_type = getattr(CONFIG, 'LOG_FORMAT', default_format).lower()
    format_mapping = {'console': LogFormatT.SIMPLE, 'pretty': LogFormatT.SIMPLE}
    format_type = format_mapping.get(format_type, format_type)
    return format_type if format_type in LogFormatT else default_format


def get_logging_config() -> dict[str, Any]:
    log_level = get_log_level()
    use_json = get_log_format() == LogFormatT.JSON

    formatters = {
        'json': {'class': 'pm.logging.structured.StructuredJSONFormatter'},
        'simple': {
            'format': '%(asctime)s %(levelname)-8s %(name)-30s %(message)s',
            'datefmt': '%Y-%m-%d %H:%M:%S',
        },
    }

    handlers = {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'json' if use_json else 'simple',
            'level': log_level,
            'stream': 'ext://sys.stdout',
        }
    }

    log_file = getattr(CONFIG, 'LOG_FILE', None)
    if log_file:
        handlers['file'] = {
            'class': 'logging.handlers.RotatingFileHandler',
            'formatter': 'json',
            'level': log_level,
            'filename': log_file,
            'maxBytes': getattr(CONFIG, 'LOG_FILE_MAX_BYTES', 10_000_000),
            'backupCount': getattr(CONFIG, 'LOG_FILE_BACKUP_COUNT', 5),
        }

    root_handlers = ['console']
    if log_file:
        root_handlers.append('file')

    third_party_loggers = {
        'uvicorn': {'level': 'INFO'},
        'uvicorn.access': {'level': 'WARNING'},
        'uvicorn.error': {'level': 'INFO'},
        'fastapi': {'level': 'INFO'},
        'taskiq': {'level': 'INFO'},
        'beanie': {'level': 'WARNING'},
        'motor': {'level': 'WARNING'},
        'pymongo': {'level': 'WARNING'},
        'httpx': {'level': 'WARNING'},
        'aioredis': {'level': 'WARNING'},
    }

    if CONFIG.DEV_MODE:
        third_party_loggers.update(
            {
                'uvicorn.access': {'level': 'INFO'},
                'beanie': {'level': 'INFO'},
            }
        )

    return {
        'version': 1,
        'disable_existing_loggers': False,
        'formatters': formatters,
        'handlers': handlers,
        'loggers': {
            'pm': {
                'level': log_level,
                'handlers': root_handlers,
                'propagate': False,
            },
            **third_party_loggers,
        },
        'root': {
            'level': log_level,
            'handlers': root_handlers,
        },
    }


def configure_logging() -> None:
    config = get_logging_config()
    logging.config.dictConfig(config)


def get_logger(name: str) -> logging.Logger:
    if not logging.getLogger().handlers:
        configure_logging()
    return logging.getLogger(name)
