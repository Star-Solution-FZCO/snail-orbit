from datetime import datetime
from http import HTTPStatus
from uuid import UUID

from beanie import PydanticObjectId
from fastapi import HTTPException
from pydantic import BaseModel

import pm.models as m
from pm.api.context import current_user
from pm.api.utils.router import APIRouter
from pm.api.views.output import SuccessPayloadOutput
from pm.api.views.user import UserOutput
from pm.permissions import PermAnd, ProjectPermissions

__all__ = ('router',)


router = APIRouter(
    prefix='/{issue_id_or_alias}/spent_time',
    tags=['comment'],
)


class IssueSpentTimeRecordOutput(BaseModel):
    id: UUID
    user: UserOutput
    spent_time: int
    created_at: datetime


class IssueSpentTimeOutput(BaseModel):
    total_spent_time: int | None
    records: list[IssueSpentTimeRecordOutput]


@router.get('/')
async def get_spent_time(
    issue_id_or_alias: PydanticObjectId | str,
) -> SuccessPayloadOutput[IssueSpentTimeOutput]:
    issue = await m.Issue.find_one_by_id_or_alias(issue_id_or_alias)
    if not issue:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')
    user_ctx = current_user()
    user_ctx.validate_issue_permission(issue, PermAnd(ProjectPermissions.ISSUE_READ))
    all_authors = {c.author.id: c.author for c in issue.comments}
    records = [
        IssueSpentTimeRecordOutput(
            id=comment.id,
            user=UserOutput.from_obj(all_authors[comment.author.id]),
            spent_time=comment.spent_time,
            created_at=comment.created_at,
        )
        for comment in issue.comments
        if comment.spent_time
    ]
    return SuccessPayloadOutput(
        payload=IssueSpentTimeOutput(
            total_spent_time=sum((c.spent_time for c in issue.comments), start=0),
            records=records,
        ),
    )
