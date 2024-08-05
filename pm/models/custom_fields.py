from enum import StrEnum
from uuid import UUID

from beanie import Document
from pydantic import BaseModel, Field
from pydantic.color import Color

from ._audit import audited_model

__all__ = (
    'CustomFieldTypeT',
    'CustomField',
    'EnumOption',
    'StringCustomField',
    'IntegerCustomField',
    'FloatCustomField',
    'BooleanCustomField',
    'DateCustomField',
    'DateTimeCustomField',
    'UserCustomField',
    'UserMultiCustomField',
    'EnumCustomField',
    'EnumMultiCustomField',
)


class CustomFieldTypeT(StrEnum):
    STRING = 'string'
    INTEGER = 'integer'
    FLOAT = 'float'
    BOOLEAN = 'boolean'
    DATE = 'date'
    DATETIME = 'datetime'
    USER = 'user'
    USER_MULTI = 'user_multi'
    ENUM = 'enum'
    ENUM_MULTI = 'enum_multi'

    def get_field_class(self) -> type['CustomField']:
        return MAPPING[self]


class EnumOption(BaseModel):
    value: str
    color: str | None = None


@audited_model
class CustomField(Document):
    class Settings:
        name = 'custom_fields'
        use_revision = True
        use_state_management = True
        state_management_save_previous = True
        is_root = True

    name: str
    type: CustomFieldTypeT
    is_nullable: bool


class StringCustomField(CustomField):
    type: CustomFieldTypeT = CustomFieldTypeT.STRING


class IntegerCustomField(CustomField):
    type: CustomFieldTypeT = CustomFieldTypeT.INTEGER


class FloatCustomField(CustomField):
    type: CustomFieldTypeT = CustomFieldTypeT.FLOAT


class BooleanCustomField(CustomField):
    type: CustomFieldTypeT = CustomFieldTypeT.BOOLEAN


class DateCustomField(CustomField):
    type: CustomFieldTypeT = CustomFieldTypeT.DATE


class DateTimeCustomField(CustomField):
    type: CustomFieldTypeT = CustomFieldTypeT.DATETIME


class UserCustomField(CustomField):
    type: CustomFieldTypeT = CustomFieldTypeT.USER


class UserMultiCustomField(CustomField):
    type: CustomFieldTypeT = CustomFieldTypeT.USER_MULTI


class EnumCustomField(CustomField):
    type: CustomFieldTypeT = CustomFieldTypeT.ENUM
    options: dict[UUID, EnumOption] = Field(default_factory=dict)


class EnumMultiCustomField(CustomField):
    type: CustomFieldTypeT = CustomFieldTypeT.ENUM_MULTI
    options: dict[UUID, EnumOption] = Field(default_factory=dict)


MAPPING = {
    CustomFieldTypeT.STRING: StringCustomField,
    CustomFieldTypeT.INTEGER: IntegerCustomField,
    CustomFieldTypeT.FLOAT: FloatCustomField,
    CustomFieldTypeT.BOOLEAN: BooleanCustomField,
    CustomFieldTypeT.DATE: DateCustomField,
    CustomFieldTypeT.DATETIME: DateTimeCustomField,
    CustomFieldTypeT.USER: UserCustomField,
    CustomFieldTypeT.USER_MULTI: UserMultiCustomField,
    CustomFieldTypeT.ENUM: EnumCustomField,
    CustomFieldTypeT.ENUM_MULTI: EnumMultiCustomField,
}
