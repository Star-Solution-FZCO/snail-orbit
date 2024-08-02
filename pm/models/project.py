from beanie import Document, Indexed, PydanticObjectId
from pydantic import BaseModel

from ._audit import audited_model

__all__ = (
    'Project',
    'ProjectLinkField',
)


@audited_model
class Project(Document):
    class Settings:
        name = 'projects'
        use_revision = True
        use_state_management = True
        state_management_save_previous = True

    name: str = Indexed(str)
    slug: str = Indexed(str, unique=True)
    description: str | None = None
    is_active: bool = True


class ProjectLinkField(BaseModel):
    id: PydanticObjectId
    name: str
    slug: str
