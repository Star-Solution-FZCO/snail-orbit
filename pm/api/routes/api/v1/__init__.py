from fastapi import APIRouter

from .issue import router as issue_router
from .project import router as project_router
from .settings import router as settings_router
from .user import router as user_router
from .version import router as version_router

__all__ = ('router',)

router = APIRouter(prefix='/v1', tags=['v1'])
router.include_router(version_router)
router.include_router(user_router)
router.include_router(project_router)
router.include_router(issue_router)
router.include_router(settings_router)
