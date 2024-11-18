from http import HTTPStatus

from beanie import PydanticObjectId
from fastapi import HTTPException
from pydantic import BaseModel

import pm.models as m
from pm.api.context import current_user
from pm.api.utils.router import APIRouter
from pm.api.views.user import UserOutput
from pm.permissions import PermAnd, Permissions

__all__ = ('router',)


router = APIRouter(
    prefix='/{issue_id_or_alias}/spent_time',
    tags=['comment'],
)


class IssueSpentTimeRecordOutput(BaseModel):
    user: UserOutput
    spent_time: int


class IssueSpentTimeOutput(BaseModel):
    total_spent_time: int | None
    records: list[IssueSpentTimeRecordOutput]


@router.get('/')
async def get_spent_time(
    issue_id_or_alias: PydanticObjectId | str,
) -> IssueSpentTimeOutput:
    issue = await m.Issue.find_one_by_id_or_alias(issue_id_or_alias)
    if not issue:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')

    user_ctx = current_user()
    user_ctx.validate_issue_permission(issue, PermAnd(Permissions.ISSUE_READ))

    all_authors = {c.author.id: c.author for c in issue.comments}
    records: dict[PydanticObjectId, int] = {}
    for comment in issue.comments:
        if not comment.spent_time:
            continue
        if comment.author.id not in records:
            records[comment.author.id] = 0
        records[comment.author.id] += comment.spent_time

    return IssueSpentTimeOutput(
        total_spent_time=sum((c.spent_time for c in issue.comments), start=0),
        records=[
            IssueSpentTimeRecordOutput(
                user=UserOutput.from_obj(all_authors[user_id]),
                spent_time=spent_time,
            )
            for user_id, spent_time in records.items()
        ],
    )
