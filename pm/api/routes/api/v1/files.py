import re
from collections.abc import AsyncIterator
from dataclasses import dataclass
from http import HTTPStatus
from os.path import join as opj
from typing import TYPE_CHECKING, Self
from uuid import uuid4

import aiofiles
from aiofiles import os as aio_os
from fastapi import File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from pm.api.utils.router import APIRouter
from pm.api.views.output import SuccessPayloadOutput
from pm.config import CONFIG

if TYPE_CHECKING:
    from aiofiles.threadpool.binary import AsyncBufferedIOBase, AsyncBufferedReader

__all__ = ('router',)

router = APIRouter(prefix='/files', tags=['files'])

FILE_CHUNK_SIZE = 1024 * 1024  # 1MB
FILE_ID_PATTERN = re.compile(r'^[0-9a-f]{32}$')


def dir_by_id(id_: str) -> str:
    return opj(CONFIG.FILE_STORAGE_DIR, id_[0:2], id_[2:4])


@dataclass
class FileHeader:
    size: int
    name: str
    content_type: str

    async def write(self, dst: 'AsyncBufferedIOBase') -> None:
        await dst.write(self.size.to_bytes(8))
        name = self.name.encode('utf-8')
        await dst.write(len(name).to_bytes(8))
        await dst.write(name)
        content_type = self.content_type.encode('utf-8')
        await dst.write(len(content_type).to_bytes(8))
        await dst.write(content_type)

    @classmethod
    async def read(cls, src: 'AsyncBufferedReader') -> Self:
        size = int.from_bytes(await src.read(8))
        name_len = int.from_bytes(await src.read(8))
        name = (await src.read(name_len)).decode('utf-8')
        content_type_len = int.from_bytes(await src.read(8))
        content_type = (await src.read(content_type_len)).decode('utf-8')
        return cls(size=size, name=name, content_type=content_type)


async def write_through_tmp_file(
    src: UploadFile, chunk_size: int = FILE_CHUNK_SIZE
) -> str:
    file_id = uuid4().hex
    dir_path = dir_by_id(file_id)
    tmp_path = opj(dir_path, f'{file_id}.tmp')
    await aio_os.makedirs(dir_path, exist_ok=True)
    try:
        async with aiofiles.open(tmp_path, 'wb') as tmp_file:
            file_header = FileHeader(
                size=src.size,
                name=src.filename,
                content_type=src.content_type,
            )
            await file_header.write(tmp_file)
            while content := await src.read(chunk_size):
                await tmp_file.write(content)
        await aio_os.replace(tmp_path, opj(dir_path, file_id))
        return file_id
    except Exception:
        await aio_os.remove(tmp_path)
        raise


class FileUploadOutput(BaseModel):
    id: str


@router.post('')
async def upload_attachment(
    file: UploadFile = File(...),
) -> SuccessPayloadOutput[FileUploadOutput]:
    try:
        file_hash = await write_through_tmp_file(file)
    except Exception as err:
        raise HTTPException(
            HTTPStatus.INTERNAL_SERVER_ERROR, 'Failed to save file'
        ) from err
    return SuccessPayloadOutput(payload=FileUploadOutput(id=file_hash))


@router.get('/{file_id}')
async def download_attachment(file_id: str):
    if not FILE_ID_PATTERN.fullmatch(file_id):
        raise HTTPException(HTTPStatus.BAD_REQUEST, 'Invalid file id format')
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
