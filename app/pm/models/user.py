import base64
import secrets
from collections.abc import Mapping
from datetime import datetime, timedelta
from enum import StrEnum
from typing import TYPE_CHECKING, Annotated, Any, ClassVar, Self

import bcrypt
import beanie.operators as bo
import pymongo
from beanie import Document, Indexed, PydanticObjectId
from bson.errors import InvalidId
from cryptography.fernet import Fernet
from pydantic import BaseModel, Field, computed_field
from starsol_otp import TOTP, generate_random_base32_secret

from pm.config import DB_ENCRYPTION_KEY
from pm.constants import BOT_USER_DOMAIN
from pm.utils.dateutils import timestamp_from_utc, utcnow

from ._audit import audited_model
from ._encryption import EncryptionKey
from .global_role import GlobalRoleLinkField
from .group import GroupLinkField

if TYPE_CHECKING:
    from .global_role import GlobalRole
    from .group import Group

__all__ = (
    'APIToken',
    'TOTPSettings',
    'User',
    'UserAvatarType',
    'UserLinkField',
    'UserOriginType',
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

    @computed_field
    @property
    def is_bot(self) -> bool:
        """Whether this user is a bot account based on email domain."""
        return self.email.endswith(BOT_USER_DOMAIN)

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
        indexes: ClassVar = [
            pymongo.IndexModel([('groups.id', 1)], name='groups_id_index'),
            pymongo.IndexModel([('global_roles.id', 1)], name='global_roles_id_index'),
            pymongo.IndexModel(
                [('api_tokens.is_active', 1)], name='api_tokens_active_index'
            ),
            pymongo.IndexModel(
                [('is_active', 1)],
                name='is_active_index',
                partialFilterExpression={'is_active': True},
            ),
            pymongo.IndexModel([('is_admin', 1)], name='is_admin_index'),
            pymongo.IndexModel([('origin', 1)], name='origin_index'),
            pymongo.IndexModel([('mfa_enabled', 1)], name='mfa_enabled_index'),
            pymongo.IndexModel(
                [('name', pymongo.TEXT), ('email', pymongo.TEXT)],
                name='user_text_search_index',
            ),
        ]

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
    global_roles: Annotated[list[GlobalRoleLinkField], Field(default_factory=list)] = (
        Field(description='Global roles assigned to this user')
    )
    origin: UserOriginType = UserOriginType.LOCAL
    avatar_type: UserAvatarType = UserAvatarType.DEFAULT
    ui_settings: Annotated[dict, Field(default_factory=dict)]
    encryption_keys: Annotated[list[EncryptionKey], Field(default_factory=list)]

    @property
    def use_external_avatar(self) -> bool:
        return self.avatar_type == UserAvatarType.EXTERNAL

    @property
    def is_bot(self) -> bool:
        """Whether this user is a bot account based on email domain."""
        return self.email.endswith(BOT_USER_DOMAIN)  # pylint: disable=no-member

    @classmethod
    def search_query(cls, search: str) -> Mapping[str, Any] | bool:
        return bo.Or(
            bo.RegEx(cls.name, search, 'i'),
            bo.RegEx(cls.email, search, 'i'),
        )

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
            f'{self.id}:{secret}:{datetime.now().timestamp()}'.encode(),
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
        if len(split_token) != 3:  # noqa: PLR2004
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
            f'{self.id}:{secret}:{timestamp_from_utc(now)}'.encode(),
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
        if len(split_token) != 3:  # noqa: PLR2004
            return None
        user_id, secret, _ = split_token
        if not (user := await cls.find_one(cls.id == PydanticObjectId(user_id))):
            return None
        if not user.password_reset_token:
            return None
        if not user.password_reset_token.check_secret(secret):
            return None
        return user

    @classmethod
    async def find_one_by_id_or_email(
        cls, id_or_email: PydanticObjectId | str
    ) -> Self | None:
        if isinstance(id_or_email, PydanticObjectId):
            return await cls.find_one(cls.id == id_or_email)
        try:
            object_id = PydanticObjectId(id_or_email)
            return await cls.find_one(cls.id == object_id)
        except InvalidId:  # noqa: S110
            pass
        return await cls.find_one(cls.email == id_or_email)

    def check_totp(self, code: str) -> bool:
        if not self.totp:
            return False
        return self.totp.check_code(code)

    @classmethod
    async def remove_group_embedded_links(
        cls,
        group_id: PydanticObjectId,
    ) -> None:
        await cls.find({'groups.id': group_id}).update_many(
            {'$pull': {'groups': {'id': group_id}}}
        )

    @classmethod
    async def update_group_embedded_links(
        cls,
        group: 'Group',
    ) -> None:
        await cls.find(
            cls.groups.id == group.id,
        ).update_many(
            {'$set': {'groups.$[g]': GroupLinkField.from_obj(group).model_dump()}},
            array_filters=[{'g.id': group.id}],
        )

    @classmethod
    async def remove_global_role_embedded_links(
        cls,
        global_role_id: PydanticObjectId,
    ) -> None:
        """Remove global role links when a global role is deleted."""
        await cls.find({'global_roles.id': global_role_id}).update_many(
            {'$pull': {'global_roles': {'id': global_role_id}}}
        )

    @classmethod
    async def update_global_role_embedded_links(
        cls,
        global_role: 'GlobalRole',
    ) -> None:
        """Update global role links when a global role is modified."""
        await cls.find(
            {'global_roles.id': global_role.id},
        ).update_many(
            {
                '$set': {
                    'global_roles.$[gr]': GlobalRoleLinkField.from_obj(
                        global_role
                    ).model_dump()
                }
            },
            array_filters=[{'gr.id': global_role.id}],
        )
