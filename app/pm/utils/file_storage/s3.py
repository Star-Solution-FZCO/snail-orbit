from collections.abc import AsyncGenerator
from os.path import join as opj
from typing import TYPE_CHECKING, Literal
from urllib.parse import quote, unquote

import aioboto3

from ._base import BaseStorageClient, FileHeader, FileIDT, StorageFileNotFound

if TYPE_CHECKING:
    from types_aiobotocore_s3 import S3Client

    from ._typing import AsyncReadable, AsyncWritable

__all__ = ('S3StorageClient',)

STREAM_CHUNK_SIZE = 1024 * 1024  # 1MB


def encode_filename_disposition(filename: str) -> str:
    return f"filename*=UTF-8''{quote(filename)}"


def decode_filename_disposition(disposition: str) -> str:
    return unquote(disposition.split("''", 1)[1])


class S3StorageClient(BaseStorageClient):
    __bucket: str
    __endpoint: str
    __public_endpoint: str
    __verify: bool
    __access_key_id: str
    __access_key_secret: str
    __region: str

    def __init__(
        self,
        access_key_id: str,
        access_key_secret: str,
        endpoint: str,
        bucket: str,
        region: str,
        verify: bool = True,
        public_endpoint: str | None = None,
    ) -> None:
        self.__access_key_id = access_key_id
        self.__access_key_secret = access_key_secret
        self.__region = region
        self.__bucket = bucket
        self.__endpoint = endpoint
        self.__public_endpoint = public_endpoint or endpoint
        self.__verify = verify

    def _get_client_ctx(self, public: bool = False) -> 'S3Client':
        session = aioboto3.Session(
            aws_access_key_id=self.__access_key_id,
            aws_secret_access_key=self.__access_key_secret,
            region_name=self.__region,
        )
        return session.client(
            's3',
            endpoint_url=self.__endpoint if not public else self.__public_endpoint,
            verify=self.__verify,
        )

    async def upload_file(
        self,
        file_id: FileIDT,
        src: 'AsyncReadable',
        file_header: FileHeader,
        folder: str = 'storage',
    ) -> None:
        filepath = opj(folder, str(file_id))
        async with self._get_client_ctx() as client:
            await client.upload_fileobj(
                src,
                self.__bucket,
                filepath,
                ExtraArgs={
                    'ContentDisposition': f'attachment; {encode_filename_disposition(file_header.name)}',
                    'ContentType': file_header.content_type,
                },
            )

    async def download_file(
        self,
        file_id: FileIDT,
        dst: 'AsyncWritable',
        folder: str = 'storage',
    ) -> None:
        filepath = opj(folder, str(file_id))
        async with self._get_client_ctx() as client:
            await client.download_fileobj(self.__bucket, filepath, dst)

    async def get_file_stream(
        self,
        file_id: FileIDT,
        folder: str = 'storage',
    ) -> AsyncGenerator[bytes]:
        filepath = opj(folder, str(file_id))
        file_header = await self.get_file_info(file_id, folder)
        async with self._get_client_ctx() as client:
            for chunk_start in range(0, file_header.size, STREAM_CHUNK_SIZE):
                chunk_end = min(
                    chunk_start + STREAM_CHUNK_SIZE - 1, file_header.size - 1
                )
                resp = await client.get_object(
                    Bucket=self.__bucket,
                    Key=filepath,
                    Range=f'bytes={chunk_start}-{chunk_end}',
                )
                async with resp['Body'] as body:
                    yield await body.read()

    async def get_presigned_url(
        self,
        file_id: FileIDT,
        method: Literal['get_object', 'put_object'] = 'get_object',
        folder: str = 'storage',
        expiration: int = 3600,
    ) -> str:
        filepath = opj(folder, str(file_id))
        async with self._get_client_ctx(public=True) as client:
            return await client.generate_presigned_url(
                method,
                Params={
                    'Bucket': self.__bucket,
                    'Key': filepath,
                },
                ExpiresIn=expiration,
            )

    async def get_file_info(
        self, file_id: FileIDT, folder: str = 'storage'
    ) -> FileHeader:
        filepath = opj(folder, str(file_id))
        async with self._get_client_ctx() as client:
            try:
                head = await client.head_object(Bucket=self.__bucket, Key=filepath)
                return FileHeader(
                    size=head['ContentLength'],
                    name=decode_filename_disposition(head['ContentDisposition']),
                    content_type=head['ContentType'],
                )
            except Exception as err:
                if getattr(err, 'response', {}).get('Error', {}).get('Code') == '404':
                    raise StorageFileNotFound(file_id) from err
                raise

    async def delete_file(
        self,
        file_id: FileIDT,
        folder: str = 'storage',
    ) -> None:
        filepath = opj(folder, str(file_id))
        await self.get_file_info(file_id, folder)
        async with self._get_client_ctx() as client:
            await client.delete_object(
                Bucket=self.__bucket,
                Key=filepath,
            )
