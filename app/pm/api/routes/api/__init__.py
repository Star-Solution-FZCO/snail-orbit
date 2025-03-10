from pm.api.utils.router import APIRouter

from .auth import router as auth_router
from .avatar import router as avatar_router
from .v1 import router as v1_router

__all__ = ('router',)

router = APIRouter(prefix='/api', tags=['api'])
router.include_router(v1_router)
router.include_router(auth_router)
router.include_router(avatar_router)
