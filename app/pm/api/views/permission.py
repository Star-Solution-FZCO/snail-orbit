from typing import Self
from uuid import UUID

from beanie import PydanticObjectId
from pydantic import BaseModel, Field

import pm.models as m
from pm.api.views.group import GroupOutput
from pm.api.views.user import UserOutput

__all__ = (
    'GrantPermissionBody',
    'PermissionOutput',
    'UpdatePermissionBody',
)


class PermissionOutput(BaseModel):
    id: UUID
    target_type: m.PermissionTargetType
    target: UserOutput | GroupOutput
    permission_type: m.PermissionType

    @classmethod
    def from_obj(cls, obj: m.PermissionRecord) -> Self:
        target = (
            GroupOutput.from_obj(obj.target)
            if obj.target_type == m.PermissionTargetType.GROUP
            else UserOutput.from_obj(obj.target)
        )
        return cls(
            id=obj.id,
            target_type=obj.target_type,
            target=target,
            permission_type=obj.permission_type,
        )


class GrantPermissionBody(BaseModel):
    target_type: m.PermissionTargetType = Field(description='Type of permission target')
    target: PydanticObjectId = Field(description='Target user or group ID')
    permission_type: m.PermissionType = Field(description='Permission level to grant')


class UpdatePermissionBody(BaseModel):
    permission_type: m.PermissionType = Field(description='New permission level')
