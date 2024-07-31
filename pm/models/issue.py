from beanie import Document, Indexed
from pydantic import BaseModel, Extra, Field

from .project import ProjectLinkField
from .user import UserLinkField

__all__ = (
    'Issue',
    'IssueComment',
)


class IssueComment(BaseModel):
    author: UserLinkField
    text: str | None


class Issue(Document):
    class Settings:
        name = 'issues'
        use_revision = True
        use_state_management = True

    class Config:
        extra = Extra.allow

    subject: str = Indexed(str)
    text: str | None = None

    project: ProjectLinkField
    comments: list[IssueComment] = Field(default_factory=list)
