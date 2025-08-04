from collections.abc import Mapping
from typing import Annotated, Any, ClassVar, Self

import beanie.operators as bo
import pymongo
from beanie import Document, Indexed, PydanticObjectId
from pydantic import BaseModel, Field

from pm.permissions import GlobalPermissions

from ._audit import audited_model

__all__ = (
    'GlobalRole',
    'GlobalRoleLinkField',
)


class GlobalRoleLinkField(BaseModel):
    id: PydanticObjectId
    name: str
    description: str | None
    permissions: list[GlobalPermissions] = Field(
        description='Global permissions granted by this role'
    )

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, GlobalRoleLinkField):
            return False
        return self.id == other.id

    @classmethod
    def from_obj(cls, obj: 'GlobalRole') -> Self:
        return cls(
            id=obj.id,
            name=obj.name,
            description=obj.description,
            permissions=obj.permissions,
        )


@audited_model
class GlobalRole(Document):
    """Global role with system-wide permissions."""

    class Settings:
        name = 'global_roles'
        use_revision = True
        use_state_management = True
        state_management_save_previous = True
        indexes: ClassVar = [
            pymongo.IndexModel([('permissions', 1)], name='permissions_index'),
        ]

    name: Annotated[str, Indexed(str)] = Field(description='Role name')
    description: str | None = Field(default=None, description='Role description')
    permissions: Annotated[list[GlobalPermissions], Field(default_factory=list)] = (
        Field(description='Global permissions granted by this role')
    )

    @classmethod
    def search_query(cls, search: str) -> Mapping[str, Any] | bool:
        return bo.RegEx(cls.name, search, 'i')
