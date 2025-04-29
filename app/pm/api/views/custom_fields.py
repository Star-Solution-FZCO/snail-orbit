from abc import ABC
from datetime import date, datetime
from typing import Annotated, Any, Generic, Literal, Self, TypeVar
from uuid import UUID

from beanie import PydanticObjectId
from pydantic import BaseModel, Field, RootModel

import pm.models as m

from .group import GroupOutput
from .project import ProjectShortOutput
from .user import UserOutput

__all__ = (
    'EnumOptionOutput',
    'StateOptionOutput',
    'VersionOptionOutput',
    'StateCustomFieldOutput',
    'EnumCustomFieldOutput',
    'UserCustomFieldOutput',
    'VersionCustomFieldOutput',
    'CustomFieldLinkOutput',
    'CustomFieldOutputT',
    'CustomFieldOutputRootModel',
    'CustomFieldGroupOutputT',
    'CustomFieldGroupOutputRootModel',
    'CustomFieldOutput',
    'CustomFieldSelectOptionsT',
    'ShortOptionOutput',
    'CustomFieldGroupSelectOptionsT',
    'cf_output_from_obj',
    'cf_group_output_cls_from_type',
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


class UserOptionOutput(BaseModel):
    uuid: UUID
    type: m.UserOptionType
    value: UserOutput | GroupOutput


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


CustomFieldT = TypeVar('CustomFieldT', bound='m.CustomField')


class BaseCustomFieldOutput(BaseModel, Generic[CustomFieldT], ABC):
    id: PydanticObjectId
    gid: str
    name: str
    type: m.CustomFieldTypeT
    is_nullable: bool
    default_value: Any | None
    label: str
    description: str | None = None
    ai_description: str | None = None
    projects: list[ProjectShortOutput]

    @classmethod
    def from_obj(cls, obj: CustomFieldT) -> Self:
        return cls(
            id=obj.id,
            gid=obj.gid,
            name=obj.name,
            is_nullable=obj.is_nullable,
            default_value=obj.default_value,
            label=obj.label,
            description=obj.description,
            ai_description=obj.ai_description,
            projects=[ProjectShortOutput.from_obj(p) for p in obj.projects],
        )


class StringCustomFieldOutput(BaseCustomFieldOutput[m.StringCustomField]):
    type: Literal[m.CustomFieldTypeT.STRING] = m.CustomFieldTypeT.STRING
    default_value: str | None


class IntegerCustomFieldOutput(BaseCustomFieldOutput[m.IntegerCustomField]):
    type: Literal[m.CustomFieldTypeT.INTEGER] = m.CustomFieldTypeT.INTEGER
    default_value: int | None


class FloatCustomFieldOutput(BaseCustomFieldOutput[m.FloatCustomField]):
    type: Literal[m.CustomFieldTypeT.FLOAT] = m.CustomFieldTypeT.FLOAT
    default_value: float | None


class BooleanCustomFieldOutput(BaseCustomFieldOutput[m.BooleanCustomField]):
    type: Literal[m.CustomFieldTypeT.BOOLEAN] = m.CustomFieldTypeT.BOOLEAN
    default_value: bool | None


class DateCustomFieldOutput(BaseCustomFieldOutput[m.DateCustomField]):
    type: Literal[m.CustomFieldTypeT.DATE] = m.CustomFieldTypeT.DATE
    default_value: date | None

    @classmethod
    def from_obj(cls, obj: m.DateCustomField) -> Self:
        return cls(
            id=obj.id,
            gid=obj.gid,
            name=obj.name,
            is_nullable=obj.is_nullable,
            default_value=obj.default_value.date() if obj.default_value else None,
            label=obj.label,
            description=obj.description,
            ai_description=obj.ai_description,
            projects=[ProjectShortOutput.from_obj(p) for p in obj.projects],
        )


class DateTimeCustomFieldOutput(BaseCustomFieldOutput[m.DateTimeCustomField]):
    type: Literal[m.CustomFieldTypeT.DATETIME] = m.CustomFieldTypeT.DATETIME
    default_value: datetime | None


class UserCustomFieldOutput(BaseCustomFieldOutput[m.UserCustomField]):
    type: Literal[m.CustomFieldTypeT.USER] = m.CustomFieldTypeT.USER
    default_value: m.UserLinkField | None
    options: list[UserOptionOutput]
    users: list[UserOutput]

    @classmethod
    def from_obj(cls, obj: m.UserCustomField) -> Self:
        return cls(
            id=obj.id,
            gid=obj.gid,
            name=obj.name,
            description=obj.description,
            ai_description=obj.ai_description,
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
            projects=[ProjectShortOutput.from_obj(p) for p in obj.projects],
        )


class UserMultiCustomFieldOutput(BaseCustomFieldOutput[m.UserMultiCustomField]):
    type: Literal[m.CustomFieldTypeT.USER_MULTI] = m.CustomFieldTypeT.USER_MULTI
    default_value: list[m.UserLinkField] | None
    options: list[UserOptionOutput]
    users: list[UserOutput]

    @classmethod
    def from_obj(cls, obj: m.UserMultiCustomField) -> Self:
        return cls(
            id=obj.id,
            gid=obj.gid,
            name=obj.name,
            description=obj.description,
            ai_description=obj.ai_description,
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
            projects=[ProjectShortOutput.from_obj(p) for p in obj.projects],
        )


class EnumCustomFieldOutput(BaseCustomFieldOutput[m.EnumCustomField]):
    type: Literal[m.CustomFieldTypeT.ENUM] = m.CustomFieldTypeT.ENUM
    default_value: m.EnumOption | None
    options: list[EnumOptionOutput]

    @classmethod
    def from_obj(cls, obj: m.EnumCustomField) -> Self:
        return cls(
            id=obj.id,
            gid=obj.gid,
            name=obj.name,
            description=obj.description,
            ai_description=obj.ai_description,
            is_nullable=obj.is_nullable,
            default_value=obj.default_value,
            label=obj.label,
            options=[EnumOptionOutput.from_obj(opt) for opt in obj.options],
            projects=[ProjectShortOutput.from_obj(p) for p in obj.projects],
        )


class EnumMultiCustomFieldOutput(BaseCustomFieldOutput[m.EnumMultiCustomField]):
    type: Literal[m.CustomFieldTypeT.ENUM_MULTI] = m.CustomFieldTypeT.ENUM_MULTI
    default_value: list[m.EnumOption] | None
    options: list[EnumOptionOutput]

    @classmethod
    def from_obj(cls, obj: m.EnumMultiCustomField) -> Self:
        return cls(
            id=obj.id,
            gid=obj.gid,
            name=obj.name,
            description=obj.description,
            ai_description=obj.ai_description,
            is_nullable=obj.is_nullable,
            default_value=obj.default_value,
            label=obj.label,
            options=[EnumOptionOutput.from_obj(opt) for opt in obj.options],
            projects=[ProjectShortOutput.from_obj(p) for p in obj.projects],
        )


class StateCustomFieldOutput(BaseCustomFieldOutput[m.StateCustomField]):
    type: Literal[m.CustomFieldTypeT.STATE] = m.CustomFieldTypeT.STATE
    default_value: StateOptionOutput | None
    options: list[StateOptionOutput]

    @classmethod
    def from_obj(cls, obj: m.StateCustomField) -> Self:
        return cls(
            id=obj.id,
            gid=obj.gid,
            name=obj.name,
            description=obj.description,
            ai_description=obj.ai_description,
            is_nullable=obj.is_nullable,
            options=[StateOptionOutput.from_obj(opt) for opt in obj.options],
            default_value=StateOptionOutput.from_obj(obj.default_value)
            if obj.default_value
            else None,
            label=obj.label,
            projects=[ProjectShortOutput.from_obj(p) for p in obj.projects],
        )


class VersionCustomFieldOutput(BaseCustomFieldOutput[m.VersionCustomField]):
    type: Literal[m.CustomFieldTypeT.VERSION] = m.CustomFieldTypeT.VERSION
    default_value: m.VersionOption | None
    options: list[VersionOptionOutput]

    @classmethod
    def from_obj(cls, obj: m.VersionCustomField) -> Self:
        return cls(
            id=obj.id,
            gid=obj.gid,
            name=obj.name,
            description=obj.description,
            ai_description=obj.ai_description,
            is_nullable=obj.is_nullable,
            options=[VersionOptionOutput.from_obj(opt) for opt in obj.options],
            default_value=obj.default_value,
            label=obj.label,
            projects=[ProjectShortOutput.from_obj(p) for p in obj.projects],
        )


class VersionMultiCustomFieldOutput(BaseCustomFieldOutput[m.VersionMultiCustomField]):
    type: Literal[m.CustomFieldTypeT.VERSION_MULTI] = m.CustomFieldTypeT.VERSION_MULTI
    default_value: list[m.VersionOption] | None
    options: list[VersionOptionOutput]

    @classmethod
    def from_obj(cls, obj: m.VersionMultiCustomField) -> Self:
        return cls(
            id=obj.id,
            gid=obj.gid,
            name=obj.name,
            description=obj.description,
            ai_description=obj.ai_description,
            is_nullable=obj.is_nullable,
            options=[VersionOptionOutput.from_obj(opt) for opt in obj.options],
            default_value=obj.default_value,
            label=obj.label,
            projects=[ProjectShortOutput.from_obj(p) for p in obj.projects],
        )


CustomFieldOutputT = (
    StringCustomFieldOutput
    | IntegerCustomFieldOutput
    | FloatCustomFieldOutput
    | BooleanCustomFieldOutput
    | DateCustomFieldOutput
    | DateTimeCustomFieldOutput
    | UserCustomFieldOutput
    | UserMultiCustomFieldOutput
    | EnumCustomFieldOutput
    | EnumMultiCustomFieldOutput
    | StateCustomFieldOutput
    | VersionCustomFieldOutput
    | VersionMultiCustomFieldOutput
)


CustomFieldSelectOptionsT = (
    EnumOptionOutput | UserOutput | StateOptionOutput | VersionOptionOutput
)


class CustomFieldOutput(BaseModel):
    id: PydanticObjectId
    gid: str
    name: str
    type: m.CustomFieldTypeT
    is_nullable: bool
    default_value: Any | None
    label: str
    description: str | None = None
    ai_description: str | None = None

    @classmethod
    def from_obj(cls, obj: CustomFieldT) -> Self:
        return cls(
            id=obj.id,
            gid=obj.gid,
            name=obj.name,
            type=obj.type,
            is_nullable=obj.is_nullable,
            default_value=obj.default_value,
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


CF_OUTPUT_MAP: dict[m.CustomFieldTypeT, type[CustomFieldOutputT]] = {
    m.CustomFieldTypeT.STRING: StringCustomFieldOutput,
    m.CustomFieldTypeT.INTEGER: IntegerCustomFieldOutput,
    m.CustomFieldTypeT.FLOAT: FloatCustomFieldOutput,
    m.CustomFieldTypeT.BOOLEAN: BooleanCustomFieldOutput,
    m.CustomFieldTypeT.DATE: DateCustomFieldOutput,
    m.CustomFieldTypeT.DATETIME: DateTimeCustomFieldOutput,
    m.CustomFieldTypeT.USER: UserCustomFieldOutput,
    m.CustomFieldTypeT.USER_MULTI: UserMultiCustomFieldOutput,
    m.CustomFieldTypeT.ENUM: EnumCustomFieldOutput,
    m.CustomFieldTypeT.ENUM_MULTI: EnumMultiCustomFieldOutput,
    m.CustomFieldTypeT.STATE: StateCustomFieldOutput,
    m.CustomFieldTypeT.VERSION: VersionCustomFieldOutput,
    m.CustomFieldTypeT.VERSION_MULTI: VersionMultiCustomFieldOutput,
}


class CustomFieldOutputRootModel(RootModel):
    root: Annotated[CustomFieldOutputT, Field(..., discriminator='type')]


def cf_output_from_obj(obj: m.CustomField) -> CustomFieldOutputT:
    output_class = CF_OUTPUT_MAP.get(obj.type)
    if not output_class:
        raise ValueError(f'Unsupported custom field type: {obj.type}')
    return output_class.from_obj(obj)


class BaseCustomFieldGroupOutput(BaseModel, Generic[CustomFieldT], ABC):
    gid: str
    name: str
    type: m.CustomFieldTypeT
    description: str | None = None
    ai_description: str | None = None
    fields: list[BaseCustomFieldOutput[CustomFieldT]]


class StringCustomFieldGroupOutput(BaseCustomFieldGroupOutput[m.StringCustomField]):
    type: Literal[m.CustomFieldTypeT.STRING] = m.CustomFieldTypeT.STRING
    fields: list[StringCustomFieldOutput]


class IntegerCustomFieldGroupOutput(BaseCustomFieldGroupOutput[m.IntegerCustomField]):
    type: Literal[m.CustomFieldTypeT.INTEGER] = m.CustomFieldTypeT.INTEGER
    fields: list[IntegerCustomFieldOutput]


class FloatCustomFieldGroupOutput(BaseCustomFieldGroupOutput[m.FloatCustomField]):
    type: Literal[m.CustomFieldTypeT.FLOAT] = m.CustomFieldTypeT.FLOAT
    fields: list[FloatCustomFieldOutput]


class BooleanCustomFieldGroupOutput(BaseCustomFieldGroupOutput[m.BooleanCustomField]):
    type: Literal[m.CustomFieldTypeT.BOOLEAN] = m.CustomFieldTypeT.BOOLEAN
    fields: list[BooleanCustomFieldOutput]


class DateCustomFieldGroupOutput(BaseCustomFieldGroupOutput[m.DateCustomField]):
    type: Literal[m.CustomFieldTypeT.DATE] = m.CustomFieldTypeT.DATE
    fields: list[DateCustomFieldOutput]


class DateTimeCustomFieldGroupOutput(BaseCustomFieldGroupOutput[m.DateTimeCustomField]):
    type: Literal[m.CustomFieldTypeT.DATETIME] = m.CustomFieldTypeT.DATETIME
    fields: list[DateTimeCustomFieldOutput]


class UserCustomFieldGroupOutput(BaseCustomFieldGroupOutput[m.UserCustomField]):
    type: Literal[m.CustomFieldTypeT.USER] = m.CustomFieldTypeT.USER
    fields: list[UserCustomFieldOutput]


class UserMultiCustomFieldGroupOutput(
    BaseCustomFieldGroupOutput[m.UserMultiCustomField]
):
    type: Literal[m.CustomFieldTypeT.USER_MULTI] = m.CustomFieldTypeT.USER_MULTI
    fields: list[UserMultiCustomFieldOutput]


class EnumCustomFieldGroupOutput(BaseCustomFieldGroupOutput[m.EnumCustomField]):
    type: Literal[m.CustomFieldTypeT.ENUM] = m.CustomFieldTypeT.ENUM
    fields: list[EnumCustomFieldOutput]


class EnumMultiCustomFieldGroupOutput(
    BaseCustomFieldGroupOutput[m.EnumMultiCustomField]
):
    type: Literal[m.CustomFieldTypeT.ENUM_MULTI] = m.CustomFieldTypeT.ENUM_MULTI
    fields: list[EnumMultiCustomFieldOutput]


class StateCustomFieldGroupOutput(BaseCustomFieldGroupOutput[m.StateCustomField]):
    type: Literal[m.CustomFieldTypeT.STATE] = m.CustomFieldTypeT.STATE
    fields: list[StateCustomFieldOutput]


class VersionCustomFieldGroupOutput(BaseCustomFieldGroupOutput[m.VersionCustomField]):
    type: Literal[m.CustomFieldTypeT.VERSION] = m.CustomFieldTypeT.VERSION
    fields: list[VersionCustomFieldOutput]


class VersionMultiCustomFieldGroupOutput(
    BaseCustomFieldGroupOutput[m.VersionMultiCustomField]
):
    type: Literal[m.CustomFieldTypeT.VERSION_MULTI] = m.CustomFieldTypeT.VERSION_MULTI
    fields: list[VersionMultiCustomFieldOutput]


CustomFieldGroupOutputT = (
    StringCustomFieldGroupOutput
    | IntegerCustomFieldGroupOutput
    | FloatCustomFieldGroupOutput
    | BooleanCustomFieldGroupOutput
    | DateCustomFieldGroupOutput
    | DateTimeCustomFieldGroupOutput
    | UserCustomFieldGroupOutput
    | UserMultiCustomFieldGroupOutput
    | EnumCustomFieldGroupOutput
    | EnumMultiCustomFieldGroupOutput
    | StateCustomFieldGroupOutput
    | VersionCustomFieldGroupOutput
    | VersionMultiCustomFieldGroupOutput
)


class CustomFieldGroupOutputRootModel(RootModel):
    root: Annotated[CustomFieldGroupOutputT, Field(..., discriminator='type')]


CF_GROUP_OUTPUT_MAP: dict[m.CustomFieldTypeT, type[CustomFieldGroupOutputT]] = {
    m.CustomFieldTypeT.STRING: StringCustomFieldGroupOutput,
    m.CustomFieldTypeT.INTEGER: IntegerCustomFieldGroupOutput,
    m.CustomFieldTypeT.FLOAT: FloatCustomFieldGroupOutput,
    m.CustomFieldTypeT.BOOLEAN: BooleanCustomFieldGroupOutput,
    m.CustomFieldTypeT.DATE: DateCustomFieldGroupOutput,
    m.CustomFieldTypeT.DATETIME: DateTimeCustomFieldGroupOutput,
    m.CustomFieldTypeT.USER: UserCustomFieldGroupOutput,
    m.CustomFieldTypeT.USER_MULTI: UserMultiCustomFieldGroupOutput,
    m.CustomFieldTypeT.ENUM: EnumCustomFieldGroupOutput,
    m.CustomFieldTypeT.ENUM_MULTI: EnumMultiCustomFieldGroupOutput,
    m.CustomFieldTypeT.STATE: StateCustomFieldGroupOutput,
    m.CustomFieldTypeT.VERSION: VersionCustomFieldGroupOutput,
    m.CustomFieldTypeT.VERSION_MULTI: VersionMultiCustomFieldGroupOutput,
}


def cf_group_output_cls_from_type(
    type_: m.CustomFieldTypeT,
) -> type[CustomFieldGroupOutputT]:
    if not (output_class := CF_GROUP_OUTPUT_MAP.get(type_)):
        raise ValueError(f'Unsupported custom field type: {type_}')
    return output_class


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
