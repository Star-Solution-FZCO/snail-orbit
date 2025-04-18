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
from pm.api.views.output import BaseListOutput, SuccessPayloadOutput
from pm.api.views.params import ListParams
from pm.api.views.select import SelectParams
from pm.api.views.user import UserOutput
from pm.services.avatars import generate_default_avatar
from pm.tasks.actions import task_send_email, task_send_pararam_message
from pm.templates import TemplateT, render_template

__all__ = ('router',)

router = APIRouter(
    prefix='/user', tags=['user'], dependencies=[Depends(admin_context_dependency)]
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


@router.get('/list')
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


@router.get('/select')
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


@router.get('/{user_id}')
async def get_user(
    user_id: PydanticObjectId,
) -> SuccessPayloadOutput[UserFullOutput]:
    user = await m.User.find_one(m.User.id == user_id)
    if not user:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'User not found')
    return SuccessPayloadOutput(payload=UserFullOutput.from_obj(user))


@router.post('/')
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
            INVITE_PASSWORD_TOKEN_LIFETIME
        )
        obj.password_reset_token = password_token_obj
        await obj.save_changes()
    if body.send_email_invite:
        task_send_email.delay(
            recipients=[obj.email],
            subject='Snail orbit registration',
            body=render_template(
                TemplateT.INVITE_EMAIL,
                user=obj,
                register_token=password_token,  # pylint: disable=possibly-used-before-assignment
            ),
        )
    if body.send_pararam_invite:
        task_send_pararam_message.delay(
            user_email=obj.email,
            message=render_template(
                TemplateT.INVITE_PARARAM,
                user=obj,
                register_token=password_token,
            ),
        )
    await asyncio.gather(
        m.UserMultiCustomField.add_option_predefined_scope(obj),
        m.UserCustomField.add_option_predefined_scope(obj),
    )
    return SuccessPayloadOutput(payload=UserFullOutput.from_obj(obj))


@router.put('/{user_id}')
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
            HTTPStatus.FORBIDDEN, 'Cannot update user with external origin'
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
            m.Tag.update_user_embedded_links(obj),
        )
        await generate_default_avatar(obj)
    return SuccessPayloadOutput(payload=UserFullOutput.from_obj(obj))
