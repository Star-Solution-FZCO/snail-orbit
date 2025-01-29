from enum import StrEnum
from typing import Annotated

from beanie import Document, Indexed
from pydantic import Field

from ._audit import audited_model
from .group import GroupLinkField
from .permission import (
    PermissionRecord,
    PermissionTypes,
    _check_permissions,
)
from .user import User, UserLinkField

__all__ = ('Search', 'SearchPermission', 'SearchPermissionType')


class SearchPermissionType(StrEnum):
    VIEW = PermissionTypes.VIEW.value
    EDIT = PermissionTypes.EDIT.value
    OWNER = PermissionTypes.OWNER.value


class SearchPermission(PermissionRecord):
    permission_type: SearchPermissionType


@audited_model
class Search(Document):
    class Settings:
        name = 'searches'
        use_revision = True
        use_state_management = True
        state_management_save_previous = True

    name: str = Indexed(str)
    query: str
    description: str | None
    created_by: UserLinkField
    permissions: Annotated[list[SearchPermission], Field(default_factory=list)]

    def has_permission_for_target(self, target: GroupLinkField | UserLinkField) -> bool:
        return any(p.target.id == target.id for p in self.permissions)

    def check_permissions(
        self, user: User, required_permission: SearchPermissionType
    ) -> bool:
        return _check_permissions(
            permissions=self.permissions,
            user=user,
            required_permission=required_permission,
        )
