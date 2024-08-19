from fastapi import Depends

import pm.models as m
from pm.api.context import current_user, current_user_context_dependency
from pm.api.utils.router import APIRouter
from pm.api.views.factories.crud import CrudOutput
from pm.api.views.output import SuccessPayloadOutput

__all__ = ('router',)

router = APIRouter(
    prefix='/profile',
    tags=['profile'],
    dependencies=[Depends(current_user_context_dependency)],
)


class Profile(CrudOutput[m.User]):
    name: str
    email: str
    is_active: bool
    is_admin: bool


@router.get('/')
async def add_token() -> SuccessPayloadOutput[Profile]:
    user_ctx = current_user()
    return SuccessPayloadOutput(payload=Profile.from_obj(user_ctx.user))
