from enum import StrEnum
from typing import TYPE_CHECKING, Annotated, Any, ClassVar
from uuid import UUID, uuid4

import pymongo
from beanie import Document, Indexed, PydanticObjectId
from pydantic import BaseModel, Field

from ._audit import audited_model
from .group import Group, GroupLinkField
from .permission import (
    PermissionRecord,
    PermissionRecordMixin,
    PermissionTargetType,
    PermissionType,
    _check_permissions,
    _filter_permissions,
)
from .report import ReportLinkField
from .user import UserLinkField

if TYPE_CHECKING:
    from pm.api.context import UserContext

    from .user import User

__all__ = ('Dashboard', 'IssueListTile', 'ReportTile', 'Tile', 'TileTypeT')


class TileTypeT(StrEnum):
    ISSUE_LIST = 'issue_list'
    REPORT = 'report'


class Tile(BaseModel):
    id: Annotated[
        UUID, Field(default_factory=uuid4, description='Unique tile identifier')
    ]
    type: TileTypeT
    name: str = Field(description='Display name of the tile')
    ui_settings: Annotated[
        dict,
        Field(default_factory=dict, description='UI-specific settings for the tile'),
    ]


class IssueListTile(Tile):
    type: TileTypeT = TileTypeT.ISSUE_LIST
    query: str = Field(description='Issue query to filter issues for this tile')


class ReportTile(Tile):
    type: TileTypeT = TileTypeT.REPORT
    report: ReportLinkField = Field(description='Report to display in this tile')


@audited_model
class Dashboard(Document, PermissionRecordMixin):
    class Settings:
        name = 'dashboards'
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
            pymongo.IndexModel([('created_by.id', 1)], name='created_by_id_index'),
        ]

    name: str = Indexed(str, description='Dashboard name')
    description: str | None = Field(default=None, description='Dashboard description')
    tiles: Annotated[
        list[IssueListTile | ReportTile],
        Field(default_factory=list, description='List of tiles in this dashboard'),
    ]
    ui_settings: Annotated[
        dict,
        Field(
            default_factory=dict, description='UI-specific settings for the dashboard'
        ),
    ]
    created_by: UserLinkField = Field(description='Dashboard creator')

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
    def get_filter_query(user_ctx: 'UserContext') -> dict[str, Any]:
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
    async def update_user_embedded_links(
        cls,
        user: 'User',
    ) -> None:
        # Update user permissions
        await cls.find(
            cls.permissions.target_type == PermissionTargetType.USER,
            cls.permissions.target.id == user.id,
        ).update(
            {'$set': {'permissions.$[p].target': UserLinkField.from_obj(user)}},
            array_filters=[
                {
                    'p.target.id': user.id,
                    'p.target_type': PermissionTargetType.USER.value,
                },
            ],
        )

        # Update created_by field
        await cls.find(
            cls.created_by.id == user.id,  # pylint: disable=no-member
        ).update(
            {'$set': {'created_by': UserLinkField.from_obj(user)}},
        )

    @classmethod
    async def remove_user_embedded_links(
        cls,
        user_id: PydanticObjectId,
    ) -> None:
        # Remove user permissions
        await cls.find(
            cls.permissions.target_type == PermissionTargetType.USER,
            cls.permissions.target.id == user_id,
        ).update(
            {
                '$pull': {
                    'permissions': {
                        'target_type': PermissionTargetType.USER.value,
                        'target.id': user_id,
                    },
                },
            },
        )
