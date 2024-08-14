from fastapi import APIRouter, Depends

from pm.api.context import current_user_context_dependency

from .comment import router as comment_router
from .issue import router as issue_router

__all__ = ('router',)

router = APIRouter(
    prefix='/issue',
    tags=['issue'],
    dependencies=[Depends(current_user_context_dependency)],
)
router.include_router(issue_router)
router.include_router(comment_router)
