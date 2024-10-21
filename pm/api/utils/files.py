import asyncio
from dataclasses import dataclass
from os.path import join as opj
from typing import TYPE_CHECKING, Self, TypeVar
from uuid import UUID, uuid4

import aiofiles
from aiofiles import os as aio_os

from pm.config import CONFIG
from pm.utils.file_storage import S3StorageClient

if TYPE_CHECKING:
    from aiofiles.threadpool.binary import AsyncBufferedIOBase, AsyncBufferedReader
    from fastapi import UploadFile

__all__ = (
    'dir_by_id',
    'FileHeader',
    'resolve_file',
    'resolve_files',
    'write_through_tmp_file',
)


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


FileIDT = TypeVar('FileIDT', bound=str | UUID)


async def resolve_file(id_: FileIDT) -> FileHeader:
    id_ = str(id_)
    s3_client = S3StorageClient(
        access_key_id=CONFIG.S3_ACCESS_KEY_ID,
        access_key_secret=CONFIG.S3_ACCESS_KEY_SECRET,
        endpoint=CONFIG.S3_ENDPOINT,
        bucket=CONFIG.S3_BUCKET,
        region=CONFIG.S3_REGION,
        verify=CONFIG.S3_VERIFY,
        public_endpoint=CONFIG.S3_PUBLIC_ENDPOINT,
    )
    return await s3_client.get_file_info(id_)


async def resolve_files(ids: list[FileIDT]) -> dict[FileIDT, FileHeader]:
    results = await asyncio.gather(*(resolve_file(id_) for id_ in ids))
    return dict(zip(ids, results))


async def write_through_tmp_file(
    src: 'UploadFile',
    chunk_size: int,
) -> str:
    file_id = str(uuid4())
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
