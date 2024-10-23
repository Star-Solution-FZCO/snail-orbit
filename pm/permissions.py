from abc import ABC, abstractmethod
from collections.abc import Collection
from enum import StrEnum
from typing import Self

__all__ = (
    'Permissions',
    'PermAnd',
    'PermOr',
    'PermissionT',
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

    def __str__(self):
        return '(' + ' and '.join(str(p) for p in self._permissions) + ')'


class PermOr(PermBinOp):
    def check(self, permissions: Collection[Permissions]) -> bool:
        return any(p.check(permissions) for p in self._permissions)

    def __str__(self):
        return '(' + ' or '.join(str(p) for p in self._permissions) + ')'


PermissionT = Permissions | PermBinOp
