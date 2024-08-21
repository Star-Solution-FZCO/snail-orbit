from typing import Self

from beanie import PydanticObjectId
from pydantic import BaseModel

import pm.models as m

__all__ = ('IssueOutput',)


class ProjectField(BaseModel):
    id: PydanticObjectId
    name: str
    slug: str

    @classmethod
    def from_obj(cls, obj: m.Issue) -> Self:
        return cls(
            id=obj.project.id,
            name=obj.project.name,
            slug=obj.project.slug,
        )


class IssueOutput(BaseModel):
    id: PydanticObjectId
    project: ProjectField
    subject: str
    text: str | None
    fields: dict[str, m.CustomFieldValue]

    @classmethod
    def from_obj(cls, obj: m.Issue) -> Self:
        return cls(
            id=obj.id,
            project=ProjectField.from_obj(obj),
            subject=obj.subject,
            text=obj.text,
            fields=obj.fields,
        )
