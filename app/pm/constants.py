import os
from os.path import join as opj

__all__ = (
    'ROOT_DIR',
    'CONFIG_PATHS',
)


ROOT_DIR = os.path.realpath(opj(os.path.dirname(__file__), '..'))
CONFIG_PATHS = [
    opj(ROOT_DIR, 'settings-' + os.environ.get('APP_ENV', 'production') + '.toml'),
    opj(ROOT_DIR, 'settings.toml'),
]
