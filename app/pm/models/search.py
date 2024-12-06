from enum import StrEnum
from typing import Annotated
from uuid import UUID, uuid4

from beanie import Document, Indexed
from pydantic import BaseModel, Field

from ._audit import audited_model
from .group import GroupLinkField
from .user import UserLinkField

__all__ = ('Search', 'SearchPermissionType', 'SearchPermission')


class SearchPermissionType(StrEnum):
    GROUP = 'group'
    USER = 'user'


class SearchPermission(BaseModel):
    id: Annotated[UUID, Field(default_factory=uuid4)]
    target_type: SearchPermissionType
    target: GroupLinkField | UserLinkField


@audited_model
class Search(Document):
    class Settings:
        name = 'searches'
        use_revision = True
        use_state_management = True
        state_management_save_previous = True

    name: str = Indexed(str)
    query: str
    owner: UserLinkField
    permissions: Annotated[list[SearchPermission], Field(default_factory=list)]
