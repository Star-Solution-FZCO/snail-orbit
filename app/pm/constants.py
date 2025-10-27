import os
from pathlib import Path

__all__ = (
    'BOT_USER_DOMAIN',
    'CONFIG_PATHS',
    'ROOT_DIR',
    'SENTRY_PACKAGE_NAME',
)


BOT_USER_DOMAIN = '@so.bot'
ROOT_DIR = Path(__file__).parent.parent.resolve()
CONFIG_PATHS = [
    ROOT_DIR / f'settings-{os.environ.get("APP_ENV", "production")}.toml',
    ROOT_DIR / 'settings.toml',
]
SENTRY_PACKAGE_NAME = 'snail-orbit'
