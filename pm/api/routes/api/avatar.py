from http import HTTPStatus

from fastapi import HTTPException
from fastapi.responses import FileResponse

from pm.api.utils.avatar import get_avatar_path
from pm.api.utils.router import APIRouter
from pm.constants import AVATAR_SIZES

__all__ = ('router',)

router = APIRouter(prefix='/avatar', tags=['avatar'])

FILE_CHUNK_SIZE = 1024 * 1024  # 1MB
DEFAULT_AVATAR_SIZE = max(AVATAR_SIZES)


@router.get('')
async def get_avatar(
    email: str,
    size: int = DEFAULT_AVATAR_SIZE,
    ts: int | None = None,
) -> FileResponse:
    if size not in AVATAR_SIZES:
        raise HTTPException(
            HTTPStatus.BAD_REQUEST,
            'Invalid size, must be one of: ' + ', '.join(map(str, AVATAR_SIZES)),
        )
    avatar_path = await get_avatar_path(email, size, update=bool(ts))
    if not avatar_path:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Avatar not found')
    return FileResponse(
        path=avatar_path,
    )
