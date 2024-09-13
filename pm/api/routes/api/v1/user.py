import asyncio
from http import HTTPStatus
from typing import Self

import beanie.operators as bo
from beanie import PydanticObjectId
from fastapi import Depends, HTTPException

import pm.models as m
from pm.api.context import admin_context_dependency
from pm.api.utils.router import APIRouter
from pm.api.views.factories.crud import CrudCreateBody, CrudOutput, CrudUpdateBody
from pm.api.views.output import BaseListOutput, SuccessPayloadOutput
from pm.api.views.params import ListParams
from pm.api.views.select import SelectParams
from pm.api.views.user import UserOutput

__all__ = ('router',)

router = APIRouter(
    prefix='/user', tags=['user'], dependencies=[Depends(admin_context_dependency)]
)


class UserFullOutput(UserOutput):
    is_active: bool
    is_admin: bool
    origin: m.UserOriginType

    @classmethod
    def from_obj(cls, obj: m.User) -> Self:
        return cls(
            id=obj.id,
            email=obj.email,
            name=obj.name,
            is_active=obj.is_active,
            is_admin=obj.is_admin,
            origin=obj.origin,
        )


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
) -> BaseListOutput[UserFullOutput]:
    q = m.User.find().sort(m.User.id)
    results = []
    async for obj in q.limit(query.limit).skip(query.offset):
        results.append(UserFullOutput.from_obj(obj))
    return BaseListOutput.make(
        count=await q.count(),
        limit=query.limit,
        offset=query.offset,
        items=results,
    )


@router.get('/select')
async def select_users(
    query: SelectParams = Depends(),
):
    q = m.User.find(
        bo.Or(
            bo.RegEx(m.User.name, query.search, 'i'),
            bo.RegEx(m.User.email, query.search, 'i'),
        )
    ).sort(m.User.name)
    results = []
    return BaseListOutput.make(
        count=await q.count(),
        limit=query.limit,
        offset=query.offset,
        items=[
            UserOutput.from_obj(obj)
            async for obj in q.limit(query.limit).skip(query.offset)
        ],
    )


@router.get('/{user_id}')
async def get_user(
    user_id: PydanticObjectId,
) -> SuccessPayloadOutput[UserFullOutput]:
    user = await m.User.find_one(m.User.id == user_id)
    if not user:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'User not found')
    return SuccessPayloadOutput(payload=UserFullOutput.from_obj(user))


@router.post('/')
async def create_user(
    body: UserCreate,
) -> SuccessPayloadOutput[UserFullOutput]:
    obj = body.create_obj(m.User)
    await obj.insert()
    return SuccessPayloadOutput(payload=UserFullOutput.from_obj(obj))


@router.put('/{user_id}')
async def update_user(
    user_id: PydanticObjectId,
    body: UserUpdate,
) -> SuccessPayloadOutput[UserFullOutput]:
    obj: m.User | None = await m.User.find_one(m.User.id == user_id)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'User not found')
    body.update_obj(obj)
    if obj.is_changed:
        await obj.save_changes()
        await asyncio.gather(
            m.Project.update_user_embedded_links(obj),
            m.Issue.update_user_embedded_links(obj),
            m.UserMultiCustomField.update_user_embedded_links(obj),
            m.UserCustomField.update_user_embedded_links(obj),
        )
    return SuccessPayloadOutput(payload=UserFullOutput.from_obj(obj))
