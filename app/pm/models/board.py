from enum import StrEnum
from typing import Annotated
from uuid import UUID, uuid4

from beanie import Document, Indexed, PydanticObjectId
from pydantic import BaseModel, Field

from ._audit import audited_model
from .custom_fields import CustomField, CustomFieldLink, CustomFieldValueT
from .group import GroupLinkField
from .project import PermissionTargetType, ProjectLinkField
from .user import User, UserLinkField

__all__ = ('Board', 'BoardPermission', 'BoardPermissionType')


permission_levels = {'view': 1, 'edit': 2, 'admin': 3}


def _check_permissions(
    permissions: list,
    user: User,
    required_permission,
) -> bool:
    group_ids = {gr.id for gr in user.groups}
    max_level_value = 0
    for perm in permissions:
        if (
            perm.target_type == PermissionTargetType.USER and perm.target.id == user.id
        ) or (
            perm.target_type == PermissionTargetType.GROUP
            and perm.target.id in group_ids
        ):
            current_value = permission_levels.get(required_permission.value, 0)
            max_level_value = max(max_level_value, current_value)
    if max_level_value == 0:
        return False
    required_value = permission_levels.get(required_permission.value, 0)
    return max_level_value >= required_value


class PermissionTypes(StrEnum):
    VIEW = 'view'
    EDIT = 'edit'
    ADMIN = 'admin'


class BoardPermissionType(StrEnum):
    VIEW = PermissionTypes.VIEW.value
    EDIT = PermissionTypes.EDIT.value
    ADMIN = PermissionTypes.ADMIN.value


class PermissionRecord(BaseModel):
    id: Annotated[UUID, Field(default_factory=uuid4)]
    target_type: PermissionTargetType
    target: GroupLinkField | UserLinkField


class BoardPermission(PermissionRecord):
    permission_type: BoardPermissionType


@audited_model
class Board(Document):
    class Settings:
        name = 'boards'
        use_revision = True
        use_state_management = True
        state_management_save_previous = True

    name: str = Indexed(str)
    description: str | None = None
    query: str | None = None
    projects: Annotated[list[ProjectLinkField], Field(default_factory=list)]
    column_field: CustomFieldLink
    columns: Annotated[list[CustomFieldValueT], Field(default_factory=list)]
    swimlane_field: CustomFieldLink | None = None
    swimlanes: Annotated[list[CustomFieldValueT], Field(default_factory=list)]
    issues_order: Annotated[list[PydanticObjectId], Field(default_factory=list)]
    card_fields: Annotated[list[CustomFieldLink], Field(default_factory=list)]
    card_colors_fields: Annotated[list[CustomFieldLink], Field(default_factory=list)]
    ui_settings: dict = Field(default_factory=dict)
    created_by: UserLinkField
    permissions: Annotated[list[BoardPermission], Field(default_factory=list)]

    def has_permission_for_target(self, target: GroupLinkField | UserLinkField) -> bool:
        return any(p.target.id == target.id for p in self.permissions)

    def has_any_other_admin_target(
        self, target: UserLinkField | GroupLinkField
    ) -> bool:
        return (
            sum(
                1
                for p in self.permissions
                if p.permission_type == BoardPermissionType.ADMIN
                and p.target.id != target.id
            )
            > 0
        )

    @staticmethod
    def get_filter_query(user: User) -> dict:
        permission_type = {'$in': [l.value for l in BoardPermissionType]}
        return {
            '$or': [
                {
                    'permissions': {
                        '$elemMatch': {
                            'target_type': PermissionTargetType.USER,
                            'target.id': user.id,
                            'permission_type': permission_type,
                        }
                    }
                },
                {
                    'permissions': {
                        '$elemMatch': {
                            'target_type': PermissionTargetType.GROUP,
                            'target.id': {'$in': [g.id for g in user.groups]},
                            'permission_type': permission_type,
                        }
                    }
                },
            ]
        }

    def check_permissions(
        self, user: User, required_permission: BoardPermissionType
    ) -> bool:
        return _check_permissions(
            permissions=self.permissions,
            user=user,
            required_permission=required_permission,
        )

    def move_issue(
        self, issue_id: PydanticObjectId, after_id: PydanticObjectId | None = None
    ) -> None:
        try:
            self.issues_order.remove(issue_id)
        except ValueError:
            pass
        new_idx = 0
        if after_id:
            try:
                new_idx = self.issues_order.index(after_id) + 1
            except ValueError:
                self.issues_order.append(after_id)
                self.issues_order.append(issue_id)
                return
        self.issues_order.insert(new_idx, issue_id)

    @classmethod
    async def update_field_embedded_links(
        cls, field: CustomField | CustomFieldLink
    ) -> None:
        if isinstance(field, CustomField):
            field = CustomFieldLink.from_obj(field)
        await cls.find(cls.column_field.id == field.id).update(
            {'$set': {'column_field': field}}
        )
        await cls.find(cls.swimlane_field.id == field.id).update(
            {'$set': {'swimlane_field': field}}
        )
        await cls.find(cls.card_fields.id == field.id).update(
            {'$set': {'card_fields.$[f]': field}},
            array_filters=[{'f.id': field.id}],
        )
        await cls.find(cls.card_colors_fields.id == field.id).update(
            {'$set': {'card_colors_fields.$[f]': field}},
            array_filters=[{'f.id': field.id}],
        )
