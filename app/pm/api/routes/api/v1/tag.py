from http import HTTPStatus
from typing import Self

from beanie import PydanticObjectId
from fastapi import Depends, HTTPException
from pydantic import BaseModel

import pm.models as m
from pm.api.context import (
    current_user,
    current_user_context_dependency,
)
from pm.api.utils.router import APIRouter
from pm.api.views.output import (
    BaseListOutput,
    ModelIdOutput,
    SuccessPayloadOutput,
)
from pm.api.views.params import ListParams
from pm.api.views.user import UserOutput

__all__ = ('router',)


router = APIRouter(
    prefix='/tag',
    tags=['tag'],
    dependencies=[Depends(current_user_context_dependency)],
)


class TagOutput(BaseModel):
    id: PydanticObjectId
    name: str
    description: str | None
    ai_description: str | None
    color: str | None
    untag_on_resolve: bool
    untag_on_close: bool
    created_by: UserOutput

    @classmethod
    def from_obj(cls, obj: m.Tag) -> Self:
        return cls(
            id=obj.id,
            name=obj.name,
            description=obj.description,
            ai_description=obj.ai_description,
            color=obj.color,
            untag_on_resolve=obj.untag_on_resolve,
            untag_on_close=obj.untag_on_close,
            created_by=UserOutput.from_obj(obj.created_by),
        )


class TagCreate(BaseModel):
    name: str
    description: str | None = None
    ai_description: str | None = None
    color: str | None = None
    untag_on_resolve: bool = False
    untag_on_close: bool = False


class TagUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    ai_description: str | None = None
    color: str | None = None
    untag_on_resolve: bool | None = None
    untag_on_close: bool | None = None


@router.get('/list')
async def list_tags(
    query: ListParams = Depends(),
) -> BaseListOutput[TagOutput]:
    q = m.Tag.find().sort(m.Tag.name)
    return await BaseListOutput.make_from_query(
        q,
        limit=query.limit,
        offset=query.offset,
        projection_fn=TagOutput.from_obj,
    )


@router.get('/{tag_id}')
async def get_tag(
    tag_id: PydanticObjectId,
) -> SuccessPayloadOutput[TagOutput]:
    tag: m.Tag | None = await m.Tag.find_one(m.Tag.id == tag_id)
    if not tag:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail='Tag not found')
    return SuccessPayloadOutput(payload=TagOutput.from_obj(tag))


@router.post('/')
async def create_tag(
    tag_data: TagCreate,
) -> SuccessPayloadOutput[TagOutput]:
    user_ctx = current_user()
    tag = m.Tag(
        name=tag_data.name,
        description=tag_data.description,
        ai_description=tag_data.ai_description,
        color=tag_data.color,
        untag_on_resolve=tag_data.untag_on_resolve,
        untag_on_close=tag_data.untag_on_close,
        created_by=m.UserLinkField.from_obj(user_ctx.user),
    )
    await tag.insert()
    return SuccessPayloadOutput(payload=TagOutput.from_obj(tag))


@router.put('/{tag_id}')
async def update_tag(
    tag_id: PydanticObjectId,
    tag_data: TagUpdate,
) -> SuccessPayloadOutput[TagOutput]:
    user_ctx = current_user()
    tag: m.Tag | None = await m.Tag.find_one(m.Tag.id == tag_id)
    if not tag:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail='Tag not found')
    if not user_ctx.user.is_admin or tag.created_by.id != user_ctx.user.id:
        raise HTTPException(status_code=HTTPStatus.FORBIDDEN, detail='Forbidden')
    for k, v in tag_data.model_dump(exclude_unset=True).items():
        setattr(tag, k, v)
    if tag.is_changed:
        await tag.save_changes()
        await m.Issue.update_tag_embedded_links(tag)
    return SuccessPayloadOutput(payload=TagOutput.from_obj(tag))


@router.delete('/{tag_id}')
async def delete_tag(
    tag_id: PydanticObjectId,
) -> ModelIdOutput:
    user_ctx = current_user()
    tag: m.Tag | None = await m.Tag.find_one(m.Tag.id == tag_id)
    if not tag:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail='Tag not found')
    if not user_ctx.user.is_admin or tag.created_by.id != user_ctx.user.id:
        raise HTTPException(status_code=HTTPStatus.FORBIDDEN, detail='Forbidden')
    await tag.delete()
    await m.Issue.remove_tag_embedded_links(tag_id)
    return ModelIdOutput.make(tag_id)
