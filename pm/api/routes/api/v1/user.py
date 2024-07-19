from http import HTTPStatus

import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from starsol_sql_base.db import async_session
from starsol_sql_base.utils import count_select_query_results

import pm.models as m
from pm.api.views.factories.crud import CrudOutput, CrudCreateBody, CrudUpdateBody
from pm.api.views.output import BaseListOutput, SuccessPayloadOutput, ModelIdOutput
from pm.api.views.pararams import ListParams

__all__ = ('router',)

router = APIRouter(prefix='/user', tags=['user'])


class UserOutput(CrudOutput[m.User]):
    id: int
    email: str
    name: str
    active: bool

class UserCreate(CrudCreateBody[m.User]):
    email: str
    name: str
    active: bool = True


class UserUpdate(CrudUpdateBody[m.User]):
    email: str | None = None
    name: str | None = None
    active: bool | None = None


@router.get('/list')
async def list_users(
    query: ListParams = Depends(),
    session: AsyncSession = Depends(async_session),
) -> BaseListOutput[UserOutput]:
    q = sa.select(m.User)
    count = await count_select_query_results(q, session=session)
    q = q.limit(query.limit).offset(query.offset)
    users_ = await session.scalars(q)
    return BaseListOutput.make(
        count=count,
        limit=query.limit,
        offset=query.offset,
        items=[
            UserOutput.from_obj(user)
            for user in users_.all()
        ],
    )


@router.get('/{user_id}')
async def get_user(
    user_id: int,
    session: AsyncSession = Depends(async_session),
) -> SuccessPayloadOutput[UserOutput]:
    user = await session.scalar(sa.select(m.User).where(m.User.id == user_id))
    if not user:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'User not found')
    return SuccessPayloadOutput.make(payload=UserOutput.from_obj(user))


@router.post('/')
async def create_user(
    body: UserCreate,
    session: AsyncSession = Depends(async_session),
) -> ModelIdOutput:
    user = m.User(
        email=body.email,
        name=body.name,
        active=body.active,
    )
    session.add(user)
    await session.commit()
    return ModelIdOutput.from_obj(user)


@router.put('/{user_id}')
async def update_user(
    user_id: int,
    body: UserUpdate,
    session: AsyncSession = Depends(async_session),
) -> ModelIdOutput:
    user = await session.scalar(sa.select(m.User).where(m.User.id == user_id))
    if not user:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'User not found')
    body.update_obj(user)
    await session.commit()
    return ModelIdOutput.from_obj(user)
