from collections.abc import Mapping
from enum import StrEnum
from typing import Annotated, Any, ClassVar, Self
from uuid import UUID, uuid4

import beanie.operators as bo
import pymongo
from beanie import Document, Indexed, Link, PydanticObjectId, Update
from pydantic import BaseModel, Field

from pm.permissions import Permissions

from ._audit import audited_model
from ._encryption import EncryptionKey
from .custom_fields import CustomField
from .group import Group, GroupLinkField
from .role import Role, RoleLinkField
from .user import User, UserLinkField
from .workflow import Workflow

__all__ = (
    'PermissionTargetType',
    'Project',
    'ProjectAvatarType',
    'ProjectEncryptionSettings',
    'ProjectLinkField',
    'ProjectPermission',
)


class ProjectAvatarType(StrEnum):
    LOCAL = 'local'
    DEFAULT = 'default'


class PermissionTargetType(StrEnum):
    GROUP = 'group'
    USER = 'user'


class ProjectPermission(BaseModel):
    id: Annotated[UUID, Field(default_factory=uuid4)]
    target_type: PermissionTargetType
    target: GroupLinkField | UserLinkField
    role: RoleLinkField

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, ProjectPermission):
            return False
        return (
            self.target_type == other.target_type
            and self.target == other.target
            and self.role == other.role
        )


class ProjectEncryptionSettings(BaseModel):
    encryption_keys: list[EncryptionKey]
    users: Annotated[list[UserLinkField], Field(default_factory=list)]
    encrypt_attachments: bool
    encrypt_comments: bool
    encrypt_description: bool


@audited_model
class Project(Document):
    class Settings:
        name = 'projects'
        use_revision = True
        use_state_management = True
        state_management_save_previous = True
        indexes: ClassVar = [
            pymongo.IndexModel(
                [('permissions.target_type', 1), ('permissions.target.id', 1)],
                name='permissions_target_index',
            ),
            pymongo.IndexModel([('subscribers', 1)], name='subscribers_index'),
            pymongo.IndexModel([('custom_fields', 1)], name='custom_fields_index'),
            pymongo.IndexModel([('slug_history', 1)], name='slug_history_index'),
            pymongo.IndexModel([('is_active', 1)], name='is_active_index'),
            pymongo.IndexModel([('workflows', 1)], name='workflows_index'),
            pymongo.IndexModel(
                [('encryption_settings.users.id', 1)],
                name='encryption_users_index',
            ),
        ]

    name: str = Indexed(str)
    slug: str = Indexed(str, unique=True)
    slug_history: Annotated[list[str], Field(default_factory=list)]
    description: str | None = None
    ai_description: str | None = None
    is_active: bool = True
    custom_fields: Annotated[list[Link['CustomField']], Field(default_factory=list)]
    workflows: Annotated[list[Link['Workflow']], Field(default_factory=list)]
    permissions: Annotated[list[ProjectPermission], Field(default_factory=list)]
    issue_counter: int = 0
    subscribers: Annotated[list[PydanticObjectId], Field(default_factory=list)]
    card_fields: Annotated[list[PydanticObjectId], Field(default_factory=list)]
    avatar_type: ProjectAvatarType = ProjectAvatarType.DEFAULT
    encryption_settings: ProjectEncryptionSettings | None = None

    @classmethod
    def search_query(cls, search: str) -> Mapping[str, Any] | bool:
        return bo.Or(
            bo.RegEx(cls.name, search, 'i'),
            bo.RegEx(cls.slug, search, 'i'),
        )

    async def get_new_issue_alias(self) -> str:
        await self.update(
            {'$inc': {'issue_counter': 1}},
            ignore_revision=True,
            skip_actions=[Update],
        )
        return f'{self.slug}-{self.issue_counter}'

    def get_user_permissions(
        self,
        user: User,
        all_group_ids: set[PydanticObjectId] | None = None,
    ) -> set[Permissions]:
        results = set()
        if all_group_ids is None:
            all_group_ids = {gr.id for gr in user.groups}
        for perm in self.permissions:
            if (
                perm.target_type == PermissionTargetType.USER
                and perm.target.id == user.id
            ):
                results.update(perm.role.permissions)
                continue
            if (
                perm.target_type == PermissionTargetType.GROUP
                and perm.target.id in all_group_ids
            ):
                results.update(perm.role.permissions)
        return results

    @classmethod
    async def update_role_embedded_links(
        cls,
        role: Role,
    ) -> None:
        await cls.find(cls.permissions.role.id == role.id).update(
            {'$set': {'permissions.$[p].role': RoleLinkField.from_obj(role)}},
            array_filters=[{'p.role.id': role.id}],
        )

    @classmethod
    async def remove_role_embedded_links(
        cls,
        role_id: PydanticObjectId,
    ) -> None:
        await cls.find(cls.permissions.role.id == role_id).update(
            {'$pull': {'permissions.role.id': role_id}},
        )

    @classmethod
    async def update_group_embedded_links(
        cls,
        group: Group,
    ) -> None:
        await cls.find(
            cls.permissions.target_type == PermissionTargetType.GROUP,
            cls.permissions.target.id == group.id,
        ).update(
            {'$set': {'permissions.$[p].target': GroupLinkField.from_obj(group)}},
            array_filters=[
                {'p.target.id': group.id, 'p.target_type': PermissionTargetType.GROUP},
            ],
        )

    @classmethod
    async def remove_group_embedded_links(
        cls,
        group_id: PydanticObjectId,
    ) -> None:
        await cls.find(
            cls.permissions.target_type == PermissionTargetType.GROUP,
            cls.permissions.target.id == group_id,
        ).update(
            {
                '$pull': {
                    'permissions': {
                        'target_type': PermissionTargetType.GROUP,
                        'target.id': group_id,
                    },
                },
            },
        )

    @classmethod
    async def update_user_embedded_links(
        cls,
        user: User,
    ) -> None:
        await cls.find(
            cls.permissions.target_type == PermissionTargetType.USER,
            cls.permissions.target.id == user.id,
        ).update(
            {'$set': {'permissions.$[p].target': UserLinkField.from_obj(user)}},
            array_filters=[
                {'p.target.id': user.id, 'p.target_type': PermissionTargetType.USER},
            ],
        )
        await cls.find(
            cls.encryption_settings.users.id == user.id,
        ).update(
            {'$set': {'encryption_settings.users.$[u]': UserLinkField.from_obj(user)}},
            array_filters=[{'u.id': user.id}],
        )

    @classmethod
    async def remove_user_embedded_links(
        cls,
        user_id: PydanticObjectId,
    ) -> None:
        await cls.find(
            cls.permissions.target_type == PermissionTargetType.USER,
            cls.permissions.target.id == user_id,
        ).update(
            {
                '$pull': {
                    'permissions': {
                        'target_type': PermissionTargetType.USER,
                        'target.id': user_id,
                    },
                },
            },
        )
        await cls.find(
            cls.encryption_settings.users.id == user_id,
        ).update(
            {
                '$pull': {
                    'encryption_settings.users': {
                        'id': user_id,
                    },
                },
            },
        )

    @classmethod
    async def check_slug_used(
        cls,
        slug: str,
    ) -> bool:
        return bool(
            await cls.find_one(
                bo.Or(
                    cls.slug == slug,
                    cls.slug_history == slug,
                ),
            ),
        )


class ProjectLinkField(BaseModel):
    id: PydanticObjectId
    name: str
    slug: str

    @classmethod
    def from_obj(cls, obj: Project) -> Self:
        return cls(
            id=obj.id,
            name=obj.name,
            slug=obj.slug,
        )

    async def resolve(self, fetch_links: bool = False) -> Project:
        pr = await Project.find_one(Project.id == self.id, fetch_links=fetch_links)
        if not pr:
            raise ValueError(f'Project {self.id} not found')
        return pr
