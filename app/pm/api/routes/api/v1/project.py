# pylint: disable=too-many-lines
import asyncio
import contextlib
from http import HTTPStatus
from typing import Annotated, Self
from uuid import UUID

from beanie import PydanticObjectId
from beanie import operators as bo
from fastapi import BackgroundTasks, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel, Field, computed_field

import pm.models as m
from pm.api.context import (
    current_user,
    current_user_context_dependency,
)
from pm.api.utils.router import APIRouter
from pm.api.views.custom_fields import (
    CustomFieldOutput,
    CustomFieldOutputRootModel,
    cf_output_from_obj,
)
from pm.api.views.encryption import (
    EncryptionKeyCreate,
    EncryptionKeyOut,
    EncryptionKeyPublicOut,
)
from pm.api.views.error_responses import error_responses
from pm.api.views.group import GroupOutput
from pm.api.views.output import (
    BaseListOutput,
    ErrorOutput,
    ModelIdOutput,
    SuccessOutput,
    SuccessPayloadOutput,
    UUIDOutput,
)
from pm.api.views.params import ListParams
from pm.api.views.role import RoleLinkOutput, RoleOutput
from pm.api.views.select import SelectParams
from pm.api.views.user import UserOutput
from pm.config import CONFIG
from pm.enums import EncryptionTargetTypeT
from pm.permissions import (
    PROJECT_PERMISSIONS_BY_CATEGORY,
    GlobalPermissions,
    ProjectPermissions,
)
from pm.services.avatars import PROJECT_AVATAR_STORAGE_DIR
from pm.services.files import STORAGE_CLIENT
from pm.utils.file_storage._base import FileHeader, StorageFileNotFoundError

__all__ = ('router',)

SLUG_PATTERN = r'^\w+$'

router = APIRouter(
    prefix='/project',
    tags=['project'],
    dependencies=[Depends(current_user_context_dependency)],
    responses=error_responses(
        (HTTPStatus.UNAUTHORIZED, ErrorOutput),
        (HTTPStatus.FORBIDDEN, ErrorOutput),
    ),
)


class WorkflowOutput(BaseModel):
    id: PydanticObjectId
    name: str
    description: str | None
    type: m.WorkflowType

    @classmethod
    def from_obj(cls, obj: m.Workflow) -> Self:
        return cls(
            id=obj.id,
            name=obj.name,
            description=obj.description,
            type=obj.type,
        )


class ProjectListItemOutput(BaseModel):
    id: PydanticObjectId
    name: str
    slug: str
    description: str | None
    ai_description: str | None
    is_active: bool
    is_subscribed: bool
    is_favorite: bool
    avatar_type: m.ProjectAvatarType
    is_encrypted: bool
    access_claims: list[ProjectPermissions]

    @computed_field
    @property
    def avatar(self) -> str | None:
        return (
            f'/api/avatar/project/{self.id}'
            if self.avatar_type == m.ProjectAvatarType.LOCAL
            else None
        )

    @classmethod
    def from_obj(cls, obj: m.Project) -> Self:
        user_ctx = current_user()
        user_permissions = obj.get_user_permissions(
            user_ctx.user, user_ctx.all_group_ids
        )

        return cls(
            id=obj.id,
            name=obj.name,
            slug=obj.slug,
            description=obj.description,
            ai_description=obj.ai_description,
            is_active=obj.is_active,
            is_subscribed=user_ctx.user.id in obj.subscribers,
            is_favorite=user_ctx.user.id in obj.favorite_of,
            avatar_type=obj.avatar_type,
            is_encrypted=bool(obj.encryption_settings),
            access_claims=list(user_permissions),
        )


class ProjectPermissionOutput(BaseModel):
    id: UUID
    target_type: m.PermissionTargetType
    target: GroupOutput | UserOutput
    role: RoleOutput

    @classmethod
    def from_obj(cls, obj: m.ProjectPermission) -> Self:
        target = (
            UserOutput.from_obj(obj.target)
            if obj.target_type == m.PermissionTargetType.USER
            else GroupOutput.from_obj(obj.target)
        )
        return cls(
            id=obj.id,
            target_type=obj.target_type,
            target=target,
            role=RoleOutput.from_obj(obj.role),
        )


class PermissionSourceOutput(BaseModel):
    permission_id: UUID
    role: RoleLinkOutput
    type: m.PermissionTargetType
    source_group: GroupOutput | None


class PermissionResolvedOutput(BaseModel):
    key: ProjectPermissions
    label: str
    granted: bool
    sources: list[PermissionSourceOutput]


class PermissionCategoryResolvedOutput(BaseModel):
    label: str
    permissions: list[PermissionResolvedOutput]


class ProjectResolvedPermissionOutput(BaseModel):
    user: UserOutput
    permissions: list[PermissionCategoryResolvedOutput]

    @classmethod
    def resolve_from_project(
        cls,
        project: m.Project,
        user: m.User,
        all_group_ids: set[PydanticObjectId] | None = None,
    ) -> Self:
        resolved: dict[ProjectPermissions, list[PermissionSourceOutput]] = {
            ProjectPermissions(perm): [] for perm in ProjectPermissions
        }
        if all_group_ids is None:
            all_group_ids = {gr.id for gr in user.groups}
        for perm in project.permissions:
            if (
                perm.target_type == m.PermissionTargetType.USER
                and perm.target.id == user.id
            ):
                for p in perm.role.permissions:
                    resolved[p].append(
                        PermissionSourceOutput(
                            permission_id=perm.id,
                            role=RoleLinkOutput.from_obj(perm.role),
                            type=perm.target_type,
                            source_group=None,
                        ),
                    )
            if (
                perm.target_type == m.PermissionTargetType.GROUP
                and perm.target.id in all_group_ids
            ):
                for p in perm.role.permissions:
                    resolved[p].append(
                        PermissionSourceOutput(
                            permission_id=perm.id,
                            role=RoleLinkOutput.from_obj(perm.role),
                            type=perm.target_type,
                            source_group=GroupOutput.from_obj(perm.target),
                        ),
                    )
        return cls(
            user=UserOutput.from_obj(user),
            permissions=[
                PermissionCategoryResolvedOutput(
                    label=category,
                    permissions=[
                        PermissionResolvedOutput(
                            key=key,
                            label=label,
                            granted=bool(resolved[key]),
                            sources=resolved[key],
                        ),
                    ],
                )
                for category, perms in PROJECT_PERMISSIONS_BY_CATEGORY.items()
                for key, label in perms.items()
            ],
        )


class EncryptionSettingsOutput(BaseModel):
    encryption_keys: list[EncryptionKeyOut]
    users: list[UserOutput]
    encrypt_attachments: bool
    encrypt_comments: bool
    encrypt_description: bool

    @classmethod
    def from_obj(cls, obj: m.ProjectEncryptionSettings) -> Self:
        return cls(
            encryption_keys=[
                EncryptionKeyOut.from_obj(key) for key in obj.encryption_keys
            ],
            users=[UserOutput.from_obj(user) for user in obj.users],
            encrypt_attachments=obj.encrypt_attachments,
            encrypt_comments=obj.encrypt_comments,
            encrypt_description=obj.encrypt_description,
        )


class ProjectOutput(BaseModel):
    id: PydanticObjectId
    name: str
    slug: str
    description: str | None
    ai_description: str | None
    is_active: bool
    custom_fields: list[CustomFieldOutput]
    card_fields: list[PydanticObjectId]
    workflows: list[WorkflowOutput]
    is_subscribed: bool = False
    is_favorite: bool = False
    avatar_type: m.ProjectAvatarType
    encryption_settings: EncryptionSettingsOutput | None
    access_claims: list[ProjectPermissions]

    @computed_field
    @property
    def is_encrypted(self) -> bool:
        return bool(self.encryption_settings)

    @computed_field
    @property
    def avatar(self) -> str | None:
        return (
            f'/api/avatar/project/{self.id}'
            if self.avatar_type == m.ProjectAvatarType.LOCAL
            else None
        )

    @classmethod
    def from_obj(cls, obj: m.Project) -> 'ProjectOutput':
        user_ctx = current_user()
        user_permissions = obj.get_user_permissions(
            user_ctx.user, user_ctx.all_group_ids
        )

        return cls(
            id=obj.id,
            name=obj.name,
            slug=obj.slug,
            description=obj.description,
            ai_description=obj.ai_description,
            is_active=obj.is_active,
            custom_fields=[CustomFieldOutput.from_obj(v) for v in obj.custom_fields],
            card_fields=obj.card_fields,
            workflows=[WorkflowOutput.from_obj(w) for w in obj.workflows],
            is_subscribed=user_ctx.user.id in obj.subscribers,
            is_favorite=user_ctx.user.id in obj.favorite_of,
            avatar_type=obj.avatar_type,
            encryption_settings=(
                EncryptionSettingsOutput.from_obj(obj.encryption_settings)
                if obj.encryption_settings
                else None
            ),
            access_claims=list(user_permissions),
        )


class EncryptionSettingsCreate(BaseModel):
    key: EncryptionKeyCreate
    users: Annotated[list[PydanticObjectId], Field(default_factory=list)]
    encrypt_comments: bool = True
    encrypt_description: bool = True


class ProjectCreate(BaseModel):
    name: str
    slug: str = Field(..., pattern=SLUG_PATTERN)
    description: str | None = None
    ai_description: str | None = None
    is_active: bool = True
    encryption_settings: EncryptionSettingsCreate | None = None


class EncryptionSettingsUpdate(BaseModel):
    users: list[PydanticObjectId]


class ProjectUpdate(BaseModel):
    name: str | None = None
    slug: str | None = Field(None, pattern=SLUG_PATTERN)
    description: str | None = None
    ai_description: str | None = None
    is_active: bool | None = None
    card_fields: list[PydanticObjectId] | None = None
    encryption_settings: EncryptionSettingsUpdate | None = None


class GrantPermissionBody(BaseModel):
    target_type: m.PermissionTargetType
    target_id: PydanticObjectId
    role_id: PydanticObjectId


class FieldMoveBody(BaseModel):
    after_id: PydanticObjectId | None = None


class ProjectListParams(ListParams):
    favorite_of: PydanticObjectId | None = Field(
        None, description='Filter by projects favorited by user'
    )


@router.get('/list')
async def list_projects(
    query: ProjectListParams = Depends(),
) -> BaseListOutput[ProjectListItemOutput]:
    user_ctx = current_user()

    filter_query = {}
    if not user_ctx.user.is_admin:
        filter_query['_id'] = {
            '$in': user_ctx.get_projects_with_permission(
                ProjectPermissions.PROJECT_READ
            )
        }
    if query.search:
        search_filter = m.Project.search_query(query.search)
        filter_query.update(search_filter)
    if query.favorite_of:
        filter_query['favorite_of'] = query.favorite_of

    pipeline = [
        {'$match': filter_query},
        {
            '$addFields': {
                'is_favorite': {'$in': [user_ctx.user.id, '$favorite_of']},
            },
        },
        {'$sort': {'is_favorite': -1, 'name': 1}},
    ]
    if query.offset:
        pipeline.append({'$skip': query.offset})
    if query.limit:
        pipeline.append({'$limit': query.limit})
    q = m.Project.aggregate(
        pipeline,
        projection_model=m.Project,
    )
    cnt = await m.Project.find(filter_query).count()
    return BaseListOutput.make(
        items=[ProjectListItemOutput.from_obj(project) async for project in q],
        count=cnt,
        limit=query.limit,
        offset=query.offset,
    )


@router.get('/{project_id}')
async def get_project(
    project_id: PydanticObjectId,
) -> SuccessPayloadOutput[ProjectOutput]:
    obj = await m.Project.find_one(m.Project.id == project_id, fetch_links=True)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Project not found')
    user_ctx = current_user()
    user_ctx.validate_project_permission(
        obj, ProjectPermissions.PROJECT_READ, admin_override=True
    )
    return SuccessPayloadOutput(payload=ProjectOutput.from_obj(obj))


@router.post('/')
async def create_project(
    body: ProjectCreate,
    _=Depends(current_user_context_dependency),
) -> SuccessPayloadOutput[ProjectOutput]:
    # Check PROJECT_CREATE global permission (admins can always create projects)
    user_ctx = current_user()
    user_ctx.validate_global_permission(
        GlobalPermissions.PROJECT_CREATE, admin_override=True
    )
    if await m.Project.check_slug_used(body.slug):
        raise HTTPException(
            HTTPStatus.BAD_REQUEST,
            'Project slug already used',
        )
    obj = m.Project(
        name=body.name,
        slug=body.slug,
        description=body.description,
        ai_description=body.ai_description,
        is_active=body.is_active,
    )
    if body.encryption_settings:
        if not body.encryption_settings.key.is_active:
            raise HTTPException(
                HTTPStatus.BAD_REQUEST,
                'Key must active when creating a project',
            )
        users = []
        if body.encryption_settings.users:
            users = await m.User.find(
                bo.In(m.User.id, body.encryption_settings.users),
            ).to_list()
            if len(users) != len(body.encryption_settings.users):
                raise HTTPException(
                    HTTPStatus.BAD_REQUEST,
                    'Some users not found',
                )
        obj.encryption_settings = m.ProjectEncryptionSettings(
            encryption_keys=[
                m.EncryptionKey(
                    name=body.encryption_settings.key.name,
                    public_key=body.encryption_settings.key.public_key,
                    fingerprint=body.encryption_settings.key.fingerprint,
                    algorithm=body.encryption_settings.key.algorithm,
                    is_active=True,
                    created_on=body.encryption_settings.key.created_on,
                ),
            ],
            users=[m.UserLinkField.from_obj(user) for user in users],
            encrypt_attachments=True,
            encrypt_comments=body.encryption_settings.encrypt_comments,
            encrypt_description=body.encryption_settings.encrypt_description,
        )
    await obj.insert()

    # Auto-assign creator as Project Owner
    # Find the default Project Owner role (created at startup)
    project_owner_role = await m.ProjectRole.find_one(
        m.ProjectRole.system_role_type == m.SystemRoleType.PROJECT_OWNER
    )

    if not project_owner_role:
        raise HTTPException(
            HTTPStatus.INTERNAL_SERVER_ERROR,
            'Project Owner system role not found. Please restart the application.',
        )

    owner_permission = m.ProjectPermission(
        target_type=m.PermissionTargetType.USER,
        target=m.UserLinkField.from_obj(user_ctx.user),
        role=m.ProjectRoleLinkField.from_obj(project_owner_role),
    )
    obj.permissions.append(owner_permission)
    await obj.save_changes()

    return SuccessPayloadOutput(payload=ProjectOutput.from_obj(obj))


@router.put('/{project_id}')
async def update_project(
    project_id: PydanticObjectId,
    body: ProjectUpdate,
    background_tasks: BackgroundTasks,
    _=Depends(current_user_context_dependency),
) -> SuccessPayloadOutput[ProjectOutput]:
    obj = await m.Project.find_one(m.Project.id == project_id, fetch_links=True)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Project not found')

    user_ctx = current_user()
    user_ctx.validate_project_permission(
        obj, ProjectPermissions.PROJECT_UPDATE, admin_override=True
    )
    data = body.model_dump(exclude_unset=True, exclude={'encryption_settings'})
    if 'card_fields' in data:
        project_field_ids = {field.id for field in obj.custom_fields}
        unknown_card_field = next(
            (
                field_id
                for field_id in body.card_fields
                if field_id not in project_field_ids
            ),
            None,
        )
        if unknown_card_field:
            raise HTTPException(
                HTTPStatus.BAD_REQUEST,
                f'Custom field id={unknown_card_field} not found in project fields',
            )
    if body.encryption_settings:
        users = []
        if body.encryption_settings.users:
            users = await m.User.find(
                bo.In(m.User.id, body.encryption_settings.users),
            ).to_list()
            if len(users) != len(body.encryption_settings.users):
                raise HTTPException(
                    HTTPStatus.BAD_REQUEST,
                    'Some users not found',
                )
        obj.encryption_settings.users = [
            m.UserLinkField.from_obj(user) for user in users
        ]
    if 'slug' in data and body.slug != obj.slug:
        if await m.Project.check_slug_used(body.slug):
            raise HTTPException(
                HTTPStatus.BAD_REQUEST,
                'Project slug already used',
            )
        background_tasks.add_task(
            m.Issue.update_project_slug,
            obj.id,
            obj.slug,
            body.slug,
        )
        obj.slug_history.append(obj.slug)
        obj.slug = body.slug
        del data['slug']
    for k, v in data.items():
        setattr(obj, k, v)
    if obj.is_changed:
        await obj.save_changes()
        await asyncio.gather(
            m.Issue.update_project_embedded_links(obj),
            m.IssueDraft.update_project_embedded_links(obj),
            m.Board.update_project_embedded_links(obj),
        )

    return SuccessPayloadOutput(payload=ProjectOutput.from_obj(obj))


@router.delete('/{project_id}')
async def delete_project(
    project_id: PydanticObjectId,
    _=Depends(current_user_context_dependency),
) -> ModelIdOutput:
    obj = await m.Project.find_one(m.Project.id == project_id)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Project not found')

    user_ctx = current_user()
    user_ctx.validate_project_permission(
        obj, ProjectPermissions.PROJECT_DELETE, admin_override=True
    )
    await obj.delete()
    await m.Issue.find(m.Issue.project.id == project_id).delete()
    return ModelIdOutput.make(project_id)


@router.get('/{project_id}/field/available/select')
async def get_available_select_fields(
    project_id: PydanticObjectId,
    query: SelectParams = Depends(),
) -> BaseListOutput[CustomFieldOutputRootModel]:
    project = await m.Project.find_one(m.Project.id == project_id, fetch_links=True)
    if not project:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Project not found')

    filters = [
        bo.NotIn(m.CustomField.id, [field.id for field in project.custom_fields]),
    ]
    if query.search:
        filters.append(bo.RegEx(m.CustomField.name, query.search, 'i'))
    q = m.CustomField.find(
        *filters,
        with_children=True,
        fetch_links=True,
    ).sort(m.CustomField.name)
    return await BaseListOutput.make_from_query(
        q,
        limit=query.limit,
        offset=query.offset,
        projection_fn=cf_output_from_obj,
    )


@router.post('/{project_id}/field/{field_id}')
async def add_field(
    project_id: PydanticObjectId,
    field_id: PydanticObjectId,
) -> SuccessPayloadOutput[ProjectOutput]:
    project = await m.Project.find_one(m.Project.id == project_id, fetch_links=True)
    if not project:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Project not found')
    field = await m.CustomField.find_one(
        m.CustomField.id == field_id,
        with_children=True,
    )
    if not field:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Field not found')
    if field in project.custom_fields:
        raise HTTPException(HTTPStatus.CONFLICT, 'Field already added to project')
    if any(field.name == f.name for f in project.custom_fields):
        raise HTTPException(
            HTTPStatus.CONFLICT,
            'Field with the same name already in project',
        )
    project.custom_fields.append(field)
    if project.is_changed:
        await project.save_changes()
    return SuccessPayloadOutput(payload=ProjectOutput.from_obj(project))


@router.delete('/{project_id}/field/{field_id}')
async def remove_field(
    project_id: PydanticObjectId,
    field_id: PydanticObjectId,
) -> SuccessPayloadOutput[ProjectOutput]:
    project = await m.Project.find_one(m.Project.id == project_id, fetch_links=True)
    if not project:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Project not found')
    field = await m.CustomField.find_one(
        m.CustomField.id == field_id,
        with_children=True,
    )
    if not field:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Field not found')
    if not any(cf.id == field_id for cf in project.custom_fields):
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Field not found in project')
    project.custom_fields = [cf for cf in project.custom_fields if cf.id != field.id]
    with contextlib.suppress(ValueError):
        project.card_fields.remove(field.id)
    if project.is_changed:
        await project.save_changes()
        await m.Issue.remove_field_embedded_links(
            field_id,
            flt={'project.id': project_id},
        )
        await m.IssueDraft.remove_field_embedded_links(
            field_id,
            flt={'project.id': project_id},
        )
    return SuccessPayloadOutput(payload=ProjectOutput.from_obj(project))


@router.put('/{project_id}/field/{field_id}/move')
async def move_field(
    project_id: PydanticObjectId,
    field_id: PydanticObjectId,
    body: FieldMoveBody,
) -> SuccessPayloadOutput[ProjectOutput]:
    project = await m.Project.find_one(m.Project.id == project_id, fetch_links=True)
    if not project:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Project not found')
    if body.after_id == field_id:
        raise HTTPException(
            HTTPStatus.BAD_REQUEST,
            'Field cannot be moved after itself',
        )
    try:
        field_idx = next(
            i for i, f in enumerate(project.custom_fields) if f.id == field_id
        )
        field = project.custom_fields.pop(field_idx)
    except StopIteration as err:
        raise HTTPException(
            HTTPStatus.BAD_REQUEST,
            f'Field {field_id} not found in project fields',
        ) from err
    after_field_idx = -1
    if body.after_id:
        try:
            after_field_idx = next(
                i for i, f in enumerate(project.custom_fields) if f.id == body.after_id
            )
        except StopIteration as err:
            raise HTTPException(
                HTTPStatus.BAD_REQUEST,
                f'Field {body.after_id} not found in project fields',
            ) from err
    project.custom_fields.insert(after_field_idx + 1, field)
    await project.replace()
    return SuccessPayloadOutput(payload=ProjectOutput.from_obj(project))


@router.get('/{project_id}/permissions')
async def get_project_permissions(
    project_id: PydanticObjectId,
    query: ListParams = Depends(),
) -> BaseListOutput[ProjectPermissionOutput]:
    project = await m.Project.find_one(m.Project.id == project_id)
    if not project:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Project not found')
    return BaseListOutput.make(
        count=len(project.permissions),
        limit=query.limit,
        offset=query.offset,
        items=[
            ProjectPermissionOutput.from_obj(perm)
            for perm in project.permissions[query.offset : query.offset + query.limit]
        ],
    )


@router.get('/{project_id}/permissions/resolve')
async def resolve_permissions(
    project_id: PydanticObjectId,
    query: ListParams = Depends(),
) -> BaseListOutput[ProjectResolvedPermissionOutput]:
    project = await m.Project.find_one(m.Project.id == project_id)
    if not project:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Project not found')

    results = []
    for project_permission in project.permissions:
        if project_permission.target_type == m.PermissionTargetType.GROUP:
            group_users = await m.User.find(
                m.User.groups.id == project_permission.target.id,
            ).to_list()
            results.extend(
                ProjectResolvedPermissionOutput.resolve_from_project(project, user)
                for user in group_users
            )
        else:
            user = await m.User.find_one(m.User.id == project_permission.target.id)
            if not user:
                continue
            results.append(
                ProjectResolvedPermissionOutput.resolve_from_project(project, user),
            )

    return BaseListOutput.make(
        count=len(results),
        limit=query.limit,
        offset=query.offset,
        items=results[query.offset : query.offset + query.limit],
    )


@router.post('/{project_id}/permission')
async def grant_permission(
    project_id: PydanticObjectId,
    body: GrantPermissionBody,
) -> UUIDOutput:
    project: m.Project | None = await m.Project.find_one(m.Project.id == project_id)
    if not project:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Project not found')
    role: m.ProjectRole | None = await m.ProjectRole.find_one(
        m.ProjectRole.id == body.role_id
    )
    if not role:
        raise HTTPException(HTTPStatus.BAD_REQUEST, 'Role not found')
    if body.target_type == m.PermissionTargetType.USER:
        user: m.User | None = await m.User.find_one(m.User.id == body.target_id)
        if not user:
            raise HTTPException(HTTPStatus.BAD_REQUEST, 'User not found')
        permission = m.ProjectPermission(
            target_type=body.target_type,
            target=m.UserLinkField.from_obj(user),
            role=m.ProjectRoleLinkField.from_obj(role),
        )
    else:  # m.PermissionTargetType.GROUP
        group: m.Group | None = await m.Group.find_one(
            m.Group.id == body.target_id, with_children=True
        )
        if not group:
            raise HTTPException(HTTPStatus.BAD_REQUEST, 'Group not found')
        permission = m.ProjectPermission(
            target_type=body.target_type,
            target=m.GroupLinkField.from_obj(group),
            role=m.ProjectRoleLinkField.from_obj(role),
        )
    if any(perm == permission for perm in project.permissions):
        raise HTTPException(HTTPStatus.CONFLICT, 'Permission already granted')
    project.permissions.append(permission)
    await project.save_changes()
    return UUIDOutput.make(permission.id)


@router.delete('/{project_id}/permission/{permission_id}')
async def revoke_permission(
    project_id: PydanticObjectId,
    permission_id: UUID,
) -> UUIDOutput:
    project = await m.Project.find_one(m.Project.id == project_id)
    if not project:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Project not found')
    if not any(perm.id == permission_id for perm in project.permissions):
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Permission not found')
    project.permissions = [
        perm for perm in project.permissions if perm.id != permission_id
    ]
    await project.replace()
    return UUIDOutput.make(permission_id)


@router.post('/{project_id}/workflow/{workflow_id}')
async def add_workflow(
    project_id: PydanticObjectId,
    workflow_id: PydanticObjectId,
) -> SuccessPayloadOutput[ProjectOutput]:
    project = await m.Project.find_one(m.Project.id == project_id, fetch_links=True)
    if not project:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Project not found')
    workflow = await m.Workflow.find_one(
        m.Workflow.id == workflow_id,
        with_children=True,
    )
    if not workflow:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Workflow not found')
    if workflow in project.workflows:
        raise HTTPException(HTTPStatus.CONFLICT, 'Workflow already added to project')
    project.workflows.append(workflow)
    if project.is_changed:
        await project.save_changes()
    return SuccessPayloadOutput(payload=ProjectOutput.from_obj(project))


@router.delete('/{project_id}/workflow/{workflow_id}')
async def remove_workflow(
    project_id: PydanticObjectId,
    workflow_id: PydanticObjectId,
) -> SuccessPayloadOutput[ProjectOutput]:
    project = await m.Project.find_one(m.Project.id == project_id, fetch_links=True)
    if not project:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Project not found')
    workflow = await m.Workflow.find_one(
        m.Workflow.id == workflow_id,
        with_children=True,
    )
    if not workflow:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Workflow not found')
    try:
        project.workflows.remove(workflow)
    except ValueError as err:
        raise HTTPException(
            HTTPStatus.CONFLICT,
            'Workflow not found in project',
        ) from err
    if project.is_changed:
        await project.save_changes()
    return SuccessPayloadOutput(payload=ProjectOutput.from_obj(project))


@router.get('/{project_id}/workflow/available/select')
async def get_available_workflows_for_project(
    project_id: PydanticObjectId,
    query: SelectParams = Depends(),
) -> BaseListOutput[WorkflowOutput]:
    project = await m.Project.find_one(m.Project.id == project_id, fetch_links=True)
    if not project:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Project not found')

    q = m.Workflow.find(
        bo.NotIn(m.Workflow.id, [workflow.id for workflow in project.workflows]),
        with_children=True,
    ).sort(m.Workflow.name)
    if query.search:
        q = q.find(m.Workflow.search_query(query.search))
    return await BaseListOutput.make_from_query(
        q,
        limit=query.limit,
        offset=query.offset,
        projection_fn=WorkflowOutput.from_obj,
    )


@router.post('/{project_id}/subscribe')
async def subscribe_project(
    project_id: PydanticObjectId,
) -> SuccessPayloadOutput[ProjectOutput]:
    project = await m.Project.find_one(m.Project.id == project_id, fetch_links=True)
    if not project:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Project not found')
    user_ctx = current_user()
    if user_ctx.user.id not in project.subscribers:
        project.subscribers.append(user_ctx.user.id)
        await project.replace()
    return SuccessPayloadOutput(payload=ProjectOutput.from_obj(project))


@router.post('/{project_id}/unsubscribe')
async def unsubscribe_project(
    project_id: PydanticObjectId,
) -> SuccessPayloadOutput[ProjectOutput]:
    project = await m.Project.find_one(m.Project.id == project_id, fetch_links=True)
    if not project:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Project not found')
    user_ctx = current_user()
    if user_ctx.user.id in project.subscribers:
        project.subscribers.remove(user_ctx.user.id)
        await project.replace()
    return SuccessPayloadOutput(payload=ProjectOutput.from_obj(project))


@router.post('/{project_id}/favorite')
async def favorite_project(
    project_id: PydanticObjectId,
) -> SuccessPayloadOutput[ProjectOutput]:
    project = await m.Project.find_one(m.Project.id == project_id, fetch_links=True)
    if not project:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Project not found')
    user_ctx = current_user()
    user_ctx.validate_project_permission(
        project, ProjectPermissions.PROJECT_READ, admin_override=True
    )
    if user_ctx.user.id not in project.favorite_of:
        project.favorite_of.append(user_ctx.user.id)
        await project.replace()
    return SuccessPayloadOutput(payload=ProjectOutput.from_obj(project))


@router.post('/{project_id}/unfavorite')
async def unfavorite_project(
    project_id: PydanticObjectId,
) -> SuccessPayloadOutput[ProjectOutput]:
    project = await m.Project.find_one(m.Project.id == project_id, fetch_links=True)
    if not project:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Project not found')
    user_ctx = current_user()
    user_ctx.validate_project_permission(
        project, ProjectPermissions.PROJECT_READ, admin_override=True
    )
    if user_ctx.user.id in project.favorite_of:
        project.favorite_of.remove(user_ctx.user.id)
        await project.replace()
    return SuccessPayloadOutput(payload=ProjectOutput.from_obj(project))


@router.get('/{project_id}/encryption_key/list')
async def get_encryption_keys(
    project_id: PydanticObjectId,
) -> BaseListOutput[EncryptionKeyPublicOut]:
    project = await m.Project.find_one(m.Project.id == project_id)
    if not project:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Project not found')
    if not project.encryption_settings:
        raise HTTPException(
            HTTPStatus.BAD_REQUEST,
            'Project encryption settings not found',
        )
    items = [
        EncryptionKeyPublicOut.from_obj(
            key,
            target_type=EncryptionTargetTypeT.PROJECT,
            target_id=project.id,
        )
        for key in project.encryption_settings.encryption_keys
        if key.is_active
    ]
    if project.encryption_settings.users:
        users = await m.User.find(
            bo.In(m.User.id, [user.id for user in project.encryption_settings.users]),
        ).to_list()
        for user in users:
            items.extend(
                EncryptionKeyPublicOut.from_obj(
                    key,
                    target_type=EncryptionTargetTypeT.USER,
                    target_id=user.id,
                )
                for key in user.encryption_keys
                if key.is_active
            )
    if CONFIG.ENCRYPTION_GLOBAL_PUBLIC_KEY:
        items.append(
            EncryptionKeyPublicOut(
                fingerprint=CONFIG.ENCRYPTION_GLOBAL_FINGERPRINT,
                target_type=EncryptionTargetTypeT.GLOBAL,
                target_id=None,
                public_key=CONFIG.ENCRYPTION_GLOBAL_PUBLIC_KEY,
                algorithm=CONFIG.ENCRYPTION_GLOBAL_ALGORITHM,
            ),
        )
    return BaseListOutput.make(
        count=len(items),
        limit=len(items),
        offset=0,
        items=items,
    )


@router.post('/{project_id}/avatar')
async def upload_project_avatar(
    project_id: PydanticObjectId,
    file: UploadFile = File(...),
) -> SuccessOutput:
    file_header = FileHeader(
        size=file.size,
        name=file.filename,
        content_type=file.content_type,
    )
    await STORAGE_CLIENT.upload_file(
        project_id,
        file,
        file_header,
        folder=PROJECT_AVATAR_STORAGE_DIR,
    )
    await m.Project.find_one(m.Project.id == project_id).update(
        {'$set': {'avatar_type': m.ProjectAvatarType.LOCAL}},
    )
    return SuccessOutput()


@router.delete('/{project_id}/avatar')
async def delete_project_avatar(
    project_id: PydanticObjectId,
) -> SuccessOutput:
    try:
        await STORAGE_CLIENT.delete_file(project_id, folder=PROJECT_AVATAR_STORAGE_DIR)
    except StorageFileNotFoundError as err:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND) from err
    await m.Project.find_one(m.Project.id == project_id).update(
        {'$set': {'avatar_type': m.ProjectAvatarType.DEFAULT}},
    )
    return SuccessOutput()
