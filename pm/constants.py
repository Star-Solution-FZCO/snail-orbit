import os
from os.path import join as opj

__all__ = (
    'VERSION',
    'AVATAR_SIZE',
    'ROOT_DIR',
    'CONFIG_PATHS',
)

VERSION = os.getenv('APP_VERSION', '__DEV__')

AVATAR_SIZE = 200

ROOT_DIR = os.path.realpath(opj(os.path.dirname(__file__), '..'))
CONFIG_PATHS = [
    opj(ROOT_DIR, 'settings-' + os.environ.get('APP_ENV', 'production') + '.toml'),
    opj(ROOT_DIR, 'settings.toml'),
]
