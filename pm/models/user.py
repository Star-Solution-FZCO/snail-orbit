import base64
import secrets
from datetime import datetime
from typing import Self

import bcrypt
from beanie import Document, Indexed, PydanticObjectId
from pydantic import BaseModel, Field

from pm.utils.dateutils import utcnow

from ._audit import audited_model
from .group import GroupLinkField

__all__ = (
    'APIToken',
    'User',
    'UserLinkField',
)


class UserLinkField(BaseModel):
    id: PydanticObjectId
    name: str
    email: str

    @classmethod
    def from_obj(cls, obj: 'User') -> Self:
        return cls(
            id=obj.id,
            name=obj.name,
            email=obj.email,
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
    created_at: datetime = Field(default_factory=utcnow)

    def check_secret(self, secret: str) -> bool:
        return bcrypt.checkpw(secret.encode('utf-8'), self.secret_hash.encode('utf-8'))

    @property
    def is_active(self) -> bool:
        return self.expires_at is None or self.expires_at > utcnow()

    @staticmethod
    def hash_secret(secret: str) -> str:
        return bcrypt.hashpw(secret.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


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
    is_active: bool = True
    is_admin: bool = False
    api_tokens: list[APIToken] = Field(default_factory=list)
    groups: list[GroupLinkField] = Field(default_factory=list)

    def check_password(self, password: str) -> bool:
        if not self.password_hash:
            return False
        return bcrypt.checkpw(
            password.encode('utf-8'), self.password_hash.encode('utf-8')
        )

    @staticmethod
    def hash_password(password: str) -> str:
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

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
