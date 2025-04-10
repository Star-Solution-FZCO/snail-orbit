from datetime import date
from typing import Self
from uuid import UUID

from beanie import PydanticObjectId
from pydantic import BaseModel

import pm.models as m

from .group import GroupOutput
from .user import UserOutput

__all__ = (
    'EnumOptionOutput',
    'StateOptionOutput',
    'CustomFieldOutput',
    'VersionOptionOutput',
    'CustomFieldOutputWithStateOptions',
    'CustomFieldOutputWithEnumOptions',
    'CustomFieldOutputWithUserOptions',
    'CustomFieldOutputWithVersionOptions',
    'CustomFieldLinkOutput',
    'CustomFieldOutputT',
    'CustomFieldSelectOptionsT',
    'ShortOptionOutput',
    'CustomFieldGroupSelectOptionsT',
    'cf_output_from_obj',
)


class EnumOptionOutput(BaseModel):
    uuid: UUID
    value: str
    color: str | None = None
    is_archived: bool = False

    @classmethod
    def from_obj(cls, obj: m.EnumOption) -> Self:
        return cls(
            uuid=obj.id,
            value=obj.value,
            color=obj.color,
            is_archived=obj.is_archived,
        )


class CustomFieldOutput(BaseModel):
    id: PydanticObjectId
    gid: str
    name: str
    type: m.CustomFieldTypeT
    is_nullable: bool
    default_value: m.CustomFieldValueT
    label: str
    description: str | None = None
    ai_description: str | None = None

    @classmethod
    def from_obj(cls, obj: m.CustomField) -> 'CustomFieldOutput':
        default_value = obj.default_value
        if obj.type == m.CustomFieldTypeT.DATE:
            default_value = obj.default_value.date() if obj.default_value else None
        return cls(
            id=obj.id,
            gid=obj.gid,
            name=obj.name,
            type=obj.type,
            is_nullable=obj.is_nullable,
            default_value=default_value,
            label=obj.label,
            description=obj.description,
            ai_description=obj.ai_description,
        )


class CustomFieldLinkOutput(BaseModel):
    id: PydanticObjectId
    gid: str
    name: str
    type: m.CustomFieldTypeT

    @classmethod
    def from_obj(cls, obj: m.CustomField | m.CustomFieldLink) -> Self:
        return cls(
            id=obj.id,
            gid=obj.gid,
            name=obj.name,
            type=obj.type,
        )


class CustomFieldOutputWithEnumOptions(CustomFieldOutput):
    options: list[EnumOptionOutput]

    @classmethod
    def from_obj(cls, obj: m.CustomField) -> 'CustomFieldOutputWithEnumOptions':
        return cls(
            id=obj.id,
            gid=obj.gid,
            name=obj.name,
            description=obj.description,
            ai_description=obj.ai_description,
            type=obj.type,
            is_nullable=obj.is_nullable,
            default_value=obj.default_value,
            label=obj.label,
            options=[EnumOptionOutput.from_obj(opt) for opt in obj.options],
        )


class UserOptionOutput(BaseModel):
    uuid: UUID
    type: m.UserOptionType
    value: UserOutput | GroupOutput


class CustomFieldOutputWithUserOptions(CustomFieldOutput):
    options: list[UserOptionOutput]
    users: list[UserOutput]

    @classmethod
    def from_obj(
        cls, obj: m.UserCustomField | m.UserMultiCustomField
    ) -> 'CustomFieldOutputWithUserOptions':
        return cls(
            id=obj.id,
            gid=obj.gid,
            name=obj.name,
            description=obj.description,
            ai_description=obj.ai_description,
            type=obj.type,
            is_nullable=obj.is_nullable,
            options=[
                UserOptionOutput(
                    uuid=opt.id,
                    type=opt.type,
                    value=UserOutput.from_obj(opt.value)
                    if opt.type == m.UserOptionType.USER
                    else GroupOutput.from_obj(opt.value.group),
                )
                for opt in obj.options
            ],
            default_value=obj.default_value,
            label=obj.label,
            users=[UserOutput.from_obj(u) for u in obj.users],
        )


class StateOptionOutput(BaseModel):
    uuid: UUID
    value: str
    color: str | None = None
    is_resolved: bool = False
    is_closed: bool = False
    is_archived: bool = False

    @classmethod
    def from_obj(cls, obj: m.StateOption) -> Self:
        return cls(
            uuid=obj.id,
            value=obj.value,
            color=obj.color,
            is_resolved=obj.is_resolved,
            is_closed=obj.is_closed,
            is_archived=obj.is_archived,
        )


class CustomFieldOutputWithStateOptions(CustomFieldOutput):
    options: list[StateOptionOutput]
    default_value: StateOptionOutput | None

    @classmethod
    def from_obj(cls, obj: m.StateCustomField) -> Self:
        return cls(
            id=obj.id,
            gid=obj.gid,
            name=obj.name,
            description=obj.description,
            ai_description=obj.ai_description,
            type=obj.type,
            is_nullable=obj.is_nullable,
            options=[StateOptionOutput.from_obj(opt) for opt in obj.options],
            default_value=StateOptionOutput.from_obj(obj.default_value)
            if obj.default_value
            else None,
            label=obj.label,
        )


class VersionOptionOutput(BaseModel):
    uuid: UUID
    value: str
    release_date: date | None
    is_released: bool
    is_archived: bool

    @classmethod
    def from_obj(cls, obj: m.VersionOption) -> Self:
        return cls(
            uuid=obj.id,
            value=obj.value,
            release_date=obj.release_date.date() if obj.release_date else None,
            is_released=obj.is_released,
            is_archived=obj.is_archived,
        )


class CustomFieldOutputWithVersionOptions(CustomFieldOutput):
    options: list[VersionOptionOutput]

    @classmethod
    def from_obj(cls, obj: m.VersionCustomField) -> Self:
        return cls(
            id=obj.id,
            gid=obj.gid,
            name=obj.name,
            description=obj.description,
            ai_description=obj.ai_description,
            type=obj.type,
            is_nullable=obj.is_nullable,
            options=[VersionOptionOutput.from_obj(opt) for opt in obj.options],
            default_value=obj.default_value,
            label=obj.label,
        )


CustomFieldOutputT = (
    CustomFieldOutput
    | CustomFieldOutputWithEnumOptions
    | CustomFieldOutputWithUserOptions
    | CustomFieldOutputWithStateOptions
    | CustomFieldOutputWithVersionOptions
)


CustomFieldSelectOptionsT = (
    EnumOptionOutput | UserOutput | StateOptionOutput | VersionOptionOutput
)


def cf_output_from_obj(obj: m.CustomField) -> CustomFieldOutputT:
    if obj.type in (m.CustomFieldTypeT.ENUM, m.CustomFieldTypeT.ENUM_MULTI):
        return CustomFieldOutputWithEnumOptions.from_obj(obj)
    if obj.type in (m.CustomFieldTypeT.USER, m.CustomFieldTypeT.USER_MULTI):
        return CustomFieldOutputWithUserOptions.from_obj(obj)
    if obj.type == m.CustomFieldTypeT.STATE:
        return CustomFieldOutputWithStateOptions.from_obj(obj)
    if obj.type in (m.CustomFieldTypeT.VERSION, m.CustomFieldTypeT.VERSION_MULTI):
        return CustomFieldOutputWithVersionOptions.from_obj(obj)
    return CustomFieldOutput.from_obj(obj)


class ShortOptionOutput(BaseModel):
    value: str
    color: str | None = None

    @classmethod
    def from_obj(cls, obj: m.EnumOption | m.VersionOption | m.StateOption) -> Self:
        return cls(
            value=obj.value,
            color=getattr(obj, 'color', None),
        )


CustomFieldGroupSelectOptionsT = UserOutput | ShortOptionOutput
