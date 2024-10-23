from typing import TYPE_CHECKING, Self

from beanie import PydanticObjectId
from pydantic import BaseModel

import pm.models as m
from pm.permissions import Permissions

__all__ = (
    'RoleOutput',
    'RoleLinkOutput',
    'PERMISSIONS_BY_CATEGORY',
)


PERMISSIONS_BY_CATEGORY = {
    'Project': {
        Permissions.PROJECT_READ: 'Read project',
        Permissions.PROJECT_UPDATE: 'Update project',
        Permissions.PROJECT_DELETE: 'Delete project',
    },
    'Issue': {
        Permissions.ISSUE_CREATE: 'Create issue',
        Permissions.ISSUE_READ: 'Read issue',
        Permissions.ISSUE_UPDATE: 'Update issue',
        Permissions.ISSUE_DELETE: 'Delete issue',
    },
    'Comment': {
        Permissions.COMMENT_CREATE: 'Create comment',
        Permissions.COMMENT_READ: 'Read comment',
        Permissions.COMMENT_UPDATE: 'Update comment',
        Permissions.COMMENT_DELETE_OWN: 'Delete own comment',
        Permissions.COMMENT_DELETE: 'Delete comment',
    },
}


class PermissionOutput(BaseModel):
    key: Permissions
    label: str
    granted: bool


class PermissionCategoryOutput(BaseModel):
    label: str
    permissions: list[PermissionOutput]


class RoleLinkOutput(BaseModel):
    id: PydanticObjectId
    name: str
    description: str | None

    @classmethod
    def from_obj(cls, obj: m.Role | m.RoleLinkField) -> Self:
        return cls(
            id=obj.id,
            name=obj.name,
            description=obj.description,
        )


class RoleOutput(BaseModel):
    id: PydanticObjectId
    name: str
    description: str | None
    permissions: list[PermissionCategoryOutput]

    @classmethod
    def from_obj(cls, obj: m.Role | m.RoleLinkField) -> Self:
        role_permissions = set(obj.permissions)
        return cls(
            id=obj.id,
            name=obj.name,
            description=obj.description,
            permissions=[
                PermissionCategoryOutput(
                    label=category,
                    permissions=[
                        PermissionOutput(
                            key=key,
                            label=label,
                            granted=key in role_permissions,
                        )
                        for key, label in permissions.items()
                    ],
                )
                for category, permissions in PERMISSIONS_BY_CATEGORY.items()
            ],
        )
