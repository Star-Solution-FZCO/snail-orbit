from typing import Any, Self

from beanie import PydanticObjectId
from pydantic import BaseModel, EmailStr, computed_field

import pm.models as m
from pm.services.avatars import external_avatar_url, local_avatar_url

UserIdentifier = PydanticObjectId | EmailStr


__all__ = ('UserCreate', 'UserFullOutput', 'UserIdentifier', 'UserOutput', 'UserUpdate')


class UserOutput(BaseModel):
    id: PydanticObjectId
    name: str
    email: str
    is_active: bool
    is_bot: bool

    _use_external_avatar: bool

    def __init__(self, **data: Any) -> None:
        super().__init__(**data)
        self._use_external_avatar = data.get('_use_external_avatar', False)

    @computed_field
    @property
    def avatar(self) -> str:
        if self._use_external_avatar and (url := external_avatar_url(self.email)):
            return url
        return local_avatar_url(self.email)

    @classmethod
    def from_obj(cls, obj: 'm.User | m.UserLinkField') -> Self:
        return cls(
            id=obj.id,
            name=obj.name,
            email=obj.email,
            is_active=obj.is_active,
            is_bot=obj.is_bot,
            _use_external_avatar=obj.use_external_avatar,
        )


class UserFullOutput(UserOutput):
    is_admin: bool
    origin: m.UserOriginType
    avatar_type: m.UserAvatarType
    mfa_enabled: bool

    @classmethod
    def from_obj(cls, obj: m.User) -> Self:
        return cls(
            id=obj.id,
            email=obj.email,
            name=obj.name,
            is_active=obj.is_active,
            is_bot=obj.is_bot,
            _use_external_avatar=obj.use_external_avatar,
            is_admin=obj.is_admin,
            origin=obj.origin,
            avatar_type=obj.avatar_type,
            mfa_enabled=obj.mfa_enabled,
        )


class UserCreate(BaseModel):
    email: str
    name: str
    is_active: bool = True
    is_admin: bool = False
    send_email_invite: bool = False
    send_pararam_invite: bool = False


class UserUpdate(BaseModel):
    email: str | None = None
    name: str | None = None
    is_active: bool | None = None
    is_admin: bool | None = None
