from collections.abc import Callable, Coroutine
from http import HTTPStatus

import beanie.operators as bo
from fastapi import Depends, HTTPException
from pydantic import BaseModel
from starsol_fastapi_jwt_auth import AuthJWT

import pm.models as m
from pm.api.exceptions import MFARequiredException
from pm.api.utils.router import APIRouter
from pm.api.views.output import SuccessOutput
from pm.config import CONFIG

from .oidc import router as oidc_router

__all__ = ('router',)


router = APIRouter(prefix='/auth', tags=['auth'])
router.include_router(oidc_router)

JWT_CRYPTO_ALGORITHM = 'HS256'


class UserAuth(BaseModel):
    login: str
    password: str
    remember: bool = False
    mfa_totp_code: str | None = None


class MFACheckBody(BaseModel):
    mfa_totp_code: str


class PasswordResetSetBody(BaseModel):
    reset_token: str
    password: str


class AuthException(Exception):
    detail: str

    def __init__(self, detail: str) -> None:
        super().__init__()
        self.detail = detail


def _mfa_check(user: m.User, user_auth: UserAuth) -> bool:
    if not user.mfa_enabled:
        return False
    if not user_auth.mfa_totp_code:
        raise MFARequiredException()
    if not user.check_totp(user_auth.mfa_totp_code):
        raise AuthException('MFA error')
    return True


async def local_auth(
    user_auth: UserAuth,
) -> tuple[m.User, bool]:
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
    mfa_passed = _mfa_check(user, user_auth)
    return user, mfa_passed


async def dev_auth(
    user_auth: UserAuth,
) -> tuple[m.User, bool]:
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
    mfa_passed = _mfa_check(user, user_auth)
    return user, mfa_passed


def get_auth_func() -> Callable[[UserAuth], Coroutine[None, None, tuple[m.User, bool]]]:
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
        user, mfa_passed = await auth_fn(user_auth)
    except AuthException as err:
        raise HTTPException(HTTPStatus.UNAUTHORIZED, detail=err.detail) from err
    access_token = auth.create_access_token(
        subject=user.email,
        algorithm=JWT_CRYPTO_ALGORITHM,
        expires_time=CONFIG.ACCESS_TOKEN_EXPIRES,
        user_claims={
            'mfa_passed': mfa_passed,
        },
    )
    refresh_expires = CONFIG.REFRESH_TOKEN_NON_REMEMBER_EXPIRES
    if user_auth.remember:
        refresh_expires = CONFIG.REFRESH_TOKEN_REMEMBER_EXPIRES
    refresh_token = auth.create_refresh_token(
        subject=user.email,
        algorithm=JWT_CRYPTO_ALGORITHM,
        expires_time=refresh_expires,
        user_claims={
            'mfa_passed': mfa_passed,
        },
    )
    auth.set_access_cookies(access_token, max_age=CONFIG.ACCESS_TOKEN_EXPIRES)
    auth.set_refresh_cookies(refresh_token, max_age=refresh_expires)
    return SuccessOutput()


@router.get('/refresh')
async def refresh(auth: AuthJWT = Depends()) -> SuccessOutput:
    auth.jwt_refresh_token_required()
    raw_token = auth.get_raw_jwt() or {}
    access_token = auth.create_access_token(
        subject=auth.get_jwt_subject(),
        algorithm=JWT_CRYPTO_ALGORITHM,
        expires_time=CONFIG.ACCESS_TOKEN_EXPIRES,
        user_claims={
            'mfa_passed': raw_token.get('mfa_passed', False),
        },
    )
    auth.set_access_cookies(access_token, max_age=CONFIG.ACCESS_TOKEN_EXPIRES)
    return SuccessOutput()


@router.get('/logout')
async def logout(auth: AuthJWT = Depends()) -> SuccessOutput:
    auth.jwt_required()
    auth.unset_jwt_cookies()
    return SuccessOutput()


@router.post('/password-reset/set')
async def password_reset(
    body: PasswordResetSetBody,
) -> SuccessOutput:
    user = await m.User.get_by_password_reset_token(body.reset_token)
    if not user:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'User not found')
    user.set_password(body.password)
    user.password_reset_token = None
    await user.save_changes()
    return SuccessOutput()
