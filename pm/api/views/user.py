from typing import TYPE_CHECKING, Self
from urllib.parse import quote

from beanie import PydanticObjectId
from pydantic import BaseModel

from pm.constants import AVATAR_SIZES

if TYPE_CHECKING:
    import pm.models as m


__all__ = ('UserOutput',)

AVATAR_URL = '/api/avatar?email={email}&size={size}'


class UserOutput(BaseModel):
    id: PydanticObjectId
    name: str
    email: str
    avatars: dict[int, str]

    @classmethod
    def from_obj(cls, obj: 'm.User | m.UserLinkField') -> Self:
        return cls(
            id=obj.id,
            name=obj.name,
            email=obj.email,
            avatars={
                size: AVATAR_URL.format(email=quote(obj.email), size=size)
                for size in AVATAR_SIZES
            },
        )
