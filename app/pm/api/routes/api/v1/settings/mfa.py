from datetime import datetime
from http import HTTPStatus
from typing import Self

from fastapi import HTTPException
from pydantic import BaseModel

import pm.models as m
from pm.api.context import current_user
from pm.api.exceptions import MFARequiredException
from pm.api.utils.router import APIRouter
from pm.api.views.error_responses import AUTH_ERRORS, error_responses
from pm.api.views.output import ErrorOutput, SuccessOutput, SuccessPayloadOutput
from pm.config import CONFIG

__all__ = ('router',)

router = APIRouter(
    prefix='/mfa',
    tags=['mfa'],
    responses=error_responses(*AUTH_ERRORS),
)


class TOTPStatusOut(BaseModel):
    created_at: datetime | None

    @classmethod
    def from_obj(cls, obj: m.User) -> Self:
        if not obj.totp:
            return cls(created_at=None)
        return cls(created_at=obj.totp.created_at)


class MFASettingOut(BaseModel):
    is_enabled: bool
    totp: TOTPStatusOut

    @classmethod
    def from_obj(cls, obj: m.User) -> Self:
        return cls(
            is_enabled=obj.mfa_enabled,
            totp=TOTPStatusOut.from_obj(obj),
        )


class MFASettingUpdate(BaseModel):
    is_enabled: bool
    mfa_totp_code: str | None = None


class TOTPCreateOut(BaseModel):
    created_at: datetime
    secret: str
    link: str
    period: int
    digits: int
    digest: str


class TOTPDeleteBody(BaseModel):
    mfa_totp_code: str | None = None


@router.get('')
async def get_two_fa_settings() -> SuccessPayloadOutput[MFASettingOut]:
    user_ctx = current_user()
    return SuccessPayloadOutput(payload=MFASettingOut.from_obj(user_ctx.user))


@router.put('')
async def update_two_fa_settings(
    body: MFASettingUpdate,
) -> SuccessPayloadOutput[MFASettingOut]:
    user_ctx = current_user()
    if user_ctx.user.mfa_enabled:
        if not body.mfa_totp_code:
            raise MFARequiredException()
        if not user_ctx.user.check_totp(body.mfa_totp_code):
            raise HTTPException(HTTPStatus.UNAUTHORIZED, 'Invalid MFA code')

    user_ctx.user.mfa_enabled = body.is_enabled
    if user_ctx.user.is_changed:
        await user_ctx.user.save_changes()
    return SuccessPayloadOutput(payload=MFASettingOut.from_obj(user_ctx.user))


@router.post(
    '/totp',
    responses=error_responses(
        (HTTPStatus.BAD_REQUEST, ErrorOutput),
        (HTTPStatus.UNAUTHORIZED, ErrorOutput),
        (HTTPStatus.FORBIDDEN, ErrorOutput),
        (HTTPStatus.UNPROCESSABLE_ENTITY, ErrorOutput),
    ),
)
async def create_otp() -> SuccessPayloadOutput[TOTPCreateOut]:
    user_ctx = current_user()
    if user_ctx.user.totp:
        raise HTTPException(HTTPStatus.CONFLICT, 'OTP already exists')
    settings_obj, secret = m.TOTPSettings.generate()
    user_ctx.user.totp = settings_obj
    await user_ctx.user.save_changes()
    return SuccessPayloadOutput(
        payload=TOTPCreateOut(
            created_at=settings_obj.created_at,
            secret=secret,
            link=settings_obj.get_url(CONFIG.MFA_TOTP_NAME, CONFIG.MFA_TOTP_ISSUER),
            period=settings_obj.period,
            digits=settings_obj.digits,
            digest=settings_obj.digest,
        )
    )


@router.delete(
    '/totp',
    responses=error_responses(
        (HTTPStatus.UNAUTHORIZED, ErrorOutput),
        (HTTPStatus.FORBIDDEN, ErrorOutput),
        (HTTPStatus.NOT_FOUND, ErrorOutput),
    ),
)
async def delete_otp(
    body: TOTPDeleteBody,
) -> SuccessOutput:
    user_ctx = current_user()
    if not user_ctx.user.totp:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'OTP not found')
    if user_ctx.user.mfa_enabled:
        if not body.mfa_totp_code:
            raise MFARequiredException()
        if not user_ctx.user.check_totp(body.mfa_totp_code):
            raise HTTPException(HTTPStatus.UNAUTHORIZED, 'Invalid MFA code')
    user_ctx.user.totp = None
    await user_ctx.user.save_changes()
    return SuccessOutput()
