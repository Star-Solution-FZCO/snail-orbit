from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from pm.api.context import current_user
from pm.api.views.output import BaseListOutput, SuccessPayloadOutput
from pm.api.views.pararams import ListParams

__all__ = ('router',)

router = APIRouter(prefix='/api_token', tags=['api_token'])


class ApiTokenOut(BaseModel):
    name: str
    last_digits: str
    created_at: datetime


class ApiTokenCreate(BaseModel):
    name: str


class ApiTokenCreateOut(BaseModel):
    token: str


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
            ApiTokenOut(name=t.name, last_digits=t.last_digits, created_at=t.created_at)
            for t in tokens[query.offset : query.offset + query.limit]
        ],
    )


@router.post('/')
async def add_token(
    body: ApiTokenCreate,
) -> SuccessPayloadOutput[ApiTokenCreateOut]:
    user = current_user()
    token, token_obj = user.gen_new_api_token(body.name)
    user.api_tokens.append(token_obj)
    await user.save_changes()
    return SuccessPayloadOutput(payload=ApiTokenCreateOut(token=token))
