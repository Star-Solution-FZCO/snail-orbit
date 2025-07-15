from abc import ABC, abstractmethod
from collections.abc import AsyncGenerator
from dataclasses import dataclass
from typing import TYPE_CHECKING
from urllib.parse import quote
from uuid import UUID

if TYPE_CHECKING:
    from ._typing import AsyncReadable, AsyncWritable

__all__ = (
    'BaseStorageClient',
    'FileHeader',
    'FileIDT',
    'StorageFileNotFoundError',
    'StorageInternalError',
)

FileIDT = str | UUID


@dataclass
class FileHeader:
    size: int
    name: str
    content_type: str

    def encode_filename_disposition(self) -> str:
        return f"filename*=UTF-8''{quote(self.name)}"


class BaseStorageClient(ABC):
    @abstractmethod
    async def upload_file(
        self,
        file_id: FileIDT,
        src: 'AsyncReadable',
        file_header: FileHeader,
        folder: str = 'storage',
    ) -> None:
        pass

    @abstractmethod
    async def download_file(
        self,
        file_id: FileIDT,
        dst: 'AsyncWritable',
        folder: str = 'storage',
    ) -> None:
        pass

    @abstractmethod
    async def get_file_stream(
        self,
        file_id: FileIDT,
        folder: str = 'storage',
    ) -> AsyncGenerator[bytes]:
        pass

    @abstractmethod
    async def get_file_info(
        self,
        file_id: FileIDT,
        folder: str = 'storage',
    ) -> FileHeader:
        pass

    @abstractmethod
    async def delete_file(self, file_id: FileIDT, folder: str = 'storage') -> None:
        pass


class StorageError(Exception):
    file_id: FileIDT

    def __init__(self, file_id: FileIDT, message: str = ''):
        self.file_id = file_id
        super().__init__(message)

    @property
    def message(self) -> str:
        return str(self)


class StorageFileNotFoundError(StorageError):
    def __init__(self, file_id: FileIDT, message: str = 'File not found'):
        super().__init__(file_id, message)


class StorageInternalError(StorageError):
    def __init__(self, file_id: FileIDT, message: str = 'Internal storage error'):
        super().__init__(file_id, message)
