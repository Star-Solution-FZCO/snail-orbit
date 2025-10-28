import re
from datetime import datetime
from enum import StrEnum
from typing import Annotated, ClassVar, Literal, Self
from uuid import UUID, uuid4

import beanie.operators as bo
import pymongo
from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Extra, Field

from pm.permissions import ProjectPermissions
from pm.utils.dateutils import utcnow

from ._audit import audited_model
from ._encryption import EncryptionMeta
from .custom_fields import (
    CustomField,
    CustomFieldLink,
    CustomFieldTypeT,
    CustomFieldValueT,
    CustomFieldValueUnion,
    EnumOption,
    OwnedOption,
    StateOption,
    VersionOption,
)
from .group import Group, GroupLinkField
from .project import PermissionTargetType, Project, ProjectLinkField, ProjectPermission
from .role import ProjectRole, ProjectRoleLinkField
from .tag import Tag, TagLinkField
from .user import User, UserLinkField

__all__ = (
    'Issue',
    'IssueAttachment',
    'IssueAttachmentSchema',
    'IssueBaseSchema',
    'IssueComment',
    'IssueCommentSchema',
    'IssueDraft',
    'IssueFieldChange',
    'IssueHistoryRecord',
    'IssueHistorySchema',
    'IssueInterlink',
    'IssueInterlinkTypeT',
    'IssueLinkField',
    'IssueRO',
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
    is_resolved: bool
    is_closed: bool

    @property
    def id_readable(self) -> str:
        return self.aliases[-1] if self.aliases else str(self.id)

    @classmethod
    def from_obj(cls, obj: 'Issue | Self') -> Self:
        return cls(
            id=obj.id,
            aliases=obj.aliases,
            subject=obj.subject,
            is_resolved=obj.is_resolved,
            is_closed=obj.is_closed,
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
    encryption: list[EncryptionMeta] | None = None


class IssueComment(BaseModel):
    id: Annotated[UUID, Field(default_factory=uuid4)]
    author: UserLinkField
    text: str | None
    created_at: datetime
    updated_at: datetime
    attachments: Annotated[list[IssueAttachment], Field(default_factory=list)]
    is_hidden: bool = False
    spent_time: int = 0
    encryption: list[EncryptionMeta] | None = None


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


class IssueHistorySchema(BaseModel):
    history: Annotated[list[IssueHistoryRecord], Field(default_factory=list)]


class IssueAttachmentSchema(BaseModel):
    attachments: Annotated[list[IssueAttachment], Field(default_factory=list)]


class IssueCommentSchema(BaseModel):
    comments: Annotated[list[IssueComment], Field(default_factory=list)]


class IssueBaseSchema(BaseModel):
    subject: str
    text: str | None = None
    aliases: Annotated[list[str], Field(default_factory=list)]

    project: ProjectLinkField

    fields: Annotated[
        list[Annotated[CustomFieldValueUnion, Field(discriminator='type')]],
        Field(default_factory=list),
    ]
    subscribers: Annotated[list[PydanticObjectId], Field(default_factory=list)]

    created_by: UserLinkField
    created_at: Annotated[datetime, Field(default_factory=utcnow)]

    updated_by: UserLinkField
    updated_at: Annotated[datetime, Field(default_factory=utcnow)]

    interlinks: Annotated[list[IssueInterlink], Field(default_factory=list)]
    tags: Annotated[list[TagLinkField], Field(default_factory=list)]
    encryption: list[EncryptionMeta] | None = None

    permissions: Annotated[list[ProjectPermission], Field(default_factory=list)]
    disable_project_permissions_inheritance: bool = False

    resolved_at: datetime | None = None
    closed_at: datetime | None = None

    @property
    def id_readable(self) -> str:
        return self.aliases[-1] if self.aliases else str(self.id)

    @property
    def is_resolved(self) -> bool:
        return bool(self.resolved_at)

    @property
    def is_closed(self) -> bool:
        return bool(self.closed_at)

    @property
    def has_custom_permissions(self) -> bool:
        return len(self.permissions) > 0

    def get_field_by_name(self, name: str) -> CustomFieldValueUnion | None:
        return next((field for field in self.fields if field.name == name), None)

    def get_field_by_id(self, id_: PydanticObjectId) -> CustomFieldValueUnion | None:
        return next((field for field in self.fields if field.id == id_), None)

    def get_field_by_gid(self, gid: str) -> CustomFieldValueUnion | None:
        return next((field for field in self.fields if field.gid == gid), None)

    def get_alias_by_slug(self, slug: str) -> str | None:
        slug_pattern = re.compile(rf'^{slug}-\d+$')
        return next(
            (alias for alias in self.aliases if slug_pattern.fullmatch(alias)),
            None,
        )

    def get_user_permissions(
        self,
        user: User,
        all_group_ids: set[PydanticObjectId] | None = None,
    ) -> set[ProjectPermissions]:
        results = set()
        if all_group_ids is None:
            all_group_ids = {gr.id for gr in user.groups}
        for perm in self.permissions:
            if (
                perm.target_type == PermissionTargetType.USER
                and perm.target.id == user.id
            ):
                results.update(perm.role.permissions)
                continue
            if (
                perm.target_type == PermissionTargetType.GROUP
                and perm.target.id in all_group_ids
            ):
                results.update(perm.role.permissions)
        return results


@audited_model
class Issue(
    Document,
    IssueBaseSchema,
    IssueHistorySchema,
    IssueAttachmentSchema,
    IssueCommentSchema,
):
    class Settings:
        name = 'issues'
        use_revision = True
        use_state_management = True
        state_management_save_previous = True
        indexes: ClassVar = [
            pymongo.IndexModel(
                [
                    ('subject', pymongo.TEXT),
                    ('text', pymongo.TEXT),
                    ('aliases', pymongo.TEXT),
                    ('attachments.ocr_text', pymongo.TEXT),
                    ('comments.text', pymongo.TEXT),
                ],
                name='text_index',
            ),
            pymongo.IndexModel([('project.id', 1)], name='project_id_index'),
            pymongo.IndexModel([('created_at', -1)], name='created_at_index'),
            pymongo.IndexModel([('updated_at', -1)], name='updated_at_index'),
            pymongo.IndexModel([('aliases', 1)], name='aliases_index'),
            pymongo.IndexModel(
                [('project.id', 1), ('created_at', -1)],
                name='project_created_at_index',
            ),
            pymongo.IndexModel(
                [('project.id', 1), ('updated_at', -1)],
                name='project_updated_at_index',
            ),
            pymongo.IndexModel(
                [('project.id', 1), ('resolved_at', 1)],
                name='project_resolved_at_index',
            ),
            pymongo.IndexModel(
                [('fields.gid', 1), ('fields.value', 1)],
                name='fields_gid_value_index',
            ),
            pymongo.IndexModel([('fields.id', 1)], name='fields_id_index'),
            pymongo.IndexModel([('fields.name', 1)], name='fields_name_index'),
            pymongo.IndexModel([('created_by.id', 1)], name='created_by_id_index'),
            pymongo.IndexModel([('updated_by.id', 1)], name='updated_by_id_index'),
            pymongo.IndexModel([('subscribers', 1)], name='subscribers_index'),
            pymongo.IndexModel([('resolved_at', 1)], name='resolved_at_index'),
            pymongo.IndexModel([('closed_at', 1)], name='closed_at_index'),
            pymongo.IndexModel([('tags.id', 1)], name='tags_id_index'),
            pymongo.IndexModel([('tags.name', 1)], name='tags_name_index'),
            pymongo.IndexModel(
                [('interlinks.issue.id', 1)],
                name='interlinks_issue_id_index',
            ),
            pymongo.IndexModel(
                [('created_by.id', 1), ('created_at', -1)],
                name='created_by_created_at_index',
            ),
            pymongo.IndexModel(
                [('subscribers', 1), ('updated_at', -1)],
                name='subscribers_updated_at_index',
            ),
            pymongo.IndexModel(
                [('permissions.target_type', 1), ('permissions.target.id', 1)],
                name='permissions_target_index',
            ),
            pymongo.IndexModel(
                [('permissions.role.permissions', 1)],
                name='permissions_role_permissions_index',
            ),
            pymongo.IndexModel(
                [('disable_project_permissions_inheritance', 1)],
                name='inheritance_flag_index',
            ),
        ]

    class Config:
        extra = Extra.allow

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
            Project.id == self.project.id,
            fetch_links=fetch_links,
        )
        if not pr:
            raise ValueError(
                f'Project {self.project.name} ({self.project.slug}) not found'
            )
        return pr

    @classmethod
    async def update_project_embedded_links(
        cls,
        project: Project,
    ) -> None:
        await cls.find(cls.project.id == project.id).update(
            {'$set': {'project': ProjectLinkField.from_obj(project)}},
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
            {'$set': {'created_by': user}},
        )
        await cls.find(cls.updated_by.id == user.id).update(
            {'$set': {'updated_by': user}},
        )
        await cls.find(cls.history.author.id == user.id).update(
            {'$set': {'history.$[h].author': user}},
            array_filters=[{'h.author.id': user.id}],
        )
        await cls.find(
            {
                'fields': {
                    '$elemMatch': {
                        'type': CustomFieldTypeT.OWNED,
                        'value.owner.id': user.id,
                    },
                },
            },
        ).update(
            {'$set': {'fields.$[f].value.owner': user}},
            array_filters=[
                {'f.type': CustomFieldTypeT.OWNED, 'f.value.owner.id': user.id},
            ],
        )
        await cls.find(
            {
                'fields': {
                    '$elemMatch': {
                        'type': CustomFieldTypeT.OWNED_MULTI,
                        'value.owner.id': user.id,
                    },
                },
            },
        ).update(
            {'$set': {'fields.$[f].value.$[v].owner': user}},
            array_filters=[
                {'f.type': CustomFieldTypeT.OWNED_MULTI, 'f.value.owner.id': user.id},
                {'v.owner.id': user.id},
            ],
        )

        await cls.find(
            {
                'permissions': {
                    '$elemMatch': {
                        'target_type': 'user',
                        'target.id': user.id,
                    },
                },
            },
        ).update(
            {'$set': {'permissions.$[p].target': user}},
            array_filters=[
                {'p.target_type': 'user', 'p.target.id': user.id},
            ],
        )

    @classmethod
    async def update_field_embedded_links(
        cls,
        field: CustomFieldLink | CustomField,
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
    async def remove_field_embedded_links(
        cls,
        field_id: PydanticObjectId,
        flt: dict | None = None,
    ) -> None:
        q = cls.find({'fields': {'$elemMatch': {'id': field_id}}})
        if flt:
            q = q.find(flt)
        await q.update({'$pull': {'fields': {'id': field_id}}})

    @classmethod
    async def update_field_option_embedded_links(
        cls,
        field: CustomField | CustomFieldLink,
        option: VersionOption | StateOption | EnumOption | OwnedOption,
    ) -> None:
        if field.type in (
            CustomFieldTypeT.ENUM_MULTI,
            CustomFieldTypeT.VERSION_MULTI,
            CustomFieldTypeT.OWNED_MULTI,
            CustomFieldTypeT.SPRINT_MULTI,
        ):
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

    @classmethod
    async def update_tag_embedded_links(
        cls,
        tag: Tag | TagLinkField,
    ) -> None:
        if isinstance(tag, Tag):
            tag = TagLinkField.from_obj(tag)
        await cls.find(
            {'tags': {'$elemMatch': {'id': tag.id}}},
        ).update(
            {'$set': {'tags.$[t]': tag}},
            array_filters=[{'t.id': tag.id}],
        )

    @classmethod
    async def remove_tag_embedded_links(cls, tag_id: PydanticObjectId) -> None:
        await cls.find({'tags': {'$elemMatch': {'id': tag_id}}}).update(
            {'$pull': {'tags': {'id': tag_id}}},
        )

    @classmethod
    async def update_group_embedded_links(
        cls,
        group: Group,
    ) -> None:
        group_link = GroupLinkField.from_obj(group)
        await cls.find(
            {
                'permissions': {
                    '$elemMatch': {'target_type': 'group', 'target.id': group.id}
                }
            },
        ).update(
            {'$set': {'permissions.$[p].target': group_link}},
            array_filters=[{'p.target_type': 'group', 'p.target.id': group.id}],
        )

    @classmethod
    async def remove_group_permissions_embedded_links(
        cls,
        group_id: PydanticObjectId,
    ) -> None:
        await cls.find(
            {
                'permissions': {
                    '$elemMatch': {'target_type': 'group', 'target.id': group_id}
                }
            },
        ).update(
            {'$pull': {'permissions': {'target_type': 'group', 'target.id': group_id}}},
        )

    @classmethod
    async def update_role_permissions_embedded_links(
        cls,
        role: ProjectRole,
    ) -> None:
        role_link = ProjectRoleLinkField.from_obj(role)
        await cls.find(
            {'permissions': {'$elemMatch': {'role.id': role.id}}},
        ).update(
            {'$set': {'permissions.$[p].role': role_link}},
            array_filters=[{'p.role.id': role.id}],
        )

    @classmethod
    async def remove_role_permissions_embedded_links(
        cls,
        role_id: PydanticObjectId,
    ) -> None:
        await cls.find(
            {'permissions': {'$elemMatch': {'role.id': role_id}}},
        ).update(
            {'$pull': {'permissions': {'role.id': role_id}}},
        )

    @classmethod
    async def update_project_slug(
        cls,
        project_id: PydanticObjectId,
        old_slug: str,
        new_slug: str,
    ) -> None:
        slug_pattern = re.compile(rf'^{old_slug}-\d+$')
        async for issue in cls.find(
            cls.project.id == project_id,
            bo.RegEx(cls.aliases, rf'^{old_slug}-\d+$'),
        ):
            current_alias = next(
                (alias for alias in issue.aliases if slug_pattern.fullmatch(alias)),
                None,
            )
            if not current_alias:
                continue
            current_number = current_alias.split('-')[-1]
            issue.aliases.append(f'{new_slug}-{current_number}')
            await issue.save()

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

    def update_state(self, now: datetime | None = None) -> None:
        now = now or utcnow()
        state_fields = [
            field for field in self.fields if field.type == CustomFieldTypeT.STATE
        ]
        is_resolved = bool(state_fields) and all(
            (field.value and field.value.is_resolved) for field in state_fields
        )
        if not is_resolved:
            self.resolved_at = None
        elif not self.is_resolved:
            self.resolved_at = now

        is_closed = bool(state_fields) and all(
            (field.value and field.value.is_closed) for field in state_fields
        )
        if not is_closed:
            self.closed_at = None
        elif not self.is_closed:
            self.closed_at = now


class IssueRO(IssueBaseSchema):
    id: Annotated[PydanticObjectId, Field(alias='_id')]


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
    fields: Annotated[
        list[Annotated[CustomFieldValueUnion, Field(discriminator='type')]],
        Field(default_factory=list),
    ]
    attachments: Annotated[list[IssueAttachment], Field(default_factory=list)]
    created_by: UserLinkField
    created_at: Annotated[datetime, Field(default_factory=utcnow)]
    encryption: list[EncryptionMeta] | None = None

    async def get_project(self, fetch_links: bool = False) -> Project | None:
        if not self.project:
            return None
        pr: Project | None = await Project.find_one(
            Project.id == self.project.id,
            fetch_links=fetch_links,
        )
        if not pr:
            raise ValueError(
                f'Project {self.project.name} ({self.project.slug}) not found'
            )
        return pr

    @classmethod
    async def update_project_embedded_links(
        cls,
        project: Project | ProjectLinkField,
    ) -> None:
        if isinstance(project, Project):
            project = ProjectLinkField.from_obj(project)
        await cls.find(cls.project.id == project.id).update(
            {'$set': {'project': project}},
        )

    @classmethod
    async def update_user_embedded_links(
        cls,
        user: User | UserLinkField,
    ) -> None:
        if isinstance(user, User):
            user = UserLinkField.from_obj(user)
        await cls.find(cls.created_by.id == user.id).update(
            {'$set': {'created_by': user}},
        )
        await cls.find(cls.attachments.author.id == user.id).update(
            {'$set': {'attachments.$[a].author': user}},
            array_filters=[{'a.author.id': user.id}],
        )
        await cls.find(
            {
                'fields': {
                    '$elemMatch': {
                        'type': CustomFieldTypeT.OWNED,
                        'value.owner.id': user.id,
                    },
                },
            },
        ).update(
            {'$set': {'fields.$[f].value.owner': user}},
            array_filters=[
                {'f.type': CustomFieldTypeT.OWNED, 'f.value.owner.id': user.id},
            ],
        )
        await cls.find(
            {
                'fields': {
                    '$elemMatch': {
                        'type': CustomFieldTypeT.OWNED_MULTI,
                        'value.owner.id': user.id,
                    },
                },
            },
        ).update(
            {'$set': {'fields.$[f].value.$[v].owner': user}},
            array_filters=[
                {'f.type': CustomFieldTypeT.OWNED_MULTI, 'f.value.owner.id': user.id},
                {'v.owner.id': user.id},
            ],
        )

    @classmethod
    async def update_field_embedded_links(
        cls,
        field: CustomFieldLink | CustomField,
    ) -> None:
        if isinstance(field, CustomField):
            field = CustomFieldLink.from_obj(field)
        await cls.find(
            cls.fields.id == field.id,
        ).update(
            {'$set': {'fields.$[f].name': field.name}},
            array_filters=[{'f.id': field.id}],
        )

    @classmethod
    async def remove_field_embedded_links(
        cls,
        field_id: PydanticObjectId,
        flt: dict | None = None,
    ) -> None:
        q = cls.find({'fields': {'$elemMatch': {'id': field_id}}})
        if flt:
            q = q.find(flt)
        await q.update({'$pull': {'fields': {'id': field_id}}})

    @classmethod
    async def update_field_option_embedded_links(
        cls,
        field: CustomField | CustomFieldLink,
        option: VersionOption | StateOption | EnumOption | OwnedOption,
    ) -> None:
        if field.type in (
            CustomFieldTypeT.ENUM_MULTI,
            CustomFieldTypeT.VERSION_MULTI,
            CustomFieldTypeT.OWNED_MULTI,
            CustomFieldTypeT.SPRINT_MULTI,
        ):
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
