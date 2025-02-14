from typing import Annotated, Any

from pydantic import BaseModel, Field

from ._base import CustomField, CustomFieldTypeT, CustomFieldValidationError

__all__ = (
    'StateOption',
    'StateCustomField',
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

    def validate_value(self, value: Any) -> Any:
        value = super().validate_value(value)
        if value is None:
            return value
        if isinstance(value, StateOption):
            value = value.value
        opts = {opt.value: opt for opt in self.options}
        if value not in opts:
            raise CustomFieldValidationError(
                field=self, value=value, msg='option not found'
            )
        return opts[value]
