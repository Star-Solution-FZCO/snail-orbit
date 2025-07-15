from enum import StrEnum
from http import HTTPStatus

from fastapi import Depends
from pydantic import BaseModel

import pm.models as m
from pm.api.utils.router import APIRouter
from pm.api.views.error_responses import error_responses
from pm.api.views.group import GroupOutput
from pm.api.views.output import BaseListOutput, ErrorOutput
from pm.api.views.select import SelectParams
from pm.api.views.user import UserOutput

__all__ = ('router',)


router = APIRouter(
    prefix='/user-group',
    tags=['user', 'group'],
)


class UserGroupType(StrEnum):
    USER = 'user'
    GROUP = 'group'


class UserGroupOutput(BaseModel):
    type: UserGroupType
    data: UserOutput | GroupOutput

    @property
    def name(self) -> str:
        return self.data.name


@router.get(
    '/select',
    responses=error_responses(
        (HTTPStatus.UNAUTHORIZED, ErrorOutput),
        (HTTPStatus.FORBIDDEN, ErrorOutput),
    ),
)
async def select_users_and_groups(
    query: SelectParams = Depends(),
) -> BaseListOutput[UserGroupOutput]:
    q_user = m.User.find().sort(m.User.name)
    q_group = m.Group.find().sort(m.Group.name)

    if query.search:
        q_user = q_user.find(m.User.search_query(query.search))
        q_group = q_group.find(m.Group.search_query(query.search))

    combined = [
        UserGroupOutput(type=UserGroupType.USER, data=UserOutput.from_obj(obj))
        async for obj in q_user
    ] + [
        UserGroupOutput(type=UserGroupType.GROUP, data=GroupOutput.from_obj(obj))
        async for obj in q_group
    ]
    combined = sorted(combined, key=lambda r: r.name)

    return BaseListOutput.make(
        count=len(combined),
        limit=query.limit,
        offset=query.offset,
        items=combined[query.offset : query.offset + query.limit],
    )
