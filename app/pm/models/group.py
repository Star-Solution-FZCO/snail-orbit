from abc import abstractmethod
from collections.abc import Mapping
from enum import StrEnum
from typing import TYPE_CHECKING, Any, ClassVar, Literal, Self

import beanie.operators as bo
import pymongo
from beanie import Document, Indexed, PydanticObjectId
from pydantic import BaseModel, Field

from ._audit import audited_model

if TYPE_CHECKING:
    from .user import UserLinkField

__all__ = (
    'AllUsersGroup',
    'Group',
    'GroupLinkField',
    'GroupType',
    'LocalGroup',
    'WBGroup',
)


class GroupType(StrEnum):
    LOCAL = 'local'
    WB = 'wb'
    ALL_USERS = 'all_users'


class GroupLinkField(BaseModel):
    id: PydanticObjectId
    name: str
    description: str | None
    type: GroupType

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
            type=obj.type,
        )


@audited_model
class Group(Document):
    class Settings:
        name = 'groups'
        use_revision = True
        use_state_management = True
        state_management_save_previous = True
        is_root = True
        indexes: ClassVar = [
            pymongo.IndexModel([('type', 1)], name='type_index'),
        ]

    name: str = Indexed(str, unique=True)
    description: str | None = None
    type: GroupType

    @abstractmethod
    async def resolve_members(self) -> list['UserLinkField']:
        """Resolve group members based on group type."""
        raise NotImplementedError

    @classmethod
    def search_query(cls, search: str) -> Mapping[str, Any] | bool:
        return bo.RegEx(cls.name, search, 'i')


class LocalGroup(Group):
    """User-managed group with explicit membership."""

    type: Literal[GroupType.LOCAL] = GroupType.LOCAL

    async def resolve_members(self) -> list['UserLinkField']:
        from .user import User, UserLinkField  # pylint: disable=import-outside-toplevel

        users = await User.find(User.groups.id == self.id).to_list()
        return [UserLinkField.from_obj(user) for user in users]


class WBGroup(Group):
    """Group synced from Work Breakdown system."""

    type: Literal[GroupType.WB] = GroupType.WB
    wb_id: int = Field(description='WB system identifier')

    async def resolve_members(self) -> list['UserLinkField']:
        from .user import User, UserLinkField  # pylint: disable=import-outside-toplevel

        users = await User.find(User.groups.id == self.id).to_list()
        return [UserLinkField.from_obj(user) for user in users]


class AllUsersGroup(Group):
    """Dynamic group containing all users."""

    type: Literal[GroupType.ALL_USERS] = GroupType.ALL_USERS

    async def resolve_members(self) -> list['UserLinkField']:
        from .user import User, UserLinkField  # pylint: disable=import-outside-toplevel

        users = await User.find(bo.Eq(User.is_active, True)).to_list()
        return [UserLinkField.from_obj(user) for user in users]
