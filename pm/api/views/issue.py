from datetime import date, datetime
from typing import Any, Self
from uuid import UUID

from beanie import PydanticObjectId
from pydantic import BaseModel, computed_field

import pm.models as m
from pm.api.context import current_user

from .user import UserOutput

__all__ = (
    'IssueOutput',
    'IssueAttachmentOut',
    'ProjectField',
    'CustomFieldValueOut',
    'CustomFieldValueOutT',
    'transform_custom_field_value',
)

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
    def from_obj(cls, obj: m.ProjectLinkField) -> Self:
        return cls(
            id=obj.id,
            name=obj.name,
            slug=obj.slug,
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


def transform_custom_field_value(
    value: m.CustomFieldValueT, field: m.CustomFieldLink | m.CustomField
) -> CustomFieldValueOutT:
    if field.type == m.CustomFieldTypeT.DATE:
        return value.date()
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
            value=transform_custom_field_value(obj.value, obj),
        )


class IssueOutput(BaseModel):
    id: PydanticObjectId
    aliases: list[str]
    project: ProjectField
    subject: str
    text: str | None
    fields: dict[str, CustomFieldValueOut]
    attachments: list[IssueAttachmentOut]
    is_subscribed: bool

    @computed_field
    @property
    def id_readable(self) -> str | None:
        return self.aliases[-1] if self.aliases else None

    @classmethod
    def from_obj(cls, obj: m.Issue) -> Self:
        return cls(
            id=obj.id,
            aliases=obj.aliases,
            project=ProjectField.from_obj(obj.project),
            subject=obj.subject,
            text=obj.text,
            fields={
                field.name: CustomFieldValueOut.from_obj(field) for field in obj.fields
            },
            attachments=[IssueAttachmentOut.from_obj(att) for att in obj.attachments],
            is_subscribed=current_user().user.id in obj.subscribers,
        )
