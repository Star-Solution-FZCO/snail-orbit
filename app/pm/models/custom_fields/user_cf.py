from enum import StrEnum
from typing import Annotated, Any
from uuid import UUID

from beanie import PydanticObjectId
from pydantic import BaseModel, Field

from pm.models.group import Group, GroupLinkField, PredefinedGroupScope
from pm.models.user import User, UserLinkField

from ._base import CustomField, CustomFieldTypeT, CustomFieldValidationError

__all__ = (
    'GroupOption',
    'UserCustomField',
    'UserMultiCustomField',
    'UserOption',
    'UserOptionType',
)


class UserOptionType(StrEnum):
    USER = 'user'
    GROUP = 'group'


class GroupOption(BaseModel):
    group: GroupLinkField
    users: list[UserLinkField]


class UserOption(BaseModel):
    id: UUID
    type: UserOptionType
    value: UserLinkField | GroupOption

    @property
    def users(self) -> list[UserLinkField]:
        if self.type == UserOptionType.USER:
            return [self.value]
        return self.value.users


class UserCustomFieldMixin:
    options: Annotated[list[UserOption], Field(default_factory=list)]

    @property
    def users(self) -> set[UserLinkField]:
        return {u for opt in self.options for u in opt.users}

    @classmethod
    async def update_user_embedded_links(
        cls,
        user: User,
    ) -> None:
        await cls.find(
            cls.options.type == UserOptionType.USER,
            cls.options.value.id == user.id,
        ).update(
            {'$set': {'options.$[o].value': UserLinkField.from_obj(user)}},
            array_filters=[{'o.value.id': user.id}],
        )
        await cls.find(
            cls.options.type == UserOptionType.GROUP,
            cls.options.value.users.id == user.id,
        ).update(
            {'$set': {'options.$[o].value.users.$[u]': UserLinkField.from_obj(user)}},
            array_filters=[
                {'o.value.users.id': user.id, 'o.type': UserOptionType.GROUP},
                {'u.id': user.id},
            ],
        )
        await cls.find(
            {'default_value.id': user.id},
        ).update(
            {'$set': {'default_value': UserLinkField.from_obj(user)}},
        )

    @classmethod
    async def update_group_embedded_links(
        cls,
        group: Group,
    ) -> None:
        await cls.find(
            cls.options.type == UserOptionType.GROUP,
            cls.options.value.group.id == group.id,
        ).update(
            {'$set': {'options.$[o].value.group': GroupLinkField.from_obj(group)}},
            array_filters=[
                {'o.value.group.id': group.id, 'o.type': UserOptionType.GROUP},
            ],
        )

    @classmethod
    async def remove_group_embedded_links(
        cls,
        group_id: PydanticObjectId,
    ) -> None:
        await cls.find(
            cls.options.type == UserOptionType.GROUP,
            cls.options.value.group.id == group_id,
        ).update(
            {
                '$pull': {
                    'options': {
                        'value.group.id': group_id,
                        'type': UserOptionType.GROUP,
                    },
                },
            },
        )

    @classmethod
    async def update_user_group_membership(cls, user: User, group: Group) -> None:
        if any(gr.id == group.id for gr in user.groups):
            await cls.find(
                cls.options.type == UserOptionType.GROUP,
                cls.options.value.group.id == group.id,
            ).update(
                {'$push': {'options.$[o].value.users': UserLinkField.from_obj(user)}},
                array_filters=[
                    {'o.value.group.id': group.id, 'o.type': UserOptionType.GROUP},
                ],
            )
            return
        await cls.find(
            cls.options.type == UserOptionType.GROUP,
            cls.options.value.group.id == group.id,
        ).update(
            {'$pull': {'options.$[o].value.users': {'id': user.id}}},
            array_filters=[
                {'o.value.users.id': user.id, 'o.type': UserOptionType.GROUP},
            ],
        )

    @classmethod
    async def add_option_predefined_scope(cls, user: User) -> None:
        await cls.find(
            {
                'options': {
                    '$elemMatch': {
                        'type': UserOptionType.GROUP,
                        'value.group.predefined_scope': PredefinedGroupScope.ALL_USERS,
                        'value.users.id': {'$ne': user.id},
                    },
                },
            },
        ).update(
            {'$push': {'options.$[o].value.users': UserLinkField.from_obj(user)}},
            array_filters=[
                {
                    'o.value.group.predefined_scope': PredefinedGroupScope.ALL_USERS,
                    'o.type': UserOptionType.GROUP,
                },
            ],
        )


class UserCustomField(CustomField, UserCustomFieldMixin):
    type: CustomFieldTypeT = CustomFieldTypeT.USER
    default_value: UserLinkField | None = None

    def validate_value(self, value: Any) -> Any:
        value = super().validate_value(value)
        if value is None:
            return value
        if isinstance(value, UserLinkField):
            value = value.id
        try:
            value = PydanticObjectId(value)
        except ValueError as err:
            raise CustomFieldValidationError(
                field=self,
                value=value,
                msg='must be a valid ObjectId',
            ) from err
        users = {u.id: u for opt in self.options for u in opt.users}
        if value not in users:
            raise CustomFieldValidationError(
                field=self,
                value=value,
                msg='user not found in options',
            )
        return users[value]


class UserMultiCustomField(CustomField, UserCustomFieldMixin):
    type: CustomFieldTypeT = CustomFieldTypeT.USER_MULTI
    default_value: list[UserLinkField] | None = None

    def validate_value(self, value: Any) -> Any:
        value = super().validate_value(value)
        if value is None:
            return value
        if not isinstance(value, list):
            raise CustomFieldValidationError(
                field=self,
                value=value,
                msg='must be a list',
            )
        if not self.is_nullable and not value:
            raise CustomFieldValidationError(
                field=self,
                value=value,
                msg='cannot be empty',
            )
        users = {u.id: u for opt in self.options for u in opt.users}
        results = []
        for val in value:
            user_id = val
            if isinstance(user_id, UserLinkField):
                user_id = user_id.id
            try:
                user_id = PydanticObjectId(user_id)
            except ValueError as err:
                raise CustomFieldValidationError(
                    field=self,
                    value=value,
                    msg='must be a valid ObjectId',
                ) from err
            if user_id not in users:
                raise CustomFieldValidationError(
                    field=self,
                    value=value,
                    msg=f'user {user_id} not found',
                )
            results.append(users[user_id])
        return results
