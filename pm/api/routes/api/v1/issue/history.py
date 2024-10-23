from datetime import datetime
from http import HTTPStatus
from typing import Literal, Self
from uuid import UUID

from beanie import PydanticObjectId
from fastapi import Depends, HTTPException
from pydantic import BaseModel

import pm.models as m
from pm.api.context import current_user
from pm.api.utils.router import APIRouter
from pm.api.views.issue import IssueFieldChangeOutput
from pm.api.views.output import BaseListOutput
from pm.api.views.params import ListParams
from pm.api.views.user import UserOutput
from pm.permissions import Permissions

__all__ = ('router',)


router = APIRouter(
    prefix='/{issue_id_or_alias}/history',
    tags=['history'],
)


class IssueHistoryOutput(BaseModel):
    id: UUID
    author: UserOutput
    time: datetime
    changes: list[IssueFieldChangeOutput]

    @classmethod
    def from_obj(cls, obj: m.IssueHistoryRecord) -> Self:
        return cls(
            id=obj.id,
            author=UserOutput.from_obj(obj.author),
            time=obj.time,
            changes=[IssueFieldChangeOutput.from_obj(c) for c in obj.changes],
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
