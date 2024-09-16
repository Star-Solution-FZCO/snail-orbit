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
from pm.api.views.custom_fields import CustomFieldLinkOutput
from pm.api.views.issue import CustomFieldValueOutT, transform_custom_field_value
from pm.api.views.output import BaseListOutput
from pm.api.views.params import ListParams
from pm.api.views.user import UserOutput
from pm.permissions import Permissions

__all__ = ('router',)


router = APIRouter(
    prefix='/{issue_id_or_alias}/history',
    tags=['history'],
)


class IssueFieldChangeOutput(BaseModel):
    field: CustomFieldLinkOutput
    old_value: CustomFieldValueOutT
    new_value: CustomFieldValueOutT

    @classmethod
    def from_obj(cls, obj: m.IssueFieldChange) -> Self:
        return cls(
            field=CustomFieldLinkOutput.from_obj(obj.field),
            old_value=transform_custom_field_value(obj.old_value, obj.field),
            new_value=transform_custom_field_value(obj.new_value, obj.field),
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
    if not user_ctx.has_permission(issue.project.id, Permissions.ISSUE_READ):
        raise HTTPException(
            HTTPStatus.FORBIDDEN,
            'You do not have permission to read this issue',
        )

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
