from datetime import date, datetime
from typing import Any, Literal, Self
from uuid import UUID

from beanie import PydanticObjectId
from pydantic import BaseModel

import pm.models as m
from pm.api.context import current_user

from .custom_fields import CustomFieldLinkOutput
from .user import UserOutput

__all__ = (
    'IssueOutput',
    'IssueDraftOutput',
    'IssueAttachmentOut',
    'IssueFieldChangeOutput',
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
    | list[UserOutput]
    | m.EnumField
    | list[m.EnumField]
    | m.StateField
    | m.VersionField
    | list[m.VersionField]
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
    if value is None:
        return None
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
    id_readable: str
    created_by: UserOutput
    created_at: datetime
    updated_by: UserOutput | None
    updated_at: datetime | None

    @classmethod
    def from_obj(cls, obj: m.Issue) -> Self:
        return cls(
            id=obj.id,
            id_readable=obj.id_readable,
            aliases=obj.aliases,
            project=ProjectField.from_obj(obj.project),
            subject=obj.subject,
            text=obj.text,
            fields={
                field.name: CustomFieldValueOut.from_obj(field) for field in obj.fields
            },
            attachments=[IssueAttachmentOut.from_obj(att) for att in obj.attachments],
            is_subscribed=current_user().user.id in obj.subscribers,
            created_by=UserOutput.from_obj(obj.created_by),
            created_at=obj.created_at,
            updated_by=UserOutput.from_obj(obj.updated_by) if obj.updated_by else None,
            updated_at=obj.updated_at,
        )


class IssueDraftOutput(BaseModel):
    id: PydanticObjectId
    project: ProjectField | None
    subject: str | None
    text: str | None
    fields: dict[str, CustomFieldValueOut]
    attachments: list[IssueAttachmentOut]
    created_at: datetime
    created_by: UserOutput

    @classmethod
    def from_obj(cls, obj: m.IssueDraft) -> Self:
        return cls(
            id=obj.id,
            project=ProjectField.from_obj(obj.project) if obj.project else None,
            subject=obj.subject,
            text=obj.text,
            fields={
                field.name: CustomFieldValueOut.from_obj(field) for field in obj.fields
            },
            attachments=[IssueAttachmentOut.from_obj(att) for att in obj.attachments],
            created_at=obj.created_at,
            created_by=UserOutput.from_obj(obj.created_by),
        )


class IssueFieldChangeOutput(BaseModel):
    field: CustomFieldLinkOutput | Literal['subject', 'text']
    old_value: CustomFieldValueOutT | str | None
    new_value: CustomFieldValueOutT | str | None

    @classmethod
    def from_obj(cls, obj: m.IssueFieldChange) -> Self:
        if isinstance(obj.field, str):
            return cls(
                field=obj.field,
                old_value=obj.old_value,
                new_value=obj.new_value,
            )
        return cls(
            field=CustomFieldLinkOutput.from_obj(obj.field),
            old_value=transform_custom_field_value(obj.old_value, obj.field),
            new_value=transform_custom_field_value(obj.new_value, obj.field),
        )
