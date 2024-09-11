import os

__all__ = ('VERSION', 'AVATAR_SIZE')

VERSION = os.getenv('APP_VERSION', '__DEV__')

AVATAR_SIZE = 200
