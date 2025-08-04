from http import HTTPStatus
from typing import Self

from fastapi import Depends

import pm.models as m
from pm.api.context import current_user, current_user_context_dependency
from pm.api.utils.router import APIRouter
from pm.api.views.error_responses import error_responses
from pm.api.views.output import ErrorOutput, SuccessPayloadOutput
from pm.api.views.user import UserOutput
from pm.permissions import GlobalPermissions

__all__ = ('router',)

router = APIRouter(
    prefix='/profile',
    tags=['profile'],
    dependencies=[Depends(current_user_context_dependency)],
    responses=error_responses(
        (HTTPStatus.UNAUTHORIZED, ErrorOutput),
        (HTTPStatus.FORBIDDEN, ErrorOutput),
    ),
)


class Profile(UserOutput):
    is_admin: bool
    ui_settings: dict
    access_claims: list[GlobalPermissions]

    # pylint: disable=arguments-differ
    @classmethod
    def from_obj(
        cls,
        obj: m.User,
        global_permissions: set[GlobalPermissions],
    ) -> Self:
        return cls(
            id=obj.id,
            email=obj.email,
            name=obj.name,
            is_active=obj.is_active,
            _use_external_avatar=obj.use_external_avatar,
            is_admin=obj.is_admin,
            ui_settings=obj.ui_settings,
            access_claims=list(global_permissions),
        )


@router.get('/')
async def get_profile() -> SuccessPayloadOutput[Profile]:
    user_ctx = current_user()
    return SuccessPayloadOutput(
        payload=Profile.from_obj(user_ctx.user, user_ctx.global_permissions)
    )
