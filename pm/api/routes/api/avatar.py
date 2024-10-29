from http import HTTPStatus

from fastapi import HTTPException
from fastapi.responses import RedirectResponse, StreamingResponse

from pm.api.utils.router import APIRouter
from pm.services.avatars import AVATAR_STORAGE_DIR
from pm.services.files import get_storage_client
from pm.utils.file_storage import StorageFileNotFound
from pm.utils.file_storage.s3 import S3StorageClient

__all__ = ('router',)

router = APIRouter(prefix='/avatar', tags=['avatar'])


@router.get('/{email_hash}', response_model=None)
async def get_avatar(
    email_hash: str,
) -> StreamingResponse | RedirectResponse:
    client = get_storage_client()
    if isinstance(client, S3StorageClient):
        return RedirectResponse(
            url=await client.get_presigned_url(email_hash, folder=AVATAR_STORAGE_DIR),
            status_code=HTTPStatus.TEMPORARY_REDIRECT,
        )
    try:
        file_header = await client.get_file_info(email_hash, folder=AVATAR_STORAGE_DIR)
    except StorageFileNotFound as err:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND) from err
    return StreamingResponse(
        content=client.get_file_stream(email_hash, folder=AVATAR_STORAGE_DIR),  # type: ignore
        media_type=file_header.content_type,
        headers={
            'Content-Disposition': file_header.encode_filename_disposition(),
            'Content-Length': str(file_header.size),
        },
    )
