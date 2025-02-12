from collections.abc import Mapping
from enum import StrEnum
from typing import Any, Self

import beanie.operators as bo
from beanie import Document, PydanticObjectId
from pydantic import BaseModel

from pm.models._audit import audited_model


__all__ = (
    'CustomFieldTypeT',
    'CustomField',
    'CustomFieldLink',
    'CustomFieldValidationError',
    'CustomFieldCanBeNoneError',
)


class CustomFieldValidationError(ValueError):
    field: 'CustomField'
    value: Any

    def __init__(self, field: 'CustomField', value: Any, msg: str):
        super().__init__(msg)
        self.field = field
        self.value = value

    @property
    def msg(self) -> str:
        return self.args[0]


class CustomFieldCanBeNoneError(CustomFieldValidationError):
    def __init__(
        self, field: 'CustomField', value: Any = None, msg: str = 'cannot be None'
    ):
        super().__init__(field, value, msg)


class CustomFieldTypeT(StrEnum):
    STRING = 'string'
    INTEGER = 'integer'
    FLOAT = 'float'
    BOOLEAN = 'boolean'
    DATE = 'date'
    DATETIME = 'datetime'
    ENUM = 'enum'
    ENUM_MULTI = 'enum_multi'
    STATE = 'state'
    VERSION = 'version'
    VERSION_MULTI = 'version_multi'
    USER = 'user'
    USER_MULTI = 'user_multi'


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
    gid: str
    description: str | None = None
    ai_description: str | None = None

    label: str
    is_nullable: bool = True
    default_value: Any | None = None

    @classmethod
    def search_query(cls, search: str) -> Mapping[str, Any] | bool:
        return bo.RegEx(cls.name, search, 'i')

    def validate_value(self, value: Any) -> Any:
        if value is None and not self.is_nullable:
            raise CustomFieldCanBeNoneError(field=self)
        return value

    def __hash__(self) -> int:
        return hash(self.id)


class CustomFieldLink(BaseModel):
    id: PydanticObjectId
    gid: str
    name: str
    type: CustomFieldTypeT

    @classmethod
    def from_obj(cls, obj: CustomField | Self) -> Self:
        return cls(
            id=obj.id,
            gid=obj.gid,
            name=obj.name,
            type=obj.type,
        )

    async def resolve(self) -> CustomField:
        obj = await CustomField.find_one(CustomField.id == self.id, with_children=True)
        if obj is None:
            raise ValueError(f'CustomField not found: {self.id}')
        return obj
