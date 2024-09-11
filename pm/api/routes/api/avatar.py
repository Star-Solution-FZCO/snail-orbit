from http import HTTPStatus

from fastapi import HTTPException
from fastapi.responses import FileResponse

from pm.api.utils.avatar import get_avatar_path
from pm.api.utils.router import APIRouter

__all__ = ('router',)

router = APIRouter(prefix='/avatar', tags=['avatar'])

FILE_CHUNK_SIZE = 1024 * 1024  # 1MB


@router.get('')
async def get_avatar(
    email: str,
    ts: int | None = None,
) -> FileResponse:
    avatar_path = await get_avatar_path(email, update=bool(ts))
    if not avatar_path:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Avatar not found')
    return FileResponse(
        path=avatar_path,
    )
