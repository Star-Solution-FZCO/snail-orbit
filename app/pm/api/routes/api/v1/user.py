import asyncio
from datetime import timedelta
from http import HTTPStatus
from typing import Self

import beanie.operators as bo
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
from pm.email_templates import render_template
from pm.services.avatars import generate_default_avatar
from pm.tasks.actions import task_send_email

__all__ = ('router',)

router = APIRouter(
    prefix='/user', tags=['user'], dependencies=[Depends(admin_context_dependency)]
)

INVITE_PASSWORD_TOKEN_LIFETIME = timedelta(days=7)


class UserFullOutput(UserOutput):
    is_admin: bool
    origin: m.UserOriginType
    avatar_type: m.UserAvatarType

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
        )


class UserCreate(BaseModel):
    email: str
    name: str
    is_active: bool = True
    is_admin: bool = False
    send_invite: bool = True


class UserUpdate(BaseModel):
    email: str | None = None
    name: str | None = None
    is_active: bool | None = None
    is_admin: bool | None = None


@router.get('/list')
async def list_users(
    query: ListParams = Depends(),
) -> BaseListOutput[UserFullOutput]:
    q = m.User.find().sort(m.User.id)
    return await BaseListOutput.make_from_query(
        q,
        limit=query.limit,
        offset=query.offset,
        projection_fn=UserFullOutput.from_obj,
    )


@router.get('/select')
async def select_users(
    query: SelectParams = Depends(),
):
    q = m.User.find(
        bo.Or(
            bo.RegEx(m.User.name, query.search, 'i'),
            bo.RegEx(m.User.email, query.search, 'i'),
        )
    ).sort(m.User.name)
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
    if body.send_invite:
        password_token, password_token_obj = obj.gen_new_password_reset_token(
            INVITE_PASSWORD_TOKEN_LIFETIME
        )
        obj.password_reset_token = password_token_obj
    await obj.insert()
    await generate_default_avatar(obj)
    if body.send_invite:
        task_send_email.delay(
            recipients=[obj.email],
            subject='Snail orbit registration',
            body=render_template(
                'invite',
                user=obj,
                register_token=password_token,
            ),
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
    if obj.origin != m.UserOriginType.LOCAL:
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
