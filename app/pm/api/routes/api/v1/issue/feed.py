from datetime import datetime
from enum import StrEnum
from http import HTTPStatus
from typing import Self

from beanie import PydanticObjectId
from fastapi import Depends, HTTPException
from pydantic import BaseModel

import pm.models as m
from pm.api.context import current_user, current_user_context_dependency
from pm.api.utils.router import APIRouter
from pm.api.views.issue import IssueCommentOutput, IssueHistoryOutput
from pm.api.views.output import BaseListOutput
from pm.api.views.params import ListParams
from pm.permissions import ProjectPermissions

__all__ = ('router',)


router = APIRouter(
    prefix='/{issue_id_or_alias}/feed',
    tags=['comment', 'history', 'feed'],
    dependencies=[Depends(current_user_context_dependency)],
)


ALLOWED_SORT_FIELDS = {'time'}


class IssueFeedRecordType(StrEnum):
    COMMENT = 'comment'
    HISTORY = 'history'


class IssueFeedRecordOutput(BaseModel):
    type: IssueFeedRecordType
    data: IssueCommentOutput | IssueHistoryOutput
    time: datetime

    @property
    def time(self) -> datetime:
        if self.type == IssueFeedRecordType.COMMENT:
            return self.data.created_at
        return self.data.time

    @classmethod
    def from_obj(cls, obj: m.IssueComment | m.IssueHistoryRecord) -> Self:
        if isinstance(obj, m.IssueComment):
            return cls(
                type=IssueFeedRecordType.COMMENT,
                data=IssueCommentOutput.from_obj(obj),
                time=obj.created_at,
            )
        return cls(
            type=IssueFeedRecordType.HISTORY,
            data=IssueHistoryOutput.from_obj(obj),
            time=obj.time,
        )


@router.get('/list')
async def list_issue_feed(
    issue_id_or_alias: PydanticObjectId | str,
    query: ListParams = Depends(),
) -> BaseListOutput[IssueFeedRecordOutput]:
    issue = await m.Issue.find_one_by_id_or_alias(issue_id_or_alias)
    if not issue:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')

    records: list[IssueFeedRecordOutput] = []

    user_ctx = current_user()
    if user_ctx.has_permission(issue.project.id, ProjectPermissions.COMMENT_READ):
        records.extend([IssueFeedRecordOutput.from_obj(c) for c in issue.comments])
    if user_ctx.has_permission(issue.project.id, ProjectPermissions.ISSUE_READ):
        records.extend([IssueFeedRecordOutput.from_obj(h) for h in issue.history])

    sort_by = query.sort_by

    if sort_by:
        reverse = sort_by.startswith('-')
        sort_field = sort_by.lstrip('-')

        if sort_field in ALLOWED_SORT_FIELDS:
            records.sort(key=lambda r: getattr(r, sort_field), reverse=reverse)
    else:
        records.sort(key=lambda r: r.time, reverse=False)

    return BaseListOutput.make(
        count=len(records),
        limit=query.limit,
        offset=query.offset,
        items=records[query.offset : query.offset + query.limit],
    )
