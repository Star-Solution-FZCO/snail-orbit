from datetime import datetime
from typing import Self
from uuid import UUID, uuid4

from beanie import Document, Indexed, PydanticObjectId
from pydantic import BaseModel, Extra, Field

from ._audit import audited_model
from .custom_fields import CustomFieldValue
from .project import Project, ProjectLinkField
from .user import User, UserLinkField

__all__ = (
    'Issue',
    'IssueComment',
    'IssueAttachment',
)


class IssueAttachment(BaseModel):
    id: UUID
    name: str
    size: int
    content_type: str
    author: UserLinkField
    created_at: datetime
    ocr_text: str | None = None


class IssueComment(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    author: UserLinkField
    text: str | None
    created_at: datetime
    updated_at: datetime
    attachments: list[IssueAttachment] = Field(default_factory=list)


@audited_model
class Issue(Document):
    class Settings:
        name = 'issues'
        use_revision = True
        use_state_management = True
        state_management_save_previous = True

    class Config:
        extra = Extra.allow

    subject: str = Indexed(str)
    text: str | None = None
    aliases: list[str] = Field(default_factory=list)

    project: ProjectLinkField
    comments: list[IssueComment] = Field(default_factory=list)
    attachments: list[IssueAttachment] = Field(default_factory=list)

    fields: list[CustomFieldValue] = Field(default_factory=list)

    def get_field_by_name(self, name: str) -> CustomFieldValue | None:
        return next((field for field in self.fields if field.name == name), None)

    @classmethod
    async def find_one_by_id_or_alias(cls, id_or_alias: PydanticObjectId | str) -> Self:
        if isinstance(id_or_alias, str):
            return await cls.find_one(cls.aliases == id_or_alias, fetch_links=True)
        return await cls.find_one(cls.id == id_or_alias, fetch_links=True)

    async def get_project(self, fetch_links: bool = False) -> Project:
        pr: Project | None = await Project.find_one(
            Project.id == self.project.id, fetch_links=fetch_links
        )
        if not pr:
            raise ValueError(f'Project {self.project.id} not found')
        return pr

    @classmethod
    async def update_project_embedded_links(
        cls,
        project: Project,
    ) -> None:
        await cls.find(cls.project.id == project.id).update(
            {'$set': {'project': ProjectLinkField.from_obj(project)}}
        )

    @classmethod
    async def update_user_embedded_links(
        cls,
        user: User,
    ) -> None:
        await cls.find(cls.comments.author.id == user.id).update(
            {'$set': {'comments.$[c].author': UserLinkField.from_obj(user)}},
            array_filters=[{'c.author.id': user.id}],
        )
