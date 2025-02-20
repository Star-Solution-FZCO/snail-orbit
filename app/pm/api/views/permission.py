from typing import Self
from uuid import UUID

from pydantic import BaseModel

import pm.models as m
from pm.api.views.group import GroupOutput
from pm.api.views.user import UserOutput

__all__ = ('PermissionOutput',)


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
