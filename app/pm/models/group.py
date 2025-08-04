from abc import abstractmethod
from collections.abc import Mapping
from enum import StrEnum
from typing import TYPE_CHECKING, Annotated, Any, ClassVar, Literal, Self

import beanie.operators as bo
import pymongo
from beanie import Document, Indexed, PydanticObjectId
from pydantic import BaseModel, Field

from ._audit import audited_model

if TYPE_CHECKING:
    from .global_role import GlobalRole, GlobalRoleLinkField
    from .user import UserLinkField

__all__ = (
    'AllUsersGroup',
    'Group',
    'GroupLinkField',
    'GroupType',
    'LocalGroup',
    'SystemAdminsGroup',
    'WBGroup',
)


class GroupType(StrEnum):
    LOCAL = 'local'
    WB = 'wb'
    ALL_USERS = 'all_users'
    SYSTEM_ADMINS = 'system_admins'


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
    global_roles: Annotated[
        list['GlobalRoleLinkField'], Field(default_factory=list)
    ] = Field(description='Global roles assigned to this group')

    @abstractmethod
    async def resolve_members(self) -> list['UserLinkField']:
        """Resolve group members based on group type."""
        raise NotImplementedError

    @classmethod
    def search_query(cls, search: str) -> Mapping[str, Any] | bool:
        return bo.RegEx(cls.name, search, 'i')

    @classmethod
    async def update_global_role_embedded_links(
        cls,
        global_role: 'GlobalRole',
    ) -> None:
        """Update embedded global role links when a global role is modified."""
        from .global_role import (  # pylint: disable=import-outside-toplevel
            GlobalRoleLinkField,
        )

        global_role_link = GlobalRoleLinkField.from_obj(global_role)
        await cls.find(
            {'global_roles': {'$elemMatch': {'id': global_role.id}}},
        ).update(
            {'$set': {'global_roles.$[gr]': global_role_link}},
            array_filters=[{'gr.id': global_role.id}],
        )

    @classmethod
    async def remove_global_role_embedded_links(
        cls,
        global_role_id: PydanticObjectId,
    ) -> None:
        """Remove embedded global role links when a global role is deleted."""
        await cls.find().update(
            {'$pull': {'global_roles': {'id': global_role_id}}},
        )


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


class SystemAdminsGroup(Group):
    """Dynamic group containing all system administrators."""

    type: Literal[GroupType.SYSTEM_ADMINS] = GroupType.SYSTEM_ADMINS

    async def resolve_members(self) -> list['UserLinkField']:
        from .user import User, UserLinkField  # pylint: disable=import-outside-toplevel

        users = await User.find(bo.Eq(User.is_admin, True)).to_list()
        return [UserLinkField.from_obj(user) for user in users]


def rebuild_models() -> None:
    """Rebuild models to resolve forward references."""
    from .global_role import (  # pylint: disable=import-outside-toplevel
        GlobalRoleLinkField,
    )
    from .user import UserLinkField  # pylint: disable=import-outside-toplevel

    # Create a types namespace with the required classes for forward reference resolution
    types_namespace = {
        'GlobalRoleLinkField': GlobalRoleLinkField,
        'UserLinkField': UserLinkField,
    }

    Group.model_rebuild(_types_namespace=types_namespace)
    LocalGroup.model_rebuild(_types_namespace=types_namespace)
    WBGroup.model_rebuild(_types_namespace=types_namespace)
    AllUsersGroup.model_rebuild(_types_namespace=types_namespace)
    SystemAdminsGroup.model_rebuild(_types_namespace=types_namespace)
