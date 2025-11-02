from pathlib import Path

__all__ = (
    'CONFIG_PATHS',
    'IMAGE_TYPES',
    'ROOT_DIR',
)

ROOT_DIR = Path(__file__).parent.parent.resolve()
CONFIG_PATHS = [
    ROOT_DIR / 'settings.toml',
]
IMAGE_TYPES = {'image/jpeg', 'image/png', 'image/bmp'}
