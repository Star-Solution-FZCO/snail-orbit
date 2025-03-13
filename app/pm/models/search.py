from collections.abc import Mapping
from typing import Annotated, Any

import beanie.operators as bo
from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field

from ._audit import audited_model
from .group import GroupLinkField
from .permission import (
    PermissionRecord,
    PermissionTargetType,
    PermissionType,
    _check_permissions,
    _filter_permissions,
)
from .user import UserLinkField

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

    def filter_permissions(self, user_ctx) -> list[PermissionRecord]:
        return _filter_permissions(self, user_ctx)

    def check_permissions(self, user_ctx, required_permission: PermissionType) -> bool:
        return _check_permissions(
            permissions=self.permissions,
            user_ctx=user_ctx,
            required_permission=required_permission,
        )

    @classmethod
    async def remove_group_embedded_links(
        cls,
        group_id: PydanticObjectId,
    ) -> None:
        await cls.find(
            cls.permissions.target_type == PermissionTargetType.GROUP,
            cls.permissions.target.id == group_id,
        ).update(
            {
                '$pull': {
                    'permissions': {
                        'target_type': PermissionTargetType.GROUP.value,
                        'target.id': group_id,
                    }
                }
            },
        )

    @classmethod
    async def update_group_embedded_links(
        cls,
        group: 'Group',
    ) -> None:
        await cls.find(
            cls.permissions.target_type == PermissionTargetType.GROUP,
            cls.permissions.target.id == group.id,
        ).update(
            {'$set': {'permissions.$[p].target': GroupLinkField.from_obj(group)}},
            array_filters=[
                {
                    'p.target.id': group.id,
                    'p.target_type': PermissionTargetType.GROUP.value,
                }
            ],
        )
