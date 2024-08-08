from datetime import date, datetime
from enum import StrEnum
from typing import Any
from uuid import UUID

from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Field

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
    'CustomFieldValue',
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

    def validate_value(self, value: Any) -> Any:
        if value is None and not self.is_nullable:
            raise ValueError(f'Field {self.name} cannot be null')
        return value


class StringCustomField(CustomField):
    type: CustomFieldTypeT = CustomFieldTypeT.STRING

    def validate_value(self, value: Any) -> Any:
        value = super().validate_value(value)
        if value is not None and not isinstance(value, str):
            raise ValueError(f'Field {self.name} must be a string')
        return value


class IntegerCustomField(CustomField):
    type: CustomFieldTypeT = CustomFieldTypeT.INTEGER

    def validate_value(self, value: Any) -> Any:
        value = super().validate_value(value)
        if value is not None and not isinstance(value, int):
            raise ValueError(f'Field {self.name} must be an integer')
        return value


class FloatCustomField(CustomField):
    type: CustomFieldTypeT = CustomFieldTypeT.FLOAT

    def validate_value(self, value: Any) -> Any:
        value = super().validate_value(value)
        if value is not None and not isinstance(value, float):
            raise ValueError(f'Field {self.name} must be a float')
        return value


class BooleanCustomField(CustomField):
    type: CustomFieldTypeT = CustomFieldTypeT.BOOLEAN

    def validate_value(self, value: Any) -> Any:
        value = super().validate_value(value)
        if value is not None and not isinstance(value, bool):
            raise ValueError(f'Field {self.name} must be a boolean')
        return value


class DateCustomField(CustomField):
    type: CustomFieldTypeT = CustomFieldTypeT.DATE

    def validate_value(self, value: Any) -> Any:
        value = super().validate_value(value)
        if value is None:
            return value
        if isinstance(value, date):
            return value
        if isinstance(value, str):
            try:
                return datetime.strptime(value, '%Y-%m-%d').date()
            except ValueError as err:
                raise ValueError(
                    f'Field {self.name} has wrong date format, must be YYYY-MM-DD'
                ) from err
        raise ValueError(f'Field {self.name} must be a date in ISO format')


class DateTimeCustomField(CustomField):
    type: CustomFieldTypeT = CustomFieldTypeT.DATETIME

    def validate_value(self, value: Any) -> Any:
        value = super().validate_value(value)
        if value is None:
            return value
        if isinstance(value, datetime):
            return value
        if isinstance(value, str):
            try:
                return datetime.fromisoformat(value)
            except ValueError as err:
                raise ValueError(
                    f'Field {self.name} has wrong datetime format, must be ISO format'
                ) from err
        raise ValueError(f'Field {self.name} must be a datetime in ISO format')


class UserCustomField(CustomField):
    type: CustomFieldTypeT = CustomFieldTypeT.USER

    def validate_value(self, value: Any) -> Any:
        value = super().validate_value(value)
        # todo: validate user
        return value


class UserMultiCustomField(CustomField):
    type: CustomFieldTypeT = CustomFieldTypeT.USER_MULTI

    def validate_value(self, value: Any) -> Any:
        value = super().validate_value(value)
        if value is None:
            return value
        if not isinstance(value, list):
            raise ValueError(f'Field {self.name} must be a list')
        if not self.is_nullable and not value:
            raise ValueError(f'Field {self.name} cannot be empty')
        return value


class EnumCustomField(CustomField):
    type: CustomFieldTypeT = CustomFieldTypeT.ENUM
    options: dict[UUID, EnumOption] = Field(default_factory=dict)

    def validate_value(self, value: Any) -> Any:
        value = super().validate_value(value)
        if value is None:
            return value
        if value not in {opt.value for opt in self.options.values()}:
            raise ValueError(f'Field {self.name} has wrong value')
        return value


class EnumMultiCustomField(CustomField):
    type: CustomFieldTypeT = CustomFieldTypeT.ENUM_MULTI
    options: dict[UUID, EnumOption] = Field(default_factory=dict)

    def validate_value(self, value: Any) -> Any:
        value = super().validate_value(value)
        if value is None:
            return value
        if not isinstance(value, list):
            raise ValueError(f'Field {self.name} must be a list')
        if not self.is_nullable and not value:
            raise ValueError(f'Field {self.name} cannot be empty')
        allowed_values = {opt.value for opt in self.options.values()}
        for val in value:
            if val not in allowed_values:
                raise ValueError(f'Field {self.name} has wrong value "{val}"')
        return value


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


class CustomFieldValue(BaseModel):
    id: PydanticObjectId
    type: CustomFieldTypeT
    value: Any
