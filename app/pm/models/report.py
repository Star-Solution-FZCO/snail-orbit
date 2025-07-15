from collections.abc import Mapping
from enum import StrEnum
from itertools import chain
from typing import TYPE_CHECKING, Annotated, Any, ClassVar

import beanie.operators as bo
import pymongo
from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field

from ._audit import audited_model
from .custom_fields import CustomField, CustomFieldGroupLink
from .group import Group, GroupLinkField
from .permission import (
    PermissionRecord,
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
    'IssuesPerFieldReport',
    'IssuesPerProjectReport',
    'IssuesPerTwoFieldsReport',
    'Report',
    'ReportType',
    'get_report_class',
)


class ReportType(StrEnum):
    ISSUES_PER_PROJECT = 'issues_per_project'
    ISSUES_PER_FIELD = 'issues_per_field'
    ISSUES_PER_TWO_FIELDS = 'issues_per_two_fields'


@audited_model
class Report(Document):
    class Settings:
        name = 'reports'
        use_revision = True
        use_state_management = True
        state_management_save_previous = True
        is_root = True
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
            pymongo.IndexModel([('type', 1)], name='type_index'),
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
    type: ReportType = Field(description='Type of report')
    created_by: UserLinkField = Field(description='User who created the report')
    permissions: Annotated[
        list[PermissionRecord],
        Field(
            default_factory=list,
            description='List of permissions for accessing this report',
        ),
    ]
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
        user_groups = [
            g.id for g in chain(user_ctx.user.groups, user_ctx.predefined_groups)
        ]
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
        pass


class IssuesPerProjectReport(Report):
    type: ReportType = ReportType.ISSUES_PER_PROJECT


class IssuesPerFieldReport(Report):
    type: ReportType = ReportType.ISSUES_PER_FIELD
    field: CustomFieldGroupLink

    @classmethod
    async def update_field_embedded_links(
        cls,
        field: CustomField | CustomFieldGroupLink,
    ) -> None:
        """Update embedded custom field links in IssuesPerFieldReport."""
        field_link = CustomFieldGroupLink.from_obj(field)
        await cls.find(cls.field.gid == field_link.gid).update(
            {'$set': {'field': field_link}},
        )


class IssuesPerTwoFieldsReport(Report):
    type: ReportType = ReportType.ISSUES_PER_TWO_FIELDS
    row_field: CustomFieldGroupLink
    column_field: CustomFieldGroupLink

    @classmethod
    async def update_field_embedded_links(
        cls,
        field: CustomField | CustomFieldGroupLink,
    ) -> None:
        """Update embedded custom field links in IssuesPerTwoFieldsReport."""
        field_link = CustomFieldGroupLink.from_obj(field)

        # Update row_field
        await cls.find(cls.row_field.gid == field_link.gid).update(
            {'$set': {'row_field': field_link}},
        )

        # Update column_field
        await cls.find(cls.column_field.gid == field_link.gid).update(
            {'$set': {'column_field': field_link}},
        )


REPORT_TYPE_MAPPING = {
    ReportType.ISSUES_PER_PROJECT: IssuesPerProjectReport,
    ReportType.ISSUES_PER_FIELD: IssuesPerFieldReport,
    ReportType.ISSUES_PER_TWO_FIELDS: IssuesPerTwoFieldsReport,
}


def get_report_class(report_type: ReportType) -> type[Report]:
    """Get the specific report class for a given report type."""
    return REPORT_TYPE_MAPPING[report_type]


def rebuild_models() -> None:
    """Rebuild all report models."""
    Report.model_rebuild()
    for report_class in REPORT_TYPE_MAPPING.values():
        report_class.model_rebuild()
