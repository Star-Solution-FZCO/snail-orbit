from enum import StrEnum
from typing import Annotated
from uuid import UUID, uuid4

from pydantic import BaseModel, Field

from .group import GroupLinkField
from .project import PermissionTargetType
from .user import UserLinkField

__all__ = ('_check_permissions', 'PermissionType', 'PermissionRecord')

permission_levels = {'view': 1, 'edit': 2, 'admin': 3}


class PermissionType(StrEnum):
    VIEW = 'view'
    EDIT = 'edit'
    ADMIN = 'admin'


class PermissionRecord(BaseModel):
    id: Annotated[UUID, Field(default_factory=uuid4)]
    target_type: PermissionTargetType
    target: GroupLinkField | UserLinkField
    permission_type: PermissionType


def _check_permissions(
    permissions,
    user_ctx,
    required_permission,
) -> bool:
    user = user_ctx.user
    group_ids = {gr.id for gr in user.groups}.union(
        {gr.id for gr in user_ctx.predefined_groups}
    )
    required_value = permission_levels.get(required_permission.value, 0)
    max_level_value = 0
    for perm in permissions:
        if (
            perm.target_type == PermissionTargetType.USER and perm.target.id == user.id
        ) or (
            perm.target_type == PermissionTargetType.GROUP
            and perm.target.id in group_ids
        ):
            current_value = permission_levels.get(perm.permission_type.value, 0)
            max_level_value = max(max_level_value, current_value)
    return max_level_value >= required_value


def _filter_permissions(obj, user_ctx) -> list[PermissionRecord]:
    user = user_ctx.user
    if obj.check_permissions(user_ctx, PermissionType.ADMIN):
        return obj.permissions
    perms_to_show = []
    user_group_ids = {gr.id for gr in user.groups}.union(
        {gr.id for gr in user_ctx.predefined_groups}
    )
    for perm in obj.permissions:
        if perm.target_type == PermissionTargetType.USER and perm.target.id == user.id:
            perms_to_show.append(perm)
        if (
            perm.target_type == PermissionTargetType.GROUP
            and perm.target.id in user_group_ids
        ):
            perms_to_show.append(perm)
    return perms_to_show
