from enum import StrEnum
from typing import Annotated
from uuid import UUID, uuid4

from pydantic import BaseModel, Field

from .group import GroupLinkField
from .project import PermissionTargetType
from .user import User, UserLinkField

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
    user: User,
    required_permission,
) -> bool:
    group_ids = {g.id for g in user.groups}
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
