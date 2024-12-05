from http import HTTPStatus
from typing import Self

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
)
from pm.api.views.params import ListParams
from pm.api.views.user import UserOutput

__all__ = ('router',)

router = APIRouter(
    prefix='/search',
    tags=['search'],
    dependencies=[Depends(current_user_context_dependency)],
)


class SearchShareOutput(BaseModel):
    target_type: m.SearchShareType
    target: UserOutput | GroupOutput


class SearchOutput(BaseModel):
    id: PydanticObjectId
    name: str
    query: str
    owner: UserOutput
    shared: list[SearchShareOutput]

    @classmethod
    def from_obj(cls, obj: m.Search) -> Self:
        user_ctx = current_user()
        results = []
        user_groups = [g.id for g in user_ctx.user.groups]
        for p in obj.shared:
            match p.target_type:
                case m.SearchShareType.GROUP:
                    if p.target.id in user_groups:
                        results.append(
                            SearchShareOutput(
                                target_type=p.target_type,
                                target=GroupOutput.from_obj(p.target),
                            )
                        )
                case m.SearchShareType.USER:
                    results.append(
                        SearchShareOutput(
                            target_type=p.target_type,
                            target=UserOutput.from_obj(p.target),
                        )
                    )
        return cls(
            id=obj.id,
            name=obj.name,
            query=obj.query,
            owner=UserOutput.from_obj(obj.owner),
            shared=results,
        )


class SearchShareBody(BaseModel):
    target_type: m.SearchShareType
    target: PydanticObjectId


class SearchCreate(BaseModel):
    name: str | None = None
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
                'shared': {
                    '$elemMatch': {
                        'target_type': m.SearchShareType.USER,
                        'target.id': user_ctx.user.id,
                    }
                }
            },
            {
                'shared': {
                    '$elemMatch': {
                        'target_type': m.SearchShareType.GROUP,
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


# pylint: disable=raise-missing-from
@router.post('/')
async def create_search(body: SearchCreate) -> SuccessPayloadOutput[SearchOutput]:
    user_ctx = current_user()
    try:
        await transform_query(body.query)
    except TransformError as err:
        raise HTTPException(HTTPStatus.BAD_REQUEST, err.message)
    except Exception as err:
        raise HTTPException(HTTPStatus.BAD_REQUEST, err.args[0])
    name = body.name if body.name else body.query
    search = m.Search(
        name=name,
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


@router.post('/{search_id}/share')
async def share_search(
    search_id: PydanticObjectId, body: list[SearchShareBody]
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
            for i in search.shared
        ):
            raise HTTPException(
                status_code=HTTPStatus.CONFLICT,
                detail=f'Search already shared with {p.target_type} {p.target}',
            )
        if p.target in unique:
            continue
        unique.add(p.target)
        if p.target_type == m.SearchShareType.USER:
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
                m.SearchShare(
                    target_type=p.target_type,
                    target=m.UserLinkField.from_obj(user),
                )
            )
        if p.target_type == m.SearchShareType.GROUP:
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
                m.SearchShare(
                    target_type=p.target_type, target=m.GroupLinkField.from_obj(group)
                )
            )
    if not results:
        raise HTTPException(
            status_code=HTTPStatus.BAD_REQUEST, detail='No new valid share list to add'
        )
    search.shared.extend(results)
    if search.is_changed:
        await search.save_changes()
    return SuccessPayloadOutput(payload=SearchOutput.from_obj(search))


@router.delete('/{search_id}/unshare')
async def unshare_search(
    search_id: PydanticObjectId, body: list[SearchShareBody]
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
        shared: None | m.SearchShare = next(
            (
                obj
                for obj in search.shared
                if obj.target_type == p.target_type and obj.target.id == p.target
            ),
            None,
        )
        if not shared:
            raise HTTPException(
                status_code=HTTPStatus.CONFLICT,
                detail=f'Search is not shared with {p.target_type} {p.target}',
            )
        if shared.target.id in unique:
            continue
        unique.add(shared.target.id)
        results.append(shared)
    for r in results:
        search.shared.remove(r)
    if search.is_changed:
        await search.save_changes()
    return SuccessPayloadOutput(payload=SearchOutput.from_obj(search))
