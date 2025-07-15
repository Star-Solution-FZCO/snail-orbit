from typing import Self

from beanie import PydanticObjectId
from pydantic import BaseModel

import pm.models as m
from pm.permissions import PERMISSIONS_BY_CATEGORY, Permissions

__all__ = (
    'RoleLinkOutput',
    'RoleOutput',
)


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
