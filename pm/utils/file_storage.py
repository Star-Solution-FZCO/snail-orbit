from dataclasses import dataclass
from os.path import join as opj
from typing import TYPE_CHECKING, BinaryIO, Literal
from urllib.parse import quote, unquote

import aioboto3

if TYPE_CHECKING:
    from types_aiobotocore_s3 import S3Client

__all__ = ('S3StorageClient',)


def encode_filename_disposition(filename: str) -> str:
    return f"filename*=UTF-8''{quote(filename)}"


def decode_filename_disposition(disposition: str) -> str:
    return unquote(disposition.split("''", 1)[1])


@dataclass
class FileHeader:
    size: int
    name: str
    content_type: str


class S3StorageClient:
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
        file_id: str,
        src: BinaryIO,
        folder: str = 'storage',
        filename: str | None = None,
        content_type: str = 'binary/octet-stream',
    ) -> None:
        filepath = opj(folder, file_id)
        async with self._get_client_ctx() as client:
            await client.upload_fileobj(
                src,
                self.__bucket,
                filepath,
                ExtraArgs={
                    'ContentDisposition': f'attachment; {encode_filename_disposition(filename or file_id)}',
                    'ContentType': content_type,
                },
            )

    async def download_file(
        self,
        file_id: str,
        dst: BinaryIO,
        folder: str = 'storage',
    ) -> None:
        filepath = opj(folder, file_id)
        async with self._get_client_ctx() as client:
            await client.download_fileobj(self.__bucket, filepath, dst)

    async def get_presigned_url(
        self,
        file_id: str,
        method: Literal['get_object', 'put_object'] = 'get_object',
        folder: str = 'storage',
        expiration: int = 3600,
    ) -> str:
        filepath = opj(folder, file_id)
        async with self._get_client_ctx(public=True) as client:
            return await client.generate_presigned_url(
                method,
                Params={
                    'Bucket': self.__bucket,
                    'Key': filepath,
                },
                ExpiresIn=expiration,
            )

    async def get_file_info(self, file_id: str, folder: str = 'storage') -> FileHeader:
        filepath = opj(folder, file_id)
        async with self._get_client_ctx() as client:
            head = await client.head_object(Bucket=self.__bucket, Key=filepath)
            return FileHeader(
                size=head['ContentLength'],
                name=decode_filename_disposition(head['ContentDisposition']),
                content_type=head['ContentType'],
            )
