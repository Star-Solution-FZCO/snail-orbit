from typing import TYPE_CHECKING, Self

from beanie import PydanticObjectId
from pydantic import BaseModel

if TYPE_CHECKING:
    import pm.models as m


__all__ = ('UserOutput',)


class UserOutput(BaseModel):
    id: PydanticObjectId
    name: str
    email: str

    @classmethod
    def from_obj(cls, obj: 'm.User | m.UserLinkField') -> Self:
        return cls(
            id=obj.id,
            name=obj.name,
            email=obj.email,
        )
