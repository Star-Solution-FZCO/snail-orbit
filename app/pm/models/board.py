from typing import TYPE_CHECKING, Annotated, ClassVar

import pymongo
from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field

from ._audit import audited_model
from .custom_fields import (
    CustomField,
    CustomFieldGroupLink,
    CustomFieldLink,
    CustomFieldValueT,
)
from .group import Group, GroupLinkField
from .permission import (
    PermissionRecord,
    PermissionRecordMixin,
    PermissionType,
    _check_permissions,
    _filter_permissions,
)
from .project import PermissionTargetType, Project, ProjectLinkField
from .user import UserLinkField

if TYPE_CHECKING:
    from pm.api.context import UserContext


__all__ = ('Board',)


@audited_model
class Board(Document, PermissionRecordMixin):
    class Settings:
        name = 'boards'
        use_revision = True
        use_state_management = True
        state_management_save_previous = True
        indexes: ClassVar = [
            pymongo.IndexModel(
                [
                    ('permissions.target_type', 1),
                    ('permissions.target.id', 1),
                    ('permissions.permission_type', 1),
                ],
                name='permissions_compound_index',
            ),
            pymongo.IndexModel([('projects.id', 1)], name='projects_id_index'),
            pymongo.IndexModel([('favorite_of', 1)], name='favorite_of_index'),
            pymongo.IndexModel(
                [('column_field.gid', 1)],
                name='column_field_gid_index',
            ),
            pymongo.IndexModel(
                [('swimlane_field.gid', 1)],
                name='swimlane_field_gid_index',
            ),
            pymongo.IndexModel([('card_fields.gid', 1)], name='card_fields_gid_index'),
            pymongo.IndexModel(
                [('card_colors_fields.gid', 1)],
                name='card_colors_fields_gid_index',
            ),
            pymongo.IndexModel([('issues_order', 1)], name='issues_order_index'),
            pymongo.IndexModel([('created_by.id', 1)], name='created_by_id_index'),
        ]

    name: str = Indexed(str)
    description: str | None = None
    query: str | None = None
    projects: Annotated[list[ProjectLinkField], Field(default_factory=list)]
    column_field: CustomFieldGroupLink
    columns: Annotated[list[CustomFieldValueT], Field(default_factory=list)]
    swimlane_field: CustomFieldGroupLink | None = None
    swimlanes: Annotated[list[CustomFieldValueT], Field(default_factory=list)]
    issues_order: Annotated[
        list[tuple[PydanticObjectId, PydanticObjectId | None]],
        Field(
            default_factory=list,
            description='List of (issue_id, after_issue_id) pairs representing explicit positioning. after_issue_id=None means first position',
        ),
    ]
    card_fields: Annotated[list[CustomFieldGroupLink], Field(default_factory=list)]
    card_colors_fields: Annotated[
        list[CustomFieldGroupLink],
        Field(default_factory=list),
    ]
    ui_settings: Annotated[dict, Field(default_factory=dict)]
    created_by: UserLinkField
    favorite_of: Annotated[list[PydanticObjectId], Field(default_factory=list)]

    def has_permission_for_target(self, target: GroupLinkField | UserLinkField) -> bool:
        return any(p.target.id == target.id for p in self.permissions)

    def has_any_other_admin_target(
        self,
        target: UserLinkField | GroupLinkField,
    ) -> bool:
        return (
            sum(
                1
                for p in self.permissions
                if p.permission_type == PermissionType.ADMIN
                and p.target.id != target.id
            )
            > 0
        )

    def filter_permissions(self, user_ctx: 'UserContext') -> list[PermissionRecord]:
        return _filter_permissions(self, user_ctx)

    @staticmethod
    def get_filter_query(user_ctx: 'UserContext') -> dict:
        permission_type = {'$in': [perm.value for perm in PermissionType]}
        user_groups = list(user_ctx.all_group_ids)
        return {
            '$or': [
                {
                    'permissions': {
                        '$elemMatch': {
                            'target_type': PermissionTargetType.USER,
                            'target.id': user_ctx.user.id,
                            'permission_type': permission_type,
                        },
                    },
                },
                {
                    'permissions': {
                        '$elemMatch': {
                            'target_type': PermissionTargetType.GROUP,
                            'target.id': {'$in': user_groups},
                            'permission_type': permission_type,
                        },
                    },
                },
            ],
        }

    def check_permissions(
        self, user_ctx: 'UserContext', required_permission: PermissionType
    ) -> bool:
        return _check_permissions(
            permissions=self.permissions,
            user_ctx=user_ctx,
            required_permission=required_permission,
        )

    def is_favorite_of(self, user_id: PydanticObjectId) -> bool:
        return user_id in self.favorite_of

    def move_issue(
        self,
        issue_id: PydanticObjectId,
        after_id: PydanticObjectId | None = None,
    ) -> None:
        self.issues_order = [
            (iss_id, after_iss_id)
            for iss_id, after_iss_id in self.issues_order
            if iss_id != issue_id
        ]

        self.issues_order.append((issue_id, after_id))

    @classmethod
    async def update_field_embedded_links(
        cls,
        field: CustomField | CustomFieldLink | CustomFieldGroupLink,
    ) -> None:
        field = CustomFieldGroupLink.from_obj(field)
        await cls.find(cls.column_field.gid == field.gid).update(
            {'$set': {'column_field': field}},
        )
        await cls.find(cls.swimlane_field.gid == field.gid).update(
            {'$set': {'swimlane_field': field}},
        )
        await cls.find(cls.card_fields.gid == field.gid).update(
            {'$set': {'card_fields.$[f]': field}},
            array_filters=[{'f.gid': field.gid}],
        )
        await cls.find(cls.card_colors_fields.gid == field.gid).update(
            {'$set': {'card_colors_fields.$[f]': field}},
            array_filters=[{'f.gid': field.gid}],
        )

    @classmethod
    async def update_group_embedded_links(
        cls,
        group: 'Group',
    ) -> None:
        await cls.find(
            cls.permissions.target_type == PermissionTargetType.GROUP,
            cls.permissions.target.id == group.id,
        ).update(
            {'$set': {'permissions.$[p].target': GroupLinkField.from_obj(group)}},
            array_filters=[
                {
                    'p.target.id': group.id,
                    'p.target_type': PermissionTargetType.GROUP.value,
                },
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
                        'target_type': PermissionTargetType.GROUP.value,
                        'target.id': group_id,
                    },
                },
            },
        )

    @classmethod
    async def update_project_embedded_links(
        cls,
        project: Project,
    ) -> None:
        await cls.find(
            cls.projects.id == project.id,
        ).update(
            {'$set': {'projects.$[p]': ProjectLinkField.from_obj(project)}},
            array_filters=[{'p.id': project.id}],
        )
