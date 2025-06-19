from http import HTTPStatus
from typing import Any

from authlib.integrations.starlette_client import OAuth
from fastapi import Depends, FastAPI, Form, HTTPException, Request
from fastapi.responses import RedirectResponse
from starlette.middleware.sessions import SessionMiddleware
from starsol_fastapi_jwt_auth import AuthJWT

import pm.models as m
from pm.config import CONFIG

oidc_app = FastAPI()
oidc_app.add_middleware(SessionMiddleware, secret_key=CONFIG.OIDC_SESSION_SECRET)

oauth = OAuth()
oauth.register(
    name='oidc',
    client_id=CONFIG.OIDC_CLIENT_ID,
    client_secret=CONFIG.OIDC_CLIENT_SECRET,
    server_metadata_url=CONFIG.OIDC_DISCOVERY_URL,
    client_kwargs={'scope': 'openid profile email'},
)


@oidc_app.get(
    '/',
    summary='Initiate OIDC Authentication',
    description='Redirects to OIDC provider for authentication',
    tags=['oidc'],
)
async def oidc(request: Request) -> RedirectResponse:
    callback_url = f'{request.base_url}api/auth/oidc/callback'
    return await oauth.oidc.authorize_redirect(request, callback_url)


@oidc_app.get(
    '/callback',
    summary='OIDC Authentication Callback',
    description='Handles OIDC provider callback and completes authentication',
    tags=['oidc'],
)
async def oidc_callback(
    request: Request, auth: AuthJWT = Depends()
) -> RedirectResponse:
    try:
        token: dict[str, Any] = await oauth.oidc.authorize_access_token(request)
        user_info: dict[str, Any] = token.get(
            'userinfo'
        ) or await oauth.oidc.get_userinfo(token)
        email: str | None = user_info.get('email') or user_info.get('sub')
        if not email:
            raise ValueError('No email found')
    except Exception as err:
        raise HTTPException(HTTPStatus.UNAUTHORIZED, 'Invalid token') from err

    if not (user := await m.User.find_one(m.User.email == email)):
        raise HTTPException(HTTPStatus.UNAUTHORIZED, 'User not found')

    if user.mfa_enabled:
        request.session['mfa_user_email'] = user.email
        request.session['redirect_url'] = request.query_params.get('redirect')
        return RedirectResponse(CONFIG.OIDC_MFA_PAGE)

    redirect_url: str = request.query_params.get('redirect') or '/'
    return _create_auth_response(user, auth, redirect_url)


@oidc_app.post(
    '/mfa',
    summary='OIDC MFA Verification',
    description='Verifies multi-factor authentication code for OIDC login',
    tags=['oidc'],
)
async def mfa_check(
    request: Request,
    mfa_totp_code: str = Form(...),
    auth: AuthJWT = Depends(),
) -> RedirectResponse:
    if not (mfa_code := mfa_totp_code.strip()):
        raise HTTPException(HTTPStatus.BAD_REQUEST, 'MFA code is empty')

    if not (email := request.session.get('mfa_user_email')):
        raise HTTPException(HTTPStatus.UNAUTHORIZED, 'Invalid session')

    if not (user := await m.User.find_one(m.User.email == email)):
        raise HTTPException(HTTPStatus.UNAUTHORIZED, 'User not found')

    if not user.check_totp(mfa_code):
        raise HTTPException(HTTPStatus.UNAUTHORIZED, 'MFA failed')

    redirect_url: str = request.session.get('redirect_url') or '/'
    request.session.clear()

    return _create_auth_response(user, auth, redirect_url, mfa_passed=True)


def _create_auth_response(
    user: m.User,
    auth: AuthJWT,
    redirect_url: str = '/',
    mfa_passed: bool = False,
) -> RedirectResponse:
    user_claims: dict[str, bool] = {'mfa_passed': mfa_passed}

    access_token: str = auth.create_access_token(
        subject=user.email,
        algorithm='HS256',
        expires_time=CONFIG.ACCESS_TOKEN_EXPIRES,
        user_claims=user_claims,
    )
    refresh_token: str = auth.create_refresh_token(
        subject=user.email,
        algorithm='HS256',
        expires_time=CONFIG.REFRESH_TOKEN_REMEMBER_EXPIRES,
        user_claims=user_claims,
    )

    resp = RedirectResponse(redirect_url, status_code=HTTPStatus.FOUND)
    auth.set_access_cookies(
        access_token, max_age=CONFIG.ACCESS_TOKEN_EXPIRES, response=resp
    )
    auth.set_refresh_cookies(
        refresh_token, max_age=CONFIG.REFRESH_TOKEN_REMEMBER_EXPIRES, response=resp
    )
    return resp
