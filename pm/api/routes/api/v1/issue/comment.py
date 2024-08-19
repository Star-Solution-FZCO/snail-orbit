from datetime import datetime
from http import HTTPStatus
from typing import Self
from uuid import UUID

from beanie import PydanticObjectId
from fastapi import Depends, HTTPException
from pydantic import BaseModel

import pm.models as m
from pm.api.context import current_user
from pm.api.utils.router import APIRouter
from pm.api.views.output import BaseListOutput, SuccessPayloadOutput, UUIDOutput
from pm.api.views.pararams import ListParams
from pm.api.views.user import UserOutput
from pm.permissions import Permissions
from pm.utils.dateutils import utcnow

__all__ = ('router',)


router = APIRouter(
    prefix='/{issue_id}/comment',
    tags=['comment'],
)


class IssueCommentOutput(BaseModel):
    id: UUID
    text: str | None
    author: UserOutput
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_obj(cls, obj: m.IssueComment) -> Self:
        return cls(
            id=obj.id,
            text=obj.text,
            author=UserOutput.from_obj(obj.author),
            created_at=obj.created_at,
            updated_at=obj.updated_at,
        )


class IssueCommentCreate(BaseModel):
    text: str | None = None


class IssueCommentUpdate(BaseModel):
    text: str | None = None


@router.get('/list')
async def list_comments(
    issue_id: PydanticObjectId,
    query: ListParams = Depends(),
) -> BaseListOutput[IssueCommentOutput]:
    issue = await m.Issue.find_one(m.Issue.id == issue_id)
    if not issue:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')

    user_ctx = current_user()
    if not user_ctx.has_permission(issue.project.id, Permissions.COMMENT_READ):
        raise HTTPException(
            HTTPStatus.FORBIDDEN,
            'You do not have permission to read comments on this issue',
        )

    return BaseListOutput.make(
        count=len(issue.comments),
        limit=query.limit,
        offset=query.offset,
        items=[
            IssueCommentOutput.from_obj(c)
            for c in issue.comments[query.offset : query.offset + query.limit]
        ],
    )


@router.get('/{comment_id}')
async def get_comment(
    issue_id: PydanticObjectId,
    comment_id: UUID,
) -> SuccessPayloadOutput[IssueCommentOutput]:
    issue = await m.Issue.find_one(m.Issue.id == issue_id)
    if not issue:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')
    user_ctx = current_user()
    if not user_ctx.has_permission(issue.project.id, Permissions.COMMENT_READ):
        raise HTTPException(
            HTTPStatus.FORBIDDEN,
            'You do not have permission to read comments on this issue',
        )

    comment = next((c for c in issue.comments if c.id == comment_id), None)
    if not comment:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Comment not found')
    return SuccessPayloadOutput(payload=IssueCommentOutput.from_obj(comment))


@router.post('/')
async def create_comment(
    issue_id: PydanticObjectId,
    body: IssueCommentCreate,
) -> SuccessPayloadOutput[IssueCommentOutput]:
    issue = await m.Issue.find_one(m.Issue.id == issue_id)
    if not issue:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')

    user_ctx = current_user()
    if not user_ctx.has_permission(issue.project.id, Permissions.COMMENT_CREATE):
        raise HTTPException(
            HTTPStatus.FORBIDDEN, 'You do not have permission to comment on this issue'
        )
    now = utcnow()
    comment = m.IssueComment(
        text=body.text,
        author=m.UserLinkField.from_obj(user_ctx.user),
        created_at=now,
        updated_at=now,
    )
    issue.comments.append(comment)
    await issue.save_changes()
    return SuccessPayloadOutput(payload=IssueCommentOutput.from_obj(comment))


@router.put('/{comment_id}')
async def update_comment(
    issue_id: PydanticObjectId,
    comment_id: UUID,
    body: IssueCommentUpdate,
) -> SuccessPayloadOutput[IssueCommentOutput]:
    issue = await m.Issue.find_one(m.Issue.id == issue_id)
    if not issue:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')

    comment = next((c for c in issue.comments if c.id == comment_id), None)
    if not comment:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Comment not found')
    user_ctx = current_user()
    if not user_ctx.has_permission(issue.project.id, Permissions.COMMENT_UPDATE):
        raise HTTPException(
            HTTPStatus.FORBIDDEN,
            'You do not have permission to update comments on this issue',
        )
    if comment.author.id != user_ctx.user.id:
        raise HTTPException(
            HTTPStatus.FORBIDDEN, 'You can only update your own comments'
        )

    for k, v in body.dict(exclude_unset=True).items():
        setattr(comment, k, v)
    if issue.is_changed:
        comment.updated_at = utcnow()
        await issue.save_changes()
    return SuccessPayloadOutput(payload=IssueCommentOutput.from_obj(comment))


@router.delete('/{comment_id}')
async def delete_comment(
    issue_id: PydanticObjectId,
    comment_id: UUID,
) -> UUIDOutput:
    issue = await m.Issue.find_one(m.Issue.id == issue_id)
    if not issue:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')

    comment = next((c for c in issue.comments if c.id == comment_id), None)
    if not comment:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Comment not found')
    user_ctx = current_user()
    can_delete_all = user_ctx.has_permission(
        issue.project.id, Permissions.COMMENT_DELETE
    )
    can_delete_own = (
        user_ctx.has_permission(issue.project.id, Permissions.COMMENT_DELETE_OWN)
        or can_delete_all
    )
    if not can_delete_own:
        raise HTTPException(
            HTTPStatus.FORBIDDEN,
            'You do not have permission to delete comments on this issue',
        )
    if comment.author.id != user_ctx.user.id and not can_delete_all:
        raise HTTPException(
            HTTPStatus.FORBIDDEN, 'You can only delete your own comments'
        )

    issue.comments = [c for c in issue.comments if c.id != comment_id]
    await issue.replace()
    return UUIDOutput.make(comment_id)
