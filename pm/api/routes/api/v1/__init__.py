from fastapi import APIRouter

from .project import router as project_router
from .version import router as version_router
from .user import router as user_router

__all__ = ('router',)

router = APIRouter(prefix='/v1', tags=['v1'])
router.include_router(version_router)
router.include_router(user_router)
router.include_router(project_router)
