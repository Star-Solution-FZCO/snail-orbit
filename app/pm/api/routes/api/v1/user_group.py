from enum import StrEnum

import beanie.operators as bo
from fastapi import Depends
from pydantic import BaseModel

import pm.models as m
from pm.api.utils.router import APIRouter
from pm.api.views.group import GroupOutput
from pm.api.views.output import BaseListOutput
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


@router.get('/select')
async def select_users_and_groups(
    query: SelectParams = Depends(),
) -> BaseListOutput[UserGroupOutput]:
    q_user = m.User.find(
        bo.Or(
            bo.RegEx(m.User.name, query.search, 'i'),
            bo.RegEx(m.User.email, query.search, 'i'),
        )
    ).sort(m.User.name)
    q_group = m.Group.find(bo.RegEx(m.Group.name, query.search, 'i')).sort(m.Group.name)

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
