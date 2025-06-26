import datetime
import re
from dataclasses import dataclass, field
from enum import StrEnum
from ipaddress import IPv4Address
from typing import Any

from dynaconf import Dynaconf, Validator

from pm.constants import CONFIG_PATHS
from pm.enums import EncryptionKeyAlgorithmT

__all__ = (
    'CONFIG',
    'FileStorageModeT',
    'APIServiceTokenKeyT',
    'API_SERVICE_TOKEN_KEYS',
    'DB_ENCRYPTION_KEY',
)


class FileStorageModeT(StrEnum):
    LOCAL = 'local'
    S3 = 's3'


@dataclass
class APIServiceTokenKeyT:
    kid: str
    name: str
    secret: str
    paths: dict[str, list[str]]
    ips: list[IPv4Address]
    __paths_patterns__: list[tuple[re.Pattern, list[str]]] = field(init=False)

    def __post_init__(self) -> None:
        self.__paths_patterns__ = [
            (re.compile(f'^{p}$'), methods) for p, methods in self.paths.items()
        ]

    def check_path(self, path: str, method: str) -> bool:
        return any(
            pattern.fullmatch(path) and method in methods
            for pattern, methods in self.__paths_patterns__
        )

    def check_ip(self, ip: IPv4Address | str) -> bool:
        if not self.ips:
            return True
        if isinstance(ip, str):
            ip = IPv4Address(ip)
        return ip in self.ips


def parse_api_service_token_keys(
    keys: dict[str, Any],
) -> dict[str, APIServiceTokenKeyT]:
    result = {
        kid: APIServiceTokenKeyT(
            kid=kid,
            name=data['name'],
            secret=data['secret'],
            paths={p['path']: p.get('methods', ['GET']) for p in data['paths']},
            ips=[IPv4Address(ip) for ip in data.get('ips', [])],
        )
        for kid, data in keys.items()
    }
    if len(result) != len(keys):
        raise ValueError('Duplicate key ids')
    return result


CONFIG = Dynaconf(
    settings_files=CONFIG_PATHS,
    environments=True,
    envvar_prefix='SNAIL_ORBIT',
    load_dotenv=True,
    validators=[
        Validator('DEV_MODE', cast=bool, default=False),
        Validator('RO_MODE', cast=bool, default=False),
        Validator(
            'DEV_PASSWORD', required=True, when=Validator('DEV_MODE', condition=bool)
        ),
        Validator('DEBUG', cast=bool, default=False),
        Validator('ENABLE_PROFILING', cast=bool, default=False),
        Validator(
            'DB_URI', default='mongodb://pm:pm@localhost:27017/pm?authSource=admin'
        ),
        Validator('PUBLIC_BASE_URL', default='http://localhost:3000'),
        Validator('JWT_SECRET', required=True),
        Validator(
            'SENTRY_DSN',
            is_type_of=str | None,
            default=None,
        ),
        Validator(
            'SENTRY_PROJECT_SLUG',
            is_type_of=str | None,
            default=None,
            when=Validator('SENTRY_DSN', condition=bool),
        ),
        Validator(
            'SENTRY_ENVIRONMENT',
            is_type_of=str | None,
            default=None,
            when=Validator('SENTRY_DSN', condition=bool),
        ),
        Validator(
            'SENTRY_CA_CERTS',
            is_type_of=str | None,
            default=None,
            when=Validator('SENTRY_DSN', condition=bool),
        ),
        Validator(
            'SENTRY_SAMPLE_RATE',
            is_type_of=float | int,
            default=1.0,
            gte=0,
            lte=1,
            cast=float,
            when=Validator('SENTRY_DSN', condition=bool),
        ),
        Validator(
            'SENTRY_TRACES_SAMPLE_RATE',
            is_type_of=float | int | None,
            default=None,
            when=Validator('SENTRY_DSN', condition=bool),
        ),
        Validator(
            'SENTRY_TRACES_SAMPLE_RATE',
            gte=0,
            lte=1,
            cast=float,
            when=Validator('SENTRY_TRACES_SAMPLE_RATE', condition=bool),
        ),
        Validator(
            'SENTRY_PROFILES_SAMPLE_RATE',
            is_type_of=float | int | None,
            default=None,
            when=Validator('SENTRY_DSN', condition=bool),
        ),
        Validator(
            'SENTRY_PROFILES_SAMPLE_RATE',
            gte=0,
            lte=1,
            cast=float,
            when=Validator('SENTRY_PROFILES_SAMPLE_RATE', condition=bool),
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
            'OIDC_MFA_PAGE',
            is_type_of=str,
            default='/login/mfa',
            when=Validator('OIDC_ENABLED', condition=bool),
        ),
        Validator(
            'OIDC_REQUEST_TIMEOUT',
            cast=int,
            default=30,
            when=Validator('OIDC_ENABLED', condition=bool),
        ),
        Validator(
            'OIDC_SESSION_SECRET',
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
            description='Sync local users if they found in WB',
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
            'WB_TEAM_SYNC_LOCAL',
            cast=bool,
            default=False,
            description='Sync local groups if they found in WB',
            when=Validator('WB_SYNC_ENABLED', condition=bool),
        ),
        Validator(
            'WB_TEAM_SYNC_ADD_MISSED_ARCHIVED',
            cast=bool,
            default=False,
            description='Add missed archived groups',
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
        Validator(
            'API_SERVICE_TOKEN_MAX_AGE',
            cast=int,
            default=2 * 60,
            description='API service token max age in seconds',
        ),
        Validator('API_SERVICE_TOKEN_KEYS', default={}),
        Validator('DB_ENCRYPTION_KEY', default=None),
        Validator('MFA_TOTP_NAME', default='snail-orbit'),
        Validator('MFA_TOTP_ISSUER', default='snail-orbit'),
        Validator('ENCRYPTION_GLOBAL_PUBLIC_KEY', default=None),
        Validator(
            'ENCRYPTION_GLOBAL_FINGERPRINT',
            when=Validator(
                'ENCRYPTION_GLOBAL_PUBLIC_KEY',
                condition=bool,
            ),
        ),
        Validator(
            'ENCRYPTION_GLOBAL_ALGORITHM',
            cast=EncryptionKeyAlgorithmT,
            when=Validator(
                'ENCRYPTION_GLOBAL_PUBLIC_KEY',
                condition=bool,
            ),
        ),
        Validator(
            'DB_AUTO_MIGRATE',
            cast=bool,
            default=False,
            description='Auto-run database migrations on startup (upgrades only)',
        ),
        # SMTP Configuration
        Validator(
            'SMTP_HOST',
            is_type_of=str | None,
            default=None,
            description='SMTP server hostname',
        ),
        Validator(
            'SMTP_PORT',
            cast=int,
            default=587,
            description='SMTP server port',
        ),
        Validator(
            'SMTP_LOGIN',
            is_type_of=str | None,
            default=None,
            description='SMTP login username',
        ),
        Validator(
            'SMTP_PASSWORD',
            is_type_of=str | None,
            default=None,
            description='SMTP login password',
        ),
        Validator(
            'SMTP_SENDER',
            is_type_of=str | None,
            default=None,
            description='SMTP sender email address',
        ),
        Validator(
            'SMTP_SSL_MODE',
            is_type_of=str | None,
            default=None,
            description='SMTP SSL mode (tls, ssl, or None)',
        ),
        # Notification batching configuration
        Validator(
            'NOTIFICATION_BATCH_DELAY_SECONDS',
            cast=int,
            default=30,
            description='Delay in seconds before sending batched notifications',
        ),
        # Logging Configuration
        Validator(
            'LOG_LEVEL',
            is_type_of=str,
            default='INFO',
            description='Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)',
        ),
        Validator(
            'LOG_FORMAT',
            is_type_of=str,
            default='json',
            description='Log format type (json, pretty, console)',
        ),
        Validator(
            'LOG_FILE',
            is_type_of=str | None,
            default=None,
            description='Path to log file (if None, only console logging)',
        ),
        Validator(
            'LOG_FILE_MAX_BYTES',
            cast=int,
            default=10_000_000,
            description='Maximum size of log file before rotation (bytes)',
        ),
        Validator(
            'LOG_FILE_BACKUP_COUNT',
            cast=int,
            default=5,
            description='Number of backup log files to keep',
        ),
        Validator(
            'LOG_REQUESTS',
            cast=bool,
            default=True,
            description='Whether to log HTTP requests',
        ),
        Validator(
            'LOG_ERRORS',
            cast=bool,
            default=True,
            description='Whether to log HTTP errors',
        ),
    ],
)
CONFIG.configure()

API_SERVICE_TOKEN_KEYS = parse_api_service_token_keys(CONFIG.API_SERVICE_TOKEN_KEYS)
DB_ENCRYPTION_KEY: bytes | None = (
    CONFIG.DB_ENCRYPTION_KEY.encode('utf-8') if CONFIG.DB_ENCRYPTION_KEY else None
)
