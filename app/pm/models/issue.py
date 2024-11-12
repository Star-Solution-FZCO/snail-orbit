from datetime import datetime
from enum import StrEnum
from typing import Annotated, Literal, Self
from uuid import UUID, uuid4

from beanie import Document, Indexed, PydanticObjectId
from pydantic import BaseModel, Extra, Field

from pm.utils.dateutils import utcnow

from ._audit import audited_model
from .custom_fields import (
    CustomField,
    CustomFieldLink,
    CustomFieldTypeT,
    CustomFieldValue,
    CustomFieldValueT,
    EnumField,
    StateField,
    VersionField,
)
from .project import Project, ProjectLinkField
from .user import User, UserLinkField

__all__ = (
    'Issue',
    'IssueComment',
    'IssueAttachment',
    'IssueHistoryRecord',
    'IssueFieldChange',
    'IssueDraft',
    'IssueInterlinkTypeT',
    'IssueInterlink',
    'IssueLinkField',
)


class IssueInterlinkTypeT(StrEnum):
    RELATED = 'related'
    REQUIRED_FOR = 'required_for'
    DEPENDS_ON = 'depends_on'
    DUPLICATED_BY = 'duplicated_by'
    DUPLICATES = 'duplicates'
    SUBTASK_OF = 'subtask_of'
    PARENT_OF = 'parent_of'
    BLOCKS = 'blocks'
    BLOCKED_BY = 'blocked_by'
    CLONES = 'clones'
    CLONED_BY = 'cloned_by'

    def inverse(self) -> Self:
        return _INVERSE_INTERLINKS[self]


_INVERSE_INTERLINKS = {
    IssueInterlinkTypeT.RELATED: IssueInterlinkTypeT.RELATED,
    IssueInterlinkTypeT.REQUIRED_FOR: IssueInterlinkTypeT.DEPENDS_ON,
    IssueInterlinkTypeT.DEPENDS_ON: IssueInterlinkTypeT.REQUIRED_FOR,
    IssueInterlinkTypeT.DUPLICATED_BY: IssueInterlinkTypeT.DUPLICATES,
    IssueInterlinkTypeT.DUPLICATES: IssueInterlinkTypeT.DUPLICATED_BY,
    IssueInterlinkTypeT.SUBTASK_OF: IssueInterlinkTypeT.PARENT_OF,
    IssueInterlinkTypeT.PARENT_OF: IssueInterlinkTypeT.SUBTASK_OF,
    IssueInterlinkTypeT.BLOCKS: IssueInterlinkTypeT.BLOCKED_BY,
    IssueInterlinkTypeT.BLOCKED_BY: IssueInterlinkTypeT.BLOCKS,
    IssueInterlinkTypeT.CLONES: IssueInterlinkTypeT.CLONED_BY,
    IssueInterlinkTypeT.CLONED_BY: IssueInterlinkTypeT.CLONES,
}


class IssueLinkField(BaseModel):
    id: PydanticObjectId
    aliases: list[str]
    subject: str

    @property
    def id_readable(self) -> str:
        return self.aliases[-1] if self.aliases else str(self.id)

    @classmethod
    def from_obj(cls, obj: 'Issue | Self') -> Self:
        return cls(
            id=obj.id,
            aliases=obj.aliases,
            subject=obj.subject,
        )


class IssueInterlink(BaseModel):
    id: UUID
    type: IssueInterlinkTypeT
    issue: IssueLinkField


class IssueAttachment(BaseModel):
    id: UUID
    name: str
    size: int
    content_type: str
    author: UserLinkField
    created_at: datetime
    ocr_text: str | None = None


class IssueComment(BaseModel):
    id: Annotated[UUID, Field(default_factory=uuid4)]
    author: UserLinkField
    text: str | None
    created_at: datetime
    updated_at: datetime
    attachments: Annotated[list[IssueAttachment], Field(default_factory=list)]
    is_hidden: bool = False


class IssueFieldChange(BaseModel):
    field: CustomFieldLink | Literal['subject', 'text']
    old_value: CustomFieldValueT | str | None
    new_value: CustomFieldValueT | str | None


class IssueHistoryRecord(BaseModel):
    id: Annotated[UUID, Field(default_factory=uuid4)]
    author: UserLinkField
    time: datetime
    changes: list[IssueFieldChange]
    is_hidden: bool = False


@audited_model
class Issue(Document):
    class Settings:
        name = 'issues'
        use_revision = True
        use_state_management = True
        state_management_save_previous = True

    class Config:
        extra = Extra.allow

    subject: Annotated[str, Indexed(str)]
    text: str | None = None
    aliases: Annotated[list[str], Field(default_factory=list)]

    project: ProjectLinkField
    comments: Annotated[list[IssueComment], Field(default_factory=list)]
    attachments: Annotated[list[IssueAttachment], Field(default_factory=list)]

    fields: Annotated[list[CustomFieldValue], Field(default_factory=list)]
    history: Annotated[list[IssueHistoryRecord], Field(default_factory=list)]
    subscribers: Annotated[list[PydanticObjectId], Field(default_factory=list)]

    created_by: UserLinkField
    created_at: Annotated[datetime, Field(default_factory=utcnow)]

    interlinks: Annotated[list[IssueInterlink], Field(default_factory=list)]

    @property
    def id_readable(self) -> str:
        return self.aliases[-1] if self.aliases else str(self.id)

    @property
    def updated_by(self) -> UserLinkField | None:
        latest_item, _ = self._get_latest_comment_or_history()
        return latest_item.author if latest_item else None

    @property
    def updated_at(self) -> datetime | None:
        _, latest_time = self._get_latest_comment_or_history()
        return latest_time

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
                diff[field_id] = (old_value, new_value)
        return diff

    def _params_diff(
        self,
    ) -> dict[Literal['subject', 'text'], tuple[str | None, str | None]]:
        params_to_diff = ('subject', 'text')
        old_state = self.__class__.model_validate(self.get_saved_state())
        old_params = {param: getattr(old_state, param) for param in params_to_diff}
        new_params = {param: getattr(self, param) for param in params_to_diff}
        diff = {}
        for param in params_to_diff:
            if old_params[param] != new_params[param]:
                diff[param] = (old_params[param], new_params[param])
        return diff

    def gen_history_record(self, author: 'User', time: datetime | None = None) -> None:
        time = time or utcnow()
        fields = {field.id: field for field in self.fields}
        fields_diff = self._fields_diff()
        params_diff = self._params_diff()
        if not fields_diff and not params_diff:
            return
        changes = [
            IssueFieldChange(
                field=CustomFieldLink.from_obj(fields[field_id]),
                old_value=old_value,
                new_value=new_value,
            )
            for field_id, (old_value, new_value) in fields_diff.items()
        ] + [
            IssueFieldChange(
                field=param,
                old_value=old_value,
                new_value=new_value,
            )
            for param, (old_value, new_value) in params_diff.items()
        ]
        record = IssueHistoryRecord(
            author=UserLinkField.from_obj(author),
            time=time,
            changes=changes,
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
        user: User | UserLinkField,
    ) -> None:
        if isinstance(user, User):
            user = UserLinkField.from_obj(user)
        await cls.find(cls.comments.author.id == user.id).update(
            {'$set': {'comments.$[c].author': user}},
            array_filters=[{'c.author.id': user.id}],
        )
        await cls.find(cls.attachments.author.id == user.id).update(
            {'$set': {'attachments.$[a].author': user}},
            array_filters=[{'a.author.id': user.id}],
        )
        await cls.find(cls.created_by.id == user.id).update(
            {'$set': {'created_by': user}}
        )
        await cls.find(cls.history.author.id == user.id).update(
            {'$set': {'history.$[h].author': user}},
            array_filters=[{'h.author.id': user.id}],
        )

    @classmethod
    async def update_field_embedded_links(
        cls, field: CustomFieldLink | CustomField
    ) -> None:
        if isinstance(field, CustomField):
            field = CustomFieldLink.from_obj(field)
        await cls.find(
            cls.fields.id == field.id,
        ).update(
            {'$set': {'fields.$[f].name': field.name}},
            array_filters=[{'f.id': field.id}],
        )
        await cls.find(
            cls.history.changes.field.id == field.id,
        ).update(
            {'$set': {'history.$[].changes.$[c].field': field}},
            array_filters=[{'c.field.id': field.id}],
        )

    @classmethod
    async def update_field_option_embedded_links(
        cls,
        field: CustomField | CustomFieldLink,
        option: VersionField | StateField | EnumField,
    ) -> None:
        if field.type in (CustomFieldTypeT.ENUM_MULTI, CustomFieldTypeT.VERSION_MULTI):
            await cls.find(
                {'fields': {'$elemMatch': {'id': field.id, 'value.id': option.id}}},
            ).update(
                {'$set': {'fields.$[f].value.$[val]': option}},
                array_filters=[{'f.id': field.id}, {'val.id': option.id}],
            )
            return
        await cls.find(
            {'fields': {'$elemMatch': {'id': field.id, 'value.id': option.id}}},
        ).update(
            {'$set': {'fields.$[f].value': option}},
            array_filters=[{'f.id': field.id, 'f.value.id': option.id}],
        )

    @classmethod
    async def update_issue_embedded_links(
        cls,
        issue: Self | IssueLinkField,
    ) -> None:
        await cls.find(
            {'interlinks': {'$elemMatch': {'issue.id': issue.id}}},
        ).update(
            {'$set': {'interlinks.$[i].issue': IssueLinkField.from_obj(issue)}},
            array_filters=[{'i.issue.id': issue.id}],
        )

    def _get_latest_comment_or_history(
        self,
    ) -> tuple[IssueComment | IssueHistoryRecord, datetime | None]:
        latest_comment = max(self.comments, key=lambda c: c.created_at, default=None)
        latest_history = max(self.history, key=lambda h: h.time, default=None)

        if not latest_comment:
            return latest_history, latest_history.time if latest_history else None
        if not latest_history:
            return latest_comment, latest_comment.created_at if latest_comment else None

        return (
            (latest_comment, latest_comment.created_at)
            if latest_comment.created_at > latest_history.time
            else (latest_history, latest_history.time)
        )


@audited_model
class IssueDraft(Document):
    class Settings:
        name = 'issue_drafts'
        use_revision = False
        use_state_management = True
        state_management_save_previous = False

    subject: str | None = None
    text: str | None = None
    project: ProjectLinkField | None = None
    fields: Annotated[list[CustomFieldValue], Field(default_factory=list)]
    attachments: Annotated[list[IssueAttachment], Field(default_factory=list)]
    created_by: UserLinkField
    created_at: Annotated[datetime, Field(default_factory=utcnow)]

    async def get_project(self, fetch_links: bool = False) -> Project | None:
        if not self.project:
            return None
        pr: Project | None = await Project.find_one(
            Project.id == self.project.id, fetch_links=fetch_links
        )
        if not pr:
            raise ValueError(f'Project {self.project.id} not found')
        return pr

    @classmethod
    async def update_project_embedded_links(
        cls,
        project: Project | ProjectLinkField,
    ) -> None:
        if isinstance(project, Project):
            project = ProjectLinkField.from_obj(project)
        await cls.find(cls.project.id == project.id).update(
            {'$set': {'project': project}}
        )

    @classmethod
    async def update_user_embedded_links(
        cls,
        user: User | UserLinkField,
    ) -> None:
        if isinstance(user, User):
            user = UserLinkField.from_obj(user)
        await cls.find(cls.created_by.id == user.id).update(
            {'$set': {'created_by': user}}
        )
        await cls.find(cls.attachments.author.id == user.id).update(
            {'$set': {'attachments.$[a].author': user}},
            array_filters=[{'a.author.id': user.id}],
        )

    @classmethod
    async def update_field_option_embedded_links(
        cls,
        field: CustomField | CustomFieldLink,
        option: VersionField | StateField | EnumField,
    ) -> None:
        if field.type in (CustomFieldTypeT.ENUM_MULTI, CustomFieldTypeT.VERSION_MULTI):
            await cls.find(
                {'fields': {'$elemMatch': {'id': field.id, 'value.id': option.id}}},
            ).update(
                {'$set': {'fields.$[f].value.$[val]': option}},
                array_filters=[{'f.id': field.id}, {'val.id': option.id}],
            )
            return
        await cls.find(
            {'fields': {'$elemMatch': {'id': field.id, 'value.id': option.id}}},
        ).update(
            {'$set': {'fields.$[f].value': option}},
            array_filters=[{'f.id': field.id, 'f.value.id': option.id}],
        )
