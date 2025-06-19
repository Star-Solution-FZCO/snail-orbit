from collections.abc import Mapping
from enum import StrEnum
from typing import Any, Self

import beanie.operators as bo
import pymongo
from beanie import Document, Indexed, PydanticObjectId
from pydantic import BaseModel

from ._audit import audited_model

__all__ = (
    'Group',
    'GroupLinkField',
    'GroupOriginType',
    'PredefinedGroupScope',
)


class GroupOriginType(StrEnum):
    LOCAL = 'local'
    WB = 'wb'


class PredefinedGroupScope(StrEnum):
    ALL_USERS = 'all_users'


class GroupLinkField(BaseModel):
    id: PydanticObjectId
    name: str
    description: str | None
    predefined_scope: PredefinedGroupScope | None = None

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, GroupLinkField):
            return False
        return self.id == other.id

    @classmethod
    def from_obj(cls, obj: 'Group') -> Self:
        return cls(
            id=obj.id,
            name=obj.name,
            description=obj.description,
            predefined_scope=obj.predefined_scope,
        )


@audited_model
class Group(Document):
    class Settings:
        name = 'groups'
        use_revision = True
        use_state_management = True
        state_management_save_previous = True
        indexes = [
            pymongo.IndexModel([('origin', 1)], name='origin_index'),
            pymongo.IndexModel([('external_id', 1)], name='external_id_index'),
            pymongo.IndexModel(
                [('predefined_scope', 1)], name='predefined_scope_index'
            ),
        ]

    name: str = Indexed(str, unique=True)
    description: str | None = None
    origin: GroupOriginType = GroupOriginType.LOCAL
    external_id: str | None = None
    predefined_scope: PredefinedGroupScope | None = None

    @classmethod
    def search_query(cls, search: str) -> Mapping[str, Any] | bool:
        return bo.RegEx(cls.name, search, 'i')
