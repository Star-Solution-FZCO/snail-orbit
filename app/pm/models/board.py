from typing import Annotated

from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field

from ._audit import audited_model
from .custom_fields import CustomField, CustomFieldLink, CustomFieldValueT
from .group import GroupLinkField
from .permission import (
    PermissionRecord,
    PermissionType,
    _check_permissions,
    _filter_permissions,
)
from .project import PermissionTargetType, ProjectLinkField
from .user import User, UserLinkField

__all__ = ('Board',)


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
    permissions: Annotated[list[PermissionRecord], Field(default_factory=list)]

    def has_permission_for_target(self, target: GroupLinkField | UserLinkField) -> bool:
        return any(p.target.id == target.id for p in self.permissions)

    def has_any_other_admin_target(
        self, target: UserLinkField | GroupLinkField
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

    def filter_permissions(self, user: User) -> list[PermissionRecord]:
        return _filter_permissions(self, user)

    @staticmethod
    def get_filter_query(user: User) -> dict:
        permission_type = {'$in': [l.value for l in PermissionType]}
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
        self, user: User, required_permission: PermissionType
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
