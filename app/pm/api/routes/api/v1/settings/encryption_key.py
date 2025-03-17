from datetime import datetime
from http import HTTPStatus
from typing import Self

from fastapi import Depends, HTTPException
from pydantic import BaseModel

import pm.models as m
from pm.api.context import current_user
from pm.api.utils.router import APIRouter
from pm.api.views.output import BaseListOutput, SuccessOutput, SuccessPayloadOutput
from pm.api.views.params import ListParams

__all__ = ('router',)

router = APIRouter(prefix='/encryption_key', tags=['encryption_key'])


class EncryptionKeyOut(BaseModel):
    name: str
    public_key: str
    fingerprint: str
    algorithm: m.EncryptionKeyAlgorithmT
    is_active: bool
    created_on: str | None
    created_at: datetime

    @classmethod
    def from_obj(cls, obj: m.EncryptionKey) -> Self:
        return cls(
            name=obj.name,
            public_key=obj.public_key,
            fingerprint=obj.fingerprint,
            algorithm=obj.algorithm,
            is_active=obj.is_active,
            created_on=obj.created_on,
            created_at=obj.created_at,
        )


class EncryptionKeyCreate(BaseModel):
    name: str
    public_key: str
    fingerprint: str
    algorithm: m.EncryptionKeyAlgorithmT
    is_active: bool = True
    created_on: str | None = None


class EncryptionKeyUpdate(BaseModel):
    name: str | None = None
    is_active: bool | None = None


@router.get('/list')
async def list_encryption_keys(
    query: ListParams = Depends(),
) -> BaseListOutput[EncryptionKeyOut]:
    user_ctx = current_user()
    objs = sorted(
        user_ctx.user.encryption_keys, key=lambda x: x.created_at, reverse=True
    )
    return BaseListOutput.make(
        count=len(user_ctx.user.encryption_keys),
        limit=query.limit,
        offset=query.offset,
        items=[
            EncryptionKeyOut.from_obj(obj)
            for obj in objs[query.offset : query.offset + query.limit]
        ],
    )


@router.get('/{fingerprint}')
async def get_key(
    fingerprint: str,
) -> SuccessPayloadOutput[EncryptionKeyOut]:
    user_ctx = current_user()
    obj = next(
        (
            key
            for key in user_ctx.user.encryption_keys
            if key.fingerprint == fingerprint
        ),
        None,
    )
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Key not found')
    return SuccessPayloadOutput(payload=EncryptionKeyOut.from_obj(obj))


@router.post('/')
async def add_key(
    body: EncryptionKeyCreate,
) -> SuccessPayloadOutput[EncryptionKeyOut]:
    user_ctx = current_user()
    if any(
        key
        for key in user_ctx.user.encryption_keys
        if key.fingerprint == body.fingerprint
    ):
        raise HTTPException(
            HTTPStatus.CONFLICT, 'Key with such fingerprint already exists'
        )
    obj = m.EncryptionKey(
        name=body.name,
        public_key=body.public_key,
        fingerprint=body.fingerprint,
        algorithm=body.algorithm,
        created_on=body.created_on,
    )
    user_ctx.user.encryption_keys.append(obj)
    if user_ctx.user.is_changed:
        await user_ctx.user.save_changes()
    return SuccessPayloadOutput(payload=EncryptionKeyOut.from_obj(obj))


@router.put('/{fingerprint}')
async def update_key(
    fingerprint: str,
    body: EncryptionKeyUpdate,
) -> SuccessPayloadOutput[EncryptionKeyOut]:
    user_ctx = current_user()
    obj = next(
        (
            key
            for key in user_ctx.user.encryption_keys
            if key.fingerprint == fingerprint
        ),
        None,
    )
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Key not found')
    data = body.model_dump(exclude_unset=True)
    if not data:
        return SuccessPayloadOutput(payload=EncryptionKeyOut.from_obj(obj))
    for k, v in data.items():
        setattr(obj, k, v)
    await user_ctx.user.replace()
    return SuccessPayloadOutput(payload=EncryptionKeyOut.from_obj(obj))


@router.delete('/{fingerprint}')
async def delete_key(
    fingerprint: str,
) -> SuccessOutput:
    user_ctx = current_user()
    user_ctx.user.encryption_keys = [
        key for key in user_ctx.user.encryption_keys if key.fingerprint != fingerprint
    ]
    if user_ctx.user.is_changed:
        await user_ctx.user.save_changes()
    return SuccessOutput()
