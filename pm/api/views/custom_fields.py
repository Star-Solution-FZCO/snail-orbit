from uuid import UUID

from beanie import PydanticObjectId
from pydantic import BaseModel

import pm.models as m

__all__ = (
    'EnumOptionOutput',
    'CustomFieldOutput',
    'CustomFieldOutputWithEnumOptions',
)


class EnumOptionOutput(BaseModel):
    uuid: UUID
    value: str
    color: str | None = None


class CustomFieldOutput(BaseModel):
    id: PydanticObjectId
    name: str
    type: m.CustomFieldTypeT
    is_nullable: bool

    @classmethod
    def from_obj(cls, obj: m.CustomField) -> 'CustomFieldOutput':
        return cls(
            id=obj.id,
            name=obj.name,
            type=obj.type,
            is_nullable=obj.is_nullable,
        )


class CustomFieldOutputWithEnumOptions(CustomFieldOutput):
    options: list[EnumOptionOutput]

    @classmethod
    def from_obj(cls, obj: m.CustomField) -> 'CustomFieldOutputWithEnumOptions':
        return cls(
            id=obj.id,
            name=obj.name,
            type=obj.type,
            is_nullable=obj.is_nullable,
            options=[
                EnumOptionOutput(uuid=k, value=v.value, color=v.color)
                for k, v in obj.options.items()
            ],
        )
