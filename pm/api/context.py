from collections.abc import AsyncGenerator
from typing import cast
from http import HTTPStatus

import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends, HTTPException
from starsol_fastapi_jwt_auth import AuthJWT
from starlette_context import context, request_cycle_context


import pm.models as m
from pm.api.db import db_session_dependency

__all__ = (
    'current_user_context_dependency',
    'user_dependency',
    'current_user',
    'admin_context_dependency',
)


async def user_dependency(
    jwt_auth: AuthJWT = Depends(AuthJWT),
    session: AsyncSession = Depends(db_session_dependency),
) -> 'm.User':
    jwt_auth.jwt_required()
    user_login = jwt_auth.get_jwt_subject()
    user = await session.scalar(sa.select(m.User).where(m.User.email == user_login))
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
