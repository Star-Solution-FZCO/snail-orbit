from http import HTTPStatus
from typing import Annotated
from uuid import UUID

from beanie import PydanticObjectId
from fastapi import Depends, HTTPException
from pydantic import BaseModel, Field

import pm.models as m
from pm.api.context import current_user
from pm.api.helpers.user import resolve_users_by_email
from pm.api.utils.router import APIRouter
from pm.api.views.encryption import EncryptedObject
from pm.api.views.error_responses import (
    CRUD_ERRORS,
    READ_ERRORS,
    WRITE_ERRORS,
    error_responses,
)
from pm.api.views.issue import IssueAttachmentBody, IssueCommentOutput
from pm.api.views.output import BaseListOutput, SuccessPayloadOutput, UUIDOutput
from pm.api.views.params import ListParams
from pm.permissions import PermAnd, PermOr, ProjectPermissions
from pm.tasks.actions.notification_batch import schedule_batched_notification
from pm.tasks.actions.ocr_process import process_attachments_ocr
from pm.tasks.types import CommentChange
from pm.utils.dateutils import utcnow
from pm.utils.mentions import detect_mention_changes, extract_mentions_from_text

from ._utils import update_attachments

__all__ = ('router',)


router = APIRouter(
    prefix='/{issue_id_or_alias}/comment',
    tags=['comment'],
)


class IssueCommentCreate(BaseModel):
    text: EncryptedObject | None = None
    attachments: Annotated[list[IssueAttachmentBody], Field(default_factory=list)]
    spent_time: Annotated[
        int, Field(default=0, ge=0, description='Time spent in seconds')
    ]


class IssueCommentUpdate(BaseModel):
    text: EncryptedObject | None = None
    attachments: list[IssueAttachmentBody] | None = None
    spent_time: Annotated[
        int | None, Field(default=None, ge=0, description='Time spent in seconds')
    ]


@router.get('/list')
async def list_comments(
    issue_id_or_alias: PydanticObjectId | str,
    query: ListParams = Depends(),
) -> BaseListOutput[IssueCommentOutput]:
    issue = await m.Issue.find_one_by_id_or_alias(issue_id_or_alias)
    if not issue:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')

    user_ctx = current_user()
    user_ctx.validate_issue_permission(issue, ProjectPermissions.COMMENT_READ)

    items = sorted(
        [
            await IssueCommentOutput.from_obj(c)
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


@router.get('/{comment_id}', responses=error_responses(*READ_ERRORS))
async def get_comment(
    issue_id_or_alias: PydanticObjectId | str,
    comment_id: UUID,
) -> SuccessPayloadOutput[IssueCommentOutput]:
    issue = await m.Issue.find_one_by_id_or_alias(issue_id_or_alias)
    if not issue:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')

    user_ctx = current_user()
    user_ctx.validate_issue_permission(issue, ProjectPermissions.COMMENT_READ)

    comment = next((c for c in issue.comments if c.id == comment_id), None)
    if not comment:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Comment not found')
    return SuccessPayloadOutput(payload=await IssueCommentOutput.from_obj(comment))


@router.post('/', responses=error_responses(*WRITE_ERRORS))
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
        issue,
        PermAnd(ProjectPermissions.COMMENT_READ, ProjectPermissions.COMMENT_CREATE),
    )

    comment = m.IssueComment(
        text=body.text.value if body.text else None,
        author=m.UserLinkField.from_obj(user_ctx.user),
        created_at=now,
        updated_at=now,
        spent_time=body.spent_time,
        encryption=body.text.encryption if body.text else None,
    )
    await update_attachments(comment, body.attachments, user=user_ctx.user, now=now)
    issue.comments.append(comment)
    issue.updated_at = comment.created_at
    issue.updated_by = comment.author

    mentions = list(extract_mentions_from_text(comment.text))
    mentioned_users = await resolve_users_by_email(mentions)
    issue.subscribers.extend(
        [u.id for u in mentioned_users.values() if u.id not in issue.subscribers]
    )

    await issue.save_changes()

    ocr_attachment_ids = [str(a.id) for a in comment.attachments if not a.encryption]
    if ocr_attachment_ids:
        await process_attachments_ocr.kiq(
            ocr_attachment_ids,
            str(issue.id),
            comment_id=str(comment.id),
        )

    await schedule_batched_notification(
        'update',
        issue.subject,
        issue.id_readable,
        [str(s) for s in issue.subscribers],
        str(issue.project.id),
        author=user_ctx.user.email,
        field_changes=[],
        comment_changes=[
            CommentChange(
                comment_id=comment.id,
                action='create',
            )
        ],
        new_mentions=mentions,
    )

    return SuccessPayloadOutput(payload=await IssueCommentOutput.from_obj(comment))


@router.put('/{comment_id}', responses=error_responses(*CRUD_ERRORS))
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
        issue,
        PermAnd(ProjectPermissions.COMMENT_READ, ProjectPermissions.COMMENT_UPDATE),
    )

    comment = next((c for c in issue.comments if c.id == comment_id), None)
    if not comment:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Comment not found')
    if comment.author.id != user_ctx.user.id:
        raise HTTPException(
            HTTPStatus.FORBIDDEN,
            'You can only update your own comments',
        )
    if comment.is_hidden:
        raise HTTPException(HTTPStatus.FORBIDDEN, 'You cannot update hidden comments')
    comment_attachment_ids = {a.id for a in comment.attachments}
    extra_attachment_ids = {
        a.id for a in body.attachments or [] if a.id not in comment_attachment_ids
    }
    for k, value in body.model_dump(
        exclude={'attachments', 'text'},
        exclude_unset=True,
    ).items():
        if k == 'spent_time':
            setattr(comment, k, value or 0)
        else:
            setattr(comment, k, value)
    if 'attachments' in body.model_fields_set:
        await update_attachments(comment, body.attachments, user=user_ctx.user, now=now)

    new_mentions = []

    if 'text' in body.model_fields_set:
        new_text = body.text.value if body.text else None
        new_mentions = list(
            detect_mention_changes(comment.text, new_text).newly_mentioned
        )
        comment.text = new_text
        comment.encryption = body.text.encryption if body.text else None

        # Subscribe newly mentioned users to the issue
        if new_mentions:
            mentioned_users = await resolve_users_by_email(new_mentions)
            issue.subscribers.extend(
                [
                    u.id
                    for u in mentioned_users.values()
                    if u.id not in issue.subscribers
                ]
            )

    if issue.is_changed:
        comment.updated_at = now
        issue.updated_at = comment.created_at
        issue.updated_by = comment.author
        await issue.save_changes()

        ocr_attachment_ids = [
            str(a.id)
            for a in comment.attachments
            if not a.encryption and a.id in extra_attachment_ids
        ]
        if ocr_attachment_ids:
            await process_attachments_ocr.kiq(
                ocr_attachment_ids,
                str(issue.id),
                comment_id=str(comment.id),
            )

        await schedule_batched_notification(
            'update',
            issue.subject,
            issue.id_readable,
            [str(s) for s in issue.subscribers],
            str(issue.project.id),
            author=user_ctx.user.email,
            field_changes=[],
            comment_changes=[
                CommentChange(
                    comment_id=comment.id,
                    action='update',
                )
            ],
            new_mentions=new_mentions,
        )

    return SuccessPayloadOutput(payload=await IssueCommentOutput.from_obj(comment))


@router.delete('/{comment_id}', responses=error_responses(*READ_ERRORS))
async def delete_comment(
    issue_id_or_alias: PydanticObjectId | str,
    comment_id: UUID,
) -> UUIDOutput:
    issue = await m.Issue.find_one_by_id_or_alias(issue_id_or_alias)
    if not issue:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')

    user_ctx = current_user()
    user_ctx.validate_issue_permission(issue, ProjectPermissions.COMMENT_READ)

    comment = next((c for c in issue.comments if c.id == comment_id), None)
    if not comment:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Comment not found')

    if comment.author.id != user_ctx.user.id:
        user_ctx.validate_issue_permission(issue, ProjectPermissions.COMMENT_DELETE)
    user_ctx.validate_issue_permission(
        issue,
        PermOr(
            ProjectPermissions.COMMENT_DELETE_OWN, ProjectPermissions.COMMENT_DELETE
        ),
    )

    issue.comments = [c for c in issue.comments if c.id != comment_id]
    await issue.replace()

    await schedule_batched_notification(
        'update',
        issue.subject,
        issue.id_readable,
        [str(s) for s in issue.subscribers],
        str(issue.project.id),
        author=user_ctx.user.email,
        field_changes=[],
        comment_changes=[
            CommentChange(
                comment_id=comment_id,
                action='delete',
            )
        ],
    )

    return UUIDOutput.make(comment_id)


@router.put('/{comment_id}/hide', responses=error_responses(*CRUD_ERRORS))
async def hide_comment(
    issue_id_or_alias: PydanticObjectId | str,
    comment_id: UUID,
) -> SuccessPayloadOutput[IssueCommentOutput]:
    issue = await m.Issue.find_one_by_id_or_alias(issue_id_or_alias)
    if not issue:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')

    user_ctx = current_user()
    user_ctx.validate_issue_permission(
        issue,
        PermAnd(ProjectPermissions.COMMENT_READ, ProjectPermissions.COMMENT_HIDE),
    )

    comment = next((c for c in issue.comments if c.id == comment_id), None)
    if not comment:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Comment not found')
    if comment.is_hidden:
        raise HTTPException(HTTPStatus.CONFLICT, 'Comment is already hidden')

    comment.is_hidden = True
    await issue.save_changes()

    return SuccessPayloadOutput(payload=await IssueCommentOutput.from_obj(comment))


@router.put('/{comment_id}/restore', responses=error_responses(*CRUD_ERRORS))
async def restore_comment(
    issue_id_or_alias: PydanticObjectId | str,
    comment_id: UUID,
) -> SuccessPayloadOutput[IssueCommentOutput]:
    issue = await m.Issue.find_one_by_id_or_alias(issue_id_or_alias)
    if not issue:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')

    user_ctx = current_user()
    user_ctx.validate_issue_permission(
        issue,
        PermAnd(ProjectPermissions.COMMENT_READ, ProjectPermissions.COMMENT_RESTORE),
    )

    comment = next((c for c in issue.comments if c.id == comment_id), None)
    if not comment:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Comment not found')
    if not comment.is_hidden:
        raise HTTPException(HTTPStatus.CONFLICT, 'Comment is not hidden')

    comment.is_hidden = False
    await issue.save_changes()

    return SuccessPayloadOutput(payload=await IssueCommentOutput.from_obj(comment))
