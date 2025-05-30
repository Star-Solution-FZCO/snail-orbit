from pm.api.utils.router import APIRouter

from .board import router as board_router

__all__ = ('router',)

router = APIRouter(prefix='/v2', tags=['v2'])
router.include_router(board_router)
