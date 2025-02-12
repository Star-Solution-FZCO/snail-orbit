from datetime import datetime
from typing import Annotated, Any

from pydantic import BaseModel, Field

from ._base import CustomField, CustomFieldValidationError, CustomFieldTypeT

__all__ = (
    'VersionOption',
    'VersionCustomField',
    'VersionMultiCustomField',
)


class VersionOption(BaseModel):
    id: str
    version: str
    release_date: datetime | None = None
    is_released: bool = False
    is_archived: bool = False

    def __eq__(self, other: Any) -> bool:
        if not isinstance(other, VersionOption):
            return False
        return self.version == other.version

    def __hash__(self) -> int:
        return hash(self.version)


class VersionCustomField(CustomField):
    type: CustomFieldTypeT = CustomFieldTypeT.VERSION
    options: Annotated[list[VersionOption], Field(default_factory=list)]
    default_value: VersionOption | None = None

    def validate_value(self, value: Any) -> Any:
        value = super().validate_value(value)
        if value is None:
            return value
        if isinstance(value, VersionOption):
            value = value.version
        opts = {opt.version: opt for opt in self.options}
        if value not in opts:
            raise CustomFieldValidationError(
                field=self, value=value, msg='option not found'
            )
        return opts[value]


class VersionMultiCustomField(CustomField):
    type: CustomFieldTypeT = CustomFieldTypeT.VERSION_MULTI
    options: Annotated[list[VersionOption], Field(default_factory=list)]
    default_value: list[VersionOption] | None = None

    @staticmethod
    def __transform_single_value(value: Any) -> Any:
        if isinstance(value, VersionOption):
            return value.version
        return value

    def validate_value(self, value: Any) -> Any:
        value = super().validate_value(value)
        if value is None:
            return value
        if not isinstance(value, list):
            raise CustomFieldValidationError(
                field=self, value=value, msg='must be a list'
            )
        if not self.is_nullable and not value:
            raise CustomFieldValidationError(
                field=self, value=value, msg='cannot be empty'
            )
        value = [self.__transform_single_value(val) for val in value]
        opts = {opt.version: opt for opt in self.options}
        for val in value:
            if val not in opts:
                raise CustomFieldValidationError(
                    field=self, value=value, msg=f'option {val} not found'
                )
        return [opts[val] for val in value]
