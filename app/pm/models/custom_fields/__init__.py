from typing import Any
from datetime import datetime

from beanie import PydanticObjectId

from pm.models.user import UserLinkField

from ._base import (
    CustomField,
    CustomFieldLink,
    CustomFieldTypeT,
    CustomFieldCanBeNoneError,
    CustomFieldValidationError,
)
from .plain import StringCustomField, IntegerCustomField, FloatCustomField, BooleanCustomField, DateCustomField, DateTimeCustomField
from .enum_cf import EnumCustomField, EnumMultiCustomField, EnumOption
from .state_cf import StateCustomField, StateOption
from .version_cf import VersionCustomField, VersionMultiCustomField, VersionOption
from .user_cf import UserCustomField, UserMultiCustomField, UserOption, UserOptionType, GroupOption


__all__ = (
    'get_cf_class',
    'CustomField',
    'CustomFieldLink',
    'CustomFieldTypeT',
    'CustomFieldCanBeNoneError',
    'CustomFieldValidationError',
    'CustomFieldValue',
    'CustomFieldValueT',
    'StringCustomField',
    'IntegerCustomField',
    'FloatCustomField',
    'BooleanCustomField',
    'DateCustomField',
    'DateTimeCustomField',
    'EnumCustomField',
    'EnumMultiCustomField',
    'EnumOption',
    'StateCustomField',
    'StateOption',
    'VersionCustomField',
    'VersionMultiCustomField',
    'VersionOption',
    'UserCustomField',
    'UserMultiCustomField',
    'UserOption',
    'UserOptionType',
    'GroupOption',
)

MAPPING = {
    CustomFieldTypeT.STRING: StringCustomField,
    CustomFieldTypeT.INTEGER: IntegerCustomField,
    CustomFieldTypeT.FLOAT: FloatCustomField,
    CustomFieldTypeT.BOOLEAN: BooleanCustomField,
    CustomFieldTypeT.DATE: DateCustomField,
    CustomFieldTypeT.DATETIME: DateTimeCustomField,
    CustomFieldTypeT.ENUM: EnumCustomField,
    CustomFieldTypeT.ENUM_MULTI: EnumMultiCustomField,
    CustomFieldTypeT.STATE: StateCustomField,
    CustomFieldTypeT.VERSION: VersionCustomField,
    CustomFieldTypeT.VERSION_MULTI: VersionMultiCustomField,
    CustomFieldTypeT.USER: UserCustomField,
    CustomFieldTypeT.USER_MULTI: UserMultiCustomField,
}


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
        | PydanticObjectId
        | Any
        | None
)


class CustomFieldValue(CustomFieldLink):
    value: CustomFieldValueT = None
