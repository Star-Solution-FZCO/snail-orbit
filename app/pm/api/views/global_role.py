from typing import Self

from beanie import PydanticObjectId
from pydantic import BaseModel

import pm.models as m
from pm.permissions import GLOBAL_PERMISSIONS_BY_CATEGORY, GlobalPermissions

__all__ = (
    'GlobalPermissionCategoryOutput',
    'GlobalPermissionOutput',
    'GlobalRoleOutput',
    'GlobalRoleSimpleOutput',
)


class GlobalPermissionOutput(BaseModel):
    key: GlobalPermissions
    label: str
    granted: bool


class GlobalPermissionCategoryOutput(BaseModel):
    label: str
    permissions: list[GlobalPermissionOutput]


class GlobalRoleOutput(BaseModel):
    id: PydanticObjectId
    name: str
    description: str | None
    permissions: list[GlobalPermissionCategoryOutput]

    @classmethod
    def from_obj(cls, obj: m.GlobalRole | m.GlobalRoleLinkField) -> Self:
        role_permissions = set(obj.permissions)
        return cls(
            id=obj.id,
            name=obj.name,
            description=obj.description,
            permissions=[
                GlobalPermissionCategoryOutput(
                    label=category,
                    permissions=[
                        GlobalPermissionOutput(
                            key=key,
                            label=label,
                            granted=key in role_permissions,
                        )
                        for key, label in permissions.items()
                    ],
                )
                for category, permissions in GLOBAL_PERMISSIONS_BY_CATEGORY.items()
            ],
        )


class GlobalRoleSimpleOutput(BaseModel):
    id: PydanticObjectId
    name: str
    description: str | None

    @classmethod
    def from_obj(cls, obj: m.GlobalRole | m.GlobalRoleLinkField) -> Self:
        return cls(
            id=obj.id,
            name=obj.name,
            description=obj.description,
        )
