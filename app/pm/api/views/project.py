from typing import Self

from beanie import PydanticObjectId
from pydantic import BaseModel

import pm.models as m

__all__ = ('ProjectShortOutput',)


class ProjectShortOutput(BaseModel):
    id: PydanticObjectId
    name: str
    slug: str
    description: str | None
    ai_description: str | None
    is_active: bool

    @classmethod
    def from_obj(cls, obj: m.Project) -> Self:
        return cls(
            id=obj.id,
            name=obj.name,
            slug=obj.slug,
            description=obj.description,
            ai_description=obj.ai_description,
            is_active=obj.is_active,
        )
