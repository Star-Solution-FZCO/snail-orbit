from abc import ABC, abstractmethod
from collections.abc import Collection
from enum import StrEnum
from typing import Generic, Self, TypeVar

__all__ = (
    'GLOBAL_PERMISSIONS_BY_CATEGORY',
    'PROJECT_PERMISSIONS_BY_CATEGORY',
    'GlobalPermissionT',
    'GlobalPermissions',
    'PermAnd',
    'PermOr',
    'ProjectPermissionT',
    'ProjectPermissions',
)

T = TypeVar('T', bound=StrEnum)


class GlobalPermissions(StrEnum):
    """System-wide permissions that operate independently of any specific project."""

    PROJECT_CREATE = 'global:project_create'

    def check(self, permissions: Collection[Self]) -> bool:
        return self in permissions


class ProjectPermissions(StrEnum):
    """Project-scoped permissions for collaborative entities within projects."""

    # Project permissions
    PROJECT_READ = 'project:read'
    PROJECT_UPDATE = 'project:update'
    PROJECT_DELETE = 'project:delete'
    PROJECT_MANAGE_PERMISSIONS = 'project:manage_permissions'

    # Issue permissions
    ISSUE_CREATE = 'issue:create'
    ISSUE_READ = 'issue:read'
    ISSUE_UPDATE = 'issue:update'
    ISSUE_DELETE = 'issue:delete'
    ISSUE_MANAGE_PERMISSIONS = 'issue:manage_permissions'

    # Comment permissions
    COMMENT_CREATE = 'comment:create'
    COMMENT_READ = 'comment:read'
    COMMENT_UPDATE = 'comment:update'
    COMMENT_DELETE_OWN = 'comment:delete_own'
    COMMENT_DELETE = 'comment:delete'
    COMMENT_HIDE = 'comment:hide'
    COMMENT_RESTORE = 'comment:restore'

    # History permissions
    HISTORY_HIDE = 'history:hide'
    HISTORY_RESTORE = 'history:restore'

    def check(self, permissions: Collection[Self]) -> bool:
        return self in permissions


class PermBinOp(Generic[T], ABC):
    """Generic binary operation for permissions of the same scope."""

    _permissions: list[T | Self]

    def __init__(self, *args: T | Self) -> None:
        self._permissions = list(args)

    @abstractmethod
    def check(self, permissions: Collection[T]) -> bool:
        pass


class PermAnd(PermBinOp[T]):
    """AND operation: all permissions must be present."""

    def check(self, permissions: Collection[T]) -> bool:
        return all(
            p.check(permissions) if isinstance(p, PermBinOp) else p in permissions
            for p in self._permissions
        )

    def __str__(self) -> str:
        return '(' + ' and '.join(str(p) for p in self._permissions) + ')'


class PermOr(PermBinOp[T]):
    """OR operation: any permission must be present."""

    def check(self, permissions: Collection[T]) -> bool:
        return any(
            p.check(permissions) if isinstance(p, PermBinOp) else p in permissions
            for p in self._permissions
        )

    def __str__(self) -> str:
        return '(' + ' or '.join(str(p) for p in self._permissions) + ')'


# Type aliases for specific permission scopes
GlobalPermissionT = GlobalPermissions | PermBinOp[GlobalPermissions]
ProjectPermissionT = ProjectPermissions | PermBinOp[ProjectPermissions]


GLOBAL_PERMISSIONS_BY_CATEGORY = {
    'System': {
        GlobalPermissions.PROJECT_CREATE: 'Create projects',
    },
}

PROJECT_PERMISSIONS_BY_CATEGORY = {
    'Project': {
        ProjectPermissions.PROJECT_READ: 'Read project',
        ProjectPermissions.PROJECT_UPDATE: 'Update project',
        ProjectPermissions.PROJECT_DELETE: 'Delete project',
        ProjectPermissions.PROJECT_MANAGE_PERMISSIONS: 'Manage project permissions',
    },
    'Issue': {
        ProjectPermissions.ISSUE_CREATE: 'Create issue',
        ProjectPermissions.ISSUE_READ: 'Read issue',
        ProjectPermissions.ISSUE_UPDATE: 'Update issue',
        ProjectPermissions.ISSUE_DELETE: 'Delete issue',
        ProjectPermissions.ISSUE_MANAGE_PERMISSIONS: 'Manage issue permissions',
    },
    'Comment': {
        ProjectPermissions.COMMENT_CREATE: 'Create comment',
        ProjectPermissions.COMMENT_READ: 'Read comment',
        ProjectPermissions.COMMENT_UPDATE: 'Update comment',
        ProjectPermissions.COMMENT_DELETE_OWN: 'Delete own comment',
        ProjectPermissions.COMMENT_DELETE: 'Delete comment',
        ProjectPermissions.COMMENT_HIDE: 'Hide comment',
        ProjectPermissions.COMMENT_RESTORE: 'Restore hidden comment',
    },
    'History': {
        ProjectPermissions.HISTORY_HIDE: 'Hide history record',
        ProjectPermissions.HISTORY_RESTORE: 'Restore hidden history record',
    },
}
