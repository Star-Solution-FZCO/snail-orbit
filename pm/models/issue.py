import logging
from datetime import datetime
from typing import Literal, Self
from uuid import UUID, uuid4

from beanie import Document, Indexed, PydanticObjectId
from pydantic import BaseModel, Extra, Field

from pm.utils.dateutils import utcnow

from ._audit import audited_model
from .custom_fields import CustomFieldLink, CustomFieldValue, CustomFieldValueT
from .project import Project, ProjectLinkField
from .user import User, UserLinkField

logging.basicConfig(level=logging.INFO)

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


class IssueFieldChange(BaseModel):
    field: CustomFieldLink | Literal['subject', 'text']
    old_value: CustomFieldValueT | str
    new_value: CustomFieldValueT | str


class IssueHistoryRecord(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    author: UserLinkField
    time: datetime
    changes: list[IssueFieldChange]


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
    history: list[IssueHistoryRecord] = Field(default_factory=list)

    def get_field_by_name(self, name: str) -> CustomFieldValue | None:
        return next((field for field in self.fields if field.name == name), None)

    def get_field_by_id(self, id_: PydanticObjectId) -> CustomFieldValue | None:
        return next((field for field in self.fields if field.id == id_), None)

    def _fields_diff(
        self,
    ) -> dict[PydanticObjectId, tuple[CustomFieldValueT, CustomFieldValueT]]:
        old_state = self.__class__.model_validate(self.get_saved_state())
        old_fields = {field.id: field.value for field in old_state.fields}
        new_fields = {field.id: field.value for field in self.fields}
        diff = {}
        for field_id, new_value in new_fields.items():
            old_value = old_fields.get(field_id)
            if old_value != new_value:
                logging.info(f'Field {field_id} changed: {old_value} -> {new_value}')
                diff[field_id] = (old_value, new_value)
        return diff

    def gen_history_record(self, author: 'User', time: datetime | None = None) -> None:
        time = time or utcnow()
        fields = {field.id: field for field in self.fields}
        fields_diff = self._fields_diff()
        if not fields_diff:
            return
        record = IssueHistoryRecord(
            author=UserLinkField.from_obj(author),
            time=time,
            changes=[
                IssueFieldChange(
                    field=CustomFieldLink.from_obj(fields[field_id]),
                    old_value=old_value,
                    new_value=new_value,
                )
                for field_id, (old_value, new_value) in fields_diff.items()
            ],
        )
        self.history.append(record)

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
