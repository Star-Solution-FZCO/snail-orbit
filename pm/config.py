import datetime
import os
from os.path import join as opj

from dynaconf import Dynaconf, Validator

__all__ = ('CONFIG',)


ROOT = os.path.realpath(os.path.join(os.path.dirname(__file__), '..'))
CONFIG = Dynaconf(
    settings_files=[
        opj(ROOT, 'settings-' + os.environ.get('APP_ENV', 'production') + '.toml'),
        opj(ROOT, 'settings.toml'),
    ],
    environments=True,
    load_dotenv=True,
    validators=[
        Validator('DEV_MODE', cast=bool, default=False),
        Validator(
            'DEV_PASSWORD', required=True, when=Validator('DEV_MODE', condition=bool)
        ),
        Validator('DEBUG', cast=bool, default=False),
        Validator(
            'DB_URI', default='mongodb://pm:pm@localhost:27017/pm?authSource=admin'
        ),
        Validator('PUBLIC_BASE_URL', default='http://localhost:3000'),
        Validator('JWT_SECRET', required=True),
        Validator('SENTRY_DSN', default=''),
        Validator(
            'SENTRY_PROJECT_SLUG',
            is_type_of=str,
            must_exist=True,
            when=Validator('SENTRY_DSN', condition=bool),
        ),
        Validator(
            'SENTRY_ENVIRONMENT',
            is_type_of=str,
            must_exist=True,
            when=Validator('SENTRY_DSN', condition=bool),
        ),
        Validator(
            'SENTRY_CA_CERTS',
            is_type_of=str,
            default='',
            when=Validator('SENTRY_DSN', condition=bool),
        ),
        Validator(
            'ORIGINS',
            default=[
                'http://localhost',
                'http://localhost.localdomain',
                'http://localhost:9090',
                'http://localhost.localdomain:9090',
            ],
        ),
        Validator(
            'REFRESH_TOKEN_NON_REMEMBER_EXPIRES',
            cast=int,
            default=int(datetime.timedelta(hours=2).total_seconds()),
        ),
        Validator(
            'REFRESH_TOKEN_REMEMBER_EXPIRES',
            cast=int,
            default=int(datetime.timedelta(days=90).total_seconds()),
        ),
        Validator(
            'ACCESS_TOKEN_EXPIRES',
            cast=int,
            default=int(datetime.timedelta(minutes=15).total_seconds()),
        ),
        Validator(
            'FILE_STORAGE_DIR',
            default='/data/file_storage',
        ),
        Validator(
            'REDIS_EVENT_BUS_URL',
            default='',
        ),
        Validator(
            'OIDC_ENABLED',
            cast=bool,
            default=False,
        ),
        Validator(
            'OIDC_DISCOVERY_URL',
            is_type_of=str,
            must_exist=True,
            when=Validator('OIDC_ENABLED', condition=bool),
        ),
        Validator(
            'OIDC_CLIENT_ID',
            is_type_of=str,
            must_exist=True,
            when=Validator('OIDC_ENABLED', condition=bool),
        ),
        Validator(
            'OIDC_CLIENT_SECRET',
            is_type_of=str,
            must_exist=True,
            when=Validator('OIDC_ENABLED', condition=bool),
        ),
        Validator(
            'TASKS_BROKER_URL',
            cast=str,
            default='',
        ),
        Validator(
            'WB_SYNC_ENABLED',
            cast=bool,
            default=False,
        ),
        Validator(
            'WB_USER_SYNC_LOCAL',
            cast=bool,
            default=False,
            description='Sync local if they found in WB',
            when=Validator('WB_SYNC_ENABLED', condition=bool),
        ),
        Validator(
            'WB_USER_SYNC_ADD_MISSED_INACTIVE',
            cast=bool,
            default=False,
            description='Add missed inactive users',
            when=Validator('WB_SYNC_ENABLED', condition=bool),
        ),
        Validator(
            'WB_URL',
            is_type_of=str,
            must_exist=True,
            when=Validator('WB_SYNC_ENABLED', condition=bool),
        ),
        Validator(
            'WB_API_TOKEN_KID',
            is_type_of=str,
            must_exist=True,
            when=Validator('WB_SYNC_ENABLED', condition=bool),
        ),
        Validator(
            'WB_API_TOKEN_SECRET',
            is_type_of=str,
            must_exist=True,
            when=Validator('WB_SYNC_ENABLED', condition=bool),
        ),
        Validator(
            'AVATAR_EXTERNAL_URL',
            is_type_of=str,
            description='URL for avatar service (e.g. https://avatar.example.com/{email})',
            default='',
        ),
    ],
)
CONFIG.configure()
