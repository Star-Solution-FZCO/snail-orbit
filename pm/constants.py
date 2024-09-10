import os

__all__ = ('VERSION', 'AVATAR_SIZES')

VERSION = os.getenv('APP_VERSION', '__DEV__')

AVATAR_SIZES = (
    20,
    50,
    100,
    200,
)
