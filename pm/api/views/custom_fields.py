from typing import Any, Self
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
    'CustomFieldOutputWithStateOptions',
    'CustomFieldOutputWithEnumOptions',
    'CustomFieldOutputWithUserOptions',
    'CustomFieldLinkOutput',
)


class EnumOptionOutput(BaseModel):
    uuid: UUID
    value: str
    color: str | None = None


class CustomFieldOutput(BaseModel):
    id: PydanticObjectId
    name: str
    type: m.CustomFieldTypeT
    is_nullable: bool
    default_value: m.CustomFieldValueT

    @classmethod
    def from_obj(cls, obj: m.CustomField) -> 'CustomFieldOutput':
        return cls(
            id=obj.id,
            name=obj.name,
            type=obj.type,
            is_nullable=obj.is_nullable,
            default_value=obj.default_value,
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
            type=obj.type,
            is_nullable=obj.is_nullable,
            default_value=obj.default_value,
            options=[
                EnumOptionOutput(uuid=opt.id, value=opt.value, color=opt.color)
                for opt in obj.options
            ],
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

    @classmethod
    def from_obj(cls, obj: m.StateOption) -> Self:
        return cls(
            uuid=obj.id,
            value=obj.value.state,
            color=obj.color,
            is_resolved=obj.value.is_resolved,
            is_closed=obj.value.is_closed,
        )


class CustomFieldOutputWithStateOptions(CustomFieldOutput):
    options: list[StateOptionOutput]

    @classmethod
    def from_obj(cls, obj: m.StateCustomField) -> Self:
        return cls(
            id=obj.id,
            name=obj.name,
            type=obj.type,
            is_nullable=obj.is_nullable,
            options=[StateOptionOutput.from_obj(opt) for opt in obj.options],
            default_value=obj.default_value,
        )
