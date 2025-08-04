from http import HTTPStatus

from beanie import PydanticObjectId
from fastapi import Depends, HTTPException
from pydantic import BaseModel

import pm.models as m
from pm.api.context import admin_context_dependency
from pm.api.utils.router import APIRouter
from pm.api.views.error_responses import AUTH_ERRORS, error_responses
from pm.api.views.global_role import (
    GlobalRoleOutput,
    GlobalRoleSimpleOutput,
)
from pm.api.views.output import (
    BaseListOutput,
    ErrorOutput,
    ModelIdOutput,
    SuccessPayloadOutput,
)
from pm.api.views.params import ListParams
from pm.api.views.select import SelectParams
from pm.permissions import GlobalPermissions

__all__ = ('router',)


router = APIRouter(
    prefix='/global-role',
    tags=['global-role'],
    dependencies=[Depends(admin_context_dependency)],
    responses=error_responses(*AUTH_ERRORS),
)


class GlobalRoleCreate(BaseModel):
    name: str
    description: str | None = None


class GlobalRoleUpdate(BaseModel):
    name: str | None = None
    description: str | None = None


@router.get(
    '/list',
    responses=error_responses(
        (HTTPStatus.UNAUTHORIZED, ErrorOutput),
        (HTTPStatus.FORBIDDEN, ErrorOutput),
    ),
)
async def list_global_roles(
    query: ListParams = Depends(),
) -> BaseListOutput[GlobalRoleOutput]:
    q = m.GlobalRole.find()
    query.apply_filter(q, m.GlobalRole)
    query.apply_sort(q, m.GlobalRole, (m.GlobalRole.name,))
    if query.search:
        q = q.find(m.GlobalRole.search_query(query.search))
    return await BaseListOutput.make_from_query(
        q,
        limit=query.limit,
        offset=query.offset,
        projection_fn=GlobalRoleOutput.from_obj,
    )


@router.get(
    '/select',
    responses=error_responses(
        (HTTPStatus.UNAUTHORIZED, ErrorOutput),
        (HTTPStatus.FORBIDDEN, ErrorOutput),
    ),
)
async def select_global_roles(
    query: SelectParams = Depends(),
) -> BaseListOutput[GlobalRoleSimpleOutput]:
    q = m.GlobalRole.find().sort(m.GlobalRole.name)
    if query.search:
        q = q.find(m.GlobalRole.search_query(query.search))
    return await BaseListOutput.make_from_query(
        q,
        limit=query.limit,
        offset=query.offset,
        projection_fn=GlobalRoleSimpleOutput.from_obj,
    )


@router.get(
    '/{role_id}',
    responses=error_responses(
        (HTTPStatus.UNAUTHORIZED, ErrorOutput),
        (HTTPStatus.FORBIDDEN, ErrorOutput),
        (HTTPStatus.NOT_FOUND, ErrorOutput),
    ),
)
async def get_global_role(
    role_id: PydanticObjectId,
) -> SuccessPayloadOutput[GlobalRoleOutput]:
    obj = await m.GlobalRole.find_one(m.GlobalRole.id == role_id)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Global role not found')
    return SuccessPayloadOutput(payload=GlobalRoleOutput.from_obj(obj))


@router.post('')
async def create_global_role(
    body: GlobalRoleCreate,
) -> SuccessPayloadOutput[GlobalRoleOutput]:
    obj = m.GlobalRole(name=body.name, description=body.description)
    await obj.insert()
    return SuccessPayloadOutput(payload=GlobalRoleOutput.from_obj(obj))


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
async def update_global_role(
    role_id: PydanticObjectId,
    body: GlobalRoleUpdate,
) -> SuccessPayloadOutput[GlobalRoleOutput]:
    obj: m.GlobalRole | None = await m.GlobalRole.find_one(m.GlobalRole.id == role_id)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Global role not found')

    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    if obj.is_changed:
        await obj.save_changes()
        # Update embedded links in groups that reference this global role
        await m.Group.update_global_role_embedded_links(obj)
    return SuccessPayloadOutput(payload=GlobalRoleOutput.from_obj(obj))


@router.delete(
    '/{role_id}',
    responses=error_responses(
        (HTTPStatus.UNAUTHORIZED, ErrorOutput),
        (HTTPStatus.FORBIDDEN, ErrorOutput),
        (HTTPStatus.NOT_FOUND, ErrorOutput),
    ),
)
async def delete_global_role(
    role_id: PydanticObjectId,
) -> ModelIdOutput:
    obj = await m.GlobalRole.find_one(m.GlobalRole.id == role_id)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Global role not found')

    await obj.delete()
    # Remove embedded links from groups and users
    await m.Group.remove_global_role_embedded_links(role_id)
    # Also need to remove from users if they have direct global role assignments
    await m.User.find().update(
        {'$pull': {'global_roles': {'id': role_id}}},
    )
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
async def grant_global_permission(
    role_id: PydanticObjectId,
    permission_key: GlobalPermissions,
) -> SuccessPayloadOutput[GlobalRoleOutput]:
    obj: m.GlobalRole | None = await m.GlobalRole.find_one(m.GlobalRole.id == role_id)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Global role not found')

    if permission_key in obj.permissions:
        raise HTTPException(HTTPStatus.CONFLICT, 'Permission already granted')
    obj.permissions.append(permission_key)
    await obj.save_changes()
    # Update embedded links in groups that reference this global role
    await m.Group.update_global_role_embedded_links(obj)
    return SuccessPayloadOutput(payload=GlobalRoleOutput.from_obj(obj))


@router.delete(
    '/{role_id}/permission/{permission_key}',
    responses=error_responses(
        (HTTPStatus.UNAUTHORIZED, ErrorOutput),
        (HTTPStatus.FORBIDDEN, ErrorOutput),
        (HTTPStatus.NOT_FOUND, ErrorOutput),
    ),
)
async def revoke_global_permission(
    role_id: PydanticObjectId,
    permission_key: GlobalPermissions,
) -> SuccessPayloadOutput[GlobalRoleOutput]:
    obj = await m.GlobalRole.find_one(m.GlobalRole.id == role_id)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Global role not found')

    if permission_key not in obj.permissions:
        raise HTTPException(HTTPStatus.CONFLICT, 'Permission not granted')
    obj.permissions.remove(permission_key)
    await obj.replace()
    # Update embedded links in groups that reference this global role
    await m.Group.update_global_role_embedded_links(obj)
    return SuccessPayloadOutput(payload=GlobalRoleOutput.from_obj(obj))
