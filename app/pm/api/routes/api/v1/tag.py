from http import HTTPStatus
from typing import Self
from uuid import UUID

from beanie import PydanticObjectId
from fastapi import Depends, HTTPException
from pydantic import BaseModel, Field

import pm.models as m
from pm.api.context import (
    current_user,
    current_user_context_dependency,
)
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
from pm.api.views.permission import (
    GrantPermissionBody,
    PermissionOutput,
    UpdatePermissionBody,
)
from pm.api.views.user import UserOutput

__all__ = ('router',)


router = APIRouter(
    prefix='/tag',
    tags=['tag'],
    dependencies=[Depends(current_user_context_dependency)],
    responses=error_responses(
        (HTTPStatus.UNAUTHORIZED, ErrorOutput),
        (HTTPStatus.FORBIDDEN, ErrorOutput),
    ),
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
    permissions: list[PermissionOutput]
    current_permission: m.PermissionType = Field(description='Current user permission')

    @classmethod
    def from_obj(cls, obj: m.Tag) -> Self:
        user_ctx = current_user()
        return cls(
            id=obj.id,
            name=obj.name,
            description=obj.description,
            ai_description=obj.ai_description,
            color=obj.color,
            untag_on_resolve=obj.untag_on_resolve,
            untag_on_close=obj.untag_on_close,
            created_by=UserOutput.from_obj(obj.created_by),
            permissions=[
                PermissionOutput.from_obj(p) for p in obj.filter_permissions(user_ctx)
            ],
            current_permission=obj.user_permission(user_ctx),
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
    user_ctx = current_user()
    q = m.Tag.find(m.Tag.get_filter_query(user_ctx)).sort(m.Tag.name)
    if query.search:
        q = q.find(m.Tag.search_query(query.search))
    return await BaseListOutput.make_from_query(
        q,
        limit=query.limit,
        offset=query.offset,
        projection_fn=TagOutput.from_obj,
    )


@router.get(
    '/{tag_id}',
    responses=error_responses(
        (HTTPStatus.NOT_FOUND, ErrorOutput),
        (HTTPStatus.FORBIDDEN, ErrorOutput),
    ),
)
async def get_tag(
    tag_id: PydanticObjectId,
) -> SuccessPayloadOutput[TagOutput]:
    user_ctx = current_user()
    tag: m.Tag | None = await m.Tag.find_one(m.Tag.id == tag_id)
    if not tag:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail='Tag not found')
    if not tag.check_permissions(user_ctx, m.PermissionType.VIEW):
        raise HTTPException(status_code=HTTPStatus.FORBIDDEN, detail='Forbidden')
    return SuccessPayloadOutput(payload=TagOutput.from_obj(tag))


@router.post('/')
async def create_tag(
    tag_data: TagCreate,
) -> SuccessPayloadOutput[TagOutput]:
    user_ctx = current_user()

    creator_permission = m.PermissionRecord(
        target_type=m.PermissionTargetType.USER,
        target=m.UserLinkField.from_obj(user_ctx.user),
        permission_type=m.PermissionType.ADMIN,
    )

    tag = m.Tag(
        name=tag_data.name,
        description=tag_data.description,
        ai_description=tag_data.ai_description,
        color=tag_data.color,
        untag_on_resolve=tag_data.untag_on_resolve,
        untag_on_close=tag_data.untag_on_close,
        created_by=m.UserLinkField.from_obj(user_ctx.user),
        permissions=[creator_permission],
    )
    await tag.insert()
    return SuccessPayloadOutput(payload=TagOutput.from_obj(tag))


@router.put(
    '/{tag_id}',
    responses=error_responses(
        (HTTPStatus.NOT_FOUND, ErrorOutput),
        (HTTPStatus.FORBIDDEN, ErrorOutput),
        (HTTPStatus.UNPROCESSABLE_ENTITY, ErrorOutput),
    ),
)
async def update_tag(
    tag_id: PydanticObjectId,
    tag_data: TagUpdate,
) -> SuccessPayloadOutput[TagOutput]:
    user_ctx = current_user()
    tag: m.Tag | None = await m.Tag.find_one(m.Tag.id == tag_id)
    if not tag:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail='Tag not found')
    if not tag.check_permissions(user_ctx, m.PermissionType.EDIT):
        raise HTTPException(
            status_code=HTTPStatus.FORBIDDEN, detail='No permission to modify this tag'
        )
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
    if not tag.check_permissions(user_ctx, m.PermissionType.ADMIN):
        raise HTTPException(
            status_code=HTTPStatus.FORBIDDEN, detail='No permission to modify this tag'
        )
    await tag.delete()
    await m.Issue.remove_tag_embedded_links(tag_id)
    return ModelIdOutput.make(tag_id)


@router.post('/{tag_id}/permission')
async def grant_permission(
    tag_id: PydanticObjectId,
    body: GrantPermissionBody,
) -> UUIDOutput:
    """
    Grants one permission from set of permission types to a specified target (user or group) for a tag.
    """
    tag = await m.Tag.find_one(m.Tag.id == tag_id)
    if not tag:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail='Tag not found')
    user_ctx = current_user()
    if not tag.check_permissions(user_ctx, m.PermissionType.ADMIN):
        raise HTTPException(
            status_code=HTTPStatus.FORBIDDEN,
            detail='You cannot modify permissions for this tag',
        )
    if body.target_type == m.PermissionTargetType.USER:
        user: m.User | None = await m.User.find_one(m.User.id == body.target)
        if not user:
            raise HTTPException(HTTPStatus.NOT_FOUND, 'User not found')
        target = m.UserLinkField.from_obj(user)
    else:
        group: m.Group | None = await m.Group.find_one(
            m.Group.id == body.target, with_children=True
        )
        if not group:
            raise HTTPException(HTTPStatus.NOT_FOUND, 'Group not found')
        target = m.GroupLinkField.from_obj(group)
    if tag.has_permission_for_target(target):
        raise HTTPException(HTTPStatus.CONFLICT, 'Permission already granted')
    p = m.PermissionRecord(
        target_type=body.target_type,
        target=target,
        permission_type=body.permission_type,
    )
    tag.permissions.append(p)
    await tag.save_changes()
    return UUIDOutput.make(p.id)


@router.put('/{tag_id}/permission/{permission_id}')
async def change_permission(
    tag_id: PydanticObjectId,
    permission_id: UUID,
    body: UpdatePermissionBody,
) -> UUIDOutput:
    tag = await m.Tag.find_one(m.Tag.id == tag_id)
    if not tag:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Tag not found')
    user_ctx = current_user()
    if not tag.check_permissions(user_ctx, m.PermissionType.ADMIN):
        raise HTTPException(
            HTTPStatus.FORBIDDEN,
            'You cannot modify permissions for this tag',
        )
    if not (
        perm := next(
            (obj for obj in tag.permissions if obj.id == permission_id),
            None,
        )
    ):
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Permission not found')
    if perm.permission_type == body.permission_type:
        return UUIDOutput.make(perm.id)
    if (
        perm.permission_type == m.PermissionType.ADMIN
        and not tag.has_any_other_admin_target(perm.target)
    ):
        raise HTTPException(HTTPStatus.FORBIDDEN, 'Tag must have at least one admin')
    perm.permission_type = body.permission_type
    await tag.save_changes()
    return UUIDOutput.make(perm.id)


@router.delete('/{tag_id}/permission/{permission_id}')
async def revoke_permission(
    tag_id: PydanticObjectId,
    permission_id: UUID,
) -> UUIDOutput:
    tag = await m.Tag.find_one(m.Tag.id == tag_id)
    if not tag:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail='Tag not found')
    user_ctx = current_user()
    if not tag.check_permissions(user_ctx, m.PermissionType.ADMIN):
        raise HTTPException(
            status_code=HTTPStatus.FORBIDDEN,
            detail='You cannot modify permissions for this tag',
        )
    if not (
        perm := next(
            (obj for obj in tag.permissions if obj.id == permission_id),
            None,
        )
    ):
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Permission not found')
    if (
        perm.permission_type == m.PermissionType.ADMIN
        and not tag.has_any_other_admin_target(perm.target)
    ):
        raise HTTPException(HTTPStatus.FORBIDDEN, 'Tag must have at least one admin')
    tag.permissions.remove(perm)
    await tag.save_changes()
    return UUIDOutput.make(perm.id)


@router.get('/{tag_id}/permissions')
async def get_tag_permissions(
    tag_id: PydanticObjectId,
    query: ListParams = Depends(),
) -> BaseListOutput[PermissionOutput]:
    tag = await m.Tag.find_one(m.Tag.id == tag_id)
    if not tag:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Tag not found')
    user_ctx = current_user()
    if not tag.check_permissions(user_ctx, m.PermissionType.ADMIN):
        raise HTTPException(HTTPStatus.FORBIDDEN, 'You cannot view tag permissions')
    return BaseListOutput.make(
        count=len(tag.permissions),
        limit=query.limit,
        offset=query.offset,
        items=[
            PermissionOutput.from_obj(perm)
            for perm in tag.permissions[query.offset : query.offset + query.limit]
        ],
    )
