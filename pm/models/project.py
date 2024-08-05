from beanie import Document, Indexed, Link, PydanticObjectId
from pydantic import BaseModel, Field

from ._audit import audited_model
from .custom_fields import CustomField

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
    custom_fields: list[Link['CustomField']] = Field(default_factory=list)


class ProjectLinkField(BaseModel):
    id: PydanticObjectId
    name: str
    slug: str
