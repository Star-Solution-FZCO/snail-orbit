from http import HTTPStatus

import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from starsol_sql_base.utils import count_select_query_results

import pm.models as m
from pm.api.context import admin_context_dependency
from pm.api.db import db_session_dependency
from pm.api.views.factories.crud import CrudCreateBody, CrudOutput, CrudUpdateBody
from pm.api.views.output import BaseListOutput, ModelIdOutput, SuccessPayloadOutput
from pm.api.views.pararams import ListParams

__all__ = ('router',)

router = APIRouter(
    prefix='/user', tags=['user'], dependencies=[Depends(admin_context_dependency)]
)


class UserOutput(CrudOutput[m.User]):
    id: int
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
    session: AsyncSession = Depends(db_session_dependency),
) -> BaseListOutput[UserOutput]:
    q = sa.select(m.User)
    count = await count_select_query_results(q, session=session)
    q = q.limit(query.limit).offset(query.offset)
    objs_ = await session.scalars(q)
    return BaseListOutput.make(
        count=count,
        limit=query.limit,
        offset=query.offset,
        items=[UserOutput.from_obj(obj) for obj in objs_.all()],
    )


@router.get('/{user_id}')
async def get_user(
    user_id: int,
    session: AsyncSession = Depends(db_session_dependency),
) -> SuccessPayloadOutput[UserOutput]:
    user = await session.scalar(sa.select(m.User).where(m.User.id == user_id))
    if not user:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'User not found')
    return SuccessPayloadOutput(payload=UserOutput.from_obj(user))


@router.post('/')
async def create_user(
    body: UserCreate,
    session: AsyncSession = Depends(db_session_dependency),
) -> ModelIdOutput:
    user = m.User(
        email=body.email,
        name=body.name,
        is_active=body.is_active,
        is_admin=body.is_admin,
    )
    session.add(user)
    await session.commit()
    return ModelIdOutput.from_obj(user)


@router.put('/{user_id}')
async def update_user(
    user_id: int,
    body: UserUpdate,
    session: AsyncSession = Depends(db_session_dependency),
) -> ModelIdOutput:
    user = await session.scalar(sa.select(m.User).where(m.User.id == user_id))
    if not user:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'User not found')
    body.update_obj(user)
    await session.commit()
    return ModelIdOutput.from_obj(user)
