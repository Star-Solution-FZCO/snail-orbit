from datetime import date, datetime
from typing import Any

from ._base import CustomField, CustomFieldTypeT, CustomFieldValidationError

__all__ = (
    'StringCustomField',
    'IntegerCustomField',
    'FloatCustomField',
    'BooleanCustomField',
    'DateCustomField',
    'DateTimeCustomField',
)


class StringCustomField(CustomField):
    type: CustomFieldTypeT = CustomFieldTypeT.STRING

    def validate_value(self, value: Any) -> Any:
        value = super().validate_value(value)
        if value is not None and not isinstance(value, str):
            raise CustomFieldValidationError(
                field=self, value=value, msg='must be a string'
            )
        return value


class IntegerCustomField(CustomField):
    type: CustomFieldTypeT = CustomFieldTypeT.INTEGER

    def validate_value(self, value: Any) -> Any:
        value = super().validate_value(value)
        if value is not None and not isinstance(value, int):
            raise CustomFieldValidationError(
                field=self, value=value, msg='must be an integer'
            )
        return value


class FloatCustomField(CustomField):
    type: CustomFieldTypeT = CustomFieldTypeT.FLOAT

    def validate_value(self, value: Any) -> Any:
        value = super().validate_value(value)
        if value is not None:
            try:
                value = float(value)
            except Exception as err:
                raise CustomFieldValidationError(
                    field=self, value=value, msg='must be a float'
                ) from err
        return value


class BooleanCustomField(CustomField):
    type: CustomFieldTypeT = CustomFieldTypeT.BOOLEAN

    def validate_value(self, value: Any) -> Any:
        value = super().validate_value(value)
        if value is not None and not isinstance(value, bool):
            raise CustomFieldValidationError(
                field=self, value=value, msg='must be a boolean'
            )
        return value


class DateCustomField(CustomField):
    type: CustomFieldTypeT = CustomFieldTypeT.DATE

    def validate_value(self, value: Any) -> Any:
        value = super().validate_value(value)
        if value is None:
            return value
        if isinstance(value, datetime):
            value = value.date()
        if isinstance(value, date):
            return datetime.combine(value, datetime.min.time())
        if isinstance(value, str):
            try:
                return datetime.fromisoformat(value).replace(
                    hour=0, minute=0, second=0, microsecond=0
                )
            except ValueError as err:
                raise CustomFieldValidationError(
                    field=self, value=value, msg='must be a date in ISO format'
                ) from err
        raise CustomFieldValidationError(
            field=self, value=value, msg='must be a date in ISO format'
        )


class DateTimeCustomField(CustomField):
    type: CustomFieldTypeT = CustomFieldTypeT.DATETIME

    def validate_value(self, value: Any) -> Any:
        value = super().validate_value(value)
        if value is None:
            return value
        if isinstance(value, datetime):
            return value.replace(tzinfo=None)
        if isinstance(value, str):
            try:
                return datetime.fromisoformat(value).replace(tzinfo=None)
            except ValueError as err:
                raise CustomFieldValidationError(
                    field=self, value=value, msg='must be a datetime in ISO format'
                ) from err
        raise CustomFieldValidationError(
            field=self, value=value, msg='must be a datetime in ISO format'
        )
