from abc import ABC, abstractmethod
from collections.abc import Collection
from enum import StrEnum
from typing import Self

__all__ = (
    'PermAnd',
    'PermOr',
    'PermissionT',
    'Permissions',
)


class Permissions(StrEnum):
    PROJECT_READ = 'project:read'
    PROJECT_UPDATE = 'project:update'
    PROJECT_DELETE = 'project:delete'

    ISSUE_CREATE = 'issue:create'
    ISSUE_READ = 'issue:read'
    ISSUE_UPDATE = 'issue:update'
    ISSUE_DELETE = 'issue:delete'

    COMMENT_CREATE = 'comment:create'
    COMMENT_READ = 'comment:read'
    COMMENT_UPDATE = 'comment:update'
    COMMENT_DELETE_OWN = 'comment:delete_own'
    COMMENT_DELETE = 'comment:delete'
    COMMENT_HIDE = 'comment:hide'
    COMMENT_RESTORE = 'comment:restore'

    HISTORY_HIDE = 'history:hide'
    HISTORY_RESTORE = 'history:restore'

    def check(self, permissions: Collection[Self]) -> bool:
        return self in permissions


class PermBinOp(ABC):
    _permissions: list[Permissions | Self]

    def __init__(self, *args: Permissions | Self) -> None:
        self._permissions = list(args)

    @abstractmethod
    def check(self, permissions: Collection[Permissions]) -> bool:
        pass


class PermAnd(PermBinOp):
    def check(self, permissions: Collection[Permissions]) -> bool:
        return all(p.check(permissions) for p in self._permissions)

    def __str__(self) -> str:
        return '(' + ' and '.join(str(p) for p in self._permissions) + ')'


class PermOr(PermBinOp):
    def check(self, permissions: Collection[Permissions]) -> bool:
        return any(p.check(permissions) for p in self._permissions)

    def __str__(self) -> str:
        return '(' + ' or '.join(str(p) for p in self._permissions) + ')'


PermissionT = Permissions | PermBinOp


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
        Permissions.COMMENT_HIDE: 'Hide comment',
        Permissions.COMMENT_RESTORE: 'Restore hidden comment',
    },
    'History': {
        Permissions.HISTORY_HIDE: 'Hide history record',
        Permissions.HISTORY_RESTORE: 'Restore hidden history record',
    },
}
