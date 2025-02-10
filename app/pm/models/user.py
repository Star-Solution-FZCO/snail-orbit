import base64
import secrets
from datetime import datetime, timedelta
from enum import StrEnum
from typing import Annotated, Self

import bcrypt
from beanie import Document, Indexed, PydanticObjectId
from cryptography.fernet import Fernet
from pydantic import BaseModel, Field
from starsol_otp import TOTP, generate_random_base32_secret

from pm.config import DB_ENCRYPTION_KEY
from pm.utils.dateutils import timestamp_from_utc, utcnow

from ._audit import audited_model
from .group import GroupLinkField

__all__ = (
    'APIToken',
    'User',
    'UserLinkField',
    'UserOriginType',
    'UserAvatarType',
    'TOTPSettings',
)


TOTP_WINDOW = 1


class UserOriginType(StrEnum):
    LOCAL = 'local'
    WB = 'wb'


class UserAvatarType(StrEnum):
    EXTERNAL = 'external'
    LOCAL = 'local'
    DEFAULT = 'default'


class UserLinkField(BaseModel):
    id: PydanticObjectId
    name: str
    email: str
    is_active: bool
    use_external_avatar: bool

    @classmethod
    def from_obj(cls, obj: 'User') -> Self:
        return cls(
            id=obj.id,
            name=obj.name,
            email=obj.email,
            is_active=obj.is_active,
            use_external_avatar=obj.use_external_avatar,
        )

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, UserLinkField):
            return False
        return self.id == other.id

    def __hash__(self) -> int:
        return hash(self.id)


class APIToken(BaseModel):
    name: str
    last_digits: str
    secret_hash: str
    expires_at: datetime | None = None
    created_at: Annotated[datetime, Field(default_factory=utcnow)]

    def check_secret(self, secret: str) -> bool:
        return bcrypt.checkpw(secret.encode('utf-8'), self.secret_hash.encode('utf-8'))

    @property
    def is_active(self) -> bool:
        return self.expires_at is None or self.expires_at > utcnow()

    @staticmethod
    def hash_secret(secret: str) -> str:
        return bcrypt.hashpw(secret.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


class PasswordResetToken(BaseModel):
    secret_hash: str
    expires_at: datetime
    created_at: Annotated[datetime, Field(default_factory=utcnow)]

    @property
    def is_active(self) -> bool:
        return self.expires_at > utcnow()

    @staticmethod
    def hash_secret(secret: str) -> str:
        return bcrypt.hashpw(secret.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    def check_secret(self, secret: str) -> bool:
        return bcrypt.checkpw(secret.encode('utf-8'), self.secret_hash.encode('utf-8'))


class TOTPSettings(BaseModel):
    secret_encrypted: bytes
    period: int
    digits: int
    digest: str
    created_at: datetime

    @classmethod
    def create(cls, secret: str, period: int, digits: int, digest: str) -> Self:
        if not DB_ENCRYPTION_KEY:
            raise ValueError('DB_ENCRYPTION_KEY is not set')
        fernet = Fernet(DB_ENCRYPTION_KEY)
        return cls(
            secret_encrypted=fernet.encrypt(secret.encode('utf-8')),
            period=period,
            digits=digits,
            digest=digest,
            created_at=utcnow(),
        )

    @classmethod
    def generate(
        cls, period: int = 30, digits: int = 6, digest: str = 'sha1'
    ) -> tuple[Self, str]:
        secret = generate_random_base32_secret()
        return cls.create(secret, period, digits, digest), secret

    def _get_verifier(self) -> TOTP:
        if not DB_ENCRYPTION_KEY:
            raise ValueError('DB_ENCRYPTION_KEY is not set')

        fernet = Fernet(DB_ENCRYPTION_KEY)
        secret = fernet.decrypt(self.secret_encrypted).decode('utf-8')
        return TOTP(secret, period=self.period, digits=self.digits, digest=self.digest)

    def check_code(self, code: str) -> bool:
        return self._get_verifier().verify(code, window=TOTP_WINDOW)

    def get_url(self, name: str, issuer: str) -> str:
        return self._get_verifier().url(name, issuer=issuer)


@audited_model
class User(Document):
    class Settings:
        name = 'users'
        use_revision = True
        use_state_management = True
        state_management_save_previous = True

    name: str = Indexed(str)
    email: str = Indexed(str, unique=True)
    password_hash: str | None = None
    password_reset_token: PasswordResetToken | None = None
    totp: TOTPSettings | None = None
    mfa_enabled: bool = False
    is_active: bool = True
    is_admin: bool = False
    api_tokens: Annotated[list[APIToken], Field(default_factory=list)]
    groups: Annotated[list[GroupLinkField], Field(default_factory=list)]
    origin: UserOriginType = UserOriginType.LOCAL
    avatar_type: UserAvatarType = UserAvatarType.DEFAULT
    ui_settings: Annotated[dict, Field(default_factory=dict)]

    @property
    def use_external_avatar(self) -> bool:
        return self.avatar_type == UserAvatarType.EXTERNAL

    def check_password(self, password: str) -> bool:
        if not self.password_hash:
            return False
        return bcrypt.checkpw(
            password.encode('utf-8'), self.password_hash.encode('utf-8')
        )

    @staticmethod
    def hash_password(password: str) -> str:
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    def set_password(self, password: str) -> None:
        self.password_hash = self.hash_password(password)

    def gen_new_api_token(
        self, name: str, expires_at: datetime | None = None
    ) -> tuple[str, APIToken]:
        secret = secrets.token_hex(32)
        token = base64.b64encode(
            f'{self.id}:{secret}:{datetime.now().timestamp()}'.encode('utf-8'),
            altchars=b'-:',
        ).decode('utf-8')
        api_token_obj = APIToken(
            name=name,
            last_digits=token[-6:],
            secret_hash=APIToken.hash_secret(secret),
            expires_at=expires_at,
        )
        return token, api_token_obj

    @classmethod
    async def get_by_api_token(cls, token: str) -> Self | None:
        split_token = (
            base64.b64decode(token.encode(), altchars=b'-:').decode().split(':')
        )
        if len(split_token) != 3:
            return None
        user_id, secret, _ = split_token
        if not (user := await cls.find_one(cls.id == PydanticObjectId(user_id))):
            return None
        if not any(
            api_token.check_secret(secret)
            for api_token in user.api_tokens
            if api_token.is_active
        ):
            return None
        return user

    def gen_new_password_reset_token(
        self, ttl: int | timedelta
    ) -> tuple[str, PasswordResetToken]:
        if isinstance(ttl, int):
            ttl = timedelta(seconds=ttl)
        secret = secrets.token_hex(32)
        now = utcnow()
        token = base64.b64encode(
            f'{self.id}:{secret}:{timestamp_from_utc(now)}'.encode('utf-8'),
            altchars=b'-:',
        ).decode('utf-8')
        obj = PasswordResetToken(
            secret_hash=PasswordResetToken.hash_secret(secret),
            created_at=now,
            expires_at=now + ttl,
        )
        return token, obj

    @classmethod
    async def get_by_password_reset_token(cls, token: str) -> Self | None:
        split_token = (
            base64.b64decode(token.encode(), altchars=b'-:').decode().split(':')
        )
        if len(split_token) != 3:
            return None
        user_id, secret, _ = split_token
        if not (user := await cls.find_one(cls.id == PydanticObjectId(user_id))):
            return None
        if not user.password_reset_token:
            return None
        if not user.password_reset_token.check_secret(secret):
            return None
        return user

    def check_totp(self, code: str) -> bool:
        if not self.totp:
            return False
        return self.totp.check_code(code)
