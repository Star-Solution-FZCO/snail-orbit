from os.path import join as opj
from typing import TYPE_CHECKING, AsyncIterator

import aiofiles
from aiofiles import os as aio_os

from ._base import (
    BaseStorageClient,
    FileHeader,
    FileIDT,
    StorageFileNotFound,
    StorageInternalError,
)

if TYPE_CHECKING:
    from aiofiles.threadpool.binary import AsyncBufferedIOBase, AsyncBufferedReader

    from ._typing import AsyncReadable, AsyncWritable

__all__ = ('LocalStorageClient',)

FILE_CHUNK_SIZE = 1024 * 1024  # 1MB


class LocalStorageClient(BaseStorageClient):
    __storage_dir: str

    def __init__(self, storage_dir: str) -> None:
        self.__storage_dir = storage_dir

    def get_dir_by_id(self, file_id: str) -> str:
        return opj(self.__storage_dir, file_id[0:2], file_id[2:4])

    def get_file_path(self, file_id: str) -> str:
        return opj(self.get_dir_by_id(file_id), file_id)

    def _get_tmp_file_path(self, file_id: str) -> str:
        return opj(self.get_dir_by_id(file_id), f'{file_id}.tmp')

    async def upload_file(
        self,
        file_id: FileIDT,
        src: 'AsyncReadable',
        file_header: FileHeader,
        folder: str = 'storage',
    ) -> None:
        file_id_ = str(file_id)
        dir_path = self.get_dir_by_id(file_id_)
        tmp_path = self._get_tmp_file_path(file_id_)
        await aio_os.makedirs(dir_path, exist_ok=True)
        try:
            async with aiofiles.open(tmp_path, 'wb') as tmp_file:
                await write_file_header(file_header, tmp_file)
                while content := await src.read(FILE_CHUNK_SIZE):
                    await tmp_file.write(content)
            await aio_os.replace(tmp_path, self.get_file_path(file_id_))
        except Exception as err:
            await aio_os.remove(tmp_path)
            raise StorageInternalError(file_id, message='Failed to write file') from err

    async def download_file(
        self, file_id: FileIDT, dst: 'AsyncWritable', folder: str = 'storage'
    ) -> None:
        file_path = self.get_file_path(str(file_id))
        if not await aio_os.path.exists(file_path):
            raise StorageFileNotFound(file_id)

        out_file = await aiofiles.open(file_path, mode='rb')
        try:
            async for chunk in out_file.read(FILE_CHUNK_SIZE):
                await dst.write(chunk)
        except Exception as err:
            raise StorageInternalError(file_id, message='Failed to read file') from err
        finally:
            await out_file.close()

    async def get_file_info(
        self, file_id: FileIDT, folder: str = 'storage'
    ) -> FileHeader:
        file_path = self.get_file_path(str(file_id))
        if not await aio_os.path.exists(file_path):
            raise StorageFileNotFound(file_id)
        try:
            async with aiofiles.open(file_path, 'rb') as file:
                return await read_file_header(file)
        except Exception as err:
            raise StorageInternalError(
                file_id, message='Failed to read file header'
            ) from err

    async def get_file_stream(
        self, file_id: FileIDT, folder: str = 'storage'
    ) -> AsyncIterator[bytes]:
        file_path = self.get_file_path(str(file_id))
        if not await aio_os.path.exists(file_path):
            raise StorageFileNotFound(file_id)
        try:
            async with aiofiles.open(file_path, 'rb') as file:
                await read_file_header(file)  # skip file header
                async for chunk in file:
                    yield chunk
        except Exception as err:
            raise StorageInternalError(file_id, message='Failed to read file') from err

    async def delete_file(
        self,
        file_id: FileIDT,
        folder: str = 'storage',  # pylint: disable=unused-argument
    ) -> None:
        file_path = self.get_file_path(str(file_id))
        if not await aio_os.path.exists(file_path):
            raise StorageFileNotFound(file_id)
        try:
            await aio_os.remove(file_path)
            dir_path = self.get_dir_by_id(str(file_id))
            if not await aio_os.listdir(dir_path):
                await aio_os.rmdir(dir_path)
        except Exception as err:
            raise StorageInternalError(
                file_id, message='Failed to delete file'
            ) from err


async def write_file_header(
    file_header: FileHeader, dst: 'AsyncBufferedIOBase'
) -> None:
    await dst.write(file_header.size.to_bytes(8))
    name = file_header.name.encode('utf-8')
    await dst.write(len(name).to_bytes(8))
    await dst.write(name)
    content_type = file_header.content_type.encode('utf-8')
    await dst.write(len(content_type).to_bytes(8))
    await dst.write(content_type)


async def read_file_header(src: 'AsyncBufferedReader') -> FileHeader:
    size = int.from_bytes(await src.read(8))
    name_len = int.from_bytes(await src.read(8))
    name = (await src.read(name_len)).decode('utf-8')
    content_type_len = int.from_bytes(await src.read(8))
    content_type = (await src.read(content_type_len)).decode('utf-8')
    return FileHeader(size=size, name=name, content_type=content_type)
