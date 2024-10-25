import datetime
from enum import StrEnum

from dynaconf import Dynaconf, Validator

from pm.constants import CONFIG_PATHS

__all__ = ('CONFIG', 'FileStorageModeT')


class FileStorageModeT(StrEnum):
    LOCAL = 'local'
    S3 = 's3'


CONFIG = Dynaconf(
    settings_files=CONFIG_PATHS,
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
        Validator(
            'AUDIT_STORAGE_DIR',
            is_type_of=str,
            default='/data/audit',
            description='Directory for audit logs',
        ),
        Validator(
            'PARARAM_NOTIFICATION_BOT_TOKEN',
            is_type_of=str,
            default='',
            description='Token for Pararam notification bot',
        ),
        Validator(
            'PUBLIC_BASE_URL',
            is_type_of=str,
            default='http://localhost:3000',
            description='Base URL for public links',
        ),
        Validator(
            'FILE_STORAGE_MODE',
            cast=FileStorageModeT,
            default=FileStorageModeT.LOCAL,
            description='File storage method (local or s3)',
        ),
        Validator(
            'FILE_STORAGE_DIR',
            default='/data/file_storage',
            description='Directory for file storage',
            when=Validator(
                'FILE_STORAGE_MODE', condition=lambda v: v == FileStorageModeT.LOCAL
            ),
        ),
        Validator(
            'S3_ACCESS_KEY_ID',
            is_type_of=str,
            must_exist=True,
            description='S3 access key ID',
            when=Validator(
                'FILE_STORAGE_MODE', condition=lambda v: v == FileStorageModeT.S3
            ),
        ),
        Validator(
            'S3_ACCESS_KEY_SECRET',
            is_type_of=str,
            must_exist=True,
            description='S3 access key secret',
            when=Validator(
                'FILE_STORAGE_MODE', condition=lambda v: v == FileStorageModeT.S3
            ),
        ),
        Validator(
            'S3_ENDPOINT',
            is_type_of=str,
            must_exist=True,
            description='S3 endpoint',
            when=Validator(
                'FILE_STORAGE_MODE', condition=lambda v: v == FileStorageModeT.S3
            ),
        ),
        Validator(
            'S3_REGION',
            is_type_of=str,
            must_exist=True,
            description='S3 region name',
            when=Validator(
                'FILE_STORAGE_MODE', condition=lambda v: v == FileStorageModeT.S3
            ),
        ),
        Validator(
            'S3_BUCKET',
            is_type_of=str,
            default='snail-orbit',
            description='S3 bucket name',
            when=Validator(
                'FILE_STORAGE_MODE', condition=lambda v: v == FileStorageModeT.S3
            ),
        ),
        Validator(
            'S3_VERIFY',
            cast=bool,
            default=True,
            description='Verify SSL for S3',
            when=Validator(
                'FILE_STORAGE_MODE', condition=lambda v: v == FileStorageModeT.S3
            ),
        ),
        Validator(
            'S3_PUBLIC_ENDPOINT',
            default=None,
            description='Public S3 endpoint',
            when=Validator(
                'FILE_STORAGE_MODE', condition=lambda v: v == FileStorageModeT.S3
            ),
        ),
    ],
)
CONFIG.configure()
