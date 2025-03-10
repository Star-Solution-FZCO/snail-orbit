from collections.abc import Mapping
from typing import Annotated, Any

import beanie.operators as bo
from beanie import Document, Indexed
from pydantic import Field

from ._audit import audited_model
from .group import GroupLinkField
from .permission import (
    PermissionRecord,
    PermissionType,
    _check_permissions,
    _filter_permissions,
)
from .user import User, UserLinkField

__all__ = ('Search',)


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
    permissions: Annotated[list[PermissionRecord], Field(default_factory=list)]

    @classmethod
    def search_query(cls, search: str) -> Mapping[str, Any] | bool:
        return bo.RegEx(cls.name, search, 'i')

    def has_permission_for_target(self, target: GroupLinkField | UserLinkField) -> bool:
        return any(p.target.id == target.id for p in self.permissions)

    def has_any_other_admin_target(
        self, target: UserLinkField | GroupLinkField
    ) -> bool:
        return (
            sum(
                1
                for p in self.permissions
                if p.permission_type == PermissionType.ADMIN
                and p.target.id != target.id
            )
            > 0
        )

    def filter_permissions(self, user: User) -> list[PermissionRecord]:
        return _filter_permissions(self, user)

    def check_permissions(
        self, user: User, required_permission: PermissionType
    ) -> bool:
        return _check_permissions(
            permissions=self.permissions,
            user=user,
            required_permission=required_permission,
        )
