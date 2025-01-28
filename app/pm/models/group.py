from enum import StrEnum
from typing import Self

from beanie import Document, Indexed, PydanticObjectId
from pydantic import BaseModel

from ._audit import audited_model

__all__ = (
    'Group',
    'GroupLinkField',
    'GroupOriginType',
)


class GroupOriginType(StrEnum):
    LOCAL = 'local'
    WB = 'wb'


class GroupLinkField(BaseModel):
    id: PydanticObjectId
    name: str
    description: str | None

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, GroupLinkField):
            return False
        return self.id == other.id

    @classmethod
    def from_obj(cls, obj: 'Group') -> Self:
        return cls(
            id=obj.id,
            name=obj.name,
            description=obj.description,
        )


@audited_model
class Group(Document):
    class Settings:
        name = 'groups'
        use_revision = True
        use_state_management = True
        state_management_save_previous = True

    name: str = Indexed(str, unique=True)
    description: str | None = None
    origin: GroupOriginType = GroupOriginType.LOCAL
    external_id: str | None = None
