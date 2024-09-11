from typing import TYPE_CHECKING, Self
from urllib.parse import quote

from beanie import PydanticObjectId
from pydantic import BaseModel, computed_field

if TYPE_CHECKING:
    import pm.models as m


__all__ = ('UserOutput',)

AVATAR_URL = '/api/avatar?email={email}'


class UserOutput(BaseModel):
    id: PydanticObjectId
    name: str
    email: str

    @computed_field
    @property
    def avatar(self) -> str:
        return AVATAR_URL.format(email=quote(self.email))

    @classmethod
    def from_obj(cls, obj: 'm.User | m.UserLinkField') -> Self:
        return cls(
            id=obj.id,
            name=obj.name,
            email=obj.email,
        )
