from datetime import date, datetime
from typing import Any, Self
from uuid import UUID

from beanie import PydanticObjectId
from pydantic import BaseModel, computed_field

import pm.models as m

from .user import UserOutput

__all__ = ('IssueOutput', 'IssueAttachmentOut')

CustomFieldValueOutT = (
    bool
    | int
    | float
    | date
    | datetime
    | UserOutput
    | list[str]  # todo: use only list[EnumCustomField]
    | list[UserOutput]
    | m.EnumCustomField
    | list[m.EnumCustomField]
    | m.StateField
    | PydanticObjectId
    | Any
    | None
)


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


def _transform_custom_field_value(value: m.CustomFieldValueT) -> CustomFieldValueOutT:
    if isinstance(value, m.UserLinkField):
        return UserOutput.from_obj(value)
    if isinstance(value, list) and value and isinstance(value[0], m.UserLinkField):
        return [UserOutput.from_obj(v) for v in value]
    return value


class CustomFieldValueOut(BaseModel):
    id: PydanticObjectId
    name: str
    type: m.CustomFieldTypeT
    value: CustomFieldValueOutT = None

    @classmethod
    def from_obj(cls, obj: m.CustomFieldValue) -> Self:
        return cls(
            id=obj.id,
            name=obj.name,
            type=obj.type,
            value=_transform_custom_field_value(obj.value),
        )


class IssueOutput(BaseModel):
    id: PydanticObjectId
    aliases: list[str]
    project: ProjectField
    subject: str
    text: str | None
    fields: dict[str, CustomFieldValueOut]
    attachments: list[IssueAttachmentOut]

    @computed_field
    @property
    def id_readable(self) -> str | None:
        return self.aliases[-1] if self.aliases else None

    @classmethod
    def from_obj(cls, obj: m.Issue) -> Self:
        return cls(
            id=obj.id,
            aliases=obj.aliases,
            project=ProjectField.from_obj(obj),
            subject=obj.subject,
            text=obj.text,
            fields={
                field.name: CustomFieldValueOut.from_obj(field) for field in obj.fields
            },
            attachments=[IssueAttachmentOut.from_obj(att) for att in obj.attachments],
        )
