from datetime import datetime
from typing import Annotated, Any

from pydantic import BaseModel, Field

from ._base import CustomField, CustomFieldTypeT, CustomFieldValidationError

__all__ = (
    'SprintCustomField',
    'SprintMultiCustomField',
    'SprintOption',
)


class SprintOption(BaseModel):
    id: str
    value: str
    is_completed: bool = False
    is_archived: bool = False
    color: str | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None
    description: str | None = None

    def __eq__(self, other: Any) -> bool:
        if not isinstance(other, SprintOption):
            return False
        return self.value == other.value

    def __hash__(self) -> int:
        return hash(self.value)


class SprintCustomField(CustomField):
    type: CustomFieldTypeT = CustomFieldTypeT.SPRINT
    options: Annotated[list[SprintOption], Field(default_factory=list)]
    default_value: SprintOption | None = None

    async def validate_value(self, value: Any) -> Any:
        value = await super().validate_value(value)
        if value is None:
            return value
        if isinstance(value, SprintOption):
            value = value.value
        opts = {opt.value: opt for opt in self.options}
        if value not in opts:
            raise CustomFieldValidationError(
                field=self,
                value=value,
                msg='option not found',
            )
        return opts[value]


class SprintMultiCustomField(CustomField):
    type: CustomFieldTypeT = CustomFieldTypeT.SPRINT_MULTI
    options: Annotated[list[SprintOption], Field(default_factory=list)]
    default_value: list[SprintOption] | None = None

    @staticmethod
    def __transform_single_value(value: Any) -> Any:
        if isinstance(value, SprintOption):
            return value.value
        return value

    async def validate_value(self, value: Any) -> Any:
        value = await super().validate_value(value)
        if value is None:
            return value
        if not isinstance(value, list):
            raise CustomFieldValidationError(
                field=self,
                value=value,
                msg='must be a list',
            )
        if not self.is_nullable and not value:
            raise CustomFieldValidationError(
                field=self,
                value=value,
                msg='cannot be empty',
            )
        value = [self.__transform_single_value(val) for val in value]
        opts = {opt.value: opt for opt in self.options}
        for val in value:
            if val not in opts:
                raise CustomFieldValidationError(
                    field=self,
                    value=value,
                    msg=f'option {val} not found',
                )
        return [opts[val] for val in value]
