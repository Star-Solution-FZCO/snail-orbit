from typing import TYPE_CHECKING, Self

from beanie import PydanticObjectId
from pydantic import BaseModel

if TYPE_CHECKING:
    import pm.models as m


__all__ = ('GroupOutput',)


class GroupOutput(BaseModel):
    id: PydanticObjectId
    name: str
    description: str | None

    @classmethod
    def from_obj(cls, obj: 'm.Group | m.GroupLinkField') -> Self:
        return cls(
            id=obj.id,
            name=obj.name,
            description=obj.description,
        )
