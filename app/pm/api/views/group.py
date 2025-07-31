from typing import Self

from beanie import PydanticObjectId
from pydantic import BaseModel

import pm.models as m

__all__ = ('GroupOutput',)


class GroupOutput(BaseModel):
    id: PydanticObjectId
    name: str
    description: str | None
    type: m.GroupType

    @classmethod
    def from_obj(cls, obj: 'm.Group | m.GroupLinkField') -> Self:
        return cls(
            id=obj.id,
            name=obj.name,
            description=obj.description,
            type=obj.type,
        )
