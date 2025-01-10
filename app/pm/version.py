import os

from pm.constants import ROOT_DIR

__all__ = ('APP_VERSION',)


APP_VERSION = '__DEV__'

try:
    with open(os.path.join(ROOT_DIR, 'version.txt'), encoding='utf-8') as f:
        APP_VERSION = f.read().strip()
except FileNotFoundError:
    pass
