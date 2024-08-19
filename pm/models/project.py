from enum import StrEnum
from uuid import UUID, uuid4

from beanie import Document, Indexed, Link, PydanticObjectId
from pydantic import BaseModel, Field

from pm.permissions import Permissions

from ._audit import audited_model
from .custom_fields import CustomField
from .group import GroupLinkField
from .role import RoleLinkField
from .user import User, UserLinkField

__all__ = (
    'Project',
    'ProjectLinkField',
    'ProjectPermission',
    'PermissionTargetType',
)


class PermissionTargetType(StrEnum):
    GROUP = 'group'
    USER = 'user'


class ProjectPermission(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    target_type: PermissionTargetType
    target: GroupLinkField | UserLinkField
    role: RoleLinkField


@audited_model
class Project(Document):
    class Settings:
        name = 'projects'
        use_revision = True
        use_state_management = True
        state_management_save_previous = True

    name: str = Indexed(str)
    slug: str = Indexed(str, unique=True)
    description: str | None = None
    is_active: bool = True
    custom_fields: list[Link['CustomField']] = Field(default_factory=list)
    permissions: list[ProjectPermission] = Field(default_factory=list)

    def get_user_permissions(self, user: User) -> set[Permissions]:
        results = set()
        user_groups = {gr.id for gr in user.groups}
        for perm in self.permissions:
            if (
                perm.target_type == PermissionTargetType.USER
                and perm.target.id == user.id
            ):
                results.update(perm.role.permissions)
                continue
            if (
                perm.target_type == PermissionTargetType.GROUP
                and perm.target.id in user_groups
            ):
                results.update(perm.role.permissions)
        return results


class ProjectLinkField(BaseModel):
    id: PydanticObjectId
    name: str
    slug: str
