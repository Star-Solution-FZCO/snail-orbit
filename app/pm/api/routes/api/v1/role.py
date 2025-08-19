from http import HTTPStatus

from beanie import PydanticObjectId
from fastapi import Depends, HTTPException
from pydantic import BaseModel

import pm.models as m
from pm.api.context import (
    admin_context_dependency,
    current_user_context_dependency,
)
from pm.api.utils.router import APIRouter
from pm.api.views.error_responses import AUTH_ERRORS, error_responses
from pm.api.views.output import (
    BaseListOutput,
    ErrorOutput,
    ModelIdOutput,
    SuccessPayloadOutput,
)
from pm.api.views.params import ListParams
from pm.api.views.role import RoleOutput
from pm.permissions import ProjectPermissions

__all__ = ('router',)


router = APIRouter(
    prefix='/role',
    tags=['role'],
    dependencies=[Depends(current_user_context_dependency)],
    responses=error_responses(*AUTH_ERRORS),
)


class RoleCreate(BaseModel):
    name: str
    description: str | None = None


class RoleUpdate(BaseModel):
    name: str | None = None
    description: str | None = None


@router.get(
    '/list',
    responses=error_responses(
        (HTTPStatus.UNAUTHORIZED, ErrorOutput),
    ),
)
async def list_roles(
    query: ListParams = Depends(),
) -> BaseListOutput[RoleOutput]:
    q = m.ProjectRole.find()
    query.apply_filter(q, m.ProjectRole)
    query.apply_sort(q, m.ProjectRole, (m.ProjectRole.name,))
    if query.search:
        q = q.find(m.ProjectRole.search_query(query.search))
    return await BaseListOutput.make_from_query(
        q,
        limit=query.limit,
        offset=query.offset,
        projection_fn=RoleOutput.from_obj,
    )


@router.get(
    '/{role_id}',
    responses=error_responses(
        (HTTPStatus.NOT_FOUND, ErrorOutput),
    ),
)
async def get_role(
    role_id: PydanticObjectId,
) -> SuccessPayloadOutput[RoleOutput]:
    obj = await m.ProjectRole.find_one(m.ProjectRole.id == role_id)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Role not found')
    return SuccessPayloadOutput(payload=RoleOutput.from_obj(obj))


@router.post('', dependencies=[Depends(admin_context_dependency)])
async def create_role(
    body: RoleCreate,
) -> SuccessPayloadOutput[RoleOutput]:
    obj = m.ProjectRole(name=body.name, description=body.description)
    await obj.insert()
    return SuccessPayloadOutput(payload=RoleOutput.from_obj(obj))


@router.put(
    '/{role_id}',
    dependencies=[Depends(admin_context_dependency)],
    responses=error_responses(
        (HTTPStatus.BAD_REQUEST, ErrorOutput),
        (HTTPStatus.NOT_FOUND, ErrorOutput),
        (HTTPStatus.UNPROCESSABLE_ENTITY, ErrorOutput),
    ),
)
async def update_role(
    role_id: PydanticObjectId,
    body: RoleUpdate,
) -> SuccessPayloadOutput[RoleOutput]:
    obj: m.ProjectRole | None = await m.ProjectRole.find_one(
        m.ProjectRole.id == role_id
    )
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Role not found')

    # Prevent modification of system roles
    if obj.is_system_role:
        raise HTTPException(
            HTTPStatus.FORBIDDEN,
            f'System role "{obj.name}" cannot be modified or deleted',
        )

    for k, v in body.dict(exclude_unset=True).items():
        setattr(obj, k, v)
    if obj.is_changed:
        await obj.save_changes()
        await m.Project.update_role_embedded_links(obj)
    return SuccessPayloadOutput(payload=RoleOutput.from_obj(obj))


@router.delete(
    '/{role_id}',
    dependencies=[Depends(admin_context_dependency)],
    responses=error_responses(
        (HTTPStatus.NOT_FOUND, ErrorOutput),
    ),
)
async def delete_role(
    role_id: PydanticObjectId,
) -> ModelIdOutput:
    obj = await m.ProjectRole.find_one(m.ProjectRole.id == role_id)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Role not found')

    if obj.is_system_role:
        raise HTTPException(
            HTTPStatus.FORBIDDEN,
            f'System role "{obj.name}" cannot be modified or deleted',
        )

    await obj.delete()
    await m.Project.remove_role_embedded_links(role_id)
    return ModelIdOutput.make(role_id)


@router.post(
    '/{role_id}/permission/{permission_key}',
    dependencies=[Depends(admin_context_dependency)],
    responses=error_responses(
        (HTTPStatus.BAD_REQUEST, ErrorOutput),
        (HTTPStatus.UNPROCESSABLE_ENTITY, ErrorOutput),
    ),
)
async def grant_permission(
    role_id: PydanticObjectId,
    permission_key: ProjectPermissions,
) -> SuccessPayloadOutput[RoleOutput]:
    obj: m.ProjectRole | None = await m.ProjectRole.find_one(
        m.ProjectRole.id == role_id
    )
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Role not found')

    if obj.is_system_role:
        raise HTTPException(
            HTTPStatus.FORBIDDEN,
            f'System role "{obj.name}" cannot be modified or deleted',
        )

    if permission_key in obj.permissions:
        raise HTTPException(HTTPStatus.CONFLICT, 'Permission already granted')
    obj.permissions.append(permission_key)
    await obj.save_changes()
    await m.Project.update_role_embedded_links(obj)
    return SuccessPayloadOutput(payload=RoleOutput.from_obj(obj))


@router.delete(
    '/{role_id}/permission/{permission_key}',
    dependencies=[Depends(admin_context_dependency)],
    responses=error_responses(
        (HTTPStatus.NOT_FOUND, ErrorOutput),
    ),
)
async def revoke_permission(
    role_id: PydanticObjectId,
    permission_key: ProjectPermissions,
) -> SuccessPayloadOutput[RoleOutput]:
    obj = await m.ProjectRole.find_one(m.ProjectRole.id == role_id)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Role not found')

    if obj.is_system_role:
        raise HTTPException(
            HTTPStatus.FORBIDDEN,
            f'System role "{obj.name}" cannot be modified or deleted',
        )

    if permission_key not in obj.permissions:
        raise HTTPException(HTTPStatus.CONFLICT, 'Permission not granted')
    obj.permissions.remove(permission_key)
    await obj.replace()
    await m.Project.update_role_embedded_links(obj)
    return SuccessPayloadOutput(payload=RoleOutput.from_obj(obj))
