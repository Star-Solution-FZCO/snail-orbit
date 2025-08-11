from http import HTTPStatus

from beanie import PydanticObjectId
from fastapi import HTTPException
from fastapi.responses import RedirectResponse, StreamingResponse

from pm.api.utils.router import APIRouter
from pm.api.views.error_responses import NOT_FOUND_RESPONSES
from pm.services.avatars import AVATAR_STORAGE_DIR, PROJECT_AVATAR_STORAGE_DIR
from pm.services.files import STORAGE_CLIENT
from pm.utils.file_storage import StorageFileNotFoundError
from pm.utils.file_storage.s3 import S3StorageClient

__all__ = ('router',)

router = APIRouter(prefix='/avatar', tags=['avatar'])


@router.get('/{email_hash}', response_model=None, responses=NOT_FOUND_RESPONSES)
async def get_avatar(
    email_hash: str,
) -> StreamingResponse | RedirectResponse:
    if isinstance(STORAGE_CLIENT, S3StorageClient):
        return RedirectResponse(
            url=await STORAGE_CLIENT.get_presigned_url(
                email_hash, folder=AVATAR_STORAGE_DIR
            ),
            status_code=HTTPStatus.TEMPORARY_REDIRECT,
        )
    try:
        file_header = await STORAGE_CLIENT.get_file_info(
            email_hash, folder=AVATAR_STORAGE_DIR
        )
    except StorageFileNotFoundError as err:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND) from err
    return StreamingResponse(
        content=STORAGE_CLIENT.get_file_stream(email_hash, folder=AVATAR_STORAGE_DIR),  # type: ignore[arg-type]
        media_type=file_header.content_type,
        headers={
            'Content-Disposition': file_header.encode_filename_disposition(),
            'Content-Length': str(file_header.size),
        },
    )


@router.get('/project/{project_id}', response_model=None, responses=NOT_FOUND_RESPONSES)
async def get_project_avatar(
    project_id: PydanticObjectId,
) -> RedirectResponse | StreamingResponse:
    if isinstance(STORAGE_CLIENT, S3StorageClient):
        return RedirectResponse(
            url=await STORAGE_CLIENT.get_presigned_url(
                project_id,
                folder=PROJECT_AVATAR_STORAGE_DIR,
            ),
            status_code=HTTPStatus.TEMPORARY_REDIRECT,
        )
    try:
        file_header = await STORAGE_CLIENT.get_file_info(
            project_id,
            folder=PROJECT_AVATAR_STORAGE_DIR,
        )
    except StorageFileNotFoundError as err:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND) from err
    return StreamingResponse(
        content=STORAGE_CLIENT.get_file_stream(
            project_id, folder=PROJECT_AVATAR_STORAGE_DIR
        ),
        media_type=file_header.content_type,
        headers={
            'Content-Disposition': file_header.encode_filename_disposition(),
            'Content-Length': str(file_header.size),
        },
    )
