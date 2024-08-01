from beanie import Document, Indexed
from pydantic import BaseModel, Extra, Field

from ._audit import audited_model
from .project import ProjectLinkField
from .user import UserLinkField

__all__ = (
    'Issue',
    'IssueComment',
)


class IssueComment(BaseModel):
    author: UserLinkField
    text: str | None


@audited_model
class Issue(Document):
    class Settings:
        name = 'issues'
        use_revision = True
        use_state_management = True
        state_management_save_previous = True

    class Config:
        extra = Extra.allow

    subject: str = Indexed(str)
    text: str | None = None

    project: ProjectLinkField
    comments: list[IssueComment] = Field(default_factory=list)
