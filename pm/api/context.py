from collections.abc import AsyncGenerator
from dataclasses import dataclass
from http import HTTPStatus
from typing import cast

from beanie import PydanticObjectId
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from starlette_context import context, request_cycle_context
from starsol_fastapi_jwt_auth import AuthJWT

import pm.models as m
from pm.permissions import Permissions, PermissionT

__all__ = (
    'current_user_context_dependency',
    'user_dependency',
    'current_user',
    'admin_context_dependency',
)

bearer_scheme = HTTPBearer(auto_error=False)


@dataclass
class UserContext:
    user: m.User
    permissions: dict[PydanticObjectId, set[Permissions]]

    def has_permission(
        self, project_id: PydanticObjectId, permission: PermissionT
    ) -> bool:
        return permission.check(self.permissions.get(project_id, set()))

    def validate_issue_permission(
        self, issue: m.Issue, permission: PermissionT
    ) -> None:
        if not self.has_permission(issue.project.id, permission):
            raise HTTPException(
                HTTPStatus.FORBIDDEN,
                f'Permission {permission} required for this operation',
            )

    def validate_project_permission(
        self, project: m.Project | m.ProjectLinkField, permission: PermissionT
    ) -> None:
        if not self.has_permission(project.id, permission):
            raise HTTPException(
                HTTPStatus.FORBIDDEN,
                f'Permission {permission} required for this operation',
            )

    def get_projects_with_permission(
        self, permission: PermissionT
    ) -> set[PydanticObjectId]:
        return {
            pr for pr in self.permissions.keys() if self.has_permission(pr, permission)
        }


def get_bearer_token(
    authorization: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> str | None:
    if not authorization:
        return None
    return cast(str, authorization.credentials)


async def user_dependency(
    jwt_auth: AuthJWT = Depends(AuthJWT),
    bearer_token: str | None = Depends(get_bearer_token),
) -> 'm.User':
    if bearer_token:
        user: m.User | None = await m.User.get_by_api_token(bearer_token)
    else:
        jwt_auth.jwt_required()
        user_login = jwt_auth.get_jwt_subject()
        user = await m.User.find_one(m.User.email == user_login)
    if not user:
        raise HTTPException(HTTPStatus.UNAUTHORIZED, 'Authorized user not found')
    return user


async def current_user_context_dependency(
    user: 'm.User' = Depends(user_dependency),
) -> AsyncGenerator:
    ctx = UserContext(
        user=user,
        permissions=await resolve_user_permissions(user),
    )
    data = {'current_user': ctx}
    with request_cycle_context(data):
        yield


def current_user() -> UserContext:
    if user := context.get('current_user', None):
        return cast(UserContext, user)
    raise HTTPException(HTTPStatus.UNAUTHORIZED, 'Authorized user not found')


async def admin_context_dependency(
    _: None = Depends(current_user_context_dependency),
) -> AsyncGenerator:
    ctx = current_user()
    if not ctx.user.is_admin:
        raise HTTPException(HTTPStatus.FORBIDDEN, 'Admin permission required')
    yield


async def resolve_user_permissions(
    user: m.User,
) -> dict[PydanticObjectId, set[Permissions]]:
    projects = await m.Project.find_all().to_list()
    return {pr.id: pr.get_user_permissions(user) for pr in projects}
