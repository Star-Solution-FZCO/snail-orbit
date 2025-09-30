from collections.abc import Mapping
from enum import StrEnum
from typing import TYPE_CHECKING, Annotated, Any, ClassVar

import beanie.operators as bo
import pymongo
from beanie import Document, Indexed, PydanticObjectId
from pydantic import BaseModel, Field, model_validator

from ._audit import audited_model
from .custom_fields import CustomField, CustomFieldGroupLink
from .group import Group, GroupLinkField
from .permission import (
    PermissionRecord,
    PermissionRecordMixin,
    PermissionTargetType,
    PermissionType,
    _check_permissions,
    _filter_permissions,
)
from .project import Project, ProjectLinkField
from .user import UserLinkField

if TYPE_CHECKING:
    from pm.api.context import UserContext

__all__ = (
    'Axis',
    'AxisType',
    'Report',
    'ReportLinkField',
)


class AxisType(StrEnum):
    PROJECT = 'project'
    CUSTOM_FIELD = 'custom_field'


class Axis(BaseModel):
    type: AxisType = Field(description='Type of axis (project or custom field)')
    custom_field: CustomFieldGroupLink | None = Field(
        default=None,
        description='Custom field for the axis (only when type is CUSTOM_FIELD)',
    )

    @model_validator(mode='after')
    def validate_axis(self) -> 'Axis':
        if self.type == AxisType.CUSTOM_FIELD and not self.custom_field:
            raise ValueError('custom_field must be provided for custom field axis')
        if self.type == AxisType.PROJECT and self.custom_field:
            raise ValueError('custom_field must be None for project axis')
        return self


class ReportLinkField(BaseModel):
    id: PydanticObjectId
    name: str
    description: str | None

    @classmethod
    def from_obj(cls, obj: 'Report') -> 'ReportLinkField':
        return cls(
            id=obj.id,
            name=obj.name,
            description=obj.description,
        )

    async def resolve(self, fetch_links: bool = False) -> 'Report':
        report = await Report.find_one(Report.id == self.id, fetch_links=fetch_links)
        if not report:
            raise ValueError(f'Report {self.name} not found')
        return report


@audited_model
class Report(Document, PermissionRecordMixin):
    class Settings:
        name = 'reports'
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
            pymongo.IndexModel([('created_by.id', 1)], name='created_by_id_index'),
        ]

    name: str = Indexed(str)
    description: str | None = Field(
        default=None, description='Optional report description'
    )
    query: str | None = Field(
        default=None, description='Optional query filter for the report'
    )
    projects: Annotated[
        list[ProjectLinkField],
        Field(
            default_factory=list, description='List of projects this report applies to'
        ),
    ]
    axis_1: Axis = Field(description='Primary axis for the report')
    axis_2: Axis | None = Field(
        default=None, description='Secondary axis for the report (optional)'
    )
    ui_settings: Annotated[
        dict,
        Field(default_factory=dict, description='UI-specific settings for the report'),
    ]
    created_by: UserLinkField = Field(description='User who created the report')
    favorite_of: Annotated[
        list[PydanticObjectId],
        Field(
            default_factory=list,
            description='List of user IDs who have favorited this report',
        ),
    ]

    @classmethod
    def search_query(cls, search: str) -> Mapping[str, Any] | bool:
        return bo.RegEx(cls.name, search, 'i')

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

    def check_permissions(
        self, user_ctx: 'UserContext', required_permission: PermissionType
    ) -> bool:
        return _check_permissions(
            permissions=self.permissions,
            user_ctx=user_ctx,
            required_permission=required_permission,
        )

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

    def is_favorite_of(self, user_id: PydanticObjectId) -> bool:
        return user_id in self.favorite_of

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

    @classmethod
    async def update_field_embedded_links(
        cls,
        field: CustomField | CustomFieldGroupLink,
    ) -> None:
        """Update embedded custom field references in report axes."""
        field_link = CustomFieldGroupLink.from_obj(field)

        # Update axis_1 references
        await cls.find(
            cls.axis_1.type == AxisType.CUSTOM_FIELD,  # pylint: disable=no-member
            cls.axis_1.custom_field.gid == field_link.gid,  # pylint: disable=no-member
        ).update(
            {'$set': {'axis_1.custom_field': field_link}},
        )

        # Update axis_2 references
        await cls.find(
            cls.axis_2.type == AxisType.CUSTOM_FIELD,  # pylint: disable=no-member
            cls.axis_2.custom_field.gid == field_link.gid,  # pylint: disable=no-member
        ).update(
            {'$set': {'axis_2.custom_field': field_link}},
        )
