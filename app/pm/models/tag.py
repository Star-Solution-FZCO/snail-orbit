from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, ClassVar, Self

import beanie.operators as bo
import pymongo
from beanie import Document, Indexed, PydanticObjectId
from pydantic import BaseModel

from ._audit import audited_model
from .permission import (
    PermissionRecord,
    PermissionRecordMixin,
    PermissionTargetType,
    PermissionType,
    _check_permissions,
    _filter_permissions,
)
from .user import User, UserLinkField

if TYPE_CHECKING:
    from pm.api.context import UserContext

    from .group import GroupLinkField

__all__ = (
    'Tag',
    'TagLinkField',
)


class TagLinkField(BaseModel):
    id: PydanticObjectId
    name: str
    color: str | None

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, TagLinkField):
            return False
        return self.id == other.id

    @classmethod
    def from_obj(cls, obj: 'Tag | Self') -> Self:
        if isinstance(obj, cls):
            return obj
        return cls(
            id=obj.id,
            name=obj.name,
            color=obj.color,
        )

    async def resolve(self) -> 'Tag':
        obj = await Tag.find_one(Tag.id == self.id)
        if obj is None:
            raise ValueError(f'Tag not found: {self.id}')
        return obj


@audited_model
class Tag(Document, PermissionRecordMixin):
    class Settings:
        name = 'tags'
        use_revision = True
        use_state_management = True
        state_management_save_previous = True
        indexes: ClassVar = [
            pymongo.IndexModel([('created_by.id', 1)], name='created_by_id_index'),
            pymongo.IndexModel(
                [
                    ('permissions.target_type', 1),
                    ('permissions.target.id', 1),
                    ('permissions.permission_type', 1),
                ],
                name='permissions_compound_index',
            ),
            pymongo.IndexModel([('color', 1)], name='color_index'),
            pymongo.IndexModel(
                [('untag_on_resolve', 1)],
                name='untag_on_resolve_index',
            ),
            pymongo.IndexModel([('untag_on_close', 1)], name='untag_on_close_index'),
        ]

    name: str = Indexed(str)
    description: str | None = None
    ai_description: str | None = None
    color: str | None = None
    untag_on_resolve: bool = False
    untag_on_close: bool = False
    created_by: UserLinkField

    @classmethod
    def search_query(cls, search: str) -> Mapping[str, Any] | bool:
        return bo.RegEx(cls.name, search, 'i')

    def has_permission_for_target(
        self, target: 'GroupLinkField | UserLinkField'
    ) -> bool:
        return any(p.target.id == target.id for p in self.permissions)

    def has_any_other_admin_target(
        self, target: 'UserLinkField | GroupLinkField'
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

    @classmethod
    async def update_user_embedded_links(
        cls,
        user: User | UserLinkField,
    ) -> None:
        if isinstance(user, User):
            user = UserLinkField.from_obj(user)
        await cls.find(cls.created_by.id == user.id).update(
            {'$set': {'created_by': user}},
        )
