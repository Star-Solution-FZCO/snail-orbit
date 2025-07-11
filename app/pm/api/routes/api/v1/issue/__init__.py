from http import HTTPStatus

from fastapi import Depends

from pm.api.context import current_user_context_dependency
from pm.api.utils.router import APIRouter
from pm.api.views.error_responses import ErrorOutput, error_responses

from .comment import router as comment_router
from .feed import router as feed_router
from .filters import router as filters_router
from .history import router as history_router
from .issue import router as issue_router
from .spent_time import router as spent_time_router

__all__ = ('router',)

router = APIRouter(
    prefix='/issue',
    tags=['issue'],
    dependencies=[Depends(current_user_context_dependency)],
    responses=error_responses(
        (HTTPStatus.UNAUTHORIZED, ErrorOutput), (HTTPStatus.FORBIDDEN, ErrorOutput)
    ),
)
router.include_router(issue_router)
router.include_router(comment_router)
router.include_router(history_router)
router.include_router(spent_time_router)
router.include_router(filters_router)
router.include_router(feed_router)
