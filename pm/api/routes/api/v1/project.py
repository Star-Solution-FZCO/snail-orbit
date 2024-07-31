from http import HTTPStatus

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException

import pm.models as m
from pm.api.context import admin_context_dependency, current_user_context_dependency
from pm.api.views.factories.crud import CrudCreateBody, CrudOutput, CrudUpdateBody
from pm.api.views.output import BaseListOutput, ModelIdOutput, SuccessPayloadOutput
from pm.api.views.pararams import ListParams

__all__ = ('router',)

router = APIRouter(
    prefix='/project',
    tags=['project'],
    dependencies=[Depends(current_user_context_dependency)],
)


class ProjectOutput(CrudOutput[m.Project]):
    name: str
    slug: str
    description: str | None
    is_active: bool


class ProjectCreate(CrudCreateBody[m.Project]):
    name: str
    slug: str
    description: str | None = None
    is_active: bool = True


class ProjectUpdate(CrudUpdateBody[m.Project]):
    name: str | None = None
    slug: str | None = None
    description: str | None = None
    is_active: bool | None = None


@router.get('/list')
async def list_projects(
    query: ListParams = Depends(),
) -> BaseListOutput[ProjectOutput]:
    q = m.Project.find().sort(m.Project.id)
    results = []
    async for obj in q.limit(query.limit).skip(query.offset):
        results.append(ProjectOutput.from_obj(obj))
    return BaseListOutput.make(
        count=await q.count(),
        limit=query.limit,
        offset=query.offset,
        items=results,
    )


@router.get('/{project_id}')
async def get_project(
    project_id: PydanticObjectId,
) -> SuccessPayloadOutput[ProjectOutput]:
    obj = await m.Project.find_one(m.Project.id == project_id)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Project not found')
    return SuccessPayloadOutput(payload=ProjectOutput.from_obj(obj))


@router.post('/')
async def create_project(
    body: ProjectCreate,
    _=Depends(admin_context_dependency),
) -> ModelIdOutput:
    obj = body.create_obj(m.Project)
    await obj.insert()
    return ModelIdOutput.from_obj(obj)


@router.put('/{project_id}')
async def update_project(
    project_id: PydanticObjectId,
    body: ProjectUpdate,
    _=Depends(admin_context_dependency),
) -> ModelIdOutput:
    obj = await m.Project.find_one(m.Project.id == project_id)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Project not found')
    body.update_obj(obj)
    await obj.save()
    return ModelIdOutput.from_obj(obj)
