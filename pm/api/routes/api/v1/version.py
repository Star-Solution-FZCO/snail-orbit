import os

from fastapi import APIRouter
from pydantic import BaseModel

from pm.api.views.output import SuccessPayloadOutput

__all__ = ('router',)

router = APIRouter(prefix='/version', tags=['version'])


class VersionOutput(BaseModel):
    version: str


@router.get('')
async def get_version() -> SuccessPayloadOutput[VersionOutput]:
    version = os.environ.get('APP_VERSION', '__DEV__')
    return SuccessPayloadOutput(payload=VersionOutput(version=version))
