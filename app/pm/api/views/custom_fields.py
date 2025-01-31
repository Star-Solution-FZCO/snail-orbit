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
)


class EnumOptionOutput(BaseModel):
    uuid: UUID
    value: str
    color: str | None = None
    is_archived: bool = False

    @classmethod
    def from_obj(cls, obj: m.EnumField) -> Self:
        return cls(
            uuid=obj.id,
            value=obj.value,
            color=obj.color,
            is_archived=obj.is_archived,
        )


class CustomFieldOutput(BaseModel):
    id: PydanticObjectId
    name: str
    type: m.CustomFieldTypeT
    is_nullable: bool
    default_value: m.CustomFieldValueT
    description: str | None = None
    ai_description: str | None = None

    @classmethod
    def from_obj(cls, obj: m.CustomField) -> 'CustomFieldOutput':
        default_value = obj.default_value
        if obj.type == m.CustomFieldTypeT.DATE:
            default_value = obj.default_value.date() if obj.default_value else None
        return cls(
            id=obj.id,
            name=obj.name,
            type=obj.type,
            is_nullable=obj.is_nullable,
            default_value=default_value,
            description=obj.description,
            ai_description=obj.ai_description,
        )


class CustomFieldLinkOutput(BaseModel):
    id: PydanticObjectId
    name: str
    type: m.CustomFieldTypeT

    @classmethod
    def from_obj(cls, obj: m.CustomField | m.CustomFieldLink) -> Self:
        return cls(
            id=obj.id,
            name=obj.name,
            type=obj.type,
        )


class CustomFieldOutputWithEnumOptions(CustomFieldOutput):
    options: list[EnumOptionOutput]

    @classmethod
    def from_obj(cls, obj: m.CustomField) -> 'CustomFieldOutputWithEnumOptions':
        return cls(
            id=obj.id,
            name=obj.name,
            description=obj.description,
            ai_description=obj.ai_description,
            type=obj.type,
            is_nullable=obj.is_nullable,
            default_value=obj.default_value,
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
    def from_obj(cls, obj: m.StateField) -> Self:
        return cls(
            uuid=obj.id,
            value=obj.state,
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
            name=obj.name,
            description=obj.description,
            ai_description=obj.ai_description,
            type=obj.type,
            is_nullable=obj.is_nullable,
            options=[StateOptionOutput.from_obj(opt) for opt in obj.options],
            default_value=StateOptionOutput.from_obj(obj.default_value)
            if obj.default_value
            else None,
        )


class VersionOptionOutput(BaseModel):
    uuid: UUID
    value: str
    release_date: date | None
    is_released: bool
    is_archived: bool

    @classmethod
    def from_obj(cls, obj: m.VersionField) -> Self:
        return cls(
            uuid=obj.id,
            value=obj.version,
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
            name=obj.name,
            description=obj.description,
            ai_description=obj.ai_description,
            type=obj.type,
            is_nullable=obj.is_nullable,
            options=[VersionOptionOutput.from_obj(opt) for opt in obj.options],
            default_value=obj.default_value,
        )
