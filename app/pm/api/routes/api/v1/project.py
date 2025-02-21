from http import HTTPStatus
from typing import Self
from uuid import UUID

from beanie import PydanticObjectId
from beanie import operators as bo
from fastapi import Depends, HTTPException
from pydantic import BaseModel, computed_field

import pm.models as m
from pm.api.context import (
    admin_context_dependency,
    current_user,
    current_user_context_dependency,
)
from pm.api.utils.router import APIRouter
from pm.api.views.custom_fields import (
    CustomFieldOutput,
    CustomFieldOutputT,
    cf_output_from_obj,
)
from pm.api.views.factories.crud import CrudCreateBody, CrudOutput, CrudUpdateBody
from pm.api.views.group import GroupOutput
from pm.api.views.output import (
    BaseListOutput,
    ModelIdOutput,
    SuccessPayloadOutput,
    UUIDOutput,
)
from pm.api.views.params import ListParams
from pm.api.views.role import RoleLinkOutput, RoleOutput
from pm.api.views.select import SelectParams
from pm.api.views.user import UserOutput
from pm.permissions import PERMISSIONS_BY_CATEGORY, Permissions

__all__ = ('router',)

router = APIRouter(
    prefix='/project',
    tags=['project'],
    dependencies=[Depends(current_user_context_dependency)],
)


class WorkflowOutput(CrudOutput[m.Workflow]):
    id: PydanticObjectId
    name: str
    description: str | None
    type: m.WorkflowType


class ProjectListOutput(CrudOutput[m.Project]):
    name: str
    slug: str
    description: str | None
    is_active: bool


class ProjectPermissionOutput(BaseModel):
    id: UUID
    target_type: m.PermissionTargetType
    target: GroupOutput | UserOutput
    role: RoleOutput

    @classmethod
    def from_obj(cls, obj: m.ProjectPermission) -> Self:
        if obj.target_type == m.PermissionTargetType.USER:
            target = UserOutput.from_obj(obj.target)
        else:
            target = GroupOutput.from_obj(obj.target)
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
    key: Permissions
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
    def resolve_from_project(cls, project: m.Project, user: m.User) -> Self:
        resolved: dict[Permissions, list[PermissionSourceOutput]] = {
            Permissions(perm): [] for perm in Permissions
        }
        user_groups = {gr.id for gr in user.groups}
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
                        )
                    )
            if (
                perm.target_type == m.PermissionTargetType.GROUP
                and perm.target.id in user_groups
            ):
                for p in perm.role.permissions:
                    resolved[p].append(
                        PermissionSourceOutput(
                            permission_id=perm.id,
                            role=RoleLinkOutput.from_obj(perm.role),
                            type=perm.target_type,
                            source_group=GroupOutput.from_obj(perm.target),
                        )
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
                        )
                    ],
                )
                for category, perms in PERMISSIONS_BY_CATEGORY.items()
                for key, label in perms.items()
            ],
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
    workflows: list[WorkflowOutput] = []
    is_subscribed: bool = False
    avatar_type: m.ProjectAvatarType

    @computed_field
    @property
    def avatar(self) -> str:
        return (
            f'/api/avatar/project/{self.id}'
            if self.avatar_type == m.ProjectAvatarType.LOCAL
            else None
        )

    @classmethod
    def from_obj(cls, obj: m.Project) -> 'ProjectOutput':
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
            is_subscribed=current_user().user.id in obj.subscribers,
            avatar_type=obj.avatar_type,
        )


class ProjectCreate(CrudCreateBody[m.Project]):
    name: str
    slug: str
    description: str | None = None
    ai_description: str | None = None
    is_active: bool = True


class ProjectUpdate(CrudUpdateBody[m.Project]):
    name: str | None = None
    slug: str | None = None
    description: str | None = None
    ai_description: str | None = None
    is_active: bool | None = None
    card_fields: list[PydanticObjectId] | None = None


class GrantPermissionBody(BaseModel):
    target_type: m.PermissionTargetType
    target_id: PydanticObjectId
    role_id: PydanticObjectId


class FieldMoveBody(BaseModel):
    after_id: PydanticObjectId | None = None


@router.get('/list')
async def list_projects(
    query: ListParams = Depends(),
) -> BaseListOutput[ProjectListOutput]:
    q = m.Project.find().sort(m.Project.id)
    if query.search:
        q = q.find(m.Project.search_query(query.search))
    return await BaseListOutput.make_from_query(
        q,
        limit=query.limit,
        offset=query.offset,
        projection_fn=ProjectListOutput.from_obj,
    )


@router.get('/{project_id}')
async def get_project(
    project_id: PydanticObjectId,
) -> SuccessPayloadOutput[ProjectOutput]:
    obj = await m.Project.find_one(m.Project.id == project_id, fetch_links=True)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Project not found')
    return SuccessPayloadOutput(payload=ProjectOutput.from_obj(obj))


@router.post('/')
async def create_project(
    body: ProjectCreate,
    _=Depends(admin_context_dependency),
) -> SuccessPayloadOutput[ProjectOutput]:
    obj = body.create_obj(m.Project)
    await obj.insert()
    return SuccessPayloadOutput(payload=ProjectOutput.from_obj(obj))


@router.put('/{project_id}')
async def update_project(
    project_id: PydanticObjectId,
    body: ProjectUpdate,
    _=Depends(admin_context_dependency),
) -> SuccessPayloadOutput[ProjectOutput]:
    obj = await m.Project.find_one(m.Project.id == project_id, fetch_links=True)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Project not found')
    if 'card_fields' in body.model_dump(exclude_unset=True):
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
    body.update_obj(obj)
    if obj.is_changed:
        await obj.save_changes()
        await m.Issue.update_project_embedded_links(obj)
    return SuccessPayloadOutput(payload=ProjectOutput.from_obj(obj))


@router.delete('/{project_id}')
async def delete_project(
    project_id: PydanticObjectId,
    _=Depends(admin_context_dependency),
) -> ModelIdOutput:
    obj = await m.Project.find_one(m.Project.id == project_id)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Project not found')
    await obj.delete()
    await m.Issue.find(m.Issue.project.id == project_id).delete()
    return ModelIdOutput.make(project_id)


@router.get('/{project_id}/field/available/select')
async def get_available_select_fields(
    project_id: PydanticObjectId,
    query: SelectParams = Depends(),
) -> BaseListOutput[CustomFieldOutputT]:
    project = await m.Project.find_one(m.Project.id == project_id, fetch_links=True)
    if not project:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Project not found')

    q = m.CustomField.find(
        bo.NotIn(m.CustomField.id, [field.id for field in project.custom_fields]),
        with_children=True,
    ).sort(m.CustomField.name)
    if query.search:
        q = q.find(bo.RegEx(m.CustomField.name, query.search, 'i'))
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
        m.CustomField.id == field_id, with_children=True
    )
    if not field:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Field not found')
    if field in project.custom_fields:
        raise HTTPException(HTTPStatus.CONFLICT, 'Field already added to project')
    if any(field.name == f.name for f in project.custom_fields):
        raise HTTPException(
            HTTPStatus.CONFLICT, 'Field with the same name already in project'
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
        m.CustomField.id == field_id, with_children=True
    )
    if not field:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Field not found')
    try:
        project.custom_fields.remove(field)
    except ValueError as err:
        raise HTTPException(HTTPStatus.CONFLICT, 'Field not found in project') from err
    try:
        project.card_fields.remove(field.id)
    except ValueError:
        pass
    if project.is_changed:
        await project.save_changes()
        await m.Issue.remove_field_embedded_links(
            field_id, flt={'project.id': project_id}
        )
        await m.IssueDraft.remove_field_embedded_links(
            field_id, flt={'project.id': project_id}
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
            HTTPStatus.BAD_REQUEST, 'Field cannot be moved after itself'
        )
    try:
        field_idx = next(
            i for i, f in enumerate(project.custom_fields) if f.id == field_id
        )
        field = project.custom_fields.pop(field_idx)
    except StopIteration as err:
        raise HTTPException(
            HTTPStatus.BAD_REQUEST, f'Field {field_id} not found in project fields'
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
                m.User.groups.id == project_permission.target.id
            ).to_list()
            for user in group_users:
                results.append(
                    ProjectResolvedPermissionOutput.resolve_from_project(project, user)
                )
        else:
            user = await m.User.find_one(m.User.id == project_permission.target.id)
            if not user:
                continue
            results.append(
                ProjectResolvedPermissionOutput.resolve_from_project(project, user)
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
    role: m.Role | None = await m.Role.find_one(m.Role.id == body.role_id)
    if not role:
        raise HTTPException(HTTPStatus.BAD_REQUEST, 'Role not found')
    if body.target_type == m.PermissionTargetType.USER:
        user: m.User | None = await m.User.find_one(m.User.id == body.target_id)
        if not user:
            raise HTTPException(HTTPStatus.BAD_REQUEST, 'User not found')
        permission = m.ProjectPermission(
            target_type=body.target_type,
            target=m.UserLinkField.from_obj(user),
            role=m.RoleLinkField.from_obj(role),
        )
    else:  # m.PermissionTargetType.GROUP
        group: m.Group | None = await m.Group.find_one(m.Group.id == body.target_id)
        if not group:
            raise HTTPException(HTTPStatus.BAD_REQUEST, 'Group not found')
        permission = m.ProjectPermission(
            target_type=body.target_type,
            target=m.GroupLinkField.from_obj(group),
            role=m.RoleLinkField.from_obj(role),
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
        m.Workflow.id == workflow_id, with_children=True
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
        m.Workflow.id == workflow_id, with_children=True
    )
    if not workflow:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Workflow not found')
    try:
        project.workflows.remove(workflow)
    except ValueError as err:
        raise HTTPException(
            HTTPStatus.CONFLICT, 'Workflow not found in project'
        ) from err
    if project.is_changed:
        await project.save_changes()
    return SuccessPayloadOutput(payload=ProjectOutput.from_obj(project))


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
