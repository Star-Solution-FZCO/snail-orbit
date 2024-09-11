from typing import Self

from fastapi import Depends

import pm.models as m
from pm.api.context import current_user, current_user_context_dependency
from pm.api.utils.router import APIRouter
from pm.api.views.output import SuccessPayloadOutput
from pm.api.views.user import UserOutput

__all__ = ('router',)

router = APIRouter(
    prefix='/profile',
    tags=['profile'],
    dependencies=[Depends(current_user_context_dependency)],
)


class Profile(UserOutput):
    is_active: bool
    is_admin: bool

    @classmethod
    def from_obj(cls, obj: m.User) -> Self:
        return cls(
            id=obj.id,
            name=obj.name,
            email=obj.email,
            is_active=obj.is_active,
            is_admin=obj.is_admin,
        )


@router.get('/')
async def add_token() -> SuccessPayloadOutput[Profile]:
    user_ctx = current_user()
    return SuccessPayloadOutput(payload=Profile.from_obj(user_ctx.user))
