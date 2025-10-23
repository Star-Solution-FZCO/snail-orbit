from typing import Annotated, Any

from pydantic import BaseModel, Field

from ._base import (
    CustomField,
    CustomFieldInvalidOptionError,
    CustomFieldTypeT,
    CustomFieldWrongTypeError,
)

__all__ = (
    'StateCustomField',
    'StateOption',
)


class StateOption(BaseModel):
    id: str
    value: str
    is_resolved: bool = False
    is_closed: bool = False
    is_archived: bool = False
    color: str | None = None

    def __eq__(self, other: Any) -> bool:
        if not isinstance(other, StateOption):
            return False
        return self.value == other.value

    def __hash__(self) -> int:
        return hash(self.value)


class StateCustomField(CustomField):
    type: CustomFieldTypeT = CustomFieldTypeT.STATE
    options: Annotated[list[StateOption], Field(default_factory=list)]
    default_value: StateOption | None = None

    async def validate_value(self, value: Any) -> Any:
        value = await super().validate_value(value)
        if value is None:
            return value
        if isinstance(value, StateOption):
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
                value_obj=StateOption(
                    id='',
                    value=value,
                ),
            )
        return opts[value]
