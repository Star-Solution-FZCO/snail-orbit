from http import HTTPStatus
from typing import Self
from uuid import UUID

from beanie import PydanticObjectId
from fastapi import Depends, HTTPException
from pydantic import BaseModel

import pm.models as m
from pm.api.context import current_user, current_user_context_dependency
from pm.api.search.issue import TransformError, transform_query
from pm.api.utils.router import APIRouter
from pm.api.views.group import GroupOutput
from pm.api.views.output import (
    BaseListOutput,
    ModelIdOutput,
    SuccessPayloadOutput,
    UUIDOutput,
)
from pm.api.views.params import ListParams
from pm.api.views.user import UserOutput

__all__ = ('router',)

router = APIRouter(
    prefix='/search',
    tags=['search'],
    dependencies=[Depends(current_user_context_dependency)],
)


class SearchPermissionOutput(BaseModel):
    id: UUID
    target_type: m.PermissionTargetType
    target: UserOutput | GroupOutput
    permission_type: m.SearchPermissionType

    @classmethod
    def from_obj(cls, obj: m.SearchPermission) -> Self:
        target = (
            GroupOutput.from_obj(obj.target)
            if obj.target_type == m.PermissionTargetType.GROUP
            else UserOutput.from_obj(obj.target)
        )
        return cls(
            id=obj.id,
            target_type=obj.target_type,
            target=target,
            permission_type=obj.permission_type,
        )


class SearchOutput(BaseModel):
    id: PydanticObjectId
    name: str
    query: str
    description: str | None
    created_by: UserOutput
    permissions: list[SearchPermissionOutput]

    @classmethod
    def from_obj(cls, obj: m.Search) -> Self:
        user_ctx = current_user()
        user_group_ids = {g.id for g in user_ctx.user.groups}
        permissions = []
        for permission in obj.permissions:
            if permission.target_type == m.PermissionTargetType.GROUP:
                if permission.target.id in user_group_ids:
                    permissions.append(SearchPermissionOutput.from_obj(permission))
            if (
                permission.target_type == m.PermissionTargetType.USER
                and permission.target.id == user_ctx.user.id
            ):
                permissions.append(SearchPermissionOutput.from_obj(permission))

        return cls(
            id=obj.id,
            name=obj.name,
            query=obj.query,
            description=obj.description,
            created_by=UserOutput.from_obj(obj.created_by),
            permissions=permissions,
        )


class GrantPermissionBody(BaseModel):
    target_type: m.PermissionTargetType
    target: PydanticObjectId
    permission_type: m.SearchPermissionType


class SearchCreate(BaseModel):
    name: str
    query: str
    description: str | None = None


class SearchUpdate(SearchCreate):
    name: str | None = None
    query: str | None = None
    description: str | None = None


@router.get('/list')
async def list_searches(
    query: ListParams = Depends(),
) -> BaseListOutput[SearchOutput]:
    user_ctx = current_user()
    user_groups = [g.id for g in user_ctx.user.groups]
    permission_type = {'$in': [l.value for l in m.SearchPermissionType]}
    filter_query = {
        '$or': [
            {'created_by.id': user_ctx.user.id},
            {
                'permissions': {
                    '$elemMatch': {
                        'target_type': m.PermissionTargetType.USER,
                        'target.id': user_ctx.user.id,
                        'permission_type': permission_type,
                    }
                }
            },
            {
                'permissions': {
                    '$elemMatch': {
                        'target_type': m.PermissionTargetType.GROUP,
                        'target.id': {'$in': user_groups},
                        'permission_type': permission_type,
                    }
                }
            },
        ]
    }
    q = m.Search.find(filter_query).sort(m.Search.name)
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
    except TransformError as err:
        raise HTTPException(HTTPStatus.BAD_REQUEST, err.message)  # pylint: disable=raise-missing-from
    except Exception as err:
        raise HTTPException(HTTPStatus.BAD_REQUEST, str(err)) from err
    search = m.Search(
        name=body.name,
        query=body.query,
        description=body.description,
        created_by=m.UserLinkField.from_obj(user_ctx.user),
        permissions=[
            m.SearchPermission(
                target_type=m.PermissionTargetType.USER,
                target=m.UserLinkField.from_obj(user_ctx.user),
                permission_type=m.SearchPermissionType.OWNER,
            )
        ],
    )
    await search.insert()
    return SuccessPayloadOutput(payload=SearchOutput.from_obj(search))


@router.delete('/{search_id}')
async def delete_search(search_id: PydanticObjectId) -> ModelIdOutput:
    user_ctx = current_user()
    search = await m.Search.find_one(m.Search.id == search_id)
    if not search:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Search not found')
    if not search.check_permissions(user_ctx.user, m.SearchPermissionType.OWNER):
        raise HTTPException(HTTPStatus.FORBIDDEN, 'No permission to delete this search')
    await search.delete()
    return ModelIdOutput.from_obj(search)


@router.put('/{search_id}')
async def update_search(
    search_id: PydanticObjectId,
    body: SearchUpdate,
) -> SuccessPayloadOutput[SearchOutput]:
    search = await m.Search.find_one(m.Search.id == search_id)
    if not search:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Search not found')
    user_ctx = current_user()
    if not search.check_permissions(user_ctx.user, m.SearchPermissionType.EDIT):
        raise HTTPException(HTTPStatus.FORBIDDEN, 'No permission to edit this search')
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(search, k, v)
    if search.is_changed:
        await search.save_changes()
    return SuccessPayloadOutput(payload=SearchOutput.from_obj(search))


@router.post('/{search_id}/permission')
async def grant_permission(
    search_id: PydanticObjectId, body: GrantPermissionBody
) -> UUIDOutput:
    user_ctx = current_user()
    search = await m.Search.find_one(m.Search.id == search_id)
    if not search:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail='Search not found')
    if not search.check_permissions(user_ctx.user, m.SearchPermissionType.OWNER):
        raise HTTPException(
            status_code=HTTPStatus.FORBIDDEN,
            detail='You cannot modify permissions for this search',
        )
    if body.target_type == m.PermissionTargetType.USER:
        user: m.User | None = await m.User.find_one(m.User.id == body.target)
        if not user:
            raise HTTPException(HTTPStatus.BAD_REQUEST, 'User not found')
        target = m.UserLinkField.from_obj(user)
    else:
        group: m.Group | None = await m.Group.find_one(m.Group.id == body.target)
        if not group:
            raise HTTPException(HTTPStatus.BAD_REQUEST, 'Group not found')
        if group.id not in {g.id for g in user_ctx.user.groups}:
            raise HTTPException(
                status_code=HTTPStatus.FORBIDDEN,
                detail='You cannot grant permissions to groups you are not member of',
            )
        target = m.GroupLinkField.from_obj(group)
    if search.has_permission_for_target(target):
        raise HTTPException(
            status_code=HTTPStatus.CONFLICT, detail='Permission already granted'
        )
    permission = m.SearchPermission(
        target_type=body.target_type,
        target=target,
        permission_type=body.permission_type,
    )
    search.permissions.append(permission)
    await search.save_changes()
    return UUIDOutput.make(permission.id)


@router.delete('/{search_id}/permission/{permission_id}')
async def revoke_permission(
    search_id: PydanticObjectId, permission_id: UUID
) -> UUIDOutput:
    user_ctx = current_user()
    search = await m.Search.find_one(m.Search.id == search_id)
    if not search:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail='Search not found')
    if not search.check_permissions(user_ctx.user, m.SearchPermissionType.OWNER):
        raise HTTPException(
            status_code=HTTPStatus.FORBIDDEN,
            detail='You cannot modify permissions for this search',
        )
    if not (
        target := next(
            (obj for obj in search.permissions if obj.id == permission_id),
            None,
        )
    ):
        raise HTTPException(
            status_code=HTTPStatus.CONFLICT,
            detail='Permission not found',
        )
    search.permissions.remove(target)
    if search.is_changed:
        await search.save_changes()
    return UUIDOutput.make(target.id)
