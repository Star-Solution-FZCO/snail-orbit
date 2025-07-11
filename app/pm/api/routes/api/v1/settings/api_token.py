from datetime import datetime
from http import HTTPStatus
from typing import Self

from fastapi import Depends
from pydantic import BaseModel

import pm.models as m
from pm.api.context import current_user
from pm.api.utils.router import APIRouter
from pm.api.views.error_responses import AUTH_ERRORS, error_responses
from pm.api.views.output import BaseListOutput, ErrorOutput, SuccessPayloadOutput
from pm.api.views.params import ListParams

__all__ = ('router',)

router = APIRouter(
    prefix='/api_token',
    tags=['api_token'],
    responses=error_responses(*AUTH_ERRORS),
)


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
    user_ctx = current_user()
    tokens = sorted(user_ctx.user.api_tokens, key=lambda x: x.created_at, reverse=True)
    return BaseListOutput.make(
        count=len(user_ctx.user.api_tokens),
        limit=query.limit,
        offset=query.offset,
        items=[
            ApiTokenOut.from_obj(t)
            for t in tokens[query.offset : query.offset + query.limit]
        ],
    )


@router.post(
    '/',
    responses=error_responses(
        (HTTPStatus.BAD_REQUEST, ErrorOutput),
        (HTTPStatus.UNAUTHORIZED, ErrorOutput),
        (HTTPStatus.FORBIDDEN, ErrorOutput),
        (HTTPStatus.UNPROCESSABLE_ENTITY, ErrorOutput),
    ),
)
async def add_token(
    body: ApiTokenCreate,
) -> SuccessPayloadOutput[ApiTokenCreateOut]:
    user_ctx = current_user()
    token, token_obj = user_ctx.user.gen_new_api_token(
        body.name, expires_at=body.expires_at
    )
    user_ctx.user.api_tokens.append(token_obj)
    if user_ctx.user.is_changed:
        await user_ctx.user.save_changes()
    return SuccessPayloadOutput(payload=ApiTokenCreateOut.from_obj(token_obj, token))
