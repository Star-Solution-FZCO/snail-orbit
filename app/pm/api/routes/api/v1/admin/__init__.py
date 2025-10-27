from fastapi import Depends

from pm.api.context import admin_context_dependency
from pm.api.utils.router import APIRouter
from pm.api.views.error_responses import AUTH_ERRORS, error_responses

from .user import router as user_router

__all__ = ('router',)

router = APIRouter(
    prefix='/admin',
    tags=['admin'],
    dependencies=[Depends(admin_context_dependency)],
    responses=error_responses(*AUTH_ERRORS),
)

router.include_router(user_router)
