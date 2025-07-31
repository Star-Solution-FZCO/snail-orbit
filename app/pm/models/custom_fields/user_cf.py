from enum import StrEnum
from typing import Annotated, Any
from uuid import UUID

from beanie import PydanticObjectId
from pydantic import BaseModel, Field

from pm.models.group import Group, GroupLinkField
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

    async def resolve_users(self) -> list[UserLinkField]:
        """Dynamically resolve group members."""
        group = await Group.find_one(Group.id == self.group.id, with_children=True)
        if not group:
            return []
        return await group.resolve_members()


class UserOption(BaseModel):
    id: UUID
    type: UserOptionType
    value: UserLinkField | GroupOption

    async def resolve_users(self) -> list[UserLinkField]:
        """Resolve users from this option."""
        if self.type == UserOptionType.USER:
            return [self.value]
        return await self.value.resolve_users()


class UserCustomFieldMixin:
    options: Annotated[list[UserOption], Field(default_factory=list)]

    async def resolve_available_users(self) -> set[UserLinkField]:
        """Dynamically resolve all available users from options."""
        all_users = set()
        for option in self.options:
            users = await option.resolve_users()
            all_users.update(users)
        return all_users

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
            {'default_value.id': user.id},
        ).update(
            {'$set': {'default_value': UserLinkField.from_obj(user)}},
        )

    @classmethod
    async def update_group_embedded_links(
        cls,
        group: 'Group',
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


class UserCustomField(CustomField, UserCustomFieldMixin):
    type: CustomFieldTypeT = CustomFieldTypeT.USER
    default_value: UserLinkField | None = None

    async def validate_value(self, value: Any) -> Any:
        value = await super().validate_value(value)
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

        available_users = await self.resolve_available_users()
        users_dict = {u.id: u for u in available_users}

        if value not in users_dict:
            raise CustomFieldValidationError(
                field=self,
                value=value,
                msg='user not found in options',
            )
        return users_dict[value]


class UserMultiCustomField(CustomField, UserCustomFieldMixin):
    type: CustomFieldTypeT = CustomFieldTypeT.USER_MULTI
    default_value: list[UserLinkField] | None = None

    async def validate_value(self, value: Any) -> Any:
        value = await super().validate_value(value)
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

        available_users = await self.resolve_available_users()
        users_dict = {u.id: u for u in available_users}

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
            if user_id not in users_dict:
                raise CustomFieldValidationError(
                    field=self,
                    value=value,
                    msg=f'user {user_id} not found',
                )
            results.append(users_dict[user_id])
        return results
