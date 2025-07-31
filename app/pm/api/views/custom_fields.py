# pylint: disable=too-many-lines
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
    'BooleanCustomFieldGroupWithValuesOutput',
    'CustomFieldGroupLinkOutput',
    'CustomFieldGroupOutputRootModel',
    'CustomFieldGroupOutputT',
    'CustomFieldGroupSelectOptionsT',
    'CustomFieldLinkOutput',
    'CustomFieldOutput',
    'CustomFieldOutputRootModel',
    'CustomFieldOutputT',
    'CustomFieldSelectOptionsT',
    'CustomFieldValueOutputRootModel',
    'DateCustomFieldGroupWithValuesOutput',
    'DateTimeCustomFieldGroupWithValuesOutput',
    'DurationCustomFieldGroupWithValuesOutput',
    'DurationCustomFieldOutput',
    'EnumCustomFieldGroupWithValuesOutput',
    'EnumCustomFieldOutput',
    'EnumMultiCustomFieldGroupWithValuesOutput',
    'EnumOptionOutput',
    'FloatCustomFieldGroupWithValuesOutput',
    'IntegerCustomFieldGroupWithValuesOutput',
    'OwnedCustomFieldGroupOutput',
    'OwnedCustomFieldGroupWithValuesOutput',
    'OwnedCustomFieldOutput',
    'OwnedMultiCustomFieldGroupOutput',
    'OwnedMultiCustomFieldGroupWithValuesOutput',
    'OwnedMultiCustomFieldOutput',
    'OwnedOptionOutput',
    'ShortOptionOutput',
    'StateCustomFieldGroupWithValuesOutput',
    'StateCustomFieldOutput',
    'StateOptionOutput',
    'StringCustomFieldGroupWithValuesOutput',
    'UserCustomFieldGroupWithValuesOutput',
    'UserCustomFieldOutput',
    'UserMultiCustomFieldGroupWithValuesOutput',
    'VersionCustomFieldGroupWithValuesOutput',
    'VersionCustomFieldOutput',
    'VersionMultiCustomFieldGroupWithValuesOutput',
    'VersionOptionOutput',
    'cf_group_output_cls_from_type',
    'cf_output_from_obj',
    'cf_value_output_cls_from_type',
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


class OwnedOptionOutput(BaseModel):
    uuid: UUID
    value: str
    owner: UserOutput | None = None
    color: str | None = None
    is_archived: bool = False

    @classmethod
    def from_obj(cls, obj: m.OwnedOption) -> Self:
        return cls(
            uuid=obj.id,
            value=obj.value,
            owner=UserOutput.from_obj(obj.owner) if obj.owner else None,
            color=obj.color,
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


class DurationCustomFieldOutput(BaseCustomFieldOutput[m.DurationCustomField]):
    type: Literal[m.CustomFieldTypeT.DURATION] = m.CustomFieldTypeT.DURATION
    default_value: int | None


class UserCustomFieldOutput(BaseCustomFieldOutput[m.UserCustomField]):
    type: Literal[m.CustomFieldTypeT.USER] = m.CustomFieldTypeT.USER
    default_value: m.UserLinkField | None
    options: list[UserOptionOutput]
    users: list[UserOutput]

    @classmethod
    async def from_obj(cls, obj: m.UserCustomField) -> Self:
        available_users = await obj.resolve_available_users()
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
            users=[UserOutput.from_obj(u) for u in available_users],
            projects=[ProjectShortOutput.from_obj(p) for p in obj.projects],
        )


class UserMultiCustomFieldOutput(BaseCustomFieldOutput[m.UserMultiCustomField]):
    type: Literal[m.CustomFieldTypeT.USER_MULTI] = m.CustomFieldTypeT.USER_MULTI
    default_value: list[m.UserLinkField] | None
    options: list[UserOptionOutput]
    users: list[UserOutput]

    @classmethod
    async def from_obj(cls, obj: m.UserMultiCustomField) -> Self:
        available_users = await obj.resolve_available_users()
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
            users=[UserOutput.from_obj(u) for u in available_users],
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


class OwnedCustomFieldOutput(BaseCustomFieldOutput[m.OwnedCustomField]):
    type: Literal[m.CustomFieldTypeT.OWNED] = m.CustomFieldTypeT.OWNED
    default_value: OwnedOptionOutput | None
    options: list[OwnedOptionOutput]

    @classmethod
    def from_obj(cls, obj: m.OwnedCustomField) -> Self:
        return cls(
            id=obj.id,
            gid=obj.gid,
            name=obj.name,
            description=obj.description,
            ai_description=obj.ai_description,
            is_nullable=obj.is_nullable,
            options=[OwnedOptionOutput.from_obj(opt) for opt in obj.options],
            default_value=OwnedOptionOutput.from_obj(obj.default_value)
            if obj.default_value
            else None,
            label=obj.label,
            projects=[ProjectShortOutput.from_obj(p) for p in obj.projects],
        )


class OwnedMultiCustomFieldOutput(BaseCustomFieldOutput[m.OwnedMultiCustomField]):
    type: Literal[m.CustomFieldTypeT.OWNED_MULTI] = m.CustomFieldTypeT.OWNED_MULTI
    default_value: list[OwnedOptionOutput] | None
    options: list[OwnedOptionOutput]

    @classmethod
    def from_obj(cls, obj: m.OwnedMultiCustomField) -> Self:
        return cls(
            id=obj.id,
            gid=obj.gid,
            name=obj.name,
            description=obj.description,
            ai_description=obj.ai_description,
            is_nullable=obj.is_nullable,
            options=[OwnedOptionOutput.from_obj(opt) for opt in obj.options],
            default_value=[OwnedOptionOutput.from_obj(opt) for opt in obj.default_value]
            if obj.default_value
            else None,
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
    | DurationCustomFieldOutput
    | UserCustomFieldOutput
    | UserMultiCustomFieldOutput
    | EnumCustomFieldOutput
    | EnumMultiCustomFieldOutput
    | StateCustomFieldOutput
    | VersionCustomFieldOutput
    | VersionMultiCustomFieldOutput
    | OwnedCustomFieldOutput
    | OwnedMultiCustomFieldOutput
)


CustomFieldSelectOptionsT = (
    EnumOptionOutput
    | UserOutput
    | StateOptionOutput
    | VersionOptionOutput
    | OwnedOptionOutput
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


class CustomFieldGroupLinkOutput(BaseModel):
    gid: str
    name: str
    type: m.CustomFieldTypeT

    @classmethod
    def from_obj(
        cls,
        obj: m.CustomField | m.CustomFieldLink | m.CustomFieldGroupLink,
    ) -> Self:
        return cls(
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
    m.CustomFieldTypeT.DURATION: DurationCustomFieldOutput,
    m.CustomFieldTypeT.USER: UserCustomFieldOutput,
    m.CustomFieldTypeT.USER_MULTI: UserMultiCustomFieldOutput,
    m.CustomFieldTypeT.ENUM: EnumCustomFieldOutput,
    m.CustomFieldTypeT.ENUM_MULTI: EnumMultiCustomFieldOutput,
    m.CustomFieldTypeT.STATE: StateCustomFieldOutput,
    m.CustomFieldTypeT.VERSION: VersionCustomFieldOutput,
    m.CustomFieldTypeT.VERSION_MULTI: VersionMultiCustomFieldOutput,
    m.CustomFieldTypeT.OWNED: OwnedCustomFieldOutput,
    m.CustomFieldTypeT.OWNED_MULTI: OwnedMultiCustomFieldOutput,
}


class CustomFieldOutputRootModel(RootModel):
    root: Annotated[CustomFieldOutputT, Field(..., discriminator='type')]


async def cf_output_from_obj(obj: m.CustomField) -> CustomFieldOutputT:
    output_class = CF_OUTPUT_MAP.get(obj.type)
    if not output_class:
        raise ValueError(f'Unsupported custom field type: {obj.type}')

    # Handle async from_obj methods for User custom fields
    if obj.type in (m.CustomFieldTypeT.USER, m.CustomFieldTypeT.USER_MULTI):
        return await output_class.from_obj(obj)
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


class DurationCustomFieldGroupOutput(BaseCustomFieldGroupOutput[m.DurationCustomField]):
    type: Literal[m.CustomFieldTypeT.DURATION] = m.CustomFieldTypeT.DURATION
    fields: list[DurationCustomFieldOutput]


class UserCustomFieldGroupOutput(BaseCustomFieldGroupOutput[m.UserCustomField]):
    type: Literal[m.CustomFieldTypeT.USER] = m.CustomFieldTypeT.USER
    fields: list[UserCustomFieldOutput]


class UserMultiCustomFieldGroupOutput(
    BaseCustomFieldGroupOutput[m.UserMultiCustomField],
):
    type: Literal[m.CustomFieldTypeT.USER_MULTI] = m.CustomFieldTypeT.USER_MULTI
    fields: list[UserMultiCustomFieldOutput]


class EnumCustomFieldGroupOutput(BaseCustomFieldGroupOutput[m.EnumCustomField]):
    type: Literal[m.CustomFieldTypeT.ENUM] = m.CustomFieldTypeT.ENUM
    fields: list[EnumCustomFieldOutput]


class EnumMultiCustomFieldGroupOutput(
    BaseCustomFieldGroupOutput[m.EnumMultiCustomField],
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
    BaseCustomFieldGroupOutput[m.VersionMultiCustomField],
):
    type: Literal[m.CustomFieldTypeT.VERSION_MULTI] = m.CustomFieldTypeT.VERSION_MULTI
    fields: list[VersionMultiCustomFieldOutput]


class OwnedCustomFieldGroupOutput(BaseCustomFieldGroupOutput[m.OwnedCustomField]):
    type: Literal[m.CustomFieldTypeT.OWNED] = m.CustomFieldTypeT.OWNED
    fields: list[OwnedCustomFieldOutput]


class OwnedMultiCustomFieldGroupOutput(
    BaseCustomFieldGroupOutput[m.OwnedMultiCustomField],
):
    type: Literal[m.CustomFieldTypeT.OWNED_MULTI] = m.CustomFieldTypeT.OWNED_MULTI
    fields: list[OwnedMultiCustomFieldOutput]


CustomFieldGroupOutputT = (
    StringCustomFieldGroupOutput
    | IntegerCustomFieldGroupOutput
    | FloatCustomFieldGroupOutput
    | BooleanCustomFieldGroupOutput
    | DateCustomFieldGroupOutput
    | DateTimeCustomFieldGroupOutput
    | DurationCustomFieldGroupOutput
    | UserCustomFieldGroupOutput
    | UserMultiCustomFieldGroupOutput
    | EnumCustomFieldGroupOutput
    | EnumMultiCustomFieldGroupOutput
    | StateCustomFieldGroupOutput
    | VersionCustomFieldGroupOutput
    | VersionMultiCustomFieldGroupOutput
    | OwnedCustomFieldGroupOutput
    | OwnedMultiCustomFieldGroupOutput
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
    m.CustomFieldTypeT.DURATION: DurationCustomFieldGroupOutput,
    m.CustomFieldTypeT.USER: UserCustomFieldGroupOutput,
    m.CustomFieldTypeT.USER_MULTI: UserMultiCustomFieldGroupOutput,
    m.CustomFieldTypeT.ENUM: EnumCustomFieldGroupOutput,
    m.CustomFieldTypeT.ENUM_MULTI: EnumMultiCustomFieldGroupOutput,
    m.CustomFieldTypeT.STATE: StateCustomFieldGroupOutput,
    m.CustomFieldTypeT.VERSION: VersionCustomFieldGroupOutput,
    m.CustomFieldTypeT.VERSION_MULTI: VersionMultiCustomFieldGroupOutput,
    m.CustomFieldTypeT.OWNED: OwnedCustomFieldGroupOutput,
    m.CustomFieldTypeT.OWNED_MULTI: OwnedMultiCustomFieldGroupOutput,
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


class BaseCustomFieldValueOutput(BaseModel, ABC):
    id: PydanticObjectId
    gid: str
    name: str
    type: m.CustomFieldTypeT
    value: Any | None

    @classmethod
    def from_obj(cls, obj: m.CustomFieldValue) -> Self:
        return cls(
            id=obj.id,
            gid=obj.gid,
            name=obj.name,
            type=obj.type,
            value=cls.transform_value(obj),
        )

    @classmethod
    def transform_value(cls, obj: m.CustomFieldValue) -> Any:
        return obj.value


class StringCustomFieldValueOutput(BaseCustomFieldValueOutput):
    type: Literal[m.CustomFieldTypeT.STRING] = m.CustomFieldTypeT.STRING
    value: str | None


class IntegerCustomFieldValueOutput(BaseCustomFieldValueOutput):
    type: Literal[m.CustomFieldTypeT.INTEGER] = m.CustomFieldTypeT.INTEGER
    value: int | None


class FloatCustomFieldValueOutput(BaseCustomFieldValueOutput):
    type: Literal[m.CustomFieldTypeT.FLOAT] = m.CustomFieldTypeT.FLOAT
    value: float | None


class BooleanCustomFieldValueOutput(BaseCustomFieldValueOutput):
    type: Literal[m.CustomFieldTypeT.BOOLEAN] = m.CustomFieldTypeT.BOOLEAN
    value: bool | None


class DateCustomFieldValueOutput(BaseCustomFieldValueOutput):
    type: Literal[m.CustomFieldTypeT.DATE] = m.CustomFieldTypeT.DATE
    value: date | None

    @classmethod
    def transform_value(cls, obj: m.CustomFieldValue) -> Any:
        return obj.value.date() if isinstance(obj.value, datetime) else obj.value


class DateTimeCustomFieldValueOutput(BaseCustomFieldValueOutput):
    type: Literal[m.CustomFieldTypeT.DATETIME] = m.CustomFieldTypeT.DATETIME
    value: datetime | None


class DurationCustomFieldValueOutput(BaseCustomFieldValueOutput):
    type: Literal[m.CustomFieldTypeT.DURATION] = m.CustomFieldTypeT.DURATION
    value: int | None


class UserCustomFieldValueOutput(BaseCustomFieldValueOutput):
    type: Literal[m.CustomFieldTypeT.USER] = m.CustomFieldTypeT.USER
    value: UserOutput | None

    @classmethod
    def transform_value(cls, obj: m.CustomFieldValue) -> Any:
        if isinstance(obj.value, m.UserLinkField):
            return UserOutput.from_obj(obj.value)
        return obj.value


class UserMultiCustomFieldValueOutput(BaseCustomFieldValueOutput):
    type: Literal[m.CustomFieldTypeT.USER_MULTI] = m.CustomFieldTypeT.USER_MULTI
    value: list[UserOutput] | None

    @classmethod
    def transform_value(cls, obj: m.CustomFieldValue) -> Any:
        if isinstance(obj.value, list):
            return [
                UserOutput.from_obj(v) if isinstance(v, m.UserLinkField) else v
                for v in obj.value
            ]
        return obj.value


class EnumCustomFieldValueOutput(BaseCustomFieldValueOutput):
    type: Literal[m.CustomFieldTypeT.ENUM] = m.CustomFieldTypeT.ENUM
    value: m.EnumOption | None


class EnumMultiCustomFieldValueOutput(BaseCustomFieldValueOutput):
    type: Literal[m.CustomFieldTypeT.ENUM_MULTI] = m.CustomFieldTypeT.ENUM_MULTI
    value: list[m.EnumOption] | None


class OwnedCustomFieldValueOutput(BaseCustomFieldValueOutput):
    type: Literal[m.CustomFieldTypeT.OWNED] = m.CustomFieldTypeT.OWNED
    value: m.OwnedOption | None


class OwnedMultiCustomFieldValueOutput(BaseCustomFieldValueOutput):
    type: Literal[m.CustomFieldTypeT.OWNED_MULTI] = m.CustomFieldTypeT.OWNED_MULTI
    value: list[m.OwnedOption] | None


class StateCustomFieldValueOutput(BaseCustomFieldValueOutput):
    type: Literal[m.CustomFieldTypeT.STATE] = m.CustomFieldTypeT.STATE
    value: m.StateOption | None


class VersionCustomFieldValueOutput(BaseCustomFieldValueOutput):
    type: Literal[m.CustomFieldTypeT.VERSION] = m.CustomFieldTypeT.VERSION
    value: m.VersionOption | None


class VersionMultiCustomFieldValueOutput(BaseCustomFieldValueOutput):
    type: Literal[m.CustomFieldTypeT.VERSION_MULTI] = m.CustomFieldTypeT.VERSION_MULTI
    value: list[m.VersionOption] | None


CustomFieldValueOutputT = (
    StringCustomFieldValueOutput
    | IntegerCustomFieldValueOutput
    | FloatCustomFieldValueOutput
    | BooleanCustomFieldValueOutput
    | DateCustomFieldValueOutput
    | DateTimeCustomFieldValueOutput
    | DurationCustomFieldValueOutput
    | UserCustomFieldValueOutput
    | UserMultiCustomFieldValueOutput
    | EnumCustomFieldValueOutput
    | EnumMultiCustomFieldValueOutput
    | OwnedCustomFieldValueOutput
    | OwnedMultiCustomFieldValueOutput
    | StateCustomFieldValueOutput
    | VersionCustomFieldValueOutput
    | VersionMultiCustomFieldValueOutput
)


class CustomFieldValueOutputRootModel(RootModel):
    root: Annotated[CustomFieldValueOutputT, Field(..., discriminator='type')]


CF_VALUE_OUTPUT_MAP: dict[m.CustomFieldTypeT, type[CustomFieldValueOutputT]] = {
    m.CustomFieldTypeT.STRING: StringCustomFieldValueOutput,
    m.CustomFieldTypeT.INTEGER: IntegerCustomFieldValueOutput,
    m.CustomFieldTypeT.FLOAT: FloatCustomFieldValueOutput,
    m.CustomFieldTypeT.BOOLEAN: BooleanCustomFieldValueOutput,
    m.CustomFieldTypeT.DATE: DateCustomFieldValueOutput,
    m.CustomFieldTypeT.DATETIME: DateTimeCustomFieldValueOutput,
    m.CustomFieldTypeT.DURATION: DurationCustomFieldValueOutput,
    m.CustomFieldTypeT.USER: UserCustomFieldValueOutput,
    m.CustomFieldTypeT.USER_MULTI: UserMultiCustomFieldValueOutput,
    m.CustomFieldTypeT.ENUM: EnumCustomFieldValueOutput,
    m.CustomFieldTypeT.ENUM_MULTI: EnumMultiCustomFieldValueOutput,
    m.CustomFieldTypeT.OWNED: OwnedCustomFieldValueOutput,
    m.CustomFieldTypeT.OWNED_MULTI: OwnedMultiCustomFieldValueOutput,
    m.CustomFieldTypeT.STATE: StateCustomFieldValueOutput,
    m.CustomFieldTypeT.VERSION: VersionCustomFieldValueOutput,
    m.CustomFieldTypeT.VERSION_MULTI: VersionMultiCustomFieldValueOutput,
}


def cf_value_output_cls_from_type(
    type_: m.CustomFieldTypeT,
) -> type[CustomFieldValueOutputT]:
    if not (output_class := CF_VALUE_OUTPUT_MAP.get(type_)):
        raise ValueError(f'Unsupported custom field type: {type_}')
    return output_class


class BaseCustomFieldGroupWithValuesOutput(BaseModel, ABC):
    field: CustomFieldGroupLinkOutput = Field(description='Field definition')
    type: m.CustomFieldTypeT = Field(description='Field type for discrimination')


class StringCustomFieldGroupWithValuesOutput(BaseCustomFieldGroupWithValuesOutput):
    type: Literal[m.CustomFieldTypeT.STRING] = m.CustomFieldTypeT.STRING
    values: list[str | None] = Field(description='String values')


class IntegerCustomFieldGroupWithValuesOutput(BaseCustomFieldGroupWithValuesOutput):
    type: Literal[m.CustomFieldTypeT.INTEGER] = m.CustomFieldTypeT.INTEGER
    values: list[int | None] = Field(description='Integer values')


class FloatCustomFieldGroupWithValuesOutput(BaseCustomFieldGroupWithValuesOutput):
    type: Literal[m.CustomFieldTypeT.FLOAT] = m.CustomFieldTypeT.FLOAT
    values: list[float | None] = Field(description='Float values')


class BooleanCustomFieldGroupWithValuesOutput(BaseCustomFieldGroupWithValuesOutput):
    type: Literal[m.CustomFieldTypeT.BOOLEAN] = m.CustomFieldTypeT.BOOLEAN
    values: list[bool | None] = Field(description='Boolean values')


class DateCustomFieldGroupWithValuesOutput(BaseCustomFieldGroupWithValuesOutput):
    type: Literal[m.CustomFieldTypeT.DATE] = m.CustomFieldTypeT.DATE
    values: list[date | None] = Field(description='Date values')


class DateTimeCustomFieldGroupWithValuesOutput(BaseCustomFieldGroupWithValuesOutput):
    type: Literal[m.CustomFieldTypeT.DATETIME] = m.CustomFieldTypeT.DATETIME
    values: list[datetime | None] = Field(description='DateTime values')


class DurationCustomFieldGroupWithValuesOutput(BaseCustomFieldGroupWithValuesOutput):
    type: Literal[m.CustomFieldTypeT.DURATION] = m.CustomFieldTypeT.DURATION
    values: list[int | None] = Field(description='Duration values in seconds')


class UserCustomFieldGroupWithValuesOutput(BaseCustomFieldGroupWithValuesOutput):
    type: Literal[m.CustomFieldTypeT.USER] = m.CustomFieldTypeT.USER
    values: list[UserOutput | None] = Field(description='User values')


class UserMultiCustomFieldGroupWithValuesOutput(BaseCustomFieldGroupWithValuesOutput):
    type: Literal[m.CustomFieldTypeT.USER_MULTI] = m.CustomFieldTypeT.USER_MULTI
    values: list[list[UserOutput] | None] = Field(description='Multiple user values')


class EnumCustomFieldGroupWithValuesOutput(BaseCustomFieldGroupWithValuesOutput):
    type: Literal[m.CustomFieldTypeT.ENUM] = m.CustomFieldTypeT.ENUM
    values: list[m.EnumOption | None] = Field(description='Enum option values')


class EnumMultiCustomFieldGroupWithValuesOutput(BaseCustomFieldGroupWithValuesOutput):
    type: Literal[m.CustomFieldTypeT.ENUM_MULTI] = m.CustomFieldTypeT.ENUM_MULTI
    values: list[list[m.EnumOption] | None] = Field(
        description='Multiple enum option values',
    )


class StateCustomFieldGroupWithValuesOutput(BaseCustomFieldGroupWithValuesOutput):
    type: Literal[m.CustomFieldTypeT.STATE] = m.CustomFieldTypeT.STATE
    values: list[m.StateOption | None] = Field(description='State option values')


class VersionCustomFieldGroupWithValuesOutput(BaseCustomFieldGroupWithValuesOutput):
    type: Literal[m.CustomFieldTypeT.VERSION] = m.CustomFieldTypeT.VERSION
    values: list[m.VersionOption | None] = Field(description='Version option values')


class VersionMultiCustomFieldGroupWithValuesOutput(
    BaseCustomFieldGroupWithValuesOutput,
):
    type: Literal[m.CustomFieldTypeT.VERSION_MULTI] = m.CustomFieldTypeT.VERSION_MULTI
    values: list[list[m.VersionOption] | None] = Field(
        description='Multiple version option values',
    )


class OwnedCustomFieldGroupWithValuesOutput(BaseCustomFieldGroupWithValuesOutput):
    type: Literal[m.CustomFieldTypeT.OWNED] = m.CustomFieldTypeT.OWNED
    values: list[m.OwnedOption | None] = Field(description='Owned option values')


class OwnedMultiCustomFieldGroupWithValuesOutput(BaseCustomFieldGroupWithValuesOutput):
    type: Literal[m.CustomFieldTypeT.OWNED_MULTI] = m.CustomFieldTypeT.OWNED_MULTI
    values: list[list[m.OwnedOption] | None] = Field(
        description='Multiple owned option values',
    )


CustomFieldGroupWithValuesOutputT = (
    StringCustomFieldGroupWithValuesOutput
    | IntegerCustomFieldGroupWithValuesOutput
    | FloatCustomFieldGroupWithValuesOutput
    | BooleanCustomFieldGroupWithValuesOutput
    | DateCustomFieldGroupWithValuesOutput
    | DateTimeCustomFieldGroupWithValuesOutput
    | DurationCustomFieldGroupWithValuesOutput
    | UserCustomFieldGroupWithValuesOutput
    | UserMultiCustomFieldGroupWithValuesOutput
    | EnumCustomFieldGroupWithValuesOutput
    | EnumMultiCustomFieldGroupWithValuesOutput
    | StateCustomFieldGroupWithValuesOutput
    | VersionCustomFieldGroupWithValuesOutput
    | VersionMultiCustomFieldGroupWithValuesOutput
    | OwnedCustomFieldGroupWithValuesOutput
    | OwnedMultiCustomFieldGroupWithValuesOutput
)


class CustomFieldGroupWithValuesOutputRootModel(RootModel):
    root: Annotated[CustomFieldGroupWithValuesOutputT, Field(..., discriminator='type')]


CUSTOM_FIELD_GROUP_WITH_VALUES_OUTPUT_MAP: dict[
    m.CustomFieldTypeT,
    type[CustomFieldGroupWithValuesOutputT],
] = {
    m.CustomFieldTypeT.STRING: StringCustomFieldGroupWithValuesOutput,
    m.CustomFieldTypeT.INTEGER: IntegerCustomFieldGroupWithValuesOutput,
    m.CustomFieldTypeT.FLOAT: FloatCustomFieldGroupWithValuesOutput,
    m.CustomFieldTypeT.BOOLEAN: BooleanCustomFieldGroupWithValuesOutput,
    m.CustomFieldTypeT.DATE: DateCustomFieldGroupWithValuesOutput,
    m.CustomFieldTypeT.DATETIME: DateTimeCustomFieldGroupWithValuesOutput,
    m.CustomFieldTypeT.DURATION: DurationCustomFieldGroupWithValuesOutput,
    m.CustomFieldTypeT.USER: UserCustomFieldGroupWithValuesOutput,
    m.CustomFieldTypeT.USER_MULTI: UserMultiCustomFieldGroupWithValuesOutput,
    m.CustomFieldTypeT.ENUM: EnumCustomFieldGroupWithValuesOutput,
    m.CustomFieldTypeT.ENUM_MULTI: EnumMultiCustomFieldGroupWithValuesOutput,
    m.CustomFieldTypeT.STATE: StateCustomFieldGroupWithValuesOutput,
    m.CustomFieldTypeT.VERSION: VersionCustomFieldGroupWithValuesOutput,
    m.CustomFieldTypeT.VERSION_MULTI: VersionMultiCustomFieldGroupWithValuesOutput,
    m.CustomFieldTypeT.OWNED: OwnedCustomFieldGroupWithValuesOutput,
    m.CustomFieldTypeT.OWNED_MULTI: OwnedMultiCustomFieldGroupWithValuesOutput,
}


def custom_field_group_with_values_output_cls_from_type(
    type_: m.CustomFieldTypeT,
) -> type[CustomFieldGroupWithValuesOutputT]:
    if not (output_class := CUSTOM_FIELD_GROUP_WITH_VALUES_OUTPUT_MAP.get(type_)):
        raise ValueError(f'Unsupported custom field type: {type_}')
    return output_class
