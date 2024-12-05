from enum import StrEnum
from typing import Annotated

from beanie import Document, Indexed
from pydantic import BaseModel, Field

from ._audit import audited_model
from .group import GroupLinkField
from .user import UserLinkField

__all__ = ('Search', 'SearchShareType', 'SearchShare')


class SearchShareType(StrEnum):
    GROUP = 'group'
    USER = 'user'


class SearchShare(BaseModel):
    target_type: SearchShareType
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
    owner: UserLinkField
    shared: Annotated[list[SearchShare], Field(default_factory=list)]
