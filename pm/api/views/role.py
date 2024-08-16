from typing import TYPE_CHECKING, Self

from beanie import PydanticObjectId
from pydantic import BaseModel

if TYPE_CHECKING:
    import pm.models as m


__all__ = ('RoleOutput',)


class RoleOutput(BaseModel):
    id: PydanticObjectId
    name: str

    @classmethod
    def from_obj(cls, obj: 'm.Role | m.RoleLinkField') -> Self:
        return cls(
            id=obj.id,
            name=obj.name,
        )
