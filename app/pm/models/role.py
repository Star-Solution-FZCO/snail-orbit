from collections.abc import Mapping
from enum import StrEnum
from typing import Annotated, Any, ClassVar, Self

import beanie.operators as bo
import pymongo
from beanie import Document, Indexed, PydanticObjectId
from pydantic import BaseModel, Field

from pm.permissions import ProjectPermissions

from ._audit import audited_model

__all__ = (
    'ProjectRole',
    'ProjectRoleLinkField',
    'SystemRoleType',
)


class SystemRoleType(StrEnum):
    """System role types for built-in roles that cannot be modified."""

    PROJECT_OWNER = 'project_owner'


class ProjectRoleLinkField(BaseModel):
    """Link field for project roles with embedded permissions."""

    id: PydanticObjectId
    name: str
    description: str | None
    permissions: list[ProjectPermissions]

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, ProjectRoleLinkField):
            return False
        return self.id == other.id

    @classmethod
    def from_obj(cls, obj: 'ProjectRole') -> Self:
        return cls(
            id=obj.id,
            name=obj.name,
            description=obj.description,
            permissions=obj.permissions,
        )


@audited_model
class ProjectRole(Document):
    """Project-specific role with project-scoped permissions."""

    class Settings:
        name = 'roles'  # Keep same collection name for backward compatibility
        use_revision = True
        use_state_management = True
        state_management_save_previous = True
        indexes: ClassVar = [
            pymongo.IndexModel([('permissions', 1)], name='permissions_index'),
            pymongo.IndexModel(
                [('system_role_type', 1)], name='system_role_type_index'
            ),
        ]

    name: Annotated[str, Indexed(str)] = Field(description='Role name')
    description: str | None = Field(default=None, description='Role description')
    system_role_type: SystemRoleType | None = Field(
        default=None,
        description='System role type for built-in roles (null for user-created roles)',
    )
    permissions: Annotated[list[ProjectPermissions], Field(default_factory=list)] = (
        Field(description='Project permissions granted by this role')
    )

    @property
    def is_system_role(self) -> bool:
        """Check if this is a system role that cannot be modified."""
        return self.system_role_type is not None

    @classmethod
    def search_query(cls, search: str) -> Mapping[str, Any] | bool:
        return bo.RegEx(cls.name, search, 'i')
