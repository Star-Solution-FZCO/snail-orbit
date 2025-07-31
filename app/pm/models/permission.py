from enum import StrEnum
from typing import TYPE_CHECKING, Annotated, Any
from uuid import UUID, uuid4

from pydantic import BaseModel, Field

from .group import GroupLinkField
from .project import PermissionTargetType
from .user import UserLinkField

if TYPE_CHECKING:
    from pm.api.context import UserContext

__all__ = (
    'PermissionRecord',
    'PermissionRecordMixin',
    'PermissionType',
    '_check_permissions',
    '_find_max_permission',
)


class PermissionType(StrEnum):
    VIEW = 'view'
    EDIT = 'edit'
    ADMIN = 'admin'


PERMISSION_LEVEL = {
    PermissionType.VIEW: 1,
    PermissionType.EDIT: 2,
    PermissionType.ADMIN: 3,
}
LEVEL_PERMISSION = {v: k for k, v in PERMISSION_LEVEL.items()}


class PermissionRecord(BaseModel):
    id: Annotated[UUID, Field(default_factory=uuid4)]
    target_type: PermissionTargetType
    target: GroupLinkField | UserLinkField
    permission_type: PermissionType


def _find_max_permission(
    permissions: list[PermissionRecord],
    user_ctx: 'UserContext',
) -> PermissionType | None:
    user = user_ctx.user
    group_ids = user_ctx.all_group_ids
    max_level_value = 0
    for perm in permissions:
        if (
            perm.target_type == PermissionTargetType.USER and perm.target.id == user.id
        ) or (
            perm.target_type == PermissionTargetType.GROUP
            and perm.target.id in group_ids
        ):
            max_level_value = max(
                max_level_value, PERMISSION_LEVEL.get(perm.permission_type, 0)
            )
    return LEVEL_PERMISSION.get(max_level_value)


def _check_permissions(
    permissions: list[PermissionRecord],
    user_ctx: 'UserContext',
    required_permission: PermissionType,
) -> bool:
    required_value = PERMISSION_LEVEL.get(required_permission, 0)
    max_level_value = PERMISSION_LEVEL.get(
        _find_max_permission(permissions, user_ctx), 0
    )
    return max_level_value >= required_value


def _filter_permissions(obj: Any, user_ctx: 'UserContext') -> list[PermissionRecord]:
    user = user_ctx.user
    if obj.check_permissions(user_ctx, PermissionType.ADMIN):
        return obj.permissions
    perms_to_show = []
    user_group_ids = user_ctx.all_group_ids
    for perm in obj.permissions:
        if perm.target_type == PermissionTargetType.USER and perm.target.id == user.id:
            perms_to_show.append(perm)
        if (
            perm.target_type == PermissionTargetType.GROUP
            and perm.target.id in user_group_ids
        ):
            perms_to_show.append(perm)
    return perms_to_show


class PermissionRecordMixin:
    permissions: Annotated[list[PermissionRecord], Field(default_factory=list)]

    def user_permission(self, user_ctx: 'UserContext') -> PermissionType | None:
        return _find_max_permission(self.permissions, user_ctx)
