import os

__all__ = ('VERSION',)

VERSION = os.getenv('APP_VERSION', '__DEV__')
