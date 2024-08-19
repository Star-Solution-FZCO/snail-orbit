from http import HTTPStatus
from typing import Self

from beanie import PydanticObjectId
from fastapi import Depends, HTTPException
from pydantic import BaseModel

import pm.models as m
from pm.api.context import admin_context_dependency
from pm.api.utils.router import APIRouter
from pm.api.views.output import BaseListOutput, ModelIdOutput, SuccessPayloadOutput
from pm.api.views.pararams import ListParams
from pm.permissions import Permissions

__all__ = ('router',)


router = APIRouter(
    prefix='/role', tags=['role'], dependencies=[Depends(admin_context_dependency)]
)

PERMISSIONS_BY_CATEGORY = {
    'Project': {
        Permissions.PROJECT_READ: 'Read project',
        Permissions.PROJECT_UPDATE: 'Update project',
        Permissions.PROJECT_DELETE: 'Delete project',
    },
    'Issue': {
        Permissions.ISSUE_CREATE: 'Create issue',
        Permissions.ISSUE_READ: 'Read issue',
        Permissions.ISSUE_UPDATE: 'Update issue',
        Permissions.ISSUE_DELETE: 'Delete issue',
    },
    'Comment': {
        Permissions.COMMENT_CREATE: 'Create comment',
        Permissions.COMMENT_READ: 'Read comment',
        Permissions.COMMENT_UPDATE: 'Update comment',
        Permissions.COMMENT_DELETE_OWN: 'Delete own comment',
        Permissions.COMMENT_DELETE: 'Delete comment',
    },
    'Attachment': {
        Permissions.ATTACHMENT_CREATE: 'Create attachment',
        Permissions.ATTACHMENT_READ: 'Read attachment',
        Permissions.ATTACHMENT_DELETE_OWN: 'Delete own attachment',
        Permissions.ATTACHMENT_DELETE: 'Delete attachment',
    },
}


class PermissionOutput(BaseModel):
    key: Permissions
    label: str
    granted: bool


class PermissionCategoryOutput(BaseModel):
    label: str
    permissions: list[PermissionOutput]


class RoleOutput(BaseModel):
    id: PydanticObjectId
    name: str
    permissions: list[PermissionCategoryOutput]

    @classmethod
    def from_obj(cls, obj: m.Role) -> Self:
        role_permissions = set(obj.permissions)
        return cls(
            id=obj.id,
            name=obj.name,
            permissions=[
                PermissionCategoryOutput(
                    label=category,
                    permissions=[
                        PermissionOutput(
                            key=key,
                            label=label,
                            granted=key in role_permissions,
                        )
                        for key, label in permissions.items()
                    ],
                )
                for category, permissions in PERMISSIONS_BY_CATEGORY.items()
            ],
        )


class RoleCreate(BaseModel):
    name: str


class RoleUpdate(BaseModel):
    name: str | None = None


@router.get('/list')
async def list_roles(
    query: ListParams = Depends(),
) -> BaseListOutput[RoleOutput]:
    q = m.Role.find().sort(m.Role.name)
    return BaseListOutput.make(
        count=await q.count(),
        limit=query.limit,
        offset=query.offset,
        items=[
            RoleOutput.from_obj(obj)
            async for obj in q.limit(query.limit).skip(query.offset)
        ],
    )


@router.get('/{role_id}')
async def get_role(
    role_id: PydanticObjectId,
) -> SuccessPayloadOutput[RoleOutput]:
    obj = await m.Role.find_one(m.Role.id == role_id)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Role not found')
    return SuccessPayloadOutput(payload=RoleOutput.from_obj(obj))


@router.post('')
async def create_role(
    body: RoleCreate,
) -> SuccessPayloadOutput[RoleOutput]:
    obj = m.Role(name=body.name)
    await obj.insert()
    return SuccessPayloadOutput(payload=RoleOutput.from_obj(obj))


@router.put('/{role_id}')
async def update_role(
    role_id: PydanticObjectId,
    body: RoleUpdate,
) -> SuccessPayloadOutput[RoleOutput]:
    obj: m.Role | None = await m.Role.find_one(m.Role.id == role_id)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Role not found')
    for k, v in body.dict(exclude_unset=True).items():
        setattr(obj, k, v)
    if obj.is_changed:
        await obj.save_changes()
        await m.Project.update_role_embedded_links(obj)
    return SuccessPayloadOutput(payload=RoleOutput.from_obj(obj))


@router.delete('/{role_id}')
async def delete_role(
    role_id: PydanticObjectId,
) -> ModelIdOutput:
    obj = await m.Role.find_one(m.Role.id == role_id)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Role not found')
    await obj.delete()
    await m.Project.remove_role_embedded_links(role_id)
    return ModelIdOutput.make(role_id)


@router.post('/{role_id}/permission/{permission_key}')
async def grant_permission(
    role_id: PydanticObjectId,
    permission_key: Permissions,
) -> SuccessPayloadOutput[RoleOutput]:
    obj: m.Role | None = await m.Role.find_one(m.Role.id == role_id)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Role not found')
    if permission_key in obj.permissions:
        raise HTTPException(HTTPStatus.CONFLICT, 'Permission already granted')
    obj.permissions.append(permission_key)
    await obj.save_changes()
    await m.Project.update_role_embedded_links(obj)
    return SuccessPayloadOutput(payload=RoleOutput.from_obj(obj))


@router.delete('/{role_id}/permission/{permission_key}')
async def revoke_permission(
    role_id: PydanticObjectId,
    permission_key: Permissions,
) -> SuccessPayloadOutput[RoleOutput]:
    obj = await m.Role.find_one(m.Role.id == role_id)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Role not found')
    if permission_key not in obj.permissions:
        raise HTTPException(HTTPStatus.CONFLICT, 'Permission not granted')
    obj.permissions.remove(permission_key)
    await obj.replace()
    await m.Project.update_role_embedded_links(obj)
    return SuccessPayloadOutput(payload=RoleOutput.from_obj(obj))
