from typing import TYPE_CHECKING

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship

from starsol_sql_base import BaseModel

if TYPE_CHECKING:
    from .project import Project

__all__ = (
    'Issue',
    'IssueComment',
)


class Issue(BaseModel):
    __tablename__ = 'issues'
    subject: Mapped[str]
    text: Mapped[str | None]

    project_id: Mapped[int] = mapped_column(sa.ForeignKey('projects.id', ondelete='CASCADE', name='fk__issues__project_id'),)
    project: Mapped['Project'] = relationship(foreign_keys=[project_id], lazy='joined')

    comments: Mapped[list['IssueComment']] = relationship(back_populates='issue', lazy='joined')


class IssueComment(BaseModel):
    __tablename__ = 'issue_comments'

    issue_id: Mapped[int] = mapped_column(sa.ForeignKey('issues.id', ondelete='CASCADE', name='fk__issue_comments__issue_id'),)
    issue: Mapped['Issue'] = relationship(foreign_keys=[issue_id], back_populates='comments', lazy='joined')

    author_id: Mapped[int] = mapped_column(sa.ForeignKey('users.id', ondelete='SET NULL', name='fk__issue_comments__author_id'),)
    text: Mapped[str | None]
