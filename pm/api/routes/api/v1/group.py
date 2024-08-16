from http import HTTPStatus

from beanie import PydanticObjectId
from fastapi import Depends, HTTPException
from pydantic import BaseModel

import pm.models as m
from pm.api.context import admin_context_dependency
from pm.api.utils.router import APIRouter
from pm.api.views.output import BaseListOutput, ModelIdOutput, SuccessPayloadOutput
from pm.api.views.pararams import ListParams
from pm.api.views.user import UserOutput

__all__ = ('router',)


router = APIRouter(
    prefix='/group', tags=['group'], dependencies=[Depends(admin_context_dependency)]
)


class GroupOutput(BaseModel):
    id: PydanticObjectId
    name: str


class GroupCreate(BaseModel):
    name: str


class GroupUpdate(BaseModel):
    name: str | None = None


@router.get('/list')
async def list_groups(
    query: ListParams = Depends(),
) -> BaseListOutput[GroupOutput]:
    q = m.Group.find().sort(m.Group.name)
    results = []
    async for obj in q.limit(query.limit).skip(query.offset):  # type: m.Group
        results.append(
            GroupOutput(
                id=obj.id,
                name=obj.name,
            )
        )
    return BaseListOutput.make(
        count=await q.count(),
        limit=query.limit,
        offset=query.offset,
        items=results,
    )


@router.get('/{group_id}')
async def get_group(
    group_id: PydanticObjectId,
) -> SuccessPayloadOutput[GroupOutput]:
    obj = await m.Group.find_one(m.Group.id == group_id)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Group not found')
    return SuccessPayloadOutput(
        payload=GroupOutput(
            id=obj.id,
            name=obj.name,
        )
    )


@router.post('')
async def create_group(
    body: GroupCreate,
) -> SuccessPayloadOutput[GroupOutput]:
    obj = m.Group(name=body.name)
    await obj.insert()
    return SuccessPayloadOutput(
        payload=GroupOutput(
            id=obj.id,
            name=obj.name,
        )
    )


@router.put('/{group_id}')
async def update_group(
    group_id: PydanticObjectId,
    body: GroupUpdate,
) -> SuccessPayloadOutput[GroupOutput]:
    obj = await m.Group.find_one(m.Group.id == group_id)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Group not found')
    for k, v in body.dict(exclude_unset=True).items():
        setattr(obj, k, v)
    if obj.is_changed:
        # todo: update group links
        await obj.save_changes()
    return SuccessPayloadOutput(
        payload=GroupOutput(
            id=obj.id,
            name=obj.name,
        )
    )


@router.delete('/{group_id}')
async def delete_group(
    group_id: PydanticObjectId,
) -> ModelIdOutput:
    obj = await m.Group.find_one(m.Group.id == group_id)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Group not found')
    await obj.delete()
    return ModelIdOutput.make(group_id)


@router.get('/{group_id}/members')
async def list_group_members(
    group_id: PydanticObjectId,
    query: ListParams = Depends(),
) -> BaseListOutput[UserOutput]:
    group = await m.Group.find_one(m.Group.id == group_id)
    if not group:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Group not found')
    q = m.User.find(m.User.groups.id == group.id).sort(m.User.name)
    results = []
    async for obj in q.limit(query.limit).skip(query.offset):
        results.append(UserOutput.from_obj(obj))
    return BaseListOutput.make(
        count=await q.count(),
        limit=query.limit,
        offset=query.offset,
        items=results,
    )


@router.post('/{group_id}/members/{user_id}')
async def add_group_member(
    group_id: PydanticObjectId,
    user_id: PydanticObjectId,
) -> ModelIdOutput:
    group: m.Group | None = await m.Group.find_one(m.Group.id == group_id)
    if not group:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Group not found')
    user = await m.User.find_one(m.User.id == user_id)
    if not user:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'User not found')
    if any(gr.id == group.id for gr in user.groups):
        raise HTTPException(HTTPStatus.CONFLICT, 'User already in group')
    user.groups.append(m.GroupLinkField.from_obj(group))
    await user.save_changes()
    return ModelIdOutput.from_obj(group)


@router.delete('/{group_id}/members/{user_id}')
async def remove_group_member(
    group_id: PydanticObjectId,
    user_id: PydanticObjectId,
) -> ModelIdOutput:
    group = await m.Group.find_one(m.Group.id == group_id)
    if not group:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Group not found')
    user = await m.User.find_one(m.User.id == user_id)
    if not user:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'User not found')
    if not any(gr.id == group.id for gr in user.groups):
        raise HTTPException(HTTPStatus.CONFLICT, 'User not in group')
    user.groups = [gr for gr in user.groups if gr.id != group.id]
    await user.save_changes()
    return ModelIdOutput.from_obj(group)
