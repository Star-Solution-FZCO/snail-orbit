from datetime import datetime
from http import HTTPStatus
from typing import Self
from uuid import UUID

from beanie import PydanticObjectId
from fastapi import Depends, HTTPException
from pydantic import BaseModel, Field

import pm.models as m
from pm.api.context import current_user
from pm.api.utils.files import resolve_files
from pm.api.utils.router import APIRouter
from pm.api.views.issue import IssueAttachmentOut
from pm.api.views.output import BaseListOutput, SuccessPayloadOutput, UUIDOutput
from pm.api.views.params import ListParams
from pm.api.views.user import UserOutput
from pm.permissions import Permissions
from pm.utils.dateutils import utcnow

__all__ = ('router',)


router = APIRouter(
    prefix='/{issue_id_or_alias}/comment',
    tags=['comment'],
)


class IssueCommentOutput(BaseModel):
    id: UUID
    text: str | None
    author: UserOutput
    created_at: datetime
    updated_at: datetime
    attachments: list[IssueAttachmentOut]

    @classmethod
    def from_obj(cls, obj: m.IssueComment) -> Self:
        return cls(
            id=obj.id,
            text=obj.text,
            author=UserOutput.from_obj(obj.author),
            created_at=obj.created_at,
            updated_at=obj.updated_at,
            attachments=[IssueAttachmentOut.from_obj(a) for a in obj.attachments],
        )


class IssueCommentCreate(BaseModel):
    text: str | None = None
    attachments: list[UUID] = Field(default_factory=list)


class IssueCommentUpdate(BaseModel):
    text: str | None = None
    attachments: list[UUID] | None = None


@router.get('/list')
async def list_comments(
    issue_id_or_alias: PydanticObjectId | str,
    query: ListParams = Depends(),
) -> BaseListOutput[IssueCommentOutput]:
    issue = await m.Issue.find_one_by_id_or_alias(issue_id_or_alias)
    if not issue:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')

    user_ctx = current_user()
    if not user_ctx.has_permission(issue.project.id, Permissions.COMMENT_READ):
        raise HTTPException(
            HTTPStatus.FORBIDDEN,
            'You do not have permission to read comments on this issue',
        )

    items = sorted(
        [
            IssueCommentOutput.from_obj(c)
            for c in issue.comments[query.offset : query.offset + query.limit]
        ],
        key=lambda comment: comment.created_at,
        reverse=True,
    )

    return BaseListOutput.make(
        count=len(issue.comments),
        limit=query.limit,
        offset=query.offset,
        items=items,
    )


@router.get('/{comment_id}')
async def get_comment(
    issue_id_or_alias: PydanticObjectId | str,
    comment_id: UUID,
) -> SuccessPayloadOutput[IssueCommentOutput]:
    issue = await m.Issue.find_one_by_id_or_alias(issue_id_or_alias)
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
    issue_id_or_alias: PydanticObjectId | str,
    body: IssueCommentCreate,
) -> SuccessPayloadOutput[IssueCommentOutput]:
    now = utcnow()
    issue = await m.Issue.find_one_by_id_or_alias(issue_id_or_alias)
    if not issue:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')

    user_ctx = current_user()
    if not user_ctx.has_permission(issue.project.id, Permissions.COMMENT_CREATE):
        raise HTTPException(
            HTTPStatus.FORBIDDEN, 'You do not have permission to comment on this issue'
        )
    attachments = {}
    if body.attachments:
        if not user_ctx.has_permission(issue.project.id, Permissions.ATTACHMENT_CREATE):
            raise HTTPException(
                HTTPStatus.FORBIDDEN,
                'You do not have permission to attach files to this issue',
            )
        try:
            attachments = await resolve_files(body.attachments)
        except ValueError as err:
            raise HTTPException(HTTPStatus.BAD_REQUEST, str(err))
    comment = m.IssueComment(
        text=body.text,
        author=m.UserLinkField.from_obj(user_ctx.user),
        created_at=now,
        updated_at=now,
        attachments=[
            m.IssueAttachment(
                id=a_id,
                name=a_data.name,
                size=a_data.size,
                content_type=a_data.content_type,
                author=m.UserLinkField.from_obj(user_ctx.user),
                created_at=now,
            )
            for a_id, a_data in attachments.items()
        ],
    )
    issue.comments.append(comment)
    await issue.save_changes()
    return SuccessPayloadOutput(payload=IssueCommentOutput.from_obj(comment))


@router.put('/{comment_id}')
async def update_comment(
    issue_id_or_alias: PydanticObjectId | str,
    comment_id: UUID,
    body: IssueCommentUpdate,
) -> SuccessPayloadOutput[IssueCommentOutput]:
    now = utcnow()
    issue = await m.Issue.find_one_by_id_or_alias(issue_id_or_alias)
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
        if k == 'attachments':
            extra_attachment_ids = [
                a_id for a_id in v if a_id not in comment.attachments
            ]
            try:
                extra_attachments = await resolve_files(extra_attachment_ids)
            except ValueError as err:
                raise HTTPException(HTTPStatus.BAD_REQUEST, str(err))
            comment.attachments = [a for a in comment.attachments if a.id not in v]
            comment.attachments.extend(
                [
                    m.IssueAttachment(
                        id=a_id,
                        name=a_data.name,
                        size=a_data.size,
                        content_type=a_data.content_type,
                        author=m.UserLinkField.from_obj(user_ctx.user),
                        created_at=now,
                    )
                    for a_id, a_data in extra_attachments.items()
                ]
            )
            continue
        setattr(comment, k, v)
    if issue.is_changed:
        comment.updated_at = now
        await issue.save_changes()
    return SuccessPayloadOutput(payload=IssueCommentOutput.from_obj(comment))


@router.delete('/{comment_id}')
async def delete_comment(
    issue_id_or_alias: PydanticObjectId | str,
    comment_id: UUID,
) -> UUIDOutput:
    issue = await m.Issue.find_one_by_id_or_alias(issue_id_or_alias)
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
