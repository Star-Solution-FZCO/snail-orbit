from typing import Self

from beanie import PydanticObjectId
from pydantic import BaseModel

import pm.models as m

__all__ = ('TagLinkOutput',)


class TagLinkOutput(BaseModel):
    id: PydanticObjectId
    name: str
    color: str | None

    @classmethod
    def from_obj(cls, obj: m.Tag | m.TagLinkField) -> Self:
        return cls(
            id=obj.id,
            name=obj.name,
            color=obj.color,
        )
