from collections.abc import AsyncGenerator
from http import HTTPStatus
from typing import cast

from fastapi import Depends, HTTPException
from starlette_context import context, request_cycle_context
from starsol_fastapi_jwt_auth import AuthJWT

import pm.models as m

__all__ = (
    'current_user_context_dependency',
    'user_dependency',
    'current_user',
    'admin_context_dependency',
)


async def user_dependency(
    jwt_auth: AuthJWT = Depends(AuthJWT),
) -> 'm.User':
    jwt_auth.jwt_required()
    user_login = jwt_auth.get_jwt_subject()
    user: m.User | None = await m.User.find_one(m.User.email == user_login)
    if not user:
        raise HTTPException(HTTPStatus.UNAUTHORIZED, 'Authorized user not found')
    return user


async def current_user_context_dependency(
    user: 'm.User' = Depends(user_dependency),
) -> AsyncGenerator:
    data = {'current_user': user}
    with request_cycle_context(data):
        yield


def current_user() -> 'm.User':
    if user := context.get('current_user', None):
        return cast(m.User, user)
    raise HTTPException(HTTPStatus.UNAUTHORIZED, 'Authorized user not found')


async def admin_context_dependency(
    _: None = Depends(current_user_context_dependency),
) -> AsyncGenerator:
    user = current_user()
    if not user.is_admin:
        raise HTTPException(HTTPStatus.FORBIDDEN, 'Admin permission required')
    yield
