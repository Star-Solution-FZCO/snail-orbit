import asyncio
from datetime import timedelta
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
from pm.api.views.global_role import (
    GlobalRoleOutput,
)
from pm.api.views.output import (
    BaseListOutput,
    ModelIdOutput,
    SuccessPayloadOutput,
)
from pm.api.views.params import ListParams
from pm.api.views.select import SelectParams
from pm.api.views.user import UserOutput
from pm.services.avatars import generate_default_avatar
from pm.tasks.actions import task_send_email, task_send_pararam_message
from pm.templates import TemplateT, render_template

__all__ = ('router',)

router = APIRouter(
    prefix='/user',
    tags=['user'],
    dependencies=[Depends(admin_context_dependency)],
    responses=error_responses(*AUTH_ERRORS),
)

INVITE_PASSWORD_TOKEN_LIFETIME = timedelta(days=7)
ALLOW_EXTERNAL_USER_UPDATE_FIELDS = {'is_admin'}


class UserFullOutput(UserOutput):
    is_admin: bool
    origin: m.UserOriginType
    avatar_type: m.UserAvatarType
    mfa_enabled: bool

    @classmethod
    def from_obj(cls, obj: m.User) -> Self:
        return cls(
            id=obj.id,
            email=obj.email,
            name=obj.name,
            is_active=obj.is_active,
            _use_external_avatar=obj.use_external_avatar,
            is_admin=obj.is_admin,
            origin=obj.origin,
            avatar_type=obj.avatar_type,
            mfa_enabled=obj.mfa_enabled,
        )


class UserCreate(BaseModel):
    email: str
    name: str
    is_active: bool = True
    is_admin: bool = False
    send_email_invite: bool = False
    send_pararam_invite: bool = False


class UserUpdate(BaseModel):
    email: str | None = None
    name: str | None = None
    is_active: bool | None = None
    is_admin: bool | None = None


@router.get(
    '/list',
    responses=error_responses(*AUTH_ERRORS),
)
async def list_users(
    query: ListParams = Depends(),
) -> BaseListOutput[UserFullOutput]:
    q = m.User.find()
    query.apply_filter(q, m.User)
    query.apply_sort(q, m.User, (m.User.name,))
    if query.search:
        q = q.find(m.User.search_query(query.search))
    return await BaseListOutput.make_from_query(
        q,
        limit=query.limit,
        offset=query.offset,
        projection_fn=UserFullOutput.from_obj,
    )


@router.get(
    '/select',
    responses=error_responses(*AUTH_ERRORS),
)
async def select_users(
    query: SelectParams = Depends(),
) -> BaseListOutput[UserOutput]:
    q = m.User.find().sort(m.User.name)
    if query.search:
        q = q.find(m.User.search_query(query.search))
    return await BaseListOutput.make_from_query(
        q,
        limit=query.limit,
        offset=query.offset,
        projection_fn=UserOutput.from_obj,
    )


@router.get('/{user_id}', responses=error_responses(*READ_ERRORS))
async def get_user(
    user_id: PydanticObjectId,
) -> SuccessPayloadOutput[UserFullOutput]:
    user = await m.User.find_one(m.User.id == user_id)
    if not user:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'User not found')
    return SuccessPayloadOutput(payload=UserFullOutput.from_obj(user))


@router.post('/', responses=error_responses(*WRITE_ERRORS))
async def create_user(
    body: UserCreate,
) -> SuccessPayloadOutput[UserFullOutput]:
    obj = m.User(
        email=body.email,
        name=body.name,
        is_active=body.is_active,
        is_admin=body.is_admin,
        origin=m.UserOriginType.LOCAL,
    )
    await obj.insert()
    await generate_default_avatar(obj)

    if body.send_email_invite or body.send_pararam_invite:
        password_token, password_token_obj = obj.gen_new_password_reset_token(
            INVITE_PASSWORD_TOKEN_LIFETIME,
        )
        obj.password_reset_token = password_token_obj
        await obj.save_changes()
    if body.send_email_invite:
        await task_send_email.kiq(
            recipients=[obj.email],
            subject='Snail orbit registration',
            body=render_template(
                TemplateT.INVITE_EMAIL,
                user=obj,
                register_token=password_token,  # pylint: disable=possibly-used-before-assignment
            ),
        )
    if body.send_pararam_invite:
        await task_send_pararam_message.kiq(
            user_email=obj.email,
            message=render_template(
                TemplateT.INVITE_PARARAM,
                user=obj,
                register_token=password_token,
            ),
        )
    return SuccessPayloadOutput(payload=UserFullOutput.from_obj(obj))


@router.put(
    '/{user_id}',
    responses=error_responses(*CRUD_ERRORS),
)
async def update_user(
    user_id: PydanticObjectId,
    body: UserUpdate,
) -> SuccessPayloadOutput[UserFullOutput]:
    obj: m.User | None = await m.User.find_one(m.User.id == user_id)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'User not found')
    changes = {
        k: v
        for k, v in body.model_dump(exclude_unset=True).items()
        if getattr(obj, k) != v
    }
    if not changes:
        return SuccessPayloadOutput(payload=UserFullOutput.from_obj(obj))
    if obj.origin != m.UserOriginType.LOCAL and any(
        k not in ALLOW_EXTERNAL_USER_UPDATE_FIELDS for k in changes
    ):
        raise HTTPException(
            HTTPStatus.FORBIDDEN,
            'Cannot update user with external origin',
        )
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    if obj.is_changed:
        await obj.save_changes()
        await asyncio.gather(
            m.Project.update_user_embedded_links(obj),
            m.Issue.update_user_embedded_links(obj),
            m.IssueDraft.update_user_embedded_links(obj),
            m.UserMultiCustomField.update_user_embedded_links(obj),
            m.UserCustomField.update_user_embedded_links(obj),
            m.OwnedCustomField.update_user_embedded_links(obj),
            m.OwnedMultiCustomField.update_user_embedded_links(obj),
            m.Tag.update_user_embedded_links(obj),
            m.Dashboard.update_user_embedded_links(obj),
        )
        await generate_default_avatar(obj)
    return SuccessPayloadOutput(payload=UserFullOutput.from_obj(obj))


@router.get('/{user_id}/global-roles', responses=error_responses(*READ_ERRORS))
async def list_user_global_roles(
    user_id: PydanticObjectId,
    query: ListParams = Depends(),
) -> BaseListOutput[GlobalRoleOutput]:
    """List global roles assigned to a user."""
    user: m.User | None = await m.User.find_one(m.User.id == user_id)
    if not user:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'User not found')

    return BaseListOutput.make(
        count=len(user.global_roles),
        limit=query.limit,
        offset=query.offset,
        items=[
            GlobalRoleOutput.from_obj(role)
            for role in user.global_roles[query.offset : query.offset + query.limit]
        ],
    )


@router.post(
    '/{user_id}/global-role/{role_id}', responses=error_responses(*WRITE_ERRORS)
)
async def assign_global_role_to_user(
    user_id: PydanticObjectId,
    role_id: PydanticObjectId,
) -> ModelIdOutput:
    """Assign a global role to a user."""
    user: m.User | None = await m.User.find_one(m.User.id == user_id)
    if not user:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'User not found')

    global_role: m.GlobalRole | None = await m.GlobalRole.find_one(
        m.GlobalRole.id == role_id
    )
    if not global_role:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Global role not found')

    # Check if role is already assigned
    if any(role.id == role_id for role in user.global_roles):
        raise HTTPException(HTTPStatus.CONFLICT, 'Global role already assigned to user')

    # Add the global role
    user.global_roles.append(m.GlobalRoleLinkField.from_obj(global_role))
    await user.save_changes()

    return ModelIdOutput.make(role_id)


@router.delete(
    '/{user_id}/global-role/{role_id}', responses=error_responses(*READ_ERRORS)
)
async def remove_global_role_from_user(
    user_id: PydanticObjectId,
    role_id: PydanticObjectId,
) -> ModelIdOutput:
    """Remove a global role from a user."""
    user: m.User | None = await m.User.find_one(m.User.id == user_id)
    if not user:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'User not found')

    # Check if role is assigned
    if not any(role.id == role_id for role in user.global_roles):
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Global role not assigned to user')

    # Remove the global role
    user.global_roles = [role for role in user.global_roles if role.id != role_id]
    await user.save_changes()

    return ModelIdOutput.make(role_id)
