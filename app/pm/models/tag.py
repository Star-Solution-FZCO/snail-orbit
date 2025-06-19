from collections.abc import Mapping
from typing import Any, Self

import beanie.operators as bo
import pymongo
from beanie import Document, Indexed, PydanticObjectId
from pydantic import BaseModel

from ._audit import audited_model
from .user import User, UserLinkField

__all__ = (
    'Tag',
    'TagLinkField',
)


class TagLinkField(BaseModel):
    id: PydanticObjectId
    name: str
    color: str | None

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, TagLinkField):
            return False
        return self.id == other.id

    @classmethod
    def from_obj(cls, obj: 'Tag | Self') -> Self:
        if isinstance(obj, cls):
            return obj
        return cls(
            id=obj.id,
            name=obj.name,
            color=obj.color,
        )

    async def resolve(self) -> 'Tag':
        obj = await Tag.find_one(Tag.id == self.id)
        if obj is None:
            raise ValueError(f'Tag not found: {self.id}')
        return obj


@audited_model
class Tag(Document):
    class Settings:
        name = 'tags'
        use_revision = True
        use_state_management = True
        state_management_save_previous = True
        indexes = [
            pymongo.IndexModel([('created_by.id', 1)], name='created_by_id_index'),
            pymongo.IndexModel([('color', 1)], name='color_index'),
            pymongo.IndexModel(
                [('untag_on_resolve', 1)], name='untag_on_resolve_index'
            ),
            pymongo.IndexModel([('untag_on_close', 1)], name='untag_on_close_index'),
        ]

    name: str = Indexed(str)
    description: str | None = None
    ai_description: str | None = None
    color: str | None = None
    untag_on_resolve: bool = False
    untag_on_close: bool = False
    created_by: UserLinkField

    @classmethod
    def search_query(cls, search: str) -> Mapping[str, Any] | bool:
        return bo.RegEx(cls.name, search, 'i')

    @classmethod
    async def update_user_embedded_links(
        cls,
        user: User | UserLinkField,
    ) -> None:
        if isinstance(user, User):
            user = UserLinkField.from_obj(user)
        await cls.find(cls.created_by.id == user.id).update(
            {'$set': {'created_by': user}},
        )
