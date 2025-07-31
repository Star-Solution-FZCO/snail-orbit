from collections.abc import AsyncGenerator
from dataclasses import dataclass, field
from hashlib import sha1
from http import HTTPStatus
from typing import cast

from beanie import PydanticObjectId
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from starlette_context import context, request_cycle_context
from starsol_fastapi_jwt_auth import AuthJWT

import pm.models as m
from pm.api.exceptions import MFARequiredError
from pm.api.utils.jwt_validator import JWTValidationError, is_jwt, validate_jwt
from pm.config import API_SERVICE_TOKEN_KEYS, CONFIG
from pm.permissions import Permissions, PermissionT

__all__ = (
    'UserContext',
    'admin_context_dependency',
    'current_user',
    'current_user_context_dependency',
    'user_dependency',
)

bearer_scheme = HTTPBearer(auto_error=False)


@dataclass
class UserContext:
    user: m.User
    permissions: dict[PydanticObjectId, set[Permissions]]
    all_group_ids: set[PydanticObjectId] = field(default_factory=set)
    _accessible_tag_ids: set[PydanticObjectId] | None = field(default=None, init=False)

    def has_permission(
        self,
        project_id: PydanticObjectId,
        permission: PermissionT,
    ) -> bool:
        return permission.check(self.permissions.get(project_id, set()))

    def validate_issue_permission(
        self,
        issue: m.Issue,
        permission: PermissionT,
    ) -> None:
        if not issue.disable_project_permissions_inheritance and self.has_permission(
            issue.project.id, permission
        ):
            return

        if self.check_issue_permissions(issue, permission):
            return

        raise HTTPException(
            HTTPStatus.FORBIDDEN,
            f'Permission {permission} required for this operation',
        )

    def validate_project_permission(
        self,
        project: m.Project | m.ProjectLinkField,
        permission: PermissionT,
    ) -> None:
        if not self.has_permission(project.id, permission):
            raise HTTPException(
                HTTPStatus.FORBIDDEN,
                f'Permission {permission} required for this operation',
            )

    def get_projects_with_permission(
        self,
        permission: PermissionT,
    ) -> set[PydanticObjectId]:
        return {pr for pr in self.permissions if self.has_permission(pr, permission)}

    def get_issue_filter_for_permission(self, permission: Permissions) -> dict:
        user_project_ids = list(self.get_projects_with_permission(permission))

        return {
            '$or': [
                {
                    '$and': [
                        {'disable_project_permissions_inheritance': {'$ne': True}},
                        {'project.id': {'$in': user_project_ids}},
                    ]
                },
                {
                    'permissions': {
                        '$elemMatch': {
                            '$and': [
                                {
                                    '$or': [
                                        {
                                            'target_type': 'user',
                                            'target.id': self.user.id,
                                        },
                                        {
                                            'target_type': 'group',
                                            'target.id': {
                                                '$in': list(self.all_group_ids)
                                            },
                                        },
                                    ]
                                },
                                {'role.permissions': permission.value},
                            ]
                        }
                    }
                },
            ]
        }

    def check_issue_permissions(
        self,
        issue: m.Issue,
        permission: PermissionT,
    ) -> bool:
        issue_permissions = issue.get_user_permissions(
            self.user,
            self.all_group_ids,
        )
        return permission.check(issue_permissions)

    async def get_accessible_tag_ids(self) -> set[PydanticObjectId]:
        """Lazy load and cache accessible tag IDs for this request"""
        if self._accessible_tag_ids is None:
            accessible_tags = await m.Tag.find(m.Tag.get_filter_query(self)).to_list()
            self._accessible_tag_ids = {tag.id for tag in accessible_tags}
        return self._accessible_tag_ids


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
            raise MFARequiredError()
    if not user:
        raise HTTPException(HTTPStatus.UNAUTHORIZED, 'Authorized user not found')
    return user


async def current_user_context_dependency(
    user: 'm.User' = Depends(user_dependency),
) -> AsyncGenerator:
    all_group_ids = await resolve_all_user_groups(user)
    ctx = UserContext(
        user=user,
        permissions=await resolve_user_permissions(user, all_group_ids),
        all_group_ids=all_group_ids,
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


async def resolve_all_user_groups(user: m.User) -> set[PydanticObjectId]:
    """Resolve all group IDs for user (stored + dynamic)"""
    group_ids = {gr.id for gr in user.groups}  # Stored groups (LOCAL, WB)

    all_users_groups = await m.AllUsersGroup.find_all().to_list()
    if all_users_groups:
        group_ids.update({gr.id for gr in all_users_groups})

    return group_ids


async def resolve_user_permissions(
    user: m.User,
    all_group_ids: set[PydanticObjectId] | None = None,
) -> dict[PydanticObjectId, set[Permissions]]:
    if all_group_ids is None:
        all_group_ids = await resolve_all_user_groups(user)
    projects = await m.Project.find_all().to_list()
    return {pr.id: pr.get_user_permissions(user, all_group_ids) for pr in projects}


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
        (request.method + url_path).encode('utf-8'),
        usedforsecurity=False,
    ).hexdigest()
    if data['req_hash'] != real_req_hash:
        raise HTTPException(
            HTTPStatus.UNAUTHORIZED,
            'Invalid request hash',
        )
    user: m.User | None = await m.User.find_one(m.User.email == data['sub'])
    return user
