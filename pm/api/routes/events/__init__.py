from pm.api.utils.router import APIRouter

from .issue import router as issue_router

__all__ = ('router',)

router = APIRouter(prefix='/events', tags=['events'])
router.include_router(issue_router)
