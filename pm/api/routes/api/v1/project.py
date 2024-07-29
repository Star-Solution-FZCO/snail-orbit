from http import HTTPStatus

import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from starsol_sql_base.utils import count_select_query_results

import pm.models as m
from pm.api.db import db_session_dependency
from pm.api.views.factories.crud import CrudOutput, CrudCreateBody, CrudUpdateBody
from pm.api.views.output import BaseListOutput, SuccessPayloadOutput, ModelIdOutput
from pm.api.views.pararams import ListParams
from pm.api.context import admin_context_dependency, current_user_context_dependency

__all__ = ('router',)

router = APIRouter(prefix='/project', tags=['project'], dependencies=[Depends(current_user_context_dependency)])


class ProjectOutput(CrudOutput[m.Project]):
    id: int
    name: str
    description: str | None
    is_active: bool


class ProjectCreate(CrudCreateBody[m.Project]):
    email: str
    name: str
    description: str | None = None
    is_active: bool = True


class ProjectUpdate(CrudUpdateBody[m.Project]):
    email: str | None = None
    name: str | None = None
    description: str | None = None
    is_active: bool | None = None


@router.get('/list')
async def list_projects(
    query: ListParams = Depends(),
    session: AsyncSession = Depends(db_session_dependency),
) -> BaseListOutput[ProjectOutput]:
    q = sa.select(m.Project)
    count = await count_select_query_results(q, session=session)
    q = q.limit(query.limit).offset(query.offset)
    objs_ = await session.scalars(q)
    return BaseListOutput.make(
        count=count,
        limit=query.limit,
        offset=query.offset,
        items=[
            ProjectOutput.from_obj(obj)
            for obj in objs_.all()
        ],
    )


@router.get('/{project_id}')
async def get_project(
    project_id: int,
    session: AsyncSession = Depends(db_session_dependency),
) -> SuccessPayloadOutput[ProjectOutput]:
    obj = await session.scalar(sa.select(m.Project).where(m.Project.id == project_id))
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Project not found')
    return SuccessPayloadOutput(payload=ProjectOutput.from_obj(obj))


@router.post('/')
async def create_project(
    body: ProjectCreate,
    session: AsyncSession = Depends(db_session_dependency),
    _ = Depends(admin_context_dependency),
) -> ModelIdOutput:
    obj = m.Project(
        name=body.name,
        description=body.description,
        is_active=body.is_active,
    )
    session.add(obj)
    await session.commit()
    return ModelIdOutput.from_obj(obj)


@router.put('/{project_id}')
async def update_project(
    project_id: int,
    body: ProjectUpdate,
    session: AsyncSession = Depends(db_session_dependency),
    _ = Depends(admin_context_dependency),
) -> ModelIdOutput:
    obj = await session.scalar(sa.select(m.Project).where(m.Project.id == project_id))
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Project not found')
    body.update_obj(obj)
    await session.commit()
    return ModelIdOutput.from_obj(obj)
