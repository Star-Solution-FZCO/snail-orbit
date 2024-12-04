import time
from http import HTTPStatus
from urllib.parse import urljoin

import jwt
from fastapi import Cookie, Depends, Form, HTTPException, Request, Response
from fastapi.responses import RedirectResponse
from starsol_fastapi_jwt_auth import AuthJWT

import pm.models as m
from pm.api.utils.router import APIRouter
from pm.config import CONFIG
from pm.utils.oidc import auth_with_oidc_token, discover_oidc_params

router = APIRouter(prefix='/oidc', tags=['oidc'])

STATE_COOKIE_NAME = 'oidc_state'
CALL_BACK_PATH = '/api/auth/oidc/callback'
STATE_NOT_BEFORE_DELTA = 60  # 1 minute
STATE_TTL = 10 * 60  # 10 minutes


@router.get('')
async def oidc(
    request: Request,
) -> RedirectResponse:
    if not CONFIG.OIDC_ENABLED:
        raise HTTPException(
            status_code=HTTPStatus.NOT_IMPLEMENTED,
            detail='OIDC is not enabled',
        )
    params = await discover_oidc_params(CONFIG.OIDC_DISCOVERY_URL)
    state_data = _gen_state_data(request)
    state = jwt.encode(
        state_data,
        CONFIG.JWT_SECRET,
        algorithm='HS256',
    )
    resp = RedirectResponse(
        params.gen_login_url(
            CONFIG.OIDC_CLIENT_ID,
            state=state,
            callback_url=urljoin(str(request.base_url), CALL_BACK_PATH),
        )
    )
    resp.set_cookie(
        STATE_COOKIE_NAME,
        state,
        httponly=True,
        secure=not CONFIG.DEV_MODE,
        samesite='lax',
        path='/api/auth/oidc/callback',
    )
    return resp


@router.get('/callback')
async def oidc_callback(
    request: Request,
    response: Response,
    state: str,
    state_cookie: str = Cookie(None, alias=STATE_COOKIE_NAME),
    auth: AuthJWT = Depends(),
) -> RedirectResponse:
    if not CONFIG.OIDC_ENABLED:
        raise HTTPException(
            status_code=HTTPStatus.NOT_IMPLEMENTED,
            detail='OIDC is not enabled',
        )
    if state_cookie is None:
        raise HTTPException(
            status_code=HTTPStatus.BAD_REQUEST,
            detail='State cookie is missing',
        )
    response.delete_cookie(STATE_COOKIE_NAME)
    if state != state_cookie:
        raise HTTPException(
            status_code=HTTPStatus.BAD_REQUEST,
            detail='State mismatch',
            headers={'set-cookie': response.headers['set-cookie']},
        )
    try:
        state_data = _decode_state(request, state)
    except StateCheckException as err:
        raise HTTPException(
            status_code=HTTPStatus.BAD_REQUEST,
            detail=err.detail,
            headers={'set-cookie': response.headers['set-cookie']},
        ) from err
    email = await auth_with_oidc_token(
        code=request.query_params.get('code'),
        client_id=CONFIG.OIDC_CLIENT_ID,
        client_secret=CONFIG.OIDC_CLIENT_SECRET,
        discovery_url=CONFIG.OIDC_DISCOVERY_URL,
        callback_url=urljoin(str(request.base_url), CALL_BACK_PATH),
    )
    if not email:
        raise HTTPException(
            status_code=HTTPStatus.UNAUTHORIZED,
            detail='Invalid token',
            headers={'set-cookie': response.headers['set-cookie']},
        )
    if not (user := await m.User.find_one(m.User.email == email)):
        raise HTTPException(
            status_code=HTTPStatus.UNAUTHORIZED,
            detail='User not found',
            headers={'set-cookie': response.headers['set-cookie']},
        )
    if user.mfa_enabled:
        resp = RedirectResponse(CONFIG.OIDC_MFA_PAGE)
        state_data['user'] = user.email
        state = jwt.encode(
            state_data,
            CONFIG.JWT_SECRET,
            algorithm='HS256',
        )
        resp.set_cookie(
            STATE_COOKIE_NAME,
            state,
            httponly=True,
            secure=not CONFIG.DEV_MODE,
            samesite='lax',
            path='/api/auth/oidc/mfa',
        )
        return resp
    return gen_authorized_response(user, auth, redirect_url=state_data.get('redirect'))


@router.post('/mfa')
async def mfa_check(
    request: Request,
    response: Response,
    mfa_totp_code: str = Form(...),
    state_cookie: str = Cookie(None, alias=STATE_COOKIE_NAME),
    auth: AuthJWT = Depends(),
) -> RedirectResponse:
    if not CONFIG.OIDC_ENABLED:
        raise HTTPException(
            status_code=HTTPStatus.NOT_IMPLEMENTED,
            detail='OIDC is not enabled',
        )
    if state_cookie is None:
        raise HTTPException(
            status_code=HTTPStatus.BAD_REQUEST,
            detail='State cookie is missing',
        )
    response.delete_cookie(STATE_COOKIE_NAME)
    mfa_code = mfa_totp_code.strip()
    if not mfa_code:
        raise HTTPException(
            status_code=HTTPStatus.BAD_REQUEST,
            detail='MFA code is empty',
            headers={'set-cookie': response.headers['set-cookie']},
        )
    try:
        state_data = _decode_state(request, state_cookie)
    except StateCheckException as err:
        raise HTTPException(
            status_code=HTTPStatus.BAD_REQUEST,
            detail=err.detail,
            headers={'set-cookie': response.headers['set-cookie']},
        ) from err
    email = state_data.get('user')
    if not email:
        raise HTTPException(
            status_code=HTTPStatus.UNAUTHORIZED,
            detail='Invalid token',
            headers={'set-cookie': response.headers['set-cookie']},
        )
    if not (user := await m.User.find_one(m.User.email == email)):
        raise HTTPException(
            status_code=HTTPStatus.UNAUTHORIZED,
            detail='User not found',
            headers={'set-cookie': response.headers['set-cookie']},
        )
    if not user.check_totp(mfa_code):
        raise HTTPException(
            status_code=HTTPStatus.UNAUTHORIZED,
            detail='MFA failed',
            headers={'set-cookie': response.headers['set-cookie']},
        )
    return gen_authorized_response(
        user, auth, redirect_url=state_data.get('redirect'), mfa_passed=True
    )


def gen_authorized_response(
    user: m.User,
    auth: AuthJWT,
    redirect_url: str | None = None,
    mfa_passed: bool = False,
) -> RedirectResponse:
    access_token = auth.create_access_token(
        subject=user.email,
        algorithm='HS256',
        expires_time=CONFIG.ACCESS_TOKEN_EXPIRES,
        user_claims={
            'mfa_passed': mfa_passed,
        },
    )
    refresh_expires = CONFIG.REFRESH_TOKEN_REMEMBER_EXPIRES
    refresh_token = auth.create_refresh_token(
        subject=user.email,
        algorithm='HS256',
        expires_time=CONFIG.REFRESH_TOKEN_REMEMBER_EXPIRES,
        user_claims={
            'mfa_passed': mfa_passed,
        },
    )
    resp = RedirectResponse(
        redirect_url or '/',
        status_code=HTTPStatus.FOUND,
    )
    resp.delete_cookie(STATE_COOKIE_NAME)
    auth.set_access_cookies(
        access_token, max_age=CONFIG.ACCESS_TOKEN_EXPIRES, response=resp
    )
    auth.set_refresh_cookies(refresh_token, max_age=refresh_expires, response=resp)
    return resp


def _gen_state_data(req: Request) -> dict:
    now = time.time()
    data = {
        'ip': req.client.host,
        'not_before': now - STATE_NOT_BEFORE_DELTA,
        'expires': now + STATE_TTL,
    }
    if url := req.query_params.get('redirect'):
        data['redirect'] = url
    return data


class StateCheckException(Exception):
    detail: str

    def __init__(self, detail: str) -> None:
        self.detail = detail


def _decode_state(req: Request, state: str) -> dict:
    try:
        data = jwt.decode(
            state,
            CONFIG.JWT_SECRET,
            algorithms=['HS256'],
        )
    except jwt.PyJWTError as err:
        raise StateCheckException(
            detail='Invalid state',
        ) from err
    if not isinstance(data, dict):
        raise StateCheckException(
            detail='Invalid state',
        )
    if not (ip := data.get('ip')) or ip != req.client.host:
        raise StateCheckException(
            detail='State mismatch',
        )
    now = time.time()
    if not (not_before := data.get('not_before')) or not_before > now:
        raise StateCheckException(
            detail='State not yet valid',
        )
    if not (expires := data.get('expires')) or expires < now:
        raise StateCheckException(
            detail='State expired',
        )
    return data
