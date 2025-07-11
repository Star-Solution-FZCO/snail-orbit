from datetime import datetime
from enum import StrEnum
from typing import Self

import beanie.operators as bo
from beanie import PydanticObjectId
from pydantic import BaseModel

import pm.models as m
from pm.api.utils.router import APIRouter
from pm.api.views.issue import (
    IssueChangeOutputRootModel,
    ProjectField,
    issue_change_output_from_obj,
)
from pm.api.views.output import BaseListOutput
from pm.api.views.user import UserOutput

# No error responses needed for this public route
from pm.utils.dateutils import utcfromtimestamp

__all__ = ('router',)

router = APIRouter(prefix='/activity', tags=['activity'])


class ActionT(StrEnum):
    ISSUE_CREATED = 'issue_created'
    ISSUE_UPDATED = 'issue_updated'
    ISSUE_COMMENTED = 'issue_commented'


class IssueShortOutput(BaseModel):
    id: PydanticObjectId
    aliases: list[str]
    project: ProjectField
    subject: str
    id_readable: str

    @classmethod
    def from_obj(cls, obj: m.Issue) -> Self:
        return cls(
            id=obj.id,
            aliases=obj.aliases,
            project=ProjectField.from_obj(obj.project),
            subject=obj.subject,
            id_readable=obj.id_readable,
        )


class Activity(BaseModel):
    author: UserOutput
    action: ActionT
    issue: IssueShortOutput
    time: datetime
    changes: list[IssueChangeOutputRootModel] | None = None


def _get_issue_activity_unsorted(
    issue: m.Issue, start: datetime, end: datetime
) -> list[Activity]:
    results = []
    for history in issue.history:
        if start <= history.time <= end:
            results.append(
                Activity(
                    author=UserOutput.from_obj(history.author),
                    action=ActionT.ISSUE_UPDATED,
                    issue=IssueShortOutput.from_obj(issue),
                    time=history.time,
                    changes=[issue_change_output_from_obj(c) for c in history.changes],
                )
            )
    for comment in issue.comments:
        if start <= comment.created_at <= end:
            results.append(
                Activity(
                    author=UserOutput.from_obj(comment.author),
                    action=ActionT.ISSUE_COMMENTED,
                    issue=IssueShortOutput.from_obj(issue),
                    time=comment.created_at,
                )
            )
    if start <= issue.created_at <= end:
        results.append(
            Activity(
                author=UserOutput.from_obj(issue.created_by),
                action=ActionT.ISSUE_CREATED,
                issue=IssueShortOutput.from_obj(issue),
                time=issue.created_at,
            )
        )
    return results


@router.get('/list')
async def get_activity_list(
    start: float,
    end: float,
    user_id: PydanticObjectId | None = None,
) -> BaseListOutput[Activity]:
    start_dt = utcfromtimestamp(start)
    end_dt = utcfromtimestamp(end)
    flt = [
        bo.Or(
            bo.And(
                m.Issue.history.time >= start_dt,
                m.Issue.history.time <= end_dt,
            ),
            bo.And(
                m.Issue.comments.created_at >= start_dt,
                m.Issue.comments.created_at <= end_dt,
            ),
            bo.And(
                m.Issue.created_at >= start_dt,
                m.Issue.created_at <= end_dt,
            ),
        )
    ]
    if user_id:
        flt.append(
            bo.Or(
                m.Issue.created_by.id == user_id,
                m.Issue.history.author.id == user_id,
                m.Issue.comments.author.id == user_id,
            )
        )
    results = []
    async for issue in m.Issue.find(*flt):
        results.extend(_get_issue_activity_unsorted(issue, start_dt, end_dt))
    return BaseListOutput.make(
        count=len(results),
        limit=len(results),
        offset=0,
        items=sorted(results, key=lambda a: a.time),
    )
