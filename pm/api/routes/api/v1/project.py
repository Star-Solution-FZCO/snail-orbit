from http import HTTPStatus
from typing import Self
from uuid import UUID

from beanie import PydanticObjectId
from fastapi import Depends, HTTPException
from pydantic import BaseModel

import pm.models as m
from pm.api.context import admin_context_dependency, current_user_context_dependency
from pm.api.utils.router import APIRouter
from pm.api.views.custom_fields import (
    CustomFieldOutput,
    CustomFieldOutputWithEnumOptions,
)
from pm.api.views.factories.crud import CrudCreateBody, CrudOutput, CrudUpdateBody
from pm.api.views.group import GroupOutput
from pm.api.views.output import (
    BaseListOutput,
    ModelIdOutput,
    SuccessPayloadOutput,
    UUIDOutput,
)
from pm.api.views.pararams import ListParams
from pm.api.views.role import RoleOutput
from pm.api.views.user import UserOutput

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


class ProjectPermissionOutput(BaseModel):
    id: UUID
    target_type: m.PermissionTargetType
    target: GroupOutput | UserOutput
    role: RoleOutput

    @classmethod
    def from_obj(cls, obj: m.ProjectPermission) -> Self:
        if obj.target_type == m.PermissionTargetType.USER:
            target = UserOutput.from_obj(obj.target)
        else:
            target = GroupOutput.from_obj(obj.target)
        return cls(
            id=obj.id,
            target_type=obj.target_type,
            target=target,
            role=RoleOutput.from_obj(obj.role),
        )


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


class GrantPermissionBody(BaseModel):
    target_type: m.PermissionTargetType
    target_id: PydanticObjectId
    role_id: PydanticObjectId


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
    obj = await m.Project.find_one(m.Project.id == project_id, fetch_links=True)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Project not found')
    return SuccessPayloadOutput(payload=ProjectOutput.from_obj(obj))


@router.post('/')
async def create_project(
    body: ProjectCreate,
    _=Depends(admin_context_dependency),
) -> SuccessPayloadOutput[ProjectOutput]:
    obj = body.create_obj(m.Project)
    await obj.insert()
    return SuccessPayloadOutput(payload=ProjectOutput.from_obj(obj))


@router.put('/{project_id}')
async def update_project(
    project_id: PydanticObjectId,
    body: ProjectUpdate,
    _=Depends(admin_context_dependency),
) -> SuccessPayloadOutput[ProjectOutput]:
    obj = await m.Project.find_one(m.Project.id == project_id, fetch_links=True)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Project not found')
    body.update_obj(obj)
    if obj.is_changed:
        await obj.save_changes()
    return SuccessPayloadOutput(payload=ProjectOutput.from_obj(obj))


@router.delete('/{project_id}')
async def delete_project(
    project_id: PydanticObjectId,
    _=Depends(admin_context_dependency),
) -> ModelIdOutput:
    obj = await m.Project.find_one(m.Project.id == project_id)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Project not found')
    await obj.delete()
    return ModelIdOutput.make(project_id)


@router.post('/{project_id}/field/{field_id}')
async def add_field(
    project_id: PydanticObjectId,
    field_id: PydanticObjectId,
) -> SuccessPayloadOutput[ProjectOutput]:
    project = await m.Project.find_one(m.Project.id == project_id, fetch_links=True)
    if not project:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Project not found')
    field = await m.CustomField.find_one(
        m.CustomField.id == field_id, with_children=True
    )
    if not field:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Field not found')
    if field in project.custom_fields:
        raise HTTPException(HTTPStatus.CONFLICT, 'Field already added to project')
    if any(field.name == f.name for f in project.custom_fields):
        raise HTTPException(
            HTTPStatus.CONFLICT, 'Field with the same name already in project'
        )
    project.custom_fields.append(field)
    if project.is_changed:
        await project.save_changes()
    return SuccessPayloadOutput(payload=ProjectOutput.from_obj(project))


@router.delete('/{project_id}/field/{field_id}')
async def remove_field(
    project_id: PydanticObjectId,
    field_id: PydanticObjectId,
) -> SuccessPayloadOutput[ProjectOutput]:
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
    return SuccessPayloadOutput(payload=ProjectOutput.from_obj(project))


@router.get('/{project_id}/permissions')
async def get_project_permissions(
    project_id: PydanticObjectId,
    query: ListParams = Depends(),
) -> BaseListOutput[ProjectPermissionOutput]:
    project = await m.Project.find_one(m.Project.id == project_id)
    if not project:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Project not found')
    return BaseListOutput.make(
        count=len(project.permissions),
        limit=query.limit,
        offset=query.offset,
        items=[
            ProjectPermissionOutput.from_obj(perm)
            for perm in project.permissions[query.offset : query.offset + query.limit]
        ],
    )


@router.post('/{project_id}/permission')
async def grant_permission(
    project_id: PydanticObjectId,
    body: GrantPermissionBody,
) -> UUIDOutput:
    project: m.Project | None = await m.Project.find_one(m.Project.id == project_id)
    if not project:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Project not found')
    role: m.Role | None = await m.Role.find_one(m.Role.id == body.role_id)
    if not role:
        raise HTTPException(HTTPStatus.BAD_REQUEST, 'Role not found')
    if body.target_type == m.PermissionTargetType.USER:
        user: m.User | None = await m.User.find_one(m.User.id == body.target_id)
        if not user:
            raise HTTPException(HTTPStatus.BAD_REQUEST, 'User not found')
        permission = m.ProjectPermission(
            target_type=body.target_type,
            target=m.UserLinkField.from_obj(user),
            role=m.RoleLinkField.from_obj(role),
        )
    else:  # m.PermissionTargetType.GROUP
        group: m.Group | None = await m.Group.find_one(m.Group.id == body.target_id)
        if not group:
            raise HTTPException(HTTPStatus.BAD_REQUEST, 'Group not found')
        permission = m.ProjectPermission(
            target_type=body.target_type,
            target=m.GroupLinkField.from_obj(group),
            role=m.RoleLinkField.from_obj(role),
        )
    project.permissions.append(permission)
    await project.save_changes()
    return UUIDOutput.make(permission.id)


@router.delete('/{project_id}/permission/{permission_id}')
async def revoke_permission(
    project_id: PydanticObjectId,
    permission_id: UUID,
) -> UUIDOutput:
    project = await m.Project.find_one(m.Project.id == project_id)
    if not project:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Project not found')
    if not any(perm.id == permission_id for perm in project.permissions):
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Permission not found')
    project.permissions = [
        perm for perm in project.permissions if perm.id != permission_id
    ]
    await project.replace()
    return UUIDOutput.make(permission_id)
