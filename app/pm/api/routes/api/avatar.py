from http import HTTPStatus

from beanie import PydanticObjectId
from fastapi import File, HTTPException, UploadFile
from fastapi.responses import RedirectResponse, StreamingResponse

import pm.models as m
from pm.api.utils.router import APIRouter
from pm.api.views.output import SuccessOutput
from pm.services.avatars import AVATAR_STORAGE_DIR, PROJECT_AVATAR_STORAGE_DIR
from pm.services.files import get_storage_client
from pm.utils.file_storage import FileHeader, StorageFileNotFound
from pm.utils.file_storage.s3 import S3StorageClient

__all__ = ('router',)

router = APIRouter(prefix='/avatar', tags=['avatar'])


@router.get('/{email_hash}', response_model=None)
async def get_avatar(
    email_hash: str,
) -> StreamingResponse | RedirectResponse:
    client = get_storage_client()
    if isinstance(client, S3StorageClient):
        return RedirectResponse(
            url=await client.get_presigned_url(email_hash, folder=AVATAR_STORAGE_DIR),
            status_code=HTTPStatus.TEMPORARY_REDIRECT,
        )
    try:
        file_header = await client.get_file_info(email_hash, folder=AVATAR_STORAGE_DIR)
    except StorageFileNotFound as err:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND) from err
    return StreamingResponse(
        content=client.get_file_stream(email_hash, folder=AVATAR_STORAGE_DIR),  # type: ignore
        media_type=file_header.content_type,
        headers={
            'Content-Disposition': file_header.encode_filename_disposition(),
            'Content-Length': str(file_header.size),
        },
    )


@router.get('/project/{project_id}')
async def get_project_avatar(
    project_id: PydanticObjectId,
) -> RedirectResponse:
    client = get_storage_client()
    if isinstance(client, S3StorageClient):
        return RedirectResponse(
            url=await client.get_presigned_url(
                project_id, folder=PROJECT_AVATAR_STORAGE_DIR
            ),
            status_code=HTTPStatus.TEMPORARY_REDIRECT,
        )
    try:
        file_header = await client.get_file_info(
            project_id, folder=PROJECT_AVATAR_STORAGE_DIR
        )
    except StorageFileNotFound as err:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND) from err
    return StreamingResponse(
        content=client.get_file_stream(project_id, folder=PROJECT_AVATAR_STORAGE_DIR),
        media_type=file_header.content_type,
        headers={
            'Content-Disposition': file_header.encode_filename_disposition(),
            'Content-Length': str(file_header.size),
        },
    )


@router.post('/project/{project_id}')
async def upload_project_avatar(
    project_id: PydanticObjectId,
    file: UploadFile = File(...),
) -> SuccessOutput:
    client = get_storage_client()
    file_header = FileHeader(
        size=file.size, name=file.filename, content_type=file.content_type
    )
    await client.upload_file(
        project_id, file, file_header, folder=PROJECT_AVATAR_STORAGE_DIR
    )
    await m.Project.find_one(m.Project.id == project_id).update(
        {'$set': {'avatar_type': m.ProjectAvatarType.LOCAL}}
    )
    return SuccessOutput()


@router.delete('/project/{project_id}')
async def delete_project_avatar(
    project_id: PydanticObjectId,
) -> SuccessOutput:
    client = get_storage_client()
    try:
        await client.delete_file(project_id, folder=PROJECT_AVATAR_STORAGE_DIR)
    except StorageFileNotFound as err:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND) from err
    await m.Project.find_one(m.Project.id == project_id).update(
        {'$set': {'avatar_type': m.ProjectAvatarType.DEFAULT}}
    )
    return SuccessOutput()
