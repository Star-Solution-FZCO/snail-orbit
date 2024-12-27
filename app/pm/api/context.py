from collections.abc import AsyncGenerator
from dataclasses import dataclass
from hashlib import sha1
from http import HTTPStatus
from typing import cast

from beanie import PydanticObjectId
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from starlette_context import context, request_cycle_context
from starsol_fastapi_jwt_auth import AuthJWT

import pm.models as m
from pm.api.exceptions import MFARequiredException
from pm.api.utils.jwt_validator import JWTValidationError, is_jwt, validate_jwt
from pm.config import API_SERVICE_TOKEN_KEYS, CONFIG
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
    request: Request,
    jwt_auth: AuthJWT = Depends(AuthJWT),
    bearer_token: str | None = Depends(get_bearer_token),
) -> 'm.User':
    if bearer_token:
        if is_jwt(bearer_token):
            user = await get_user_from_service_token(bearer_token, request)
        else:
            user = await m.User.get_by_api_token(bearer_token)
    else:
        jwt_auth.jwt_required()
        user_login = jwt_auth.get_jwt_subject()
        mfa_passed = (jwt_auth.get_raw_jwt() or {}).get('mfa_passed', False)
        user = await m.User.find_one(m.User.email == user_login)
        if user and user.mfa_enabled and not mfa_passed:
            raise MFARequiredException()
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


async def get_user_from_service_token(token: str, request: Request) -> m.User | None:
    try:
        kid, data = validate_jwt(
            token,
            keys={k: v.secret for k, v in API_SERVICE_TOKEN_KEYS.items()},
            required_additional_claims=('req_hash',),
            max_age=CONFIG.API_SERVICE_TOKEN_MAX_AGE,
        )
    except JWTValidationError as err:
        raise HTTPException(HTTPStatus.UNAUTHORIZED, err.msg) from err

    if not (key := API_SERVICE_TOKEN_KEYS.get(kid)):
        raise HTTPException(HTTPStatus.UNAUTHORIZED, 'Invalid token key ID')
    if not key.check_path(request.url.path, request.method):
        raise HTTPException(HTTPStatus.UNAUTHORIZED, 'Invalid path or method')
    if not key.check_ip(request.client.host):
        raise HTTPException(HTTPStatus.UNAUTHORIZED, 'Invalid source IP')

    url_path = request.url.path + ('?' + request.url.query if request.url.query else '')
    real_req_hash = sha1(
        (request.method + url_path).encode('utf-8'), usedforsecurity=False
    ).hexdigest()
    if data['req_hash'] != real_req_hash:
        raise HTTPException(
            HTTPStatus.UNAUTHORIZED,
            'Invalid request hash',
        )
    user: m.User | None = await m.User.find_one(m.User.email == data['sub'])
    return user
