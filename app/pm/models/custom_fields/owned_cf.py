from typing import Annotated, Any

from pydantic import BaseModel, Field

from pm.models.user import User, UserLinkField

from ._base import CustomField, CustomFieldTypeT, CustomFieldValidationError

__all__ = (
    'OwnedCustomField',
    'OwnedMultiCustomField',
    'OwnedOption',
)


class OwnedOption(BaseModel):
    id: str = Field(description='Unique identifier for the option')
    value: str = Field(description='Display value of the option')
    owner: UserLinkField | None = Field(
        default=None,
        description='User who owns this option',
    )
    color: str | None = Field(
        default=None,
        description='Color associated with the option',
    )
    is_archived: bool = Field(
        default=False,
        description='Whether the option is archived',
    )

    def __eq__(self, other: Any) -> bool:
        if not isinstance(other, OwnedOption):
            return False
        return self.value == other.value

    def __hash__(self) -> int:
        return hash(self.value)


class OwnedCustomField(CustomField):
    type: CustomFieldTypeT = CustomFieldTypeT.OWNED
    options: Annotated[
        list[OwnedOption],
        Field(default_factory=list, description='Available options with owners'),
    ]
    default_value: OwnedOption | None = Field(
        default=None,
        description='Default option value',
    )

    @property
    def owners(self) -> set[UserLinkField]:
        return {opt.owner for opt in self.options if opt.owner is not None}

    @classmethod
    async def update_user_embedded_links(cls, user: User) -> None:
        await cls.find(
            cls.options.owner.id == user.id,
        ).update(
            {'$set': {'options.$[o].owner': UserLinkField.from_obj(user)}},
            array_filters=[{'o.owner.id': user.id}],
        )
        await cls.find(
            {'default_value.owner.id': user.id},
        ).update(
            {'$set': {'default_value.owner': UserLinkField.from_obj(user)}},
        )

    def validate_value(self, value: Any) -> Any:
        value = super().validate_value(value)
        if value is None:
            return value
        if isinstance(value, OwnedOption):
            value = value.value
        opts = {opt.value: opt for opt in self.options}
        if value not in opts:
            raise CustomFieldValidationError(
                field=self,
                value=value,
                msg='option not found',
            )
        return opts[value]


class OwnedMultiCustomField(CustomField):
    type: CustomFieldTypeT = CustomFieldTypeT.OWNED_MULTI
    options: Annotated[
        list[OwnedOption],
        Field(default_factory=list, description='Available options with owners'),
    ]
    default_value: list[OwnedOption] | None = Field(
        default=None,
        description='Default option values',
    )

    @property
    def owners(self) -> set[UserLinkField]:
        return {opt.owner for opt in self.options if opt.owner is not None}

    @classmethod
    async def update_user_embedded_links(cls, user: User) -> None:
        await cls.find(
            cls.options.owner.id == user.id,
        ).update(
            {'$set': {'options.$[o].owner': UserLinkField.from_obj(user)}},
            array_filters=[{'o.owner.id': user.id}],
        )
        await cls.find(
            {'default_value.owner.id': user.id},
        ).update(
            {'$set': {'default_value.$[d].owner': UserLinkField.from_obj(user)}},
            array_filters=[{'d.owner.id': user.id}],
        )

    @staticmethod
    def __transform_single_value(value: Any) -> Any:
        if isinstance(value, OwnedOption):
            return value.value
        return value

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
        value = [self.__transform_single_value(val) for val in value]
        opts = {opt.value: opt for opt in self.options}
        for val in value:
            if val not in opts:
                raise CustomFieldValidationError(
                    field=self,
                    value=value,
                    msg=f'option {val} not found',
                )
        return [opts[val] for val in value]
