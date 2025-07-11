from http import HTTPStatus
from uuid import UUID

from beanie import PydanticObjectId
from fastapi import Depends, HTTPException

import pm.models as m
from pm.api.context import current_user
from pm.api.utils.router import APIRouter
from pm.api.views.error_responses import error_responses
from pm.api.views.issue import IssueHistoryOutput
from pm.api.views.output import BaseListOutput, ErrorOutput, SuccessPayloadOutput
from pm.api.views.params import ListParams
from pm.permissions import Permissions

__all__ = ('router',)


router = APIRouter(
    prefix='/{issue_id_or_alias}/history',
    tags=['history'],
)


@router.get('/list')
async def list_history(
    issue_id_or_alias: PydanticObjectId | str,
    query: ListParams = Depends(),
) -> BaseListOutput[IssueHistoryOutput]:
    issue = await m.Issue.find_one_by_id_or_alias(issue_id_or_alias)
    if not issue:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')

    user_ctx = current_user()
    user_ctx.validate_issue_permission(issue, Permissions.ISSUE_READ)

    items = sorted(
        [IssueHistoryOutput.from_obj(record) for record in issue.history],
        key=lambda r: r.time,
        reverse=True,
    )

    return BaseListOutput.make(
        count=len(issue.history),
        limit=query.limit,
        offset=query.offset,
        items=items,
    )


@router.put(
    '/{history_id}/hide',
    responses=error_responses(
        (HTTPStatus.BAD_REQUEST, ErrorOutput),
        (HTTPStatus.UNAUTHORIZED, ErrorOutput),
        (HTTPStatus.FORBIDDEN, ErrorOutput),
        (HTTPStatus.NOT_FOUND, ErrorOutput),
        (HTTPStatus.UNPROCESSABLE_ENTITY, ErrorOutput),
    ),
)
async def hide_history(
    issue_id_or_alias: PydanticObjectId | str,
    history_id: UUID,
) -> SuccessPayloadOutput[IssueHistoryOutput]:
    issue = await m.Issue.find_one_by_id_or_alias(issue_id_or_alias)
    if not issue:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')

    user_ctx = current_user()
    user_ctx.validate_issue_permission(issue, Permissions.HISTORY_HIDE)

    record = next((r for r in issue.history if r.id == history_id), None)
    if not record:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'History record not found')
    if record.is_hidden:
        raise HTTPException(HTTPStatus.CONFLICT, 'History record is already hidden')

    record.is_hidden = True
    await issue.save()

    return SuccessPayloadOutput(payload=IssueHistoryOutput.from_obj(record))


@router.put(
    '/{history_id}/restore',
    responses=error_responses(
        (HTTPStatus.BAD_REQUEST, ErrorOutput),
        (HTTPStatus.UNAUTHORIZED, ErrorOutput),
        (HTTPStatus.FORBIDDEN, ErrorOutput),
        (HTTPStatus.NOT_FOUND, ErrorOutput),
        (HTTPStatus.UNPROCESSABLE_ENTITY, ErrorOutput),
    ),
)
async def restore_history(
    issue_id_or_alias: PydanticObjectId | str,
    history_id: UUID,
) -> SuccessPayloadOutput[IssueHistoryOutput]:
    issue = await m.Issue.find_one_by_id_or_alias(issue_id_or_alias)
    if not issue:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')

    user_ctx = current_user()
    user_ctx.validate_issue_permission(issue, Permissions.HISTORY_RESTORE)

    record = next((r for r in issue.history if r.id == history_id), None)
    if not record:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'History record not found')
    if not record.is_hidden:
        raise HTTPException(HTTPStatus.CONFLICT, 'History record is not hidden')

    record.is_hidden = False
    await issue.save()

    return SuccessPayloadOutput(payload=IssueHistoryOutput.from_obj(record))
