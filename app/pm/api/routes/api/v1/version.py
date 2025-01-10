from pydantic import BaseModel

from pm.api.utils.router import APIRouter
from pm.api.views.output import SuccessPayloadOutput
from pm.version import APP_VERSION

__all__ = ('router',)

router = APIRouter(prefix='/version', tags=['version'])


class VersionOutput(BaseModel):
    version: str


@router.get('')
async def get_version() -> SuccessPayloadOutput[VersionOutput]:
    return SuccessPayloadOutput(payload=VersionOutput(version=APP_VERSION))
