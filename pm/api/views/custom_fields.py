from uuid import UUID

from beanie import PydanticObjectId
from pydantic import BaseModel

import pm.models as m

from .group import GroupOutput
from .user import UserOutput

__all__ = (
    'EnumOptionOutput',
    'CustomFieldOutput',
    'CustomFieldOutputWithEnumOptions',
    'CustomFieldOutputWithUserOptions',
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

    @classmethod
    def from_obj(cls, obj: m.CustomField) -> 'CustomFieldOutput':
        return cls(
            id=obj.id,
            name=obj.name,
            type=obj.type,
            is_nullable=obj.is_nullable,
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
            options=[
                EnumOptionOutput(uuid=k, value=v.value, color=v.color)
                for k, v in obj.options.items()
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
            users=[UserOutput.from_obj(u) for opt in obj.options for u in opt.users],
        )
