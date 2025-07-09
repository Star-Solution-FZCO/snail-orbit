from datetime import datetime
from typing import Any

from beanie import PydanticObjectId

from pm.models.user import UserLinkField

from ._base import (
    CustomField,
    CustomFieldCanBeNoneError,
    CustomFieldGroupLink,
    CustomFieldLink,
    CustomFieldTypeT,
    CustomFieldValidationError,
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
    'get_cf_class',
    'CustomField',
    'CustomFieldLink',
    'CustomFieldGroupLink',
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
    'DurationCustomField',
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
    'OwnedCustomField',
    'OwnedMultiCustomField',
    'OwnedOption',
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
}


def rebuild_models() -> None:
    # pylint: disable=import-outside-toplevel, unused-import, cyclic-import
    from pm.models.project import Project

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
    | PydanticObjectId
    | Any
    | None
)


class CustomFieldValue(CustomFieldLink):
    value: CustomFieldValueT = None
