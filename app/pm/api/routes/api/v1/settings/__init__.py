from fastapi import Depends

from pm.api.context import current_user_context_dependency
from pm.api.utils.router import APIRouter

from .api_token import router as api_token_router
from .encryption_key import router as encryption_key_router
from .mfa import router as mfa_router
from .ui_settings import router as ui_settings_router

__all__ = ('router',)

router = APIRouter(
    prefix='/settings',
    tags=['settings'],
    dependencies=[Depends(current_user_context_dependency)],
)
router.include_router(api_token_router)
router.include_router(encryption_key_router)
router.include_router(mfa_router)
router.include_router(ui_settings_router)
