from http import HTTPStatus
from typing import Self

from pydantic import BaseModel

import pm.models as m
from pm.api.context import current_user
from pm.api.utils.router import APIRouter
from pm.api.views.error_responses import AUTH_ERRORS, error_responses
from pm.api.views.output import ErrorOutput, SuccessPayloadOutput

__all__ = ('router',)

router = APIRouter(
    prefix='/ui_settings',
    tags=['ui_settings'],
    responses=error_responses(*AUTH_ERRORS),
)


class UISettingsOut(BaseModel):
    ui_settings: dict

    @classmethod
    def from_obj(cls, obj: m.User) -> Self:
        return cls(ui_settings=obj.ui_settings)


class UISettingsUpdate(BaseModel):
    ui_settings: dict


@router.get('/')
async def get_ui_settings() -> SuccessPayloadOutput[UISettingsOut]:
    user_ctx = current_user()
    return SuccessPayloadOutput(payload=UISettingsOut.from_obj(user_ctx.user))


@router.put(
    '/',
    responses=error_responses(
        (HTTPStatus.BAD_REQUEST, ErrorOutput),
        (HTTPStatus.UNAUTHORIZED, ErrorOutput),
        (HTTPStatus.FORBIDDEN, ErrorOutput),
        (HTTPStatus.NOT_FOUND, ErrorOutput),
        (HTTPStatus.UNPROCESSABLE_ENTITY, ErrorOutput),
    ),
)
async def update_ui_settings(
    body: UISettingsUpdate,
) -> SuccessPayloadOutput[UISettingsOut]:
    user_ctx = current_user()
    user_ctx.user.ui_settings = body.ui_settings
    await user_ctx.user.save()
    return SuccessPayloadOutput(payload=UISettingsOut.from_obj(user_ctx.user))
