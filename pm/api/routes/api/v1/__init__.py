from pm.api.utils.router import APIRouter

from .board import router as board_router
from .custom_field import router as custom_field_router
from .files import router as files_router
from .group import router as group_router
from .issue import router as issue_router
from .profile import router as profile_router
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
router.include_router(profile_router)
router.include_router(custom_field_router)
router.include_router(board_router)
router.include_router(files_router)
router.include_router(group_router)
