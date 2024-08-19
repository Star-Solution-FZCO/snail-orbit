from http import HTTPStatus

from beanie import PydanticObjectId
from fastapi import Depends, HTTPException

import pm.models as m
from pm.api.context import admin_context_dependency
from pm.api.utils.router import APIRouter
from pm.api.views.factories.crud import CrudCreateBody, CrudOutput, CrudUpdateBody
from pm.api.views.output import BaseListOutput, SuccessPayloadOutput
from pm.api.views.pararams import ListParams

__all__ = ('router',)

router = APIRouter(
    prefix='/user', tags=['user'], dependencies=[Depends(admin_context_dependency)]
)


class UserOutput(CrudOutput[m.User]):
    email: str
    name: str
    is_active: bool
    is_admin: bool


class UserCreate(CrudCreateBody[m.User]):
    email: str
    name: str
    is_active: bool = True
    is_admin: bool = False


class UserUpdate(CrudUpdateBody[m.User]):
    email: str | None = None
    name: str | None = None
    is_active: bool | None = None
    is_admin: bool | None = None


@router.get('/list')
async def list_users(
    query: ListParams = Depends(),
) -> BaseListOutput[UserOutput]:
    q = m.User.find().sort(m.User.id)
    results = []
    async for obj in q.limit(query.limit).skip(query.offset):
        results.append(UserOutput.from_obj(obj))
    return BaseListOutput.make(
        count=await q.count(),
        limit=query.limit,
        offset=query.offset,
        items=results,
    )


@router.get('/{user_id}')
async def get_user(
    user_id: PydanticObjectId,
) -> SuccessPayloadOutput[UserOutput]:
    user = await m.User.find_one(m.User.id == user_id)
    if not user:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'User not found')
    return SuccessPayloadOutput(payload=UserOutput.from_obj(user))


@router.post('/')
async def create_user(
    body: UserCreate,
) -> SuccessPayloadOutput[UserOutput]:
    obj = body.create_obj(m.User)
    await obj.insert()
    return SuccessPayloadOutput(payload=UserOutput.from_obj(obj))


@router.put('/{user_id}')
async def update_user(
    user_id: PydanticObjectId,
    body: UserUpdate,
) -> SuccessPayloadOutput[UserOutput]:
    obj = await m.User.find_one(m.User.id == user_id)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'User not found')
    body.update_obj(obj)
    if obj.is_changed:
        await obj.save_changes()
        await m.Project.update_user_embedded_links(obj)
        await m.Issue.update_user_embedded_links(obj)
    return SuccessPayloadOutput(payload=UserOutput.from_obj(obj))
