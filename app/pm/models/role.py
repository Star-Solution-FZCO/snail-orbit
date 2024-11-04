from typing import Annotated, Self

from beanie import Document, Indexed, PydanticObjectId
from pydantic import BaseModel, Field

from pm.permissions import Permissions

from ._audit import audited_model

__all__ = (
    'Role',
    'RoleLinkField',
)


class RoleLinkField(BaseModel):
    id: PydanticObjectId
    name: str
    description: str | None
    permissions: list[Permissions]

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, RoleLinkField):
            return False
        return self.id == other.id

    @classmethod
    def from_obj(cls, obj: 'Role') -> Self:
        return cls(
            id=obj.id,
            name=obj.name,
            description=obj.description,
            permissions=obj.permissions,
        )


@audited_model
class Role(Document):
    class Settings:
        name = 'roles'
        use_revision = True
        use_state_management = True
        state_management_save_previous = True

    name: Annotated[str, Indexed(str)]
    description: str | None = None
    permissions: Annotated[list[Permissions], Field(default_factory=list)]
