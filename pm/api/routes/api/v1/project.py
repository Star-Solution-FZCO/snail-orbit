from http import HTTPStatus

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

import pm.models as m
from pm.api.context import admin_context_dependency, current_user_context_dependency
from pm.api.views.custom_fields import (
    CustomFieldOutput,
    CustomFieldOutputWithEnumOptions,
)
from pm.api.views.factories.crud import CrudCreateBody, CrudOutput, CrudUpdateBody
from pm.api.views.output import BaseListOutput, ModelIdOutput, SuccessPayloadOutput
from pm.api.views.pararams import ListParams

__all__ = ('router',)

router = APIRouter(
    prefix='/project',
    tags=['project'],
    dependencies=[Depends(current_user_context_dependency)],
)


class ProjectListOutput(CrudOutput[m.Project]):
    name: str
    slug: str
    description: str | None
    is_active: bool


class ProjectOutput(BaseModel):
    id: PydanticObjectId
    name: str
    slug: str
    description: str | None
    is_active: bool
    custom_fields: list[CustomFieldOutput | CustomFieldOutputWithEnumOptions]

    @classmethod
    def from_obj(cls, obj: m.Project) -> 'ProjectOutput':
        custom_fields = []
        for v in obj.custom_fields:
            if v.type in (m.CustomFieldTypeT.ENUM, m.CustomFieldTypeT.ENUM_MULTI):
                custom_fields.append(CustomFieldOutputWithEnumOptions.from_obj(v))
                continue
            custom_fields.append(CustomFieldOutput.from_obj(v))
        return cls(
            id=obj.id,
            name=obj.name,
            slug=obj.slug,
            description=obj.description,
            is_active=obj.is_active,
            custom_fields=custom_fields,
        )


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
) -> BaseListOutput[ProjectListOutput]:
    q = m.Project.find().sort(m.Project.id)
    results = []
    async for obj in q.limit(query.limit).skip(query.offset):
        results.append(ProjectListOutput.from_obj(obj))
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
    await obj.fetch_all_links()
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
    if obj.is_changed:
        await obj.save_changes()
    return ModelIdOutput.from_obj(obj)


@router.post('/{project_id}/field/{field_id}')
async def add_field(
    project_id: PydanticObjectId,
    field_id: PydanticObjectId,
) -> ModelIdOutput:
    project = await m.Project.find_one(m.Project.id == project_id, fetch_links=True)
    if not project:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Project not found')
    field = await m.CustomField.find_one(
        m.CustomField.id == field_id, with_children=True
    )
    if not field:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Field not found')
    project.custom_fields.append(field)
    if project.is_changed:
        await project.save_changes()
    return ModelIdOutput.from_obj(project)


@router.delete('/{project_id}/field/{field_id}')
async def remove_field(
    project_id: PydanticObjectId,
    field_id: PydanticObjectId,
) -> ModelIdOutput:
    project = await m.Project.find_one(m.Project.id == project_id, fetch_links=True)
    if not project:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Project not found')
    field = await m.CustomField.find_one(
        m.CustomField.id == field_id, with_children=True
    )
    if not field:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Field not found')
    try:
        project.custom_fields.remove(field)
    except ValueError as err:
        raise HTTPException(HTTPStatus.CONFLICT, 'Field not found in project') from err
    if project.is_changed:
        await project.save_changes()
    return ModelIdOutput.from_obj(project)
