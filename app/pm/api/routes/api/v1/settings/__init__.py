from fastapi import Depends

from pm.api.context import current_user_context_dependency
from pm.api.utils.router import APIRouter

from .api_token import router as api_token_router

__all__ = ('router',)

router = APIRouter(
    prefix='/settings',
    tags=['settings'],
    dependencies=[Depends(current_user_context_dependency)],
)
router.include_router(api_token_router)
