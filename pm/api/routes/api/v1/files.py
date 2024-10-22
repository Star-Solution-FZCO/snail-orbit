from http import HTTPStatus
from uuid import UUID, uuid4

from fastapi import File, UploadFile
from fastapi.responses import RedirectResponse, StreamingResponse
from pydantic import BaseModel

from pm.api.utils.router import APIRouter
from pm.api.views.output import SuccessPayloadOutput
from pm.services.files import get_storage_client
from pm.utils.file_storage import FileHeader
from pm.utils.file_storage.s3 import S3StorageClient

__all__ = ('router',)

router = APIRouter(prefix='/files', tags=['files'])


class FileUploadOutput(BaseModel):
    id: UUID


@router.post('')
async def upload_attachment(
    file: UploadFile = File(...),
) -> SuccessPayloadOutput[FileUploadOutput]:
    file_hash = str(uuid4())
    file_header = FileHeader(
        size=file.size, name=file.filename, content_type=file.content_type
    )
    client = get_storage_client()
    await client.upload_file(file_hash, file, file_header)
    return SuccessPayloadOutput(payload=FileUploadOutput(id=UUID(file_hash)))


@router.get('/{file_id}')
async def get_attachment(file_id: UUID) -> RedirectResponse:
    file_id = str(file_id)
    client = get_storage_client()
    if isinstance(client, S3StorageClient):
        return RedirectResponse(
            url=await client.get_presigned_url(file_id),
            status_code=HTTPStatus.TEMPORARY_REDIRECT,
        )
    return RedirectResponse(
        url=f'{file_id}/stream',
        status_code=HTTPStatus.TEMPORARY_REDIRECT,
    )


@router.get('/{file_id}/stream')
async def download_attachment(file_id: UUID) -> StreamingResponse:
    file_id = str(file_id)
    client = get_storage_client()
    file_header = await client.get_file_info(file_id)
    return StreamingResponse(
        content=client.get_file_stream(file_id),  # type: ignore
        media_type=file_header.content_type,
        headers={
            'Content-Disposition': f'attachment; {file_header.encode_filename_disposition()}',
            'Content-Length': str(file_header.size),
        },
    )
