from http import HTTPStatus
from itertools import chain
from typing import Annotated, Self
from uuid import UUID

from beanie import PydanticObjectId
from fastapi import Depends, HTTPException
from pydantic import BaseModel, Field

import pm.models as m
from pm.api.context import current_user, current_user_context_dependency
from pm.api.issue_query import IssueQueryTransformError, transform_query
from pm.api.utils.router import APIRouter
from pm.api.views.error_responses import error_responses
from pm.api.views.output import (
    BaseListOutput,
    ErrorOutput,
    ModelIdOutput,
    SuccessPayloadOutput,
    UUIDOutput,
)
from pm.api.views.params import ListParams
from pm.api.views.permission import PermissionOutput
from pm.api.views.user import UserOutput

__all__ = ('router',)

router = APIRouter(
    prefix='/search',
    tags=['search'],
    dependencies=[Depends(current_user_context_dependency)],
    responses=error_responses(
        (HTTPStatus.UNAUTHORIZED, ErrorOutput),
        (HTTPStatus.FORBIDDEN, ErrorOutput),
    ),
)


class SearchOutput(BaseModel):
    id: PydanticObjectId
    name: str
    query: str
    description: str | None
    created_by: UserOutput
    permissions: list[PermissionOutput]
    current_permission: m.PermissionType = Field(description='Current user permission')

    @classmethod
    def from_obj(cls, obj: m.Search) -> Self:
        user_ctx = current_user()
        return cls(
            id=obj.id,
            name=obj.name,
            query=obj.query,
            description=obj.description,
            created_by=UserOutput.from_obj(obj.created_by),
            permissions=[
                PermissionOutput.from_obj(p) for p in obj.filter_permissions(user_ctx)
            ],
            current_permission=obj.user_permission(user_ctx),
        )


class GrantPermissionBody(BaseModel):
    target_type: m.PermissionTargetType
    target: PydanticObjectId
    permission_type: m.PermissionType


class SearchCreate(BaseModel):
    name: str
    query: str
    description: str | None = None
    permissions: Annotated[list[GrantPermissionBody], Field(default_factory=list)]


class SearchUpdate(BaseModel):
    name: str | None = None
    query: str | None = None
    description: str | None = None
    permissions: list[GrantPermissionBody] | None = None


@router.get('/list')
async def list_searches(
    query: ListParams = Depends(),
) -> BaseListOutput[SearchOutput]:
    user_ctx = current_user()
    user_groups = [
        g.id for g in chain(user_ctx.user.groups, user_ctx.predefined_groups)
    ]
    permission_type = {'$in': [perm.value for perm in m.PermissionType]}
    filter_query = {
        '$or': [
            {
                'permissions': {
                    '$elemMatch': {
                        'target_type': m.PermissionTargetType.USER,
                        'target.id': user_ctx.user.id,
                        'permission_type': permission_type,
                    },
                },
            },
            {
                'permissions': {
                    '$elemMatch': {
                        'target_type': m.PermissionTargetType.GROUP,
                        'target.id': {'$in': user_groups},
                        'permission_type': permission_type,
                    },
                },
            },
        ],
    }
    q = m.Search.find(filter_query).sort(m.Search.name)
    if query.search:
        q = q.find(m.Search.search_query(query.search))
    return await BaseListOutput.make_from_query(
        q,
        limit=query.limit,
        offset=query.offset,
        projection_fn=SearchOutput.from_obj,
    )


@router.post('/')
async def create_search(body: SearchCreate) -> SuccessPayloadOutput[SearchOutput]:
    user_ctx = current_user()
    try:
        await transform_query(body.query)
    except IssueQueryTransformError as err:
        raise HTTPException(HTTPStatus.BAD_REQUEST, err.message) from err
    except Exception as err:
        raise HTTPException(HTTPStatus.BAD_REQUEST, str(err)) from err
    permissions = [
        m.PermissionRecord(
            target_type=m.PermissionTargetType.USER,
            target=m.UserLinkField.from_obj(user_ctx.user),
            permission_type=m.PermissionType.ADMIN,
        ),
    ]
    if len(body.permissions) != len({perm.target for perm in body.permissions}):
        raise HTTPException(HTTPStatus.BAD_REQUEST, 'Duplicate permission targets')
    for perm in body.permissions:
        if perm.target == user_ctx.user.id:
            continue
        target = await resolve_grant_permission_target(perm)
        permissions.append(
            m.PermissionRecord(
                target_type=perm.target_type,
                target=target,
                permission_type=perm.permission_type,
            ),
        )
    search = m.Search(
        name=body.name,
        query=body.query,
        description=body.description,
        created_by=m.UserLinkField.from_obj(user_ctx.user),
        permissions=permissions,
    )
    await search.insert()
    return SuccessPayloadOutput(payload=SearchOutput.from_obj(search))


@router.get('/{search_id}')
async def get_search(
    search_id: PydanticObjectId,
) -> SuccessPayloadOutput[SearchOutput]:
    search = await m.Search.find_one(m.Search.id == search_id)
    if not search:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Search not found')
    user_ctx = current_user()
    if not search.check_permissions(user_ctx, m.PermissionType.VIEW):
        raise HTTPException(HTTPStatus.FORBIDDEN, 'No permission to view this search')
    return SuccessPayloadOutput(payload=SearchOutput.from_obj(search))


@router.delete('/{search_id}')
async def delete_search(search_id: PydanticObjectId) -> ModelIdOutput:
    user_ctx = current_user()
    search = await m.Search.find_one(m.Search.id == search_id)
    if not search:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Search not found')
    if not search.check_permissions(user_ctx, m.PermissionType.ADMIN):
        raise HTTPException(HTTPStatus.FORBIDDEN, 'No permission to delete this search')
    await search.delete()
    return ModelIdOutput.from_obj(search)


@router.put('/{search_id}')
async def update_search(
    search_id: PydanticObjectId,
    body: SearchUpdate,
) -> SuccessPayloadOutput[SearchOutput]:
    search: m.Search | None = await m.Search.find_one(m.Search.id == search_id)
    if not search:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Search not found')
    user_ctx = current_user()
    if not search.check_permissions(user_ctx, m.PermissionType.EDIT):
        raise HTTPException(HTTPStatus.FORBIDDEN, 'No permission to edit this search')
    if body.permissions:
        if not search.check_permissions(user_ctx, m.PermissionType.ADMIN):
            raise HTTPException(
                HTTPStatus.FORBIDDEN,
                'You cannot modify permissions for this search',
            )
        if len(body.permissions) != len({perm.target for perm in body.permissions}):
            raise HTTPException(HTTPStatus.BAD_REQUEST, 'Duplicate permission targets')
        permissions = [
            m.PermissionRecord(
                target_type=perm.target_type,
                target=await resolve_grant_permission_target(perm),
                permission_type=perm.permission_type,
            )
            for perm in body.permissions
        ]
        if all(perm.permission_type != m.PermissionType.ADMIN for perm in permissions):
            raise HTTPException(
                HTTPStatus.BAD_REQUEST,
                'Search must have at least one admin',
            )
        search.permissions = permissions
    for k, v in body.model_dump(exclude_unset=True, exclude={'permissions'}).items():
        setattr(search, k, v)
    if search.is_changed:
        await search.save_changes()
    return SuccessPayloadOutput(payload=SearchOutput.from_obj(search))


@router.post('/{search_id}/permission')
async def grant_permission(
    search_id: PydanticObjectId,
    body: GrantPermissionBody,
) -> UUIDOutput:
    user_ctx = current_user()
    search = await m.Search.find_one(m.Search.id == search_id)
    if not search:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail='Search not found')
    if not search.check_permissions(user_ctx, m.PermissionType.ADMIN):
        raise HTTPException(
            status_code=HTTPStatus.FORBIDDEN,
            detail='You cannot modify permissions for this search',
        )
    target = await resolve_grant_permission_target(body)
    if search.has_permission_for_target(target):
        raise HTTPException(
            status_code=HTTPStatus.CONFLICT,
            detail='Permission already granted',
        )
    permission = m.PermissionRecord(
        target_type=body.target_type,
        target=target,
        permission_type=body.permission_type,
    )
    search.permissions.append(permission)
    await search.save_changes()
    return UUIDOutput.make(permission.id)


@router.delete('/{search_id}/permission/{permission_id}')
async def revoke_permission(
    search_id: PydanticObjectId,
    permission_id: UUID,
) -> UUIDOutput:
    user_ctx = current_user()
    search = await m.Search.find_one(m.Search.id == search_id)
    if not search:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail='Search not found')
    if not search.check_permissions(user_ctx, m.PermissionType.ADMIN):
        raise HTTPException(
            status_code=HTTPStatus.FORBIDDEN,
            detail='You cannot modify permissions for this search',
        )
    if not (
        perm := next(
            (obj for obj in search.permissions if obj.id == permission_id),
            None,
        )
    ):
        raise HTTPException(
            status_code=HTTPStatus.NOT_FOUND,
            detail='Permission not found',
        )
    if (
        perm.permission_type == m.PermissionType.ADMIN
        and not search.has_any_other_admin_target(perm.target)
    ):
        raise HTTPException(
            HTTPStatus.BAD_REQUEST,
            'Search must have at least one admin',
        )
    search.permissions.remove(perm)
    await search.save_changes()
    return UUIDOutput.make(perm.id)


async def resolve_grant_permission_target(
    body: GrantPermissionBody,
) -> m.UserLinkField | m.GroupLinkField:
    if body.target_type == m.PermissionTargetType.USER:
        user: m.User | None = await m.User.find_one(m.User.id == body.target)
        if not user:
            raise HTTPException(HTTPStatus.BAD_REQUEST, 'User not found')
        return m.UserLinkField.from_obj(user)
    group: m.Group | None = await m.Group.find_one(m.Group.id == body.target)
    if not group:
        raise HTTPException(HTTPStatus.BAD_REQUEST, 'Group not found')
    return m.GroupLinkField.from_obj(group)
