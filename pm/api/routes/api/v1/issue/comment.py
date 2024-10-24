from datetime import datetime
from http import HTTPStatus
from typing import Self
from uuid import UUID

from beanie import PydanticObjectId
from fastapi import Depends, HTTPException
from pydantic import BaseModel, Field

import pm.models as m
from pm.api.context import current_user
from pm.api.events_bus import send_task
from pm.api.utils.router import APIRouter
from pm.api.views.issue import IssueAttachmentOut
from pm.api.views.output import BaseListOutput, SuccessPayloadOutput, UUIDOutput
from pm.api.views.params import ListParams
from pm.api.views.user import UserOutput
from pm.permissions import PermAnd, Permissions, PermOr
from pm.services.files import resolve_files
from pm.utils.dateutils import utcnow
from pm.utils.events_bus import Task, TaskType

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
    is_hidden: bool

    @classmethod
    def from_obj(cls, obj: m.IssueComment) -> Self:
        return cls(
            id=obj.id,
            text=obj.text if not obj.is_hidden else None,
            author=UserOutput.from_obj(obj.author),
            created_at=obj.created_at,
            updated_at=obj.updated_at,
            attachments=[IssueAttachmentOut.from_obj(a) for a in obj.attachments]
            if not obj.is_hidden
            else [],
            is_hidden=obj.is_hidden,
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
    user_ctx.validate_issue_permission(issue, Permissions.COMMENT_READ)

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
    user_ctx.validate_issue_permission(issue, Permissions.COMMENT_READ)

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
    user_ctx.validate_issue_permission(
        issue, PermAnd(Permissions.COMMENT_READ, Permissions.COMMENT_CREATE)
    )

    attachments = {}
    if body.attachments:
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
    for a in comment.attachments:
        await send_task(Task(type=TaskType.OCR, data={'attachment_id': str(a.id)}))
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

    user_ctx = current_user()
    user_ctx.validate_issue_permission(
        issue, PermAnd(Permissions.COMMENT_READ, Permissions.COMMENT_UPDATE)
    )

    comment = next((c for c in issue.comments if c.id == comment_id), None)
    if not comment:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Comment not found')
    if comment.author.id != user_ctx.user.id:
        raise HTTPException(
            HTTPStatus.FORBIDDEN, 'You can only update your own comments'
        )
    if comment.is_hidden:
        raise HTTPException(HTTPStatus.FORBIDDEN, 'You cannot update hidden comments')
    extra_attachment_ids = set()
    for k, v in body.dict(exclude_unset=True).items():
        if k == 'attachments':
            new_attachment_ids = set(v)
            current_attachment_ids = set(a.id for a in comment.attachments)
            extra_attachment_ids = new_attachment_ids - current_attachment_ids
            remove_attachment_ids = current_attachment_ids - new_attachment_ids
            try:
                extra_attachments = await resolve_files(list(extra_attachment_ids))
            except ValueError as err:
                raise HTTPException(HTTPStatus.BAD_REQUEST, str(err))
            comment.attachments = [
                a for a in comment.attachments if a.id not in remove_attachment_ids
            ]
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
        for a_id in extra_attachment_ids:
            await send_task(Task(type=TaskType.OCR, data={'attachment_id': str(a_id)}))
    return SuccessPayloadOutput(payload=IssueCommentOutput.from_obj(comment))


@router.delete('/{comment_id}')
async def delete_comment(
    issue_id_or_alias: PydanticObjectId | str,
    comment_id: UUID,
) -> UUIDOutput:
    issue = await m.Issue.find_one_by_id_or_alias(issue_id_or_alias)
    if not issue:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')

    user_ctx = current_user()
    user_ctx.validate_issue_permission(issue, Permissions.COMMENT_READ)

    comment = next((c for c in issue.comments if c.id == comment_id), None)
    if not comment:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Comment not found')

    if comment.author.id != user_ctx.user.id:
        user_ctx.validate_issue_permission(issue, Permissions.COMMENT_DELETE)
    user_ctx.validate_issue_permission(
        issue, PermOr(Permissions.COMMENT_DELETE_OWN, Permissions.COMMENT_DELETE)
    )

    issue.comments = [c for c in issue.comments if c.id != comment_id]
    await issue.replace()
    return UUIDOutput.make(comment_id)


@router.put('/{comment_id}/hide')
async def hide_comment(
    issue_id_or_alias: PydanticObjectId | str,
    comment_id: UUID,
) -> SuccessPayloadOutput[IssueCommentOutput]:
    issue = await m.Issue.find_one_by_id_or_alias(issue_id_or_alias)
    if not issue:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')

    user_ctx = current_user()
    user_ctx.validate_issue_permission(
        issue, PermAnd(Permissions.COMMENT_READ, Permissions.COMMENT_HIDE)
    )

    comment = next((c for c in issue.comments if c.id == comment_id), None)
    if not comment:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Comment not found')
    if comment.is_hidden:
        raise HTTPException(HTTPStatus.CONFLICT, 'Comment is already hidden')

    comment.is_hidden = True
    await issue.save_changes()
    return SuccessPayloadOutput(payload=IssueCommentOutput.from_obj(comment))


@router.put('/{comment_id}/restore')
async def restore_comment(
    issue_id_or_alias: PydanticObjectId | str,
    comment_id: UUID,
) -> SuccessPayloadOutput[IssueCommentOutput]:
    issue = await m.Issue.find_one_by_id_or_alias(issue_id_or_alias)
    if not issue:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')

    user_ctx = current_user()
    user_ctx.validate_issue_permission(
        issue, PermAnd(Permissions.COMMENT_READ, Permissions.COMMENT_RESTORE)
    )

    comment = next((c for c in issue.comments if c.id == comment_id), None)
    if not comment:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Comment not found')
    if not comment.is_hidden:
        raise HTTPException(HTTPStatus.CONFLICT, 'Comment is not hidden')

    comment.is_hidden = False
    await issue.save_changes()
    return SuccessPayloadOutput(payload=IssueCommentOutput.from_obj(comment))
