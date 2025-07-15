from http import HTTPStatus

from beanie import PydanticObjectId
from fastapi import Depends, HTTPException
from pydantic import BaseModel

import pm.models as m
from pm.api.context import admin_context_dependency
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
from pm.permissions import Permissions

__all__ = ('router',)


router = APIRouter(
    prefix='/role',
    tags=['role'],
    dependencies=[Depends(admin_context_dependency)],
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
        (HTTPStatus.FORBIDDEN, ErrorOutput),
    ),
)
async def list_roles(
    query: ListParams = Depends(),
) -> BaseListOutput[RoleOutput]:
    q = m.Role.find()
    query.apply_filter(q, m.Role)
    query.apply_sort(q, m.Role, (m.Role.name,))
    if query.search:
        q = q.find(m.Role.search_query(query.search))
    return await BaseListOutput.make_from_query(
        q,
        limit=query.limit,
        offset=query.offset,
        projection_fn=RoleOutput.from_obj,
    )


@router.get(
    '/{role_id}',
    responses=error_responses(
        (HTTPStatus.UNAUTHORIZED, ErrorOutput),
        (HTTPStatus.FORBIDDEN, ErrorOutput),
        (HTTPStatus.NOT_FOUND, ErrorOutput),
    ),
)
async def get_role(
    role_id: PydanticObjectId,
) -> SuccessPayloadOutput[RoleOutput]:
    obj = await m.Role.find_one(m.Role.id == role_id)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Role not found')
    return SuccessPayloadOutput(payload=RoleOutput.from_obj(obj))


@router.post('')
async def create_role(
    body: RoleCreate,
) -> SuccessPayloadOutput[RoleOutput]:
    obj = m.Role(name=body.name, description=body.description)
    await obj.insert()
    return SuccessPayloadOutput(payload=RoleOutput.from_obj(obj))


@router.put(
    '/{role_id}',
    responses=error_responses(
        (HTTPStatus.BAD_REQUEST, ErrorOutput),
        (HTTPStatus.UNAUTHORIZED, ErrorOutput),
        (HTTPStatus.FORBIDDEN, ErrorOutput),
        (HTTPStatus.NOT_FOUND, ErrorOutput),
        (HTTPStatus.UNPROCESSABLE_ENTITY, ErrorOutput),
    ),
)
async def update_role(
    role_id: PydanticObjectId,
    body: RoleUpdate,
) -> SuccessPayloadOutput[RoleOutput]:
    obj: m.Role | None = await m.Role.find_one(m.Role.id == role_id)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Role not found')
    for k, v in body.dict(exclude_unset=True).items():
        setattr(obj, k, v)
    if obj.is_changed:
        await obj.save_changes()
        await m.Project.update_role_embedded_links(obj)
    return SuccessPayloadOutput(payload=RoleOutput.from_obj(obj))


@router.delete(
    '/{role_id}',
    responses=error_responses(
        (HTTPStatus.UNAUTHORIZED, ErrorOutput),
        (HTTPStatus.FORBIDDEN, ErrorOutput),
        (HTTPStatus.NOT_FOUND, ErrorOutput),
    ),
)
async def delete_role(
    role_id: PydanticObjectId,
) -> ModelIdOutput:
    obj = await m.Role.find_one(m.Role.id == role_id)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Role not found')
    await obj.delete()
    await m.Project.remove_role_embedded_links(role_id)
    return ModelIdOutput.make(role_id)


@router.post(
    '/{role_id}/permission/{permission_key}',
    responses=error_responses(
        (HTTPStatus.BAD_REQUEST, ErrorOutput),
        (HTTPStatus.UNAUTHORIZED, ErrorOutput),
        (HTTPStatus.FORBIDDEN, ErrorOutput),
        (HTTPStatus.UNPROCESSABLE_ENTITY, ErrorOutput),
    ),
)
async def grant_permission(
    role_id: PydanticObjectId,
    permission_key: Permissions,
) -> SuccessPayloadOutput[RoleOutput]:
    obj: m.Role | None = await m.Role.find_one(m.Role.id == role_id)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Role not found')
    if permission_key in obj.permissions:
        raise HTTPException(HTTPStatus.CONFLICT, 'Permission already granted')
    obj.permissions.append(permission_key)
    await obj.save_changes()
    await m.Project.update_role_embedded_links(obj)
    return SuccessPayloadOutput(payload=RoleOutput.from_obj(obj))


@router.delete(
    '/{role_id}/permission/{permission_key}',
    responses=error_responses(
        (HTTPStatus.UNAUTHORIZED, ErrorOutput),
        (HTTPStatus.FORBIDDEN, ErrorOutput),
        (HTTPStatus.NOT_FOUND, ErrorOutput),
    ),
)
async def revoke_permission(
    role_id: PydanticObjectId,
    permission_key: Permissions,
) -> SuccessPayloadOutput[RoleOutput]:
    obj = await m.Role.find_one(m.Role.id == role_id)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Role not found')
    if permission_key not in obj.permissions:
        raise HTTPException(HTTPStatus.CONFLICT, 'Permission not granted')
    obj.permissions.remove(permission_key)
    await obj.replace()
    await m.Project.update_role_embedded_links(obj)
    return SuccessPayloadOutput(payload=RoleOutput.from_obj(obj))
