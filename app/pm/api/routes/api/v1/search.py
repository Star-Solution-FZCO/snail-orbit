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
from pm.api.views.output import BaseListOutput, ModelIdOutput, SuccessPayloadOutput
from pm.api.views.params import ListParams
from pm.api.views.user import UserOutput

__all__ = ('router',)

router = APIRouter(
    prefix='/search',
    tags=['search'],
    dependencies=[Depends(current_user_context_dependency)],
)


class SearchPermissionOutput(BaseModel):
    target_type: m.SearchPermissionTargetType
    target: UserOutput | GroupOutput | None


class SearchOutput(BaseModel):
    id: PydanticObjectId
    name: str
    query: str
    created_by: UserOutput
    permissions: list[SearchPermissionOutput]

    @classmethod
    def from_obj(cls, obj: m.Search) -> Self:
        user_ctx = current_user()
        perms = []
        user_groups = [g.id for g in user_ctx.user.groups]
        for p in obj.permissions:
            match p.target_type:
                case m.SearchPermissionTargetType.GROUP:
                    if p.target.id in user_groups:
                        perms.append(
                            SearchPermissionOutput(
                                target_type=p.target_type,
                                target=GroupOutput.from_obj(p.target),
                            )
                        )
                case _:
                    perms.append(
                        SearchPermissionOutput(
                            target_type=p.target_type,
                            target=UserOutput.from_obj(p.target) if p.target else None,
                        )
                    )
        return cls(
            id=obj.id,
            name=obj.name,
            query=obj.query,
            created_by=UserOutput.from_obj(obj.created_by),
            permissions=perms,
        )


class SearchCreate(BaseModel):
    name: str | None = None
    query: str
    type: m.SearchPermissionTargetType
    targets: list[PydanticObjectId] | None = None


@router.get('/list')
async def list_searches(
    query: ListParams = Depends(),
) -> BaseListOutput[SearchOutput]:
    user_ctx = current_user()
    user_groups = [g.id for g in user_ctx.user.groups]
    filter_query = {
        '$or': [
            {'created_by.id': user_ctx.user.id},
            {
                'permissions': {
                    '$elemMatch': {
                        'target_type': m.SearchPermissionTargetType.PRIVATE,
                        'target.id': user_ctx.user.id,
                    }
                }
            },
            {
                'permissions': {
                    '$elemMatch': {
                        'target_type': m.SearchPermissionTargetType.GROUP,
                        'target.id': {'$in': user_groups},
                    }
                }
            },
            {'permissions.target_type': m.SearchPermissionTargetType.PUBLIC},
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
    permissions = []
    match body.type:
        case m.SearchPermissionTargetType.PUBLIC:
            permissions.append(m.SearchPermission(target_type=body.type, target=None))
        case m.SearchPermissionTargetType.PRIVATE:
            if not body.targets:
                pass
            permissions.append(
                m.SearchPermission(
                    target_type=body.type,
                    target=m.UserLinkField.from_obj(user_ctx.user),
                )
            )
        case m.SearchPermissionTargetType.GROUP:
            if not body.targets:
                raise HTTPException(
                    status_code=HTTPStatus.BAD_REQUEST,
                    detail='Group id/ids must be provided for group permission type',
                )
            for g in set(body.targets):
                group = await m.Group.find_one(m.Group.id == g)
                if not group:
                    raise HTTPException(HTTPStatus.NOT_FOUND, f'Group {g} not found')
                if not any(
                    group.id == user_group.id for user_group in user_ctx.user.groups
                ):
                    raise HTTPException(
                        HTTPStatus.FORBIDDEN,
                        'You can only share searches with groups you are a member of',
                    )
                permission = m.SearchPermission(
                    target_type=body.type, target=m.GroupLinkField.from_obj(group)
                )
                permissions.append(permission)
    saved_search = m.Search(
        name=body.name if body.name else body.query,
        query=body.query,
        created_by=m.UserLinkField.from_obj(user_ctx.user),
        permissions=permissions,
    )
    await saved_search.insert()
    return SuccessPayloadOutput(payload=SearchOutput.from_obj(saved_search))


@router.delete('/{search_id}')
async def delete_search(search_id: PydanticObjectId) -> ModelIdOutput:
    user_ctx = current_user()
    search = await m.Search.find_one(m.Search.id == search_id)
    if not search:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Search not found')
    if search.created_by.id != user_ctx.user.id:
        raise HTTPException(HTTPStatus.FORBIDDEN, 'You cannot delete this search')
    await search.delete()
    return ModelIdOutput.make(id_=search_id)
