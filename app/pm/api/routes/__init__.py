from .api import router as api_router
from .events import router as events_router

__all__ = (
    'api_router',
    'events_router',
)
