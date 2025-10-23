from http import HTTPStatus

from fastapi import Depends, HTTPException

import pm.models as m
from pm.api.context import current_user_context_dependency
from pm.api.utils.router import APIRouter
from pm.api.views.error_responses import (
    AUTH_ERRORS,
    READ_ERRORS,
    error_responses,
)
from pm.api.views.output import (
    BaseListOutput,
    SuccessPayloadOutput,
)
from pm.api.views.params import ListParams
from pm.api.views.select import SelectParams
from pm.api.views.user import UserIdentifier, UserOutput

__all__ = ('router',)

router = APIRouter(
    prefix='/user',
    tags=['user'],
    dependencies=[Depends(current_user_context_dependency)],
    responses=error_responses(*AUTH_ERRORS),
)


@router.get('/list')
async def list_users(query: ListParams = Depends()) -> BaseListOutput[UserOutput]:
    q = m.User.find()
    query.apply_filter(q, m.User)
    query.apply_sort(q, m.User, (m.User.name,))
    if query.search:
        q = q.find(m.User.search_query(query.search))
    return await BaseListOutput.make_from_query(
        q,
        limit=query.limit,
        offset=query.offset,
        projection_fn=UserOutput.from_obj,
    )


@router.get('/select')
async def select_users(
    query: SelectParams = Depends(),
) -> BaseListOutput[UserOutput]:
    q = m.User.find().sort(m.User.name)
    if query.search:
        q = q.find(m.User.search_query(query.search))
    return await BaseListOutput.make_from_query(
        q,
        limit=query.limit,
        offset=query.offset,
        projection_fn=UserOutput.from_obj,
    )


@router.get('/{user_identifier}', responses=error_responses(*READ_ERRORS))
async def get_user(
    user_identifier: UserIdentifier,
) -> SuccessPayloadOutput[UserOutput]:
    user = await m.User.find_one_by_id_or_email(user_identifier)
    if not user:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'User not found')
    return SuccessPayloadOutput(payload=UserOutput.from_obj(user))
