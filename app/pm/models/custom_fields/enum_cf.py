from typing import Annotated, Any

from pydantic import BaseModel, Field

from ._base import (
    CustomField,
    CustomFieldCanBeNoneError,
    CustomFieldInvalidOptionError,
    CustomFieldTypeT,
    CustomFieldWrongTypeError,
)

__all__ = (
    'EnumCustomField',
    'EnumMultiCustomField',
    'EnumOption',
)


class EnumOption(BaseModel):
    id: str
    value: str
    color: str | None = None
    is_archived: bool = False

    def __eq__(self, other: Any) -> bool:
        if not isinstance(other, EnumOption):
            return False
        return self.value == other.value

    def __hash__(self) -> int:
        return hash(self.value)


class EnumCustomField(CustomField):
    type: CustomFieldTypeT = CustomFieldTypeT.ENUM
    options: Annotated[list[EnumOption], Field(default_factory=list)]
    default_value: EnumOption | None = None

    async def validate_value(self, value: Any) -> Any:
        value = await super().validate_value(value)
        if value is None:
            return value
        if isinstance(value, EnumOption):
            value = value.value
        if not isinstance(value, str):
            raise CustomFieldWrongTypeError(
                field=self,
                value=value,
                msg='must be a string',
            )
        opts = {opt.value: opt for opt in self.options}
        if value not in opts:
            raise CustomFieldInvalidOptionError(
                field=self,
                value=value,
                msg='option not found',
                value_obj=EnumOption(
                    id='',
                    value=value,
                ),
            )
        return opts[value]


class EnumMultiCustomField(CustomField):
    type: CustomFieldTypeT = CustomFieldTypeT.ENUM_MULTI
    options: Annotated[list[EnumOption], Field(default_factory=list)]
    default_value: list[EnumOption] | None = None

    @staticmethod
    def __transform_single_value(value: Any) -> Any:
        if isinstance(value, EnumOption):
            return value.value
        return value

    async def validate_value(self, value: Any) -> Any:
        value = await super().validate_value(value)
        if value is None:
            return value
        if not isinstance(value, list):
            raise CustomFieldWrongTypeError(
                field=self,
                value=value,
                msg='must be a list',
            )
        if not self.is_nullable and not value:
            raise CustomFieldCanBeNoneError(
                field=self,
                value=value,
            )
        value = [self.__transform_single_value(val) for val in value]
        if any(not isinstance(val, str) for val in value):
            raise CustomFieldWrongTypeError(
                field=self,
                value=value,
                msg='all items must be strings',
            )
        opts = {opt.value: opt for opt in self.options}
        for val in value:
            if val not in opts:
                raise CustomFieldInvalidOptionError(
                    field=self,
                    value=value,
                    value_obj=[
                        EnumOption(
                            id='',
                            value=val_,
                        )
                        for val_ in value
                    ],
                    msg=f'option {val} not found',
                )
        return [opts[val] for val in value]
