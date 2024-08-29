from datetime import date, datetime
from enum import StrEnum
from typing import Any
from uuid import UUID

from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Field

from ._audit import audited_model
from .group import Group, GroupLinkField
from .user import User, UserLinkField

__all__ = (
    'CustomFieldTypeT',
    'CustomField',
    'EnumOption',
    'StringCustomField',
    'IntegerCustomField',
    'FloatCustomField',
    'BooleanCustomField',
    'DateCustomField',
    'DateTimeCustomField',
    'UserCustomField',
    'UserMultiCustomField',
    'EnumCustomField',
    'EnumMultiCustomField',
    'CustomFieldValue',
    'CustomFieldValidationError',
    'UserOptionType',
    'UserOption',
    'GroupOption',
    'StateOption',
    'StateCustomField',
    'StateField',
)


class CustomFieldTypeT(StrEnum):
    STRING = 'string'
    INTEGER = 'integer'
    FLOAT = 'float'
    BOOLEAN = 'boolean'
    DATE = 'date'
    DATETIME = 'datetime'
    USER = 'user'
    USER_MULTI = 'user_multi'
    ENUM = 'enum'
    ENUM_MULTI = 'enum_multi'
    STATE = 'state'

    def get_field_class(self) -> type['CustomField']:
        return MAPPING[self]


class EnumOption(BaseModel):
    value: str
    color: str | None = None


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


class StateField(BaseModel):
    state: str
    is_resolved: bool = False
    is_closed: bool = False


class StateOption(BaseModel):
    id: UUID
    value: StateField
    color: str | None = None


class CustomFieldValidationError(ValueError):
    field: 'CustomField'
    value: Any

    def __init__(self, field: 'CustomField', value: Any, msg: str):
        super().__init__(msg)
        self.field = field
        self.value = value

    @property
    def msg(self) -> str:
        return self.args[0]


@audited_model
class CustomField(Document):
    class Settings:
        name = 'custom_fields'
        use_revision = True
        use_state_management = True
        state_management_save_previous = True
        is_root = True

    name: str
    type: CustomFieldTypeT
    is_nullable: bool

    def validate_value(self, value: Any) -> Any:
        if value is None and not self.is_nullable:
            raise CustomFieldValidationError(
                field=self, value=value, msg='cannot be None'
            )
        return value


class StringCustomField(CustomField):
    type: CustomFieldTypeT = CustomFieldTypeT.STRING

    def validate_value(self, value: Any) -> Any:
        value = super().validate_value(value)
        if value is not None and not isinstance(value, str):
            raise CustomFieldValidationError(
                field=self, value=value, msg='must be a string'
            )
        return value


class IntegerCustomField(CustomField):
    type: CustomFieldTypeT = CustomFieldTypeT.INTEGER

    def validate_value(self, value: Any) -> Any:
        value = super().validate_value(value)
        if value is not None and not isinstance(value, int):
            raise CustomFieldValidationError(
                field=self, value=value, msg='must be an integer'
            )
        return value


class FloatCustomField(CustomField):
    type: CustomFieldTypeT = CustomFieldTypeT.FLOAT

    def validate_value(self, value: Any) -> Any:
        value = super().validate_value(value)
        if value is not None and not isinstance(value, float):
            raise CustomFieldValidationError(
                field=self, value=value, msg='must be a float'
            )
        return value


class BooleanCustomField(CustomField):
    type: CustomFieldTypeT = CustomFieldTypeT.BOOLEAN

    def validate_value(self, value: Any) -> Any:
        value = super().validate_value(value)
        if value is not None and not isinstance(value, bool):
            raise CustomFieldValidationError(
                field=self, value=value, msg='must be a boolean'
            )
        return value


class DateCustomField(CustomField):
    type: CustomFieldTypeT = CustomFieldTypeT.DATE

    def validate_value(self, value: Any) -> Any:
        value = super().validate_value(value)
        if value is None:
            return value
        if isinstance(value, date):
            return value
        if isinstance(value, str):
            try:
                return datetime.strptime(value, '%Y-%m-%d').date()
            except ValueError as err:
                raise CustomFieldValidationError(
                    field=self, value=value, msg='must be a date in ISO format'
                ) from err
        raise CustomFieldValidationError(
            field=self, value=value, msg='must be a date in ISO format'
        )


class DateTimeCustomField(CustomField):
    type: CustomFieldTypeT = CustomFieldTypeT.DATETIME

    def validate_value(self, value: Any) -> Any:
        value = super().validate_value(value)
        if value is None:
            return value
        if isinstance(value, datetime):
            return value
        if isinstance(value, str):
            try:
                return datetime.fromisoformat(value)
            except ValueError as err:
                raise CustomFieldValidationError(
                    field=self, value=value, msg='must be a datetime in ISO format'
                ) from err
        raise CustomFieldValidationError(
            field=self, value=value, msg='must be a datetime in ISO format'
        )


class UserCustomFieldMixin:
    options: list[UserOption] = Field(default_factory=list)

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
                {'o.value.users.id': user.id, 'o.type': UserOptionType.USER},
                {'u.id': user.id},
            ],
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
                {'o.value.group.id': group.id, 'o.type': UserOptionType.GROUP}
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
                    }
                }
            },
        )

    @classmethod
    async def update_user_group_membership(cls, user: User, group: Group) -> None:
        if any(gr.id == group.id for gr in user.groups):
            await cls.find(
                cls.options.type == UserOptionType.GROUP,
                cls.options.value.group.id == group.id,
            ).update(
                {'$push': {'options.$[o].value.users': [UserLinkField.from_obj(user)]}},
                array_filters=[
                    {'o.value.group.id': group.id, 'o.type': UserOptionType.GROUP}
                ],
            )
            return
        await cls.find(
            cls.options.type == UserOptionType.GROUP,
            cls.options.value.group.id == group.id,
        ).update(
            {'$pull': {'options.$[o].value.users.$[u]': UserLinkField.from_obj(user)}},
            array_filters=[
                {'o.value.users.id': user.id, 'o.type': UserOptionType.USER},
                {'u.id': user.id},
            ],
        )


class UserCustomField(CustomField, UserCustomFieldMixin):
    type: CustomFieldTypeT = CustomFieldTypeT.USER

    def validate_value(self, value: Any) -> Any:
        value = super().validate_value(value)
        try:
            value = PydanticObjectId(value)
        except ValueError as err:
            raise CustomFieldValidationError(
                field=self, value=value, msg='must be a valid ObjectId'
            ) from err
        users = {u.id: u for opt in self.options for u in opt.users}
        if value not in users:
            raise CustomFieldValidationError(
                field=self, value=value, msg='user not found in options'
            )
        return users[value]


class UserMultiCustomField(CustomField, UserCustomFieldMixin):
    type: CustomFieldTypeT = CustomFieldTypeT.USER_MULTI

    def validate_value(self, value: Any) -> Any:
        value = super().validate_value(value)
        if value is None:
            return value
        if not isinstance(value, list):
            raise CustomFieldValidationError(
                field=self, value=value, msg='must be a list'
            )
        if not self.is_nullable and not value:
            raise CustomFieldValidationError(
                field=self, value=value, msg='cannot be empty'
            )
        users = {u.id: u for opt in self.options for u in opt.users}
        results = []
        for val in value:
            try:
                val = PydanticObjectId(val)
            except ValueError as err:
                raise CustomFieldValidationError(
                    field=self, value=value, msg='must be a valid ObjectId'
                ) from err
            if val not in users:
                raise CustomFieldValidationError(
                    field=self, value=value, msg=f'user {val} not found'
                )
            results.append(users[val])
        return results


class EnumCustomField(CustomField):
    type: CustomFieldTypeT = CustomFieldTypeT.ENUM
    options: dict[UUID, EnumOption] = Field(default_factory=dict)

    def validate_value(self, value: Any) -> Any:
        value = super().validate_value(value)
        if value is None:
            return value
        if value not in {opt.value for opt in self.options.values()}:
            raise CustomFieldValidationError(
                field=self, value=value, msg='option not found'
            )
        return value


class EnumMultiCustomField(CustomField):
    type: CustomFieldTypeT = CustomFieldTypeT.ENUM_MULTI
    options: dict[UUID, EnumOption] = Field(default_factory=dict)

    def validate_value(self, value: Any) -> Any:
        value = super().validate_value(value)
        if value is None:
            return value
        if not isinstance(value, list):
            raise CustomFieldValidationError(
                field=self, value=value, msg='must be a list'
            )
        if not self.is_nullable and not value:
            raise CustomFieldValidationError(
                field=self, value=value, msg='cannot be empty'
            )
        allowed_values = {opt.value for opt in self.options.values()}
        for val in value:
            if val not in allowed_values:
                raise CustomFieldValidationError(
                    field=self, value=value, msg=f'option {val} not found'
                )
        return value


class StateCustomField(CustomField):
    type: CustomFieldTypeT = CustomFieldTypeT.STATE
    options: list[StateOption] = Field(default_factory=list)

    def validate_value(self, value: Any) -> Any:
        value = super().validate_value(value)
        if value is None:
            return value
        opts = {opt.value.state: opt.value for opt in self.options}
        if value not in opts:
            raise CustomFieldValidationError(
                field=self, value=value, msg='option not found'
            )
        return opts[value]


MAPPING = {
    CustomFieldTypeT.STRING: StringCustomField,
    CustomFieldTypeT.INTEGER: IntegerCustomField,
    CustomFieldTypeT.FLOAT: FloatCustomField,
    CustomFieldTypeT.BOOLEAN: BooleanCustomField,
    CustomFieldTypeT.DATE: DateCustomField,
    CustomFieldTypeT.DATETIME: DateTimeCustomField,
    CustomFieldTypeT.USER: UserCustomField,
    CustomFieldTypeT.USER_MULTI: UserMultiCustomField,
    CustomFieldTypeT.ENUM: EnumCustomField,
    CustomFieldTypeT.ENUM_MULTI: EnumMultiCustomField,
    CustomFieldTypeT.STATE: StateCustomField,
}


class CustomFieldValue(BaseModel):
    id: PydanticObjectId
    type: CustomFieldTypeT
    # these shenanigans are needed for pydantic serialization with user fields, should replace with a custom serializer
    value: UserLinkField | list[UserLinkField] | StateField | Any
