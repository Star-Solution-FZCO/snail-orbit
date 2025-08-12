from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

__all__ = ('CommentChange',)


class CommentChange(BaseModel):
    """Model for a comment change within a notification batch."""

    comment_id: UUID = Field(description='Comment ID')
    action: Literal['create', 'update', 'delete'] = Field(
        description='Action performed on the comment'
    )
