from datetime import datetime
from typing import Self
from uuid import UUID

from beanie import PydanticObjectId
from pydantic import BaseModel

import pm.models as m

from .user import UserOutput

__all__ = ('IssueOutput', 'IssueAttachmentOut')


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


class IssueAttachmentOut(BaseModel):
    id: UUID
    name: str
    size: int
    content_type: str
    author: UserOutput
    created_at: datetime
    ocr_text: str | None

    @classmethod
    def from_obj(cls, obj: m.IssueAttachment) -> Self:
        return cls(
            id=obj.id,
            name=obj.name,
            size=obj.size,
            content_type=obj.content_type,
            author=UserOutput.from_obj(obj.author),
            created_at=obj.created_at,
            ocr_text=obj.ocr_text,
        )


class IssueOutput(BaseModel):
    id: PydanticObjectId
    project: ProjectField
    subject: str
    text: str | None
    fields: dict[str, m.CustomFieldValue]
    attachments: list[IssueAttachmentOut]

    @classmethod
    def from_obj(cls, obj: m.Issue) -> Self:
        return cls(
            id=obj.id,
            project=ProjectField.from_obj(obj),
            subject=obj.subject,
            text=obj.text,
            fields=obj.fields,
            attachments=[IssueAttachmentOut.from_obj(att) for att in obj.attachments],
        )
