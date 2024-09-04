from collections.abc import AsyncIterator
from http import HTTPStatus
from os.path import join as opj
from uuid import UUID

import aiofiles
from aiofiles import os as aio_os
from fastapi import File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from pm.api.utils.files import FileHeader, dir_by_id, write_through_tmp_file
from pm.api.utils.router import APIRouter
from pm.api.views.output import SuccessPayloadOutput

__all__ = ('router',)

router = APIRouter(prefix='/files', tags=['files'])

FILE_CHUNK_SIZE = 1024 * 1024  # 1MB


class FileUploadOutput(BaseModel):
    id: UUID


@router.post('')
async def upload_attachment(
    file: UploadFile = File(...),
) -> SuccessPayloadOutput[FileUploadOutput]:
    try:
        file_hash = await write_through_tmp_file(file, chunk_size=FILE_CHUNK_SIZE)
    except Exception as err:
        raise HTTPException(
            HTTPStatus.INTERNAL_SERVER_ERROR, 'Failed to save file'
        ) from err
    return SuccessPayloadOutput(payload=FileUploadOutput(id=UUID(file_hash)))


@router.get('/{file_id}')
async def download_attachment(file_id: UUID) -> StreamingResponse:
    file_id = str(file_id)
    file_path = opj(dir_by_id(file_id), file_id)
    if not await aio_os.path.exists(file_path):
        raise HTTPException(HTTPStatus.NOT_FOUND, 'File not found')

    out_file = await aiofiles.open(file_path, mode='rb')
    try:
        file_header = await FileHeader.read(out_file)
    except Exception as err:
        await out_file.close()
        raise HTTPException(
            HTTPStatus.INTERNAL_SERVER_ERROR, 'Failed to read file header'
        ) from err

    async def _read_content() -> AsyncIterator[bytes]:
        try:
            while chunk := await out_file.read(FILE_CHUNK_SIZE):
                yield chunk
        finally:
            await out_file.close()

    return StreamingResponse(
        _read_content(),
        media_type=file_header.content_type,
        headers={
            'Content-Disposition': f'attachment; filename="{file_header.name}"',
            'Content-Length': str(file_header.size),
        },
    )
