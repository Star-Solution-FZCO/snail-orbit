from http import HTTPStatus
from uuid import UUID, uuid4

from fastapi import File, HTTPException, UploadFile
from fastapi.responses import RedirectResponse, StreamingResponse
from pydantic import BaseModel

from pm.api.utils.router import APIRouter
from pm.api.views.error_responses import AUTH_ERRORS, error_responses
from pm.api.views.output import ErrorOutput, SuccessPayloadOutput
from pm.services.files import STORAGE_CLIENT
from pm.utils.file_storage import FileHeader, StorageFileNotFoundError
from pm.utils.file_storage.s3 import S3StorageClient

__all__ = ('router',)

router = APIRouter(
    prefix='/files',
    tags=['files'],
    responses=error_responses(*AUTH_ERRORS),
)


class FileUploadOutput(BaseModel):
    id: UUID


@router.post('')
async def upload_attachment(
    file: UploadFile = File(...),
) -> SuccessPayloadOutput[FileUploadOutput]:
    file_hash = str(uuid4())
    file_header = FileHeader(
        size=file.size,
        name=file.filename,
        content_type=file.content_type,
    )
    await STORAGE_CLIENT.upload_file(file_hash, file, file_header)
    return SuccessPayloadOutput(payload=FileUploadOutput(id=UUID(file_hash)))


@router.get(
    '/{file_id}',
    responses=error_responses(
        (HTTPStatus.UNAUTHORIZED, ErrorOutput),
        (HTTPStatus.FORBIDDEN, ErrorOutput),
        (HTTPStatus.NOT_FOUND, ErrorOutput),
    ),
)
async def get_attachment(file_id: UUID) -> RedirectResponse:
    file_id = str(file_id)
    if isinstance(STORAGE_CLIENT, S3StorageClient):
        return RedirectResponse(
            url=await STORAGE_CLIENT.get_presigned_url(file_id),
            status_code=HTTPStatus.TEMPORARY_REDIRECT,
        )
    return RedirectResponse(
        url=f'{file_id}/stream',
        status_code=HTTPStatus.TEMPORARY_REDIRECT,
    )


@router.get(
    '/{file_id}/stream',
    responses=error_responses(
        (HTTPStatus.UNAUTHORIZED, ErrorOutput),
        (HTTPStatus.FORBIDDEN, ErrorOutput),
        (HTTPStatus.NOT_FOUND, ErrorOutput),
    ),
)
async def download_attachment(file_id: UUID) -> StreamingResponse:
    file_id = str(file_id)
    try:
        file_header = await STORAGE_CLIENT.get_file_info(file_id)
    except StorageFileNotFoundError as err:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND) from err
    return StreamingResponse(
        content=STORAGE_CLIENT.get_file_stream(file_id),  # type: ignore[arg-type]
        media_type=file_header.content_type,
        headers={
            'Content-Disposition': (
                f'attachment; {file_header.encode_filename_disposition()}'
            ),
            'Content-Length': str(file_header.size),
        },
    )
