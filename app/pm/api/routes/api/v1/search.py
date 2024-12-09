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
    target_type: m.SearchPermissionType
    target: UserOutput | GroupOutput

    @classmethod
    def from_obj(cls, obj: m.SearchPermission) -> Self:
        target = (
            GroupOutput.from_obj(obj.target)
            if obj.target_type == m.SearchPermissionType.GROUP
            else UserOutput.from_obj(obj.target)
        )
        return cls(
            id=obj.id,
            target_type=obj.target_type,
            target=target,
        )


class SearchOutput(BaseModel):
    id: PydanticObjectId
    name: str
    query: str
    owner: UserOutput
    permissions: list[SearchPermissionOutput]

    @classmethod
    def from_obj(cls, obj: m.Search) -> Self:
        user_ctx = current_user()
        user_group_ids = {g.id for g in user_ctx.user.groups}
        permissions = []
        for permission in obj.permissions:
            if permission.target_type == m.SearchPermissionType.GROUP:
                if permission.target.id in user_group_ids:
                    permissions.append(SearchPermissionOutput.from_obj(permission))
            else:
                permissions.append(SearchPermissionOutput.from_obj(permission))

        return cls(
            id=obj.id,
            name=obj.name,
            query=obj.query,
            owner=UserOutput.from_obj(obj.owner),
            permissions=permissions,
        )


class SearchPermissionBody(BaseModel):
    target_type: m.SearchPermissionType
    target: PydanticObjectId


class SearchCreate(BaseModel):
    name: str
    query: str


@router.get('/list')
async def list_searches(
    query: ListParams = Depends(),
) -> BaseListOutput[SearchOutput]:
    user_ctx = current_user()
    user_groups = [g.id for g in user_ctx.user.groups]
    filter_query = {
        '$or': [
            {'owner.id': user_ctx.user.id},
            {
                'permissions': {
                    '$elemMatch': {
                        'target_type': m.SearchPermissionType.USER,
                        'target.id': user_ctx.user.id,
                    }
                }
            },
            {
                'permissions': {
                    '$elemMatch': {
                        'target_type': m.SearchPermissionType.GROUP,
                        'target.id': {'$in': user_groups},
                    }
                }
            },
        ]
    }
    q = m.Search.find(filter_query).sort(m.Search.name)
    results = []
    async for obj in q.limit(query.limit).skip(query.offset):
        results.append(SearchOutput.from_obj(obj))
    return BaseListOutput[SearchOutput].make(
        count=await q.count(), limit=query.limit, offset=query.offset, items=results
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
        owner=m.UserLinkField.from_obj(user_ctx.user),
    )
    await search.insert()
    return SuccessPayloadOutput(payload=SearchOutput.from_obj(search))


@router.delete('/{search_id}')
async def delete_search(search_id: PydanticObjectId) -> ModelIdOutput:
    user_ctx = current_user()
    search = await m.Search.find_one(m.Search.id == search_id)
    if not search:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Search not found')
    if search.owner.id != user_ctx.user.id:
        raise HTTPException(HTTPStatus.FORBIDDEN, 'You cannot delete this search')
    await search.delete()
    return ModelIdOutput.from_obj(search)


@router.post('/{search_id}/permission')
async def share_search(
    search_id: PydanticObjectId, body: list[SearchPermissionBody]
) -> SuccessPayloadOutput[SearchOutput]:
    user_ctx = current_user()
    search = await m.Search.find_one(m.Search.id == search_id)
    if not search:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail='Search not found')
    if search.owner.id != user_ctx.user.id:
        raise HTTPException(
            status_code=HTTPStatus.FORBIDDEN,
            detail='You cannot modify share list for this search',
        )
    results = []
    unique = set()
    for p in body:
        if any(
            i.target_type == p.target_type and i.target.id == p.target
            for i in search.permissions
        ):
            raise HTTPException(
                status_code=HTTPStatus.CONFLICT,
                detail=f'Search already shared with {p.target_type} {p.target}',
            )
        if p.target in unique:
            continue
        unique.add(p.target)
        if p.target_type == m.SearchPermissionType.USER:
            user = await m.User.find_one(m.User.id == p.target)
            if not user:
                raise HTTPException(
                    status_code=HTTPStatus.NOT_FOUND,
                    detail=f'User {p.target} not found',
                )
            if user.id == user_ctx.user.id:
                raise HTTPException(
                    status_code=HTTPStatus.BAD_REQUEST,
                    detail='Cannot add yourself to share list',
                )
            results.append(
                m.SearchPermission(
                    target_type=p.target_type,
                    target=m.UserLinkField.from_obj(user),
                )
            )
        if p.target_type == m.SearchPermissionType.GROUP:
            group = await m.Group.find_one(m.Group.id == p.target)
            if not group:
                raise HTTPException(
                    status_code=HTTPStatus.NOT_FOUND,
                    detail=f'Group {p.target} not found',
                )
            if group.id not in {g.id for g in user_ctx.user.groups}:
                raise HTTPException(
                    status_code=HTTPStatus.FORBIDDEN,
                    detail='You can only share searches with groups you are a member of',
                )
            results.append(
                m.SearchPermission(
                    target_type=p.target_type, target=m.GroupLinkField.from_obj(group)
                )
            )
    if not results:
        raise HTTPException(
            status_code=HTTPStatus.BAD_REQUEST, detail='No new valid share list to add'
        )
    search.permissions.extend(results)
    if search.is_changed:
        await search.save_changes()
    return SuccessPayloadOutput(payload=SearchOutput.from_obj(search))


@router.delete('/{search_id}/permission/{permission_id}')
async def unshare_search(
    search_id: PydanticObjectId, permission_id: UUID
) -> UUIDOutput:
    user_ctx = current_user()
    search = await m.Search.find_one(m.Search.id == search_id)
    if not search:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail='Search not found')
    if search.owner.id != user_ctx.user.id:
        raise HTTPException(
            status_code=HTTPStatus.FORBIDDEN,
            detail='You cannot modify share list for this search',
        )
    if not (
        target := next(
            (obj for obj in search.permissions if obj.id == permission_id),
            None,
        )
    ):
        raise HTTPException(
            status_code=HTTPStatus.CONFLICT,
            detail=f'Search is not shared with {permission_id}',
        )
    search.permissions.remove(target)
    if search.is_changed:
        await search.save_changes()
    return UUIDOutput.make(target.id)
