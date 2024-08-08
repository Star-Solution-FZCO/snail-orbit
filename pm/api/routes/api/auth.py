from collections.abc import Callable, Coroutine
from http import HTTPStatus

import beanie.operators as bo
from fastapi import Depends, HTTPException
from pydantic import BaseModel
from starsol_fastapi_jwt_auth import AuthJWT

import pm.models as m
from pm.api.utils.router import APIRouter
from pm.api.views.output import SuccessOutput
from pm.config import CONFIG

__all__ = ('router',)


router = APIRouter(prefix='/auth', tags=['auth'])

JWT_CRYPTO_ALGORITHM = 'HS256'


class UserAuth(BaseModel):
    login: str
    password: str
    remember: bool = False


class AuthException(Exception):
    detail: str

    def __init__(self, detail: str) -> None:
        super().__init__()
        self.detail = detail


async def local_auth(
    user_auth: UserAuth,
) -> m.User:
    if not user_auth.password:
        raise AuthException('Password is empty')
    user: m.User | None = await m.User.find_one(
        bo.And(
            bo.Eq(m.User.is_active, True),
            m.User.email == user_auth.login.strip().lower(),
        )
    )
    if not user:
        raise AuthException('User not found')
    if not user.check_password(user_auth.password):
        raise AuthException('Invalid password')
    return user


async def dev_auth(
    user_auth: UserAuth,
) -> m.User:
    user: m.User | None = await m.User.find_one(
        bo.And(
            bo.Eq(m.User.is_active, True),
            m.User.email == user_auth.login.strip().lower(),
        )
    )
    if not user:
        raise AuthException('User not found')
    if user_auth.password != CONFIG.DEV_PASSWORD:
        raise AuthException('Invalid password')
    return user


def get_auth_func() -> Callable[[UserAuth], Coroutine[None, None, m.User]]:
    if CONFIG.DEV_MODE:
        return dev_auth
    return local_auth


@router.post('/login')
async def login(
    user_auth: UserAuth,
    auth: AuthJWT = Depends(),
) -> SuccessOutput:
    auth_fn = get_auth_func()
    try:
        user = await auth_fn(user_auth)
    except AuthException as err:
        raise HTTPException(HTTPStatus.UNAUTHORIZED, detail=err.detail) from err
    access_token = auth.create_access_token(
        subject=user.email,
        algorithm=JWT_CRYPTO_ALGORITHM,
        expires_time=CONFIG.ACCESS_TOKEN_EXPIRES,
    )
    refresh_expires = CONFIG.REFRESH_TOKEN_NON_REMEMBER_EXPIRES
    if user_auth.remember:
        refresh_expires = CONFIG.REFRESH_TOKEN_REMEMBER_EXPIRES
    refresh_token = auth.create_refresh_token(
        subject=user.email, algorithm=JWT_CRYPTO_ALGORITHM, expires_time=refresh_expires
    )
    auth.set_access_cookies(access_token, max_age=CONFIG.ACCESS_TOKEN_EXPIRES)
    auth.set_refresh_cookies(refresh_token, max_age=refresh_expires)
    return SuccessOutput()


@router.get('/refresh')
async def refresh(auth: AuthJWT = Depends()) -> SuccessOutput:
    auth.jwt_refresh_token_required()
    access_token = auth.create_access_token(
        subject=auth.get_jwt_subject(),
        algorithm=JWT_CRYPTO_ALGORITHM,
        expires_time=CONFIG.ACCESS_TOKEN_EXPIRES,
    )
    auth.set_access_cookies(access_token, max_age=CONFIG.ACCESS_TOKEN_EXPIRES)
    return SuccessOutput()


@router.get('/logout')
async def logout(auth: AuthJWT = Depends()) -> SuccessOutput:
    auth.jwt_required()
    auth.unset_jwt_cookies()
    return SuccessOutput()
