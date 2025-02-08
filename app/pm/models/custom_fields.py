from collections.abc import Mapping
from datetime import date, datetime
from enum import StrEnum
from typing import Annotated, Any, Self
from uuid import UUID

import beanie.operators as bo
from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Field

from ._audit import audited_model
from .group import Group, GroupLinkField
from .user import User, UserLinkField

__all__ = (
    'CustomFieldTypeT',
    'CustomField',
    'CustomFieldLink',
    'EnumField',
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
    'CustomFieldCanBeNoneError',
    'UserOptionType',
    'UserOption',
    'GroupOption',
    'StateCustomField',
    'StateField',
    'VersionField',
    'VersionCustomField',
    'VersionMultiCustomField',
    'CustomFieldValueT',
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
    VERSION = 'version'
    VERSION_MULTI = 'version_multi'

    def get_field_class(self) -> type['CustomField']:
        return MAPPING[self]


class EnumField(BaseModel):
    id: str
    value: str
    color: str | None = None
    is_archived: bool = False

    def __eq__(self, other: Any) -> bool:
        if not isinstance(other, EnumField):
            return False
        return self.value == other.value

    def __hash__(self) -> int:
        return hash(self.value)


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
    id: str
    state: str
    is_resolved: bool = False
    is_closed: bool = False
    is_archived: bool = False
    color: str | None = None

    def __eq__(self, other: Any) -> bool:
        if not isinstance(other, StateField):
            return False
        return self.state == other.state

    def __hash__(self) -> int:
        return hash(self.state)


class VersionField(BaseModel):
    id: str
    version: str
    release_date: datetime | None = None
    is_released: bool = False
    is_archived: bool = False

    def __eq__(self, other: Any) -> bool:
        if not isinstance(other, VersionField):
            return False
        return self.version == other.version

    def __hash__(self) -> int:
        return hash(self.version)


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


class CustomFieldCanBeNoneError(CustomFieldValidationError):
    def __init__(
        self, field: 'CustomField', value: Any = None, msg: str = 'cannot be None'
    ):
        super().__init__(field, value, msg)


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
    gid: str
    description: str | None = None
    ai_description: str | None = None
    label: str
    is_nullable: bool = True
    default_value: Any | None = None

    @classmethod
    def search_query(cls, search: str) -> Mapping[str, Any] | bool:
        return bo.RegEx(cls.name, search, 'i')

    def validate_value(self, value: Any) -> Any:
        if value is None and not self.is_nullable:
            raise CustomFieldCanBeNoneError(field=self)
        return value

    def __hash__(self) -> int:
        return hash(self.id)


class CustomFieldLink(BaseModel):
    id: PydanticObjectId
    gid: str
    name: str
    type: CustomFieldTypeT

    @classmethod
    def from_obj(cls, obj: CustomField | Self) -> Self:
        return cls(
            id=obj.id,
            gid=obj.gid,
            name=obj.name,
            type=obj.type,
        )

    async def resolve(self) -> CustomField:
        obj = await CustomField.find_one(CustomField.id == self.id, with_children=True)
        if obj is None:
            raise ValueError(f'CustomField not found: {self.id}')
        return obj


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
        if value is not None:
            try:
                value = float(value)
            except Exception as err:
                raise CustomFieldValidationError(
                    field=self, value=value, msg='must be a float'
                ) from err
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
        if isinstance(value, datetime):
            value = value.date()
        if isinstance(value, date):
            return datetime.combine(value, datetime.min.time())
        if isinstance(value, str):
            try:
                return datetime.fromisoformat(value).replace(
                    hour=0, minute=0, second=0, microsecond=0
                )
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
            return value.replace(tzinfo=None)
        if isinstance(value, str):
            try:
                return datetime.fromisoformat(value).replace(tzinfo=None)
            except ValueError as err:
                raise CustomFieldValidationError(
                    field=self, value=value, msg='must be a datetime in ISO format'
                ) from err
        raise CustomFieldValidationError(
            field=self, value=value, msg='must be a datetime in ISO format'
        )


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
                {'$push': {'options.$[o].value.users': UserLinkField.from_obj(user)}},
                array_filters=[
                    {'o.value.group.id': group.id, 'o.type': UserOptionType.GROUP}
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
    default_value: list[UserLinkField] | None = None

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
            if isinstance(val, UserLinkField):
                val = val.id
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
    options: Annotated[list[EnumField], Field(default_factory=list)]
    default_value: EnumField | None = None

    def validate_value(self, value: Any) -> Any:
        value = super().validate_value(value)
        if value is None:
            return value
        if isinstance(value, EnumField):
            value = value.value
        opts = {opt.value: opt for opt in self.options}
        if value not in opts:
            raise CustomFieldValidationError(
                field=self, value=value, msg='option not found'
            )
        return opts[value]


class EnumMultiCustomField(CustomField):
    type: CustomFieldTypeT = CustomFieldTypeT.ENUM_MULTI
    options: Annotated[list[EnumField], Field(default_factory=list)]
    default_value: list[EnumField] | None = None

    @staticmethod
    def __transform_single_value(value: Any) -> Any:
        if isinstance(value, EnumField):
            return value.value
        return value

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
        value = [self.__transform_single_value(val) for val in value]
        opts = {opt.value: opt for opt in self.options}
        for val in value:
            if val not in opts:
                raise CustomFieldValidationError(
                    field=self, value=value, msg=f'option {val} not found'
                )
        return [opts[val] for val in value]


class StateCustomField(CustomField):
    type: CustomFieldTypeT = CustomFieldTypeT.STATE
    options: Annotated[list[StateField], Field(default_factory=list)]
    default_value: StateField | None = None

    def validate_value(self, value: Any) -> Any:
        value = super().validate_value(value)
        if value is None:
            return value
        if isinstance(value, StateField):
            value = value.state
        opts = {opt.state: opt for opt in self.options}
        if value not in opts:
            raise CustomFieldValidationError(
                field=self, value=value, msg='option not found'
            )
        return opts[value]


class VersionCustomField(CustomField):
    type: CustomFieldTypeT = CustomFieldTypeT.VERSION
    options: Annotated[list[VersionField], Field(default_factory=list)]
    default_value: VersionField | None = None

    def validate_value(self, value: Any) -> Any:
        value = super().validate_value(value)
        if value is None:
            return value
        if isinstance(value, VersionField):
            value = value.version
        opts = {opt.version: opt for opt in self.options}
        if value not in opts:
            raise CustomFieldValidationError(
                field=self, value=value, msg='option not found'
            )
        return opts[value]


class VersionMultiCustomField(CustomField):
    type: CustomFieldTypeT = CustomFieldTypeT.VERSION_MULTI
    options: Annotated[list[VersionField], Field(default_factory=list)]
    default_value: list[VersionField] | None = None

    @staticmethod
    def __transform_single_value(value: Any) -> Any:
        if isinstance(value, VersionField):
            return value.version
        return value

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
        value = [self.__transform_single_value(val) for val in value]
        opts = {opt.version: opt for opt in self.options}
        for val in value:
            if val not in opts:
                raise CustomFieldValidationError(
                    field=self, value=value, msg=f'option {val} not found'
                )
        return [opts[val] for val in value]


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
    CustomFieldTypeT.VERSION: VersionCustomField,
    CustomFieldTypeT.VERSION_MULTI: VersionMultiCustomField,
}

CustomFieldValueT = (
    bool
    | int
    | float
    | datetime
    | UserLinkField
    | list[UserLinkField]
    | EnumField
    | list[EnumField]
    | StateField
    | VersionField
    | list[VersionField]
    | PydanticObjectId
    | Any
    | None
)


class CustomFieldValue(CustomFieldLink):
    value: CustomFieldValueT = None
