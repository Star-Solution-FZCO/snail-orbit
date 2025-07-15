from pathlib import Path

from pm.constants import ROOT_DIR

__all__ = ('APP_VERSION',)


APP_VERSION = '__DEV__'

try:
    with (Path(ROOT_DIR) / 'version.txt').open(encoding='utf-8') as f:
        APP_VERSION = f.read().strip()
except FileNotFoundError:  # nosec B110  # noqa: S110
    pass
