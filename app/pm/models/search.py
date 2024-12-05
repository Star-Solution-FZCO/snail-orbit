from enum import StrEnum
from typing import Annotated

from beanie import Document, Indexed
from pydantic import BaseModel, Field

from ._audit import audited_model
from .group import GroupLinkField
from .user import UserLinkField

__all__ = ('Search', 'SearchPermissionTargetType', 'SearchPermission')


class SearchPermissionTargetType(StrEnum):
    GROUP = 'group'
    PRIVATE = 'private'
    PUBLIC = 'public'


class SearchPermission(BaseModel):
    target_type: SearchPermissionTargetType
    target: GroupLinkField | UserLinkField | None


@audited_model
class Search(Document):
    class Settings:
        name = 'searches'
        use_revision = True
        use_state_management = True
        state_management_save_previous = True

    name: str = Indexed(str)
    query: str
    created_by: UserLinkField
    permissions: Annotated[list[SearchPermission], Field(default_factory=list)]
