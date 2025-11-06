from datetime import datetime
from typing import Literal

from pm.models.user import UserLinkField

from ._base import (
    CustomField,
    CustomFieldCanBeNoneError,
    CustomFieldGroupLink,
    CustomFieldInvalidOptionError,
    CustomFieldLink,
    CustomFieldTypeT,
    CustomFieldValidationError,
    CustomFieldWrongTypeError,
)
from .enum_cf import EnumCustomField, EnumMultiCustomField, EnumOption
from .owned_cf import OwnedCustomField, OwnedMultiCustomField, OwnedOption
from .plain import (
    BooleanCustomField,
    DateCustomField,
    DateTimeCustomField,
    DurationCustomField,
    FloatCustomField,
    IntegerCustomField,
    StringCustomField,
)
from .sprint_cf import SprintCustomField, SprintMultiCustomField, SprintOption
from .state_cf import StateCustomField, StateOption
from .user_cf import (
    GroupOption,
    UserCustomField,
    UserMultiCustomField,
    UserOption,
    UserOptionType,
)
from .version_cf import VersionCustomField, VersionMultiCustomField, VersionOption

__all__ = (
    'BooleanCustomField',
    'CustomField',
    'CustomFieldCanBeNoneError',
    'CustomFieldGroupLink',
    'CustomFieldInvalidOptionError',
    'CustomFieldLink',
    'CustomFieldTypeT',
    'CustomFieldValidationError',
    'CustomFieldValue',
    'CustomFieldValueT',
    'CustomFieldValueUnion',
    'CustomFieldWrongTypeError',
    'DateCustomField',
    'DateTimeCustomField',
    'DurationCustomField',
    'EnumCustomField',
    'EnumMultiCustomField',
    'EnumOption',
    'FloatCustomField',
    'GroupOption',
    'IntegerCustomField',
    'OwnedCustomField',
    'OwnedMultiCustomField',
    'OwnedOption',
    'SprintCustomField',
    'SprintMultiCustomField',
    'SprintOption',
    'StateCustomField',
    'StateOption',
    'StringCustomField',
    'UserCustomField',
    'UserMultiCustomField',
    'UserOption',
    'UserOptionType',
    'VersionCustomField',
    'VersionMultiCustomField',
    'VersionOption',
    'get_cf_class',
    'get_cf_value_class',
)

MAPPING = {
    CustomFieldTypeT.STRING: StringCustomField,
    CustomFieldTypeT.INTEGER: IntegerCustomField,
    CustomFieldTypeT.FLOAT: FloatCustomField,
    CustomFieldTypeT.BOOLEAN: BooleanCustomField,
    CustomFieldTypeT.DATE: DateCustomField,
    CustomFieldTypeT.DATETIME: DateTimeCustomField,
    CustomFieldTypeT.DURATION: DurationCustomField,
    CustomFieldTypeT.ENUM: EnumCustomField,
    CustomFieldTypeT.ENUM_MULTI: EnumMultiCustomField,
    CustomFieldTypeT.STATE: StateCustomField,
    CustomFieldTypeT.VERSION: VersionCustomField,
    CustomFieldTypeT.VERSION_MULTI: VersionMultiCustomField,
    CustomFieldTypeT.USER: UserCustomField,
    CustomFieldTypeT.USER_MULTI: UserMultiCustomField,
    CustomFieldTypeT.OWNED: OwnedCustomField,
    CustomFieldTypeT.OWNED_MULTI: OwnedMultiCustomField,
    CustomFieldTypeT.SPRINT: SprintCustomField,
    CustomFieldTypeT.SPRINT_MULTI: SprintMultiCustomField,
}


def rebuild_models() -> None:
    # pylint: disable=import-outside-toplevel, unused-import, cyclic-import
    from pm.models.project import Project  # noqa: F401

    CustomField.model_rebuild()
    for cf in MAPPING.values():
        cf.model_rebuild()


def get_cf_class(type_: CustomFieldTypeT) -> type['CustomField']:
    return MAPPING[type_]


CustomFieldValueT = (
    bool
    | int
    | float
    | datetime
    | UserLinkField
    | list[UserLinkField]
    | EnumOption
    | list[EnumOption]
    | StateOption
    | VersionOption
    | list[VersionOption]
    | OwnedOption
    | list[OwnedOption]
    | SprintOption
    | list[SprintOption]
    | None
)


class CustomFieldValue(CustomFieldLink):
    value: CustomFieldValueT = None


class StringCustomFieldValue(CustomFieldLink):
    type: Literal[CustomFieldTypeT.STRING] = CustomFieldTypeT.STRING
    value: str | None = None


class BooleanCustomFieldValue(CustomFieldLink):
    type: Literal[CustomFieldTypeT.BOOLEAN] = CustomFieldTypeT.BOOLEAN
    value: bool | None = None


class IntegerCustomFieldValue(CustomFieldLink):
    type: Literal[CustomFieldTypeT.INTEGER] = CustomFieldTypeT.INTEGER
    value: int | None = None


class FloatCustomFieldValue(CustomFieldLink):
    type: Literal[CustomFieldTypeT.FLOAT] = CustomFieldTypeT.FLOAT
    value: float | None = None


class DateCustomFieldValue(CustomFieldLink):
    type: Literal[CustomFieldTypeT.DATE] = CustomFieldTypeT.DATE
    value: datetime | None = None


class DateTimeCustomFieldValue(CustomFieldLink):
    type: Literal[CustomFieldTypeT.DATETIME] = CustomFieldTypeT.DATETIME
    value: datetime | None = None


class UserCustomFieldValue(CustomFieldLink):
    type: Literal[CustomFieldTypeT.USER] = CustomFieldTypeT.USER
    value: UserLinkField | None = None


class UserMultiCustomFieldValue(CustomFieldLink):
    type: Literal[CustomFieldTypeT.USER_MULTI] = CustomFieldTypeT.USER_MULTI
    value: list[UserLinkField] | None = None


class EnumCustomFieldValue(CustomFieldLink):
    type: Literal[CustomFieldTypeT.ENUM] = CustomFieldTypeT.ENUM
    value: EnumOption | None = None


class EnumMultiCustomFieldValue(CustomFieldLink):
    type: Literal[CustomFieldTypeT.ENUM_MULTI] = CustomFieldTypeT.ENUM_MULTI
    value: list[EnumOption] | None = None


class StateCustomFieldValue(CustomFieldLink):
    type: Literal[CustomFieldTypeT.STATE] = CustomFieldTypeT.STATE
    value: StateOption | None = None


class VersionCustomFieldValue(CustomFieldLink):
    type: Literal[CustomFieldTypeT.VERSION] = CustomFieldTypeT.VERSION
    value: VersionOption | None = None


class VersionMultiCustomFieldValue(CustomFieldLink):
    type: Literal[CustomFieldTypeT.VERSION_MULTI] = CustomFieldTypeT.VERSION_MULTI
    value: list[VersionOption] | None = None


class OwnedCustomFieldValue(CustomFieldLink):
    type: Literal[CustomFieldTypeT.OWNED] = CustomFieldTypeT.OWNED
    value: OwnedOption | None = None


class OwnedMultiCustomFieldValue(CustomFieldLink):
    type: Literal[CustomFieldTypeT.OWNED_MULTI] = CustomFieldTypeT.OWNED_MULTI
    value: list[OwnedOption] | None = None


class SprintCustomFieldValue(CustomFieldLink):
    type: Literal[CustomFieldTypeT.SPRINT] = CustomFieldTypeT.SPRINT
    value: SprintOption | None = None


class SprintMultiCustomFieldValue(CustomFieldLink):
    type: Literal[CustomFieldTypeT.SPRINT_MULTI] = CustomFieldTypeT.SPRINT_MULTI
    value: list[SprintOption] | None = None


class DurationCustomFieldValue(CustomFieldLink):
    type: Literal[CustomFieldTypeT.DURATION] = CustomFieldTypeT.DURATION
    value: int | None = None


CustomFieldValueUnion = (
    StringCustomFieldValue
    | BooleanCustomFieldValue
    | IntegerCustomFieldValue
    | FloatCustomFieldValue
    | DateCustomFieldValue
    | DateTimeCustomFieldValue
    | UserCustomFieldValue
    | UserMultiCustomFieldValue
    | EnumCustomFieldValue
    | EnumMultiCustomFieldValue
    | StateCustomFieldValue
    | VersionCustomFieldValue
    | VersionMultiCustomFieldValue
    | OwnedCustomFieldValue
    | OwnedMultiCustomFieldValue
    | SprintCustomFieldValue
    | SprintMultiCustomFieldValue
    | DurationCustomFieldValue
)


CF_FIELD_VALUE_MAPPING: dict[CustomFieldValueT, CustomFieldValueUnion] = {
    CustomFieldTypeT.STRING: StringCustomFieldValue,
    CustomFieldTypeT.BOOLEAN: BooleanCustomFieldValue,
    CustomFieldTypeT.INTEGER: IntegerCustomFieldValue,
    CustomFieldTypeT.FLOAT: FloatCustomFieldValue,
    CustomFieldTypeT.DATE: DateCustomFieldValue,
    CustomFieldTypeT.DATETIME: DateTimeCustomFieldValue,
    CustomFieldTypeT.USER: UserCustomFieldValue,
    CustomFieldTypeT.USER_MULTI: UserMultiCustomFieldValue,
    CustomFieldTypeT.ENUM: EnumCustomFieldValue,
    CustomFieldTypeT.ENUM_MULTI: EnumMultiCustomFieldValue,
    CustomFieldTypeT.STATE: StateCustomFieldValue,
    CustomFieldTypeT.VERSION: VersionCustomFieldValue,
    CustomFieldTypeT.VERSION_MULTI: VersionMultiCustomFieldValue,
    CustomFieldTypeT.OWNED: OwnedCustomFieldValue,
    CustomFieldTypeT.OWNED_MULTI: OwnedMultiCustomFieldValue,
    CustomFieldTypeT.SPRINT: SprintCustomFieldValue,
    CustomFieldTypeT.SPRINT_MULTI: SprintMultiCustomFieldValue,
    CustomFieldTypeT.DURATION: DurationCustomFieldValue,
}


def get_cf_value_class(type_: CustomFieldTypeT) -> CustomFieldValueUnion:
    return CF_FIELD_VALUE_MAPPING[type_]
