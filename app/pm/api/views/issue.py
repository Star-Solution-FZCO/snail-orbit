from abc import ABC
from datetime import date, datetime
from typing import Annotated, Any, Literal, Self
from uuid import UUID

from beanie import PydanticObjectId
from pydantic import BaseModel, Field, RootModel

import pm.models as m
from pm.api.context import current_user
from pm.permissions import ProjectPermissions

from .custom_fields import (
    CustomFieldValueOutputRootModel,
    cf_value_output_cls_from_type,
)
from .encryption import EncryptedObject
from .tag import TagLinkOutput
from .user import UserOutput

__all__ = (
    'CustomFieldValueOutT',
    'IssueAttachmentBody',
    'IssueAttachmentOut',
    'IssueChangeOutputRootModel',
    'IssueCommentOutput',
    'IssueDraftOutput',
    'IssueHistoryOutput',
    'IssueOutput',
    'ProjectField',
    'issue_change_output_from_obj',
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
    | m.EnumOption
    | list[m.EnumOption]
    | m.StateOption
    | m.VersionOption
    | list[m.VersionOption]
    | m.OwnedOption
    | list[m.OwnedOption]
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


class IssueAttachmentBody(BaseModel):
    id: UUID
    encryption: list[m.EncryptionMeta] | None = None


class IssueAttachmentOut(BaseModel):
    id: UUID
    name: str
    size: int
    content_type: str
    author: UserOutput
    created_at: datetime
    ocr_text: str | None
    encryption: list[m.EncryptionMeta] | None

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
            encryption=obj.encryption,
        )


def transform_custom_field_value(
    value: m.CustomFieldValueT,
    field: m.CustomFieldLink | m.CustomField | m.CustomFieldGroupLink,
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


class IssueLinkFieldOutput(BaseModel):
    id: PydanticObjectId
    aliases: list[str]
    subject: str
    id_readable: str
    is_resolved: bool
    is_closed: bool

    @classmethod
    def from_obj(cls, obj: m.IssueLinkField) -> Self:
        return cls(
            id=obj.id,
            aliases=obj.aliases,
            subject=obj.subject,
            id_readable=obj.id_readable,
            is_resolved=obj.is_resolved,
            is_closed=obj.is_closed,
        )


class IssueInterlinkOutput(BaseModel):
    id: UUID
    issue: IssueLinkFieldOutput
    type: m.IssueInterlinkTypeT

    @classmethod
    def from_obj(cls, obj: m.IssueInterlink) -> Self:
        return cls(
            id=obj.id,
            issue=IssueLinkFieldOutput.from_obj(obj.issue),
            type=obj.type,
        )


class IssueOutput(BaseModel):
    id: PydanticObjectId
    aliases: list[str]
    project: ProjectField
    subject: str
    text: EncryptedObject | None
    fields: dict[str, CustomFieldValueOutputRootModel]
    attachments: list[IssueAttachmentOut]
    is_subscribed: bool
    id_readable: str
    created_by: UserOutput
    created_at: datetime
    updated_by: UserOutput | None
    updated_at: datetime | None
    is_resolved: bool
    resolved_at: datetime | None
    is_closed: bool
    closed_at: datetime | None
    interlinks: list[IssueInterlinkOutput]
    tags: list[TagLinkOutput]
    permissions: list[m.ProjectPermission]
    disable_project_permissions_inheritance: bool
    has_custom_permissions: bool
    access_claims: list[ProjectPermissions]

    @classmethod
    def from_obj(
        cls, obj: m.Issue, accessible_tag_ids: set[PydanticObjectId] | None = None
    ) -> Self:
        user_ctx = current_user()
        user_permissions = obj.get_user_permissions(
            user_ctx.user, user_ctx.all_group_ids
        )

        # Inherit project permissions unless explicitly disabled
        if not obj.disable_project_permissions_inheritance:
            project_permissions = user_ctx.permissions.get(obj.project.id, set())
            user_permissions.update(project_permissions)

        filtered_tags = obj.tags
        if accessible_tag_ids is not None:
            filtered_tags = [tag for tag in obj.tags if tag.id in accessible_tag_ids]

        return cls(
            id=obj.id,
            id_readable=obj.id_readable,
            aliases=obj.aliases,
            project=ProjectField.from_obj(obj.project),
            subject=obj.subject,
            text=EncryptedObject(
                value=obj.text,
                encryption=obj.encryption,
            )
            if obj.text
            else None,
            fields={
                field.name: cf_value_output_cls_from_type(field.type).from_obj(field)
                for field in obj.fields
            },
            attachments=[IssueAttachmentOut.from_obj(att) for att in obj.attachments],
            is_subscribed=current_user().user.id in obj.subscribers,
            created_by=UserOutput.from_obj(obj.created_by),
            created_at=obj.created_at,
            updated_by=UserOutput.from_obj(obj.updated_by) if obj.updated_by else None,
            updated_at=obj.updated_at,
            is_resolved=obj.is_resolved,
            resolved_at=obj.resolved_at,
            is_closed=obj.is_closed,
            closed_at=obj.closed_at,
            interlinks=[IssueInterlinkOutput.from_obj(link) for link in obj.interlinks],
            tags=[TagLinkOutput.from_obj(tag) for tag in filtered_tags],
            permissions=obj.permissions,
            disable_project_permissions_inheritance=obj.disable_project_permissions_inheritance,
            has_custom_permissions=obj.has_custom_permissions,
            access_claims=list(user_permissions),
        )


class IssueDraftOutput(BaseModel):
    id: PydanticObjectId
    project: ProjectField | None
    subject: str | None
    text: EncryptedObject | None
    fields: dict[str, CustomFieldValueOutputRootModel]
    attachments: list[IssueAttachmentOut]
    created_at: datetime
    created_by: UserOutput

    @classmethod
    def from_obj(cls, obj: m.IssueDraft) -> Self:
        return cls(
            id=obj.id,
            project=ProjectField.from_obj(obj.project) if obj.project else None,
            subject=obj.subject,
            text=EncryptedObject(
                value=obj.text,
                encryption=obj.encryption,
            )
            if obj.text
            else None,
            fields={
                field.name: cf_value_output_cls_from_type(field.type).from_obj(field)
                for field in obj.fields
            },
            attachments=[IssueAttachmentOut.from_obj(att) for att in obj.attachments],
            created_at=obj.created_at,
            created_by=UserOutput.from_obj(obj.created_by),
        )


class IssueBaseChangeOutput(BaseModel, ABC):
    type: Literal['subject', 'text', 'field']
    old_value: Any | None
    new_value: Any | None


class IssueFieldChangeBaseOutput(IssueBaseChangeOutput, ABC):
    type: Literal['field'] = 'field'
    field_id: PydanticObjectId
    field_gid: str
    field_name: str
    field_type: m.CustomFieldTypeT

    @classmethod
    def from_obj(cls, obj: m.IssueFieldChange) -> Self:
        if isinstance(obj.field, str):
            raise TypeError(f'Unknown field type: {obj.field}')
        return cls(
            field_id=obj.field.id,
            field_gid=obj.field.gid,
            field_name=obj.field.name,
            field_type=obj.field.type,
            old_value=transform_custom_field_value(obj.old_value, obj.field),
            new_value=transform_custom_field_value(obj.new_value, obj.field),
        )


class IssueStringFieldChangeOutput(IssueFieldChangeBaseOutput):
    field_type: Literal[m.CustomFieldTypeT.STRING] = m.CustomFieldTypeT.STRING
    old_value: str | None
    new_value: str | None


class IssueIntegerFieldChangeOutput(IssueFieldChangeBaseOutput):
    field_type: Literal[m.CustomFieldTypeT.INTEGER] = m.CustomFieldTypeT.INTEGER
    old_value: int | None
    new_value: int | None


class IssueFloatFieldChangeOutput(IssueFieldChangeBaseOutput):
    field_type: Literal[m.CustomFieldTypeT.FLOAT] = m.CustomFieldTypeT.FLOAT
    old_value: float | None
    new_value: float | None


class IssueBooleanFieldChangeOutput(IssueFieldChangeBaseOutput):
    field_type: Literal[m.CustomFieldTypeT.BOOLEAN] = m.CustomFieldTypeT.BOOLEAN
    old_value: bool | None
    new_value: bool | None


class IssueDateFieldChangeOutput(IssueFieldChangeBaseOutput):
    field_type: Literal[m.CustomFieldTypeT.DATE] = m.CustomFieldTypeT.DATE
    old_value: date | None
    new_value: date | None


class IssueDateTimeFieldChangeOutput(IssueFieldChangeBaseOutput):
    field_type: Literal[m.CustomFieldTypeT.DATETIME] = m.CustomFieldTypeT.DATETIME
    old_value: datetime | None
    new_value: datetime | None


class IssueUserFieldChangeOutput(IssueFieldChangeBaseOutput):
    field_type: Literal[m.CustomFieldTypeT.USER] = m.CustomFieldTypeT.USER
    old_value: UserOutput | None
    new_value: UserOutput | None


class IssueUserMultiFieldChangeOutput(IssueFieldChangeBaseOutput):
    field_type: Literal[m.CustomFieldTypeT.USER_MULTI] = m.CustomFieldTypeT.USER_MULTI
    old_value: list[UserOutput] | None
    new_value: list[UserOutput] | None


class IssueEnumFieldChangeOutput(IssueFieldChangeBaseOutput):
    field_type: Literal[m.CustomFieldTypeT.ENUM] = m.CustomFieldTypeT.ENUM
    old_value: m.EnumOption | None
    new_value: m.EnumOption | None


class IssueEnumMultiFieldChangeOutput(IssueFieldChangeBaseOutput):
    field_type: Literal[m.CustomFieldTypeT.ENUM_MULTI] = m.CustomFieldTypeT.ENUM_MULTI
    old_value: list[m.EnumOption] | None
    new_value: list[m.EnumOption] | None


class IssueOwnedFieldChangeOutput(IssueFieldChangeBaseOutput):
    field_type: Literal[m.CustomFieldTypeT.OWNED] = m.CustomFieldTypeT.OWNED
    old_value: m.OwnedOption | None
    new_value: m.OwnedOption | None


class IssueOwnedMultiFieldChangeOutput(IssueFieldChangeBaseOutput):
    field_type: Literal[m.CustomFieldTypeT.OWNED_MULTI] = m.CustomFieldTypeT.OWNED_MULTI
    old_value: list[m.OwnedOption] | None
    new_value: list[m.OwnedOption] | None


class IssueStateFieldChangeOutput(IssueFieldChangeBaseOutput):
    field_type: Literal[m.CustomFieldTypeT.STATE] = m.CustomFieldTypeT.STATE
    old_value: m.StateOption | None
    new_value: m.StateOption | None


class IssueVersionFieldChangeOutput(IssueFieldChangeBaseOutput):
    field_type: Literal[m.CustomFieldTypeT.VERSION] = m.CustomFieldTypeT.VERSION
    old_value: m.VersionOption | None
    new_value: m.VersionOption | None


class IssueVersionMultiFieldChangeOutput(IssueFieldChangeBaseOutput):
    field_type: Literal[m.CustomFieldTypeT.VERSION_MULTI] = (
        m.CustomFieldTypeT.VERSION_MULTI
    )
    old_value: list[m.VersionOption] | None
    new_value: list[m.VersionOption] | None


class IssueDurationFieldChangeOutput(IssueFieldChangeBaseOutput):
    field_type: Literal[m.CustomFieldTypeT.DURATION] = m.CustomFieldTypeT.DURATION
    old_value: int | None
    new_value: int | None


class IssueSubjectChangeOutput(IssueBaseChangeOutput):
    type: Literal['subject'] = 'subject'
    old_value: str
    new_value: str


class IssueTextChangeOutput(IssueBaseChangeOutput):
    type: Literal['text'] = 'text'
    old_value: str | None
    new_value: str | None


IssueFieldChangeOutputT = (
    IssueStringFieldChangeOutput
    | IssueIntegerFieldChangeOutput
    | IssueFloatFieldChangeOutput
    | IssueBooleanFieldChangeOutput
    | IssueDateFieldChangeOutput
    | IssueDateTimeFieldChangeOutput
    | IssueUserFieldChangeOutput
    | IssueUserMultiFieldChangeOutput
    | IssueEnumFieldChangeOutput
    | IssueEnumMultiFieldChangeOutput
    | IssueOwnedFieldChangeOutput
    | IssueOwnedMultiFieldChangeOutput
    | IssueStateFieldChangeOutput
    | IssueVersionFieldChangeOutput
    | IssueVersionMultiFieldChangeOutput
    | IssueDurationFieldChangeOutput
)


class IssueFieldChangeOutputRootModel(RootModel):
    root: Annotated[IssueFieldChangeOutputT, Field(..., discriminator='field_type')]


FIELD_CHANGE_OUTPUT_MAP: dict[m.CustomFieldTypeT, type[IssueFieldChangeOutputT]] = {
    m.CustomFieldTypeT.STRING: IssueStringFieldChangeOutput,
    m.CustomFieldTypeT.INTEGER: IssueIntegerFieldChangeOutput,
    m.CustomFieldTypeT.FLOAT: IssueFloatFieldChangeOutput,
    m.CustomFieldTypeT.BOOLEAN: IssueBooleanFieldChangeOutput,
    m.CustomFieldTypeT.DATE: IssueDateFieldChangeOutput,
    m.CustomFieldTypeT.DATETIME: IssueDateTimeFieldChangeOutput,
    m.CustomFieldTypeT.USER: IssueUserFieldChangeOutput,
    m.CustomFieldTypeT.USER_MULTI: IssueUserMultiFieldChangeOutput,
    m.CustomFieldTypeT.ENUM: IssueEnumFieldChangeOutput,
    m.CustomFieldTypeT.ENUM_MULTI: IssueEnumMultiFieldChangeOutput,
    m.CustomFieldTypeT.OWNED: IssueOwnedFieldChangeOutput,
    m.CustomFieldTypeT.OWNED_MULTI: IssueOwnedMultiFieldChangeOutput,
    m.CustomFieldTypeT.STATE: IssueStateFieldChangeOutput,
    m.CustomFieldTypeT.VERSION: IssueVersionFieldChangeOutput,
    m.CustomFieldTypeT.VERSION_MULTI: IssueVersionMultiFieldChangeOutput,
    m.CustomFieldTypeT.DURATION: IssueDurationFieldChangeOutput,
}


def issue_field_change_output_from_obj(
    obj: m.IssueFieldChange,
) -> IssueFieldChangeOutputT:
    if isinstance(obj.field, str):
        raise TypeError(f'Unknown field type: {obj.field}')
    if obj.field.type not in FIELD_CHANGE_OUTPUT_MAP:
        raise ValueError(f'Unknown field type: {obj.field.type}')
    return FIELD_CHANGE_OUTPUT_MAP[obj.field.type].from_obj(obj)


IssueChangeOutputT = (
    IssueSubjectChangeOutput | IssueFieldChangeOutputRootModel | IssueTextChangeOutput
)


def issue_change_output_from_obj(obj: m.IssueFieldChange) -> IssueChangeOutputT:
    if not isinstance(obj.field, str):
        return issue_field_change_output_from_obj(obj).from_obj(obj)
    if obj.field == 'subject':
        return IssueSubjectChangeOutput(
            old_value=obj.old_value,
            new_value=obj.new_value,
        )
    if obj.field == 'text':
        return IssueTextChangeOutput(
            old_value=obj.old_value,
            new_value=obj.new_value,
        )
    raise ValueError(f'Unknown field type: {obj.field}')


class IssueChangeOutputRootModel(RootModel):
    root: Annotated[IssueChangeOutputT, Field(..., discriminator='type')]


class IssueHistoryOutput(BaseModel):
    id: UUID
    author: UserOutput
    time: datetime
    changes: list[IssueChangeOutputRootModel]
    is_hidden: bool

    @classmethod
    def from_obj(cls, obj: m.IssueHistoryRecord) -> Self:
        return cls(
            id=obj.id,
            author=UserOutput.from_obj(obj.author),
            time=obj.time,
            changes=[issue_change_output_from_obj(c) for c in obj.changes]
            if not obj.is_hidden
            else [],
            is_hidden=obj.is_hidden,
        )


class IssueCommentOutput(BaseModel):
    id: UUID
    text: EncryptedObject | None
    author: UserOutput
    created_at: datetime
    updated_at: datetime
    attachments: list[IssueAttachmentOut]
    is_hidden: bool
    spent_time: int

    @classmethod
    def from_obj(cls, obj: m.IssueComment) -> Self:
        text = (
            EncryptedObject(
                value=obj.text,
                encryption=obj.encryption,
            )
            if obj.text
            else None
        )

        return cls(
            id=obj.id,
            text=text if not obj.is_hidden else None,
            author=UserOutput.from_obj(obj.author),
            created_at=obj.created_at,
            updated_at=obj.updated_at,
            attachments=[IssueAttachmentOut.from_obj(a) for a in obj.attachments]
            if not obj.is_hidden
            else [],
            is_hidden=obj.is_hidden,
            spent_time=obj.spent_time,
        )
