from beanie import Document, Indexed, PydanticObjectId
from pydantic import BaseModel

__all__ = (
    'Project',
    'ProjectLinkField',
)


class Project(Document):
    class Settings:
        name = 'projects'
        use_revision = True
        use_state_management = True

    name: Indexed(str)
    slug: str = Indexed(str, unique=True)
    description: str | None = None
    is_active: bool = True


class ProjectLinkField(BaseModel):
    id: PydanticObjectId
    name: str
    slug: str
