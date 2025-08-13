import asyncio
from http import HTTPStatus
from typing import Self

from beanie import PydanticObjectId
from fastapi import Depends, HTTPException
from pydantic import BaseModel

import pm.models as m
from pm.api.context import admin_context_dependency
from pm.api.utils.router import APIRouter
from pm.api.views.error_responses import (
    AUTH_ERRORS,
    CRUD_ERRORS,
    READ_ERRORS,
    WRITE_ERRORS,
    error_responses,
)
from pm.api.views.output import (
    BaseListOutput,
    ModelIdOutput,
    SuccessPayloadOutput,
)
from pm.api.views.params import ListParams
from pm.api.views.user import UserOutput
from pm.permissions import GLOBAL_PERMISSIONS_BY_CATEGORY, GlobalPermissions

__all__ = ('router',)


router = APIRouter(
    prefix='/group',
    tags=['group'],
    dependencies=[Depends(admin_context_dependency)],
    responses=error_responses(*AUTH_ERRORS),
)


class GroupFullOutput(BaseModel):
    id: PydanticObjectId
    name: str
    description: str | None
    type: m.GroupType

    @classmethod
    def from_obj(cls, obj: m.Group) -> Self:
        return cls(
            id=obj.id,
            name=obj.name,
            description=obj.description,
            type=obj.type,
        )


class GroupCreate(BaseModel):
    name: str
    description: str | None = None


class GroupUpdate(BaseModel):
    name: str | None = None
    description: str | None = None


class GlobalPermissionOutput(BaseModel):
    key: GlobalPermissions
    label: str
    granted: bool


class GlobalPermissionCategoryOutput(BaseModel):
    label: str
    permissions: list[GlobalPermissionOutput]


class GlobalRoleLinkOutput(BaseModel):
    id: PydanticObjectId
    name: str
    description: str | None

    @classmethod
    def from_obj(cls, obj: m.GlobalRole | m.GlobalRoleLinkField) -> Self:
        return cls(
            id=obj.id,
            name=obj.name,
            description=obj.description,
        )


class GlobalRoleOutput(BaseModel):
    id: PydanticObjectId
    name: str
    description: str | None
    permissions: list[GlobalPermissionCategoryOutput]

    @classmethod
    def from_obj(cls, obj: m.GlobalRole | m.GlobalRoleLinkField) -> Self:
        role_permissions = set(obj.permissions)
        return cls(
            id=obj.id,
            name=obj.name,
            description=obj.description,
            permissions=[
                GlobalPermissionCategoryOutput(
                    label=category,
                    permissions=[
                        GlobalPermissionOutput(
                            key=key,
                            label=label,
                            granted=key in role_permissions,
                        )
                        for key, label in permissions.items()
                    ],
                )
                for category, permissions in GLOBAL_PERMISSIONS_BY_CATEGORY.items()
            ],
        )


@router.get('/list', responses=error_responses(*AUTH_ERRORS))
async def list_groups(
    query: ListParams = Depends(),
) -> BaseListOutput[GroupFullOutput]:
    q = m.Group.find(with_children=True)
    query.apply_filter(q, m.Group)
    query.apply_sort(q, m.Group, (m.Group.name,))
    if query.search:
        q = q.find(m.Group.search_query(query.search))
    return await BaseListOutput.make_from_query(
        q,
        limit=query.limit,
        offset=query.offset,
        projection_fn=GroupFullOutput.from_obj,
    )


@router.get('/{group_id}', responses=error_responses(*READ_ERRORS))
async def get_group(
    group_id: PydanticObjectId,
) -> SuccessPayloadOutput[GroupFullOutput]:
    obj = await m.Group.find_one(m.Group.id == group_id, with_children=True)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Group not found')
    return SuccessPayloadOutput(payload=GroupFullOutput.from_obj(obj))


@router.post('')
async def create_group(
    body: GroupCreate,
) -> SuccessPayloadOutput[GroupFullOutput]:
    obj = m.LocalGroup(
        name=body.name,
        description=body.description,
    )
    await obj.insert()
    return SuccessPayloadOutput(payload=GroupFullOutput.from_obj(obj))


@router.put('/{group_id}', responses=error_responses(*CRUD_ERRORS))
async def update_group(
    group_id: PydanticObjectId,
    body: GroupUpdate,
) -> SuccessPayloadOutput[GroupFullOutput]:
    obj: m.Group | None = await m.Group.find_one(
        m.Group.id == group_id, with_children=True
    )
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Group not found')

    # Only allow updates for certain group types
    if isinstance(obj, m.WBGroup):
        raise HTTPException(HTTPStatus.FORBIDDEN, 'Cannot update external group')

    # Update fields based on group type
    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if hasattr(obj, key):
            setattr(obj, key, value)

    if obj.is_changed:
        await obj.save_changes()
        await asyncio.gather(
            m.Project.update_group_embedded_links(obj),
            m.Issue.update_group_embedded_links(obj),
            m.UserCustomField.update_group_embedded_links(obj),
            m.UserMultiCustomField.update_group_embedded_links(obj),
            m.User.update_group_embedded_links(obj),
            m.Board.update_group_embedded_links(obj),
            m.Search.update_group_embedded_links(obj),
            m.Dashboard.update_group_embedded_links(obj),
        )
    return SuccessPayloadOutput(payload=GroupFullOutput.from_obj(obj))


@router.delete('/{group_id}', responses=error_responses(*READ_ERRORS))
async def delete_group(
    group_id: PydanticObjectId,
) -> ModelIdOutput:
    obj: m.Group | None = await m.Group.find_one(
        m.Group.id == group_id, with_children=True
    )
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Group not found')
    await obj.delete()
    await asyncio.gather(
        m.Project.remove_group_embedded_links(group_id),
        m.UserCustomField.remove_group_embedded_links(group_id),
        m.UserMultiCustomField.remove_group_embedded_links(group_id),
        m.User.remove_group_embedded_links(group_id),
        m.Board.remove_group_embedded_links(group_id),
        m.Search.remove_group_embedded_links(group_id),
        m.Dashboard.remove_group_embedded_links(group_id),
    )
    return ModelIdOutput.make(group_id)


@router.get('/{group_id}/members', responses=error_responses(*READ_ERRORS))
async def list_group_members(
    group_id: PydanticObjectId,
    query: ListParams = Depends(),
) -> BaseListOutput[UserOutput]:
    group: m.Group | None = await m.Group.find_one(
        m.Group.id == group_id, with_children=True
    )
    if not group:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Group not found')

    members = await group.resolve_members()

    # todo: replace with regex search
    if query.search:
        search_lower = query.search.lower()
        members = [
            member
            for member in members
            if search_lower in member.name.lower()
            or (member.email and search_lower in member.email.lower())
        ]

    # Sort by name
    members = sorted(members, key=lambda u: u.name)

    return BaseListOutput.make(
        count=len(members),
        limit=query.limit,
        offset=query.offset,
        items=[
            UserOutput.from_obj(member)
            for member in members[query.offset : query.offset + query.limit]
        ],
    )


@router.post('/{group_id}/members/{user_id}', responses=error_responses(*WRITE_ERRORS))
async def add_group_member(
    group_id: PydanticObjectId,
    user_id: PydanticObjectId,
) -> ModelIdOutput:
    group: m.Group | None = await m.Group.find_one(
        m.Group.id == group_id, with_children=True
    )
    if not group:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Group not found')

    if group.type != m.GroupType.LOCAL:
        raise HTTPException(
            HTTPStatus.BAD_REQUEST, 'Cannot add members to external group'
        )

    user = await m.User.find_one(m.User.id == user_id)
    if not user:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'User not found')
    if any(gr.id == group.id for gr in user.groups):
        raise HTTPException(HTTPStatus.CONFLICT, 'User already in group')

    user.groups.append(m.GroupLinkField.from_obj(group))
    await user.save_changes()
    return ModelIdOutput.from_obj(group)


@router.delete('/{group_id}/members/{user_id}', responses=error_responses(*READ_ERRORS))
async def remove_group_member(
    group_id: PydanticObjectId,
    user_id: PydanticObjectId,
) -> ModelIdOutput:
    group = await m.Group.find_one(m.Group.id == group_id, with_children=True)
    if not group:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Group not found')

    if group.type != m.GroupType.LOCAL:
        raise HTTPException(
            HTTPStatus.BAD_REQUEST, 'Cannot remove member from this group type'
        )

    user = await m.User.find_one(m.User.id == user_id)
    if not user:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'User not found')
    if not any(gr.id == group.id for gr in user.groups):
        raise HTTPException(HTTPStatus.CONFLICT, 'User not in group')

    user.groups = [gr for gr in user.groups if gr.id != group.id]
    await user.save_changes()
    return ModelIdOutput.from_obj(group)


@router.get('/{group_id}/global-roles', responses=error_responses(*READ_ERRORS))
async def list_group_global_roles(
    group_id: PydanticObjectId,
    query: ListParams = Depends(),
) -> BaseListOutput[GlobalRoleOutput]:
    """List global roles assigned to a group."""
    group: m.Group | None = await m.Group.find_one(
        m.Group.id == group_id, with_children=True
    )
    if not group:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Group not found')

    return BaseListOutput.make(
        count=len(group.global_roles),
        limit=query.limit,
        offset=query.offset,
        items=[
            GlobalRoleOutput.from_obj(role)
            for role in group.global_roles[query.offset : query.offset + query.limit]
        ],
    )


@router.post(
    '/{group_id}/global-role/{role_id}', responses=error_responses(*WRITE_ERRORS)
)
async def assign_global_role_to_group(
    group_id: PydanticObjectId,
    role_id: PydanticObjectId,
) -> ModelIdOutput:
    """Assign a global role to a group."""
    group: m.Group | None = await m.Group.find_one(
        m.Group.id == group_id, with_children=True
    )
    if not group:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Group not found')

    global_role: m.GlobalRole | None = await m.GlobalRole.find_one(
        m.GlobalRole.id == role_id
    )
    if not global_role:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Global role not found')

    # Check if role is already assigned
    if any(role.id == role_id for role in group.global_roles):
        raise HTTPException(
            HTTPStatus.CONFLICT, 'Global role already assigned to group'
        )

    # Add the global role
    group.global_roles.append(m.GlobalRoleLinkField.from_obj(global_role))
    await group.save_changes()

    return ModelIdOutput.make(role_id)


@router.delete(
    '/{group_id}/global-role/{role_id}', responses=error_responses(*READ_ERRORS)
)
async def remove_global_role_from_group(
    group_id: PydanticObjectId,
    role_id: PydanticObjectId,
) -> ModelIdOutput:
    """Remove a global role from a group."""
    group: m.Group | None = await m.Group.find_one(
        m.Group.id == group_id, with_children=True
    )
    if not group:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Group not found')

    # Check if role is assigned
    if not any(role.id == role_id for role in group.global_roles):
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Global role not assigned to group')

    # Remove the global role
    group.global_roles = [role for role in group.global_roles if role.id != role_id]
    await group.save_changes()

    return ModelIdOutput.make(role_id)
