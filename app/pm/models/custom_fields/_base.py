from collections.abc import Mapping
from enum import StrEnum
from typing import TYPE_CHECKING, Any, Self

import beanie.operators as bo
import pymongo
from beanie import BackLink, Document, PydanticObjectId
from pydantic import BaseModel, Field

from pm.models._audit import audited_model

if TYPE_CHECKING:
    from pm.models.project import Project

__all__ = (
    'CustomFieldTypeT',
    'CustomField',
    'CustomFieldLink',
    'CustomFieldGroupLink',
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
    DURATION = 'duration'
    ENUM = 'enum'
    ENUM_MULTI = 'enum_multi'
    STATE = 'state'
    VERSION = 'version'
    VERSION_MULTI = 'version_multi'
    USER = 'user'
    USER_MULTI = 'user_multi'
    OWNED = 'owned'
    OWNED_MULTI = 'owned_multi'


@audited_model
class CustomField(Document):
    class Settings:
        name = 'custom_fields'
        use_revision = True
        use_state_management = True
        state_management_save_previous = True
        is_root = True
        indexes = [
            pymongo.IndexModel([('gid', 1)], name='gid_index'),
            pymongo.IndexModel([('type', 1)], name='type_index'),
            pymongo.IndexModel([('gid', 1), ('type', 1)], name='gid_type_index'),
            pymongo.IndexModel([('name', 1)], name='name_index'),
            pymongo.IndexModel(
                [('name', pymongo.TEXT), ('description', pymongo.TEXT)],
                name='field_text_search_index',
            ),
        ]

    name: str
    type: CustomFieldTypeT
    gid: str
    description: str | None = None
    ai_description: str | None = None

    label: str
    is_nullable: bool = True
    default_value: Any | None = None

    projects: list[BackLink['Project']] = Field(original_field='custom_fields')

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


class CustomFieldGroupLink(BaseModel):
    gid: str
    name: str
    type: CustomFieldTypeT

    @classmethod
    def from_obj(cls, obj: CustomField | CustomFieldLink | Self) -> Self:
        return cls(
            gid=obj.gid,
            name=obj.name,
            type=obj.type,
        )

    async def resolve(self) -> list[CustomField]:
        return await CustomField.find(
            CustomField.gid == self.gid, with_children=True
        ).to_list()

    def __hash__(self) -> int:
        return hash(self.gid)
