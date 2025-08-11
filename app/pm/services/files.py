import asyncio
from collections.abc import Collection

from pm.config import CONFIG, FileStorageModeT
from pm.utils.file_storage import BaseStorageClient, FileHeader, FileIDT
from pm.utils.file_storage.local import LocalStorageClient
from pm.utils.file_storage.s3 import S3StorageClient

__all__ = (
    'STORAGE_CLIENT',
    'resolve_file',
    'resolve_files',
)


def _get_storage_client() -> BaseStorageClient:
    if CONFIG.FILE_STORAGE_MODE == FileStorageModeT.LOCAL:
        return LocalStorageClient(CONFIG.FILE_STORAGE_DIR)
    return S3StorageClient(
        access_key_id=CONFIG.S3_ACCESS_KEY_ID,
        access_key_secret=CONFIG.S3_ACCESS_KEY_SECRET,
        endpoint=CONFIG.S3_ENDPOINT,
        bucket=CONFIG.S3_BUCKET,
        region=CONFIG.S3_REGION,
        verify=CONFIG.S3_VERIFY,
        public_endpoint=CONFIG.S3_PUBLIC_ENDPOINT,
        presigned_url_expiration=CONFIG.S3_PRESIGNED_URL_EXPIRATION,
    )


STORAGE_CLIENT = _get_storage_client()


async def resolve_file(id_: FileIDT) -> FileHeader:
    id_ = str(id_)
    return await STORAGE_CLIENT.get_file_info(id_)


async def resolve_files(ids: Collection[FileIDT]) -> dict[FileIDT, FileHeader]:
    results = await asyncio.gather(*(resolve_file(id_) for id_ in ids))
    return dict(zip(ids, results, strict=False))
