from uuid import UUID, uuid4

from fastapi import File, UploadFile
from fastapi.responses import RedirectResponse
from pydantic import BaseModel

from pm.api.utils.router import APIRouter
from pm.api.views.output import SuccessPayloadOutput
from pm.config import CONFIG
from pm.utils.file_storage import S3StorageClient

__all__ = ('router',)

router = APIRouter(prefix='/files', tags=['files'])

FILE_CHUNK_SIZE = 1024 * 1024  # 1MB


class FileUploadOutput(BaseModel):
    id: UUID


@router.post('')
async def upload_attachment(
    file: UploadFile = File(...),
) -> SuccessPayloadOutput[FileUploadOutput]:
    file_hash = str(uuid4())
    s3_client = S3StorageClient(
        access_key_id=CONFIG.S3_ACCESS_KEY_ID,
        access_key_secret=CONFIG.S3_ACCESS_KEY_SECRET,
        endpoint=CONFIG.S3_ENDPOINT,
        bucket=CONFIG.S3_BUCKET,
        region=CONFIG.S3_REGION,
        verify=CONFIG.S3_VERIFY,
        public_endpoint=CONFIG.S3_PUBLIC_ENDPOINT,
    )
    await s3_client.upload_file(
        file_hash, file.file, content_type=file.content_type, filename=file.filename
    )
    return SuccessPayloadOutput(payload=FileUploadOutput(id=UUID(file_hash)))


@router.get('/{file_id}')
async def download_attachment(file_id: UUID) -> RedirectResponse:
    file_id = str(file_id)
    s3_client = S3StorageClient(
        access_key_id=CONFIG.S3_ACCESS_KEY_ID,
        access_key_secret=CONFIG.S3_ACCESS_KEY_SECRET,
        endpoint=CONFIG.S3_ENDPOINT,
        bucket=CONFIG.S3_BUCKET,
        region=CONFIG.S3_REGION,
        verify=CONFIG.S3_VERIFY,
        public_endpoint=CONFIG.S3_PUBLIC_ENDPOINT,
    )
    presigned_url = await s3_client.get_presigned_url(file_id)
    return RedirectResponse(url=presigned_url)
