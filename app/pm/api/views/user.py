from typing import TYPE_CHECKING, Any, Self

from beanie import PydanticObjectId
from pydantic import BaseModel, EmailStr, computed_field

from pm.services.avatars import external_avatar_url, local_avatar_url

if TYPE_CHECKING:
    import pm.models as m


UserIdentifier = PydanticObjectId | EmailStr


__all__ = ('UserIdentifier', 'UserOutput')


class UserOutput(BaseModel):
    id: PydanticObjectId
    name: str
    email: str
    is_active: bool

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
            _use_external_avatar=obj.use_external_avatar,
        )
