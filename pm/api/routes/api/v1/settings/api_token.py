from datetime import datetime
from typing import Self

from fastapi import Depends
from pydantic import BaseModel

import pm.models as m
from pm.api.context import current_user
from pm.api.utils.router import APIRouter
from pm.api.views.output import BaseListOutput, SuccessPayloadOutput
from pm.api.views.pararams import ListParams

__all__ = ('router',)

router = APIRouter(prefix='/api_token', tags=['api_token'])


class ApiTokenOut(BaseModel):
    name: str
    last_digits: str
    created_at: datetime
    expires_at: datetime | None
    is_active: bool

    @classmethod
    def from_obj(cls, obj: m.APIToken) -> Self:
        return cls(
            name=obj.name,
            last_digits=obj.last_digits,
            created_at=obj.created_at,
            expires_at=obj.expires_at,
            is_active=obj.is_active,
        )


class ApiTokenCreate(BaseModel):
    name: str
    expires_at: datetime | None = None


class ApiTokenCreateOut(BaseModel):
    name: str
    last_digits: str
    created_at: datetime
    expires_at: datetime | None
    is_active: bool
    token: str

    @classmethod
    def from_obj(cls, obj: m.APIToken, token: str) -> Self:
        return cls(
            name=obj.name,
            last_digits=obj.last_digits,
            created_at=obj.created_at,
            expires_at=obj.expires_at,
            is_active=obj.is_active,
            token=token,
        )


@router.get('/list')
async def list_api_tokens(
    query: ListParams = Depends(),
) -> BaseListOutput[ApiTokenOut]:
    user = current_user()
    tokens = sorted(user.api_tokens, key=lambda x: x.created_at, reverse=True)
    return BaseListOutput.make(
        count=len(user.api_tokens),
        limit=query.limit,
        offset=query.offset,
        items=[
            ApiTokenOut.from_obj(t)
            for t in tokens[query.offset : query.offset + query.limit]
        ],
    )


@router.post('/')
async def add_token(
    body: ApiTokenCreate,
) -> SuccessPayloadOutput[ApiTokenCreateOut]:
    user = current_user()
    token, token_obj = user.gen_new_api_token(body.name, expires_at=body.expires_at)
    user.api_tokens.append(token_obj)
    if user.is_changed:
        await user.save_changes()
    return SuccessPayloadOutput(payload=ApiTokenCreateOut.from_obj(token_obj, token))
