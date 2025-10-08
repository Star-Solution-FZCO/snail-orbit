from collections.abc import AsyncGenerator, Callable
from dataclasses import dataclass, field
from hashlib import sha256
from http import HTTPStatus
from typing import Any, cast
from urllib.parse import parse_qsl

import beanie.operators as bo
from beanie import PydanticObjectId
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from starlette_context import context, request_cycle_context
from starsol_fastapi_jwt_auth import AuthJWT

import pm.models as m
from pm.api.exceptions import MFARequiredError
from pm.api.request_ctx import set_request_context
from pm.api.utils.jwt_validator import JWTValidationError, is_jwt, validate_jwt
from pm.cache import cached
from pm.config import API_SERVICE_TOKEN_KEYS, CONFIG
from pm.permissions import (
    GlobalPermissions,
    GlobalPermissionT,
    ProjectPermissions,
    ProjectPermissionT,
)

__all__ = (
    'UserContext',
    'admin_context_dependency',
    'current_user',
    'current_user_context_dependency',
    'user_dependency',
)

bearer_scheme = HTTPBearer(auto_error=False)


# ACL-specific serializers for cached functions
def _serialize_objectid_set(data: set[PydanticObjectId]) -> list[str]:
    """Convert set of PydanticObjectId to list of strings for JSON serialization."""
    return [str(obj_id) for obj_id in data]


def _serialize_permissions_dict(
    data: dict[PydanticObjectId, set[ProjectPermissions]],
) -> dict[str, list[str]]:
    """Convert dict with PydanticObjectId keys and permission sets to JSON-serializable format."""
    return {
        str(obj_id): [p.value for p in permissions]
        for obj_id, permissions in data.items()
    }


def _serialize_global_permissions_set(data: set[GlobalPermissions]) -> list[str]:
    """Convert set of GlobalPermissions to list of strings for JSON serialization."""
    return [p.value for p in data]


# ACL-specific deserializers for cached functions
def _deserialize_objectid_set(data: list[str]) -> set[PydanticObjectId]:
    """Convert list of ObjectId strings back to set of PydanticObjectId."""
    return {PydanticObjectId(id_str) for id_str in data}


def _deserialize_permissions_dict(
    data: dict[str, list[str]],
) -> dict[PydanticObjectId, set[ProjectPermissions]]:
    """Convert dict with string keys and permission lists back to proper types."""
    return {
        PydanticObjectId(str_key): {ProjectPermissions(p) for p in perm_list}
        for str_key, perm_list in data.items()
    }


def _deserialize_global_permissions_set(data: list[str]) -> set[GlobalPermissions]:
    """Convert list of permission strings back to set of GlobalPermissions."""
    return {GlobalPermissions(p) for p in data}


# ACL-specific key builders for cached functions
# pylint: disable=unused-argument
# ruff: noqa: ARG001
def _user_groups_key_builder(
    func: Callable[..., Any], args: tuple[Any, ...], kwargs: dict[str, Any]
) -> str:
    """Build cache key for resolve_all_user_groups based on user ID."""
    user = args[0]
    return f'user_groups:{user.id}'


# pylint: disable=unused-argument
# ruff: noqa: ARG001
def _user_permissions_key_builder(
    func: Callable[..., Any], args: tuple[Any, ...], kwargs: dict[str, Any]
) -> str:
    """Build cache key for resolve_user_permissions based on user ID."""
    user = args[0]
    return f'user_permissions:{user.id}'


# pylint: disable=unused-argument
# ruff: noqa: ARG001
def _user_global_permissions_key_builder(
    func: Callable[..., Any], args: tuple[Any, ...], kwargs: dict[str, Any]
) -> str:
    """Build cache key for resolve_user_global_permissions based on user ID."""
    user = args[0]
    return f'user_global_permissions:{user.id}'


@dataclass
class UserContext:
    user: m.User
    permissions: dict[PydanticObjectId, set[ProjectPermissions]]
    global_permissions: set[GlobalPermissions] = field(default_factory=set)
    all_group_ids: set[PydanticObjectId] = field(default_factory=set)
    _accessible_tag_ids: set[PydanticObjectId] | None = field(default=None, init=False)

    def has_permission(
        self,
        project_id: PydanticObjectId,
        permission: ProjectPermissionT,
    ) -> bool:
        """Check if user has a project-scoped permission."""
        return permission.check(self.permissions.get(project_id, set()))

    def has_global_permission(self, permission: GlobalPermissionT) -> bool:
        """Check if user has a global permission."""
        return permission.check(self.global_permissions)

    def validate_global_permission(
        self, permission: GlobalPermissionT, admin_override: bool = False
    ) -> None:
        """Validate that user has a global permission."""
        if admin_override and self.user.is_admin:
            return

        if not self.has_global_permission(permission):
            raise HTTPException(
                HTTPStatus.FORBIDDEN,
                f'Global permission {permission} required for this operation',
            )

    def validate_issue_permission(
        self,
        issue: m.Issue,
        permission: ProjectPermissionT,
        admin_override: bool = False,
    ) -> None:
        """Validate user has permission on issue, with inheritance."""
        if admin_override and self.user.is_admin:
            return

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
        permission: ProjectPermissionT,
        admin_override: bool = False,
    ) -> None:
        """Validate user has permission on project."""
        if admin_override and self.user.is_admin:
            return

        if not self.has_permission(project.id, permission):
            raise HTTPException(
                HTTPStatus.FORBIDDEN,
                f'Permission {permission} required for this operation',
            )

    def get_projects_with_permission(
        self,
        permission: ProjectPermissionT,
    ) -> set[PydanticObjectId]:
        """Get all project IDs where user has the specified permission."""
        return {pr for pr in self.permissions if self.has_permission(pr, permission)}

    def get_issue_filter_for_permission(self, permission: ProjectPermissions) -> dict:
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
        permission: ProjectPermissionT,
    ) -> bool:
        """Check if user has permission on specific issue."""
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
            set_request_context(
                request,
                user_id=str(user.id),
                user_email=user.email,
            )
            raise MFARequiredError()
    if not user:
        raise HTTPException(HTTPStatus.UNAUTHORIZED, 'Authorized user not found')

    set_request_context(
        request,
        user_id=str(user.id),
        user_email=user.email,
    )

    return user


async def current_user_context_dependency(
    user: 'm.User' = Depends(user_dependency),
) -> AsyncGenerator:
    all_group_ids = await resolve_all_user_groups(user)
    ctx = UserContext(
        user=user,
        permissions=await resolve_user_permissions(user, all_group_ids),
        global_permissions=await resolve_user_global_permissions(user, all_group_ids),
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


@cached(
    ttl=120,
    tags=['groups:all'],
    namespace='acl',
    serializer=_serialize_objectid_set,
    deserializer=_deserialize_objectid_set,
    key_builder=_user_groups_key_builder,
)
async def resolve_all_user_groups(user: m.User) -> set[PydanticObjectId]:
    """Resolve all group IDs for user (stored + dynamic)"""
    group_ids = {gr.id for gr in user.groups}  # Stored groups (LOCAL, WB)

    # Add ALL_USERS dynamic group
    all_users_groups = await m.AllUsersGroup.find_all().to_list()
    if all_users_groups:
        group_ids.update({gr.id for gr in all_users_groups})

    # Add SYSTEM_ADMINS dynamic group for admin users
    if user.is_admin:
        system_admin_groups = await m.SystemAdminsGroup.find_all().to_list()
        if system_admin_groups:
            group_ids.update({gr.id for gr in system_admin_groups})

    return group_ids


@cached(
    ttl=120,
    tags=['projects:all', 'permissions:all'],
    namespace='acl',
    serializer=_serialize_permissions_dict,
    deserializer=_deserialize_permissions_dict,
    key_builder=_user_permissions_key_builder,
)
async def resolve_user_permissions(
    user: m.User,
    all_group_ids: set[PydanticObjectId] | None = None,
) -> dict[PydanticObjectId, set[ProjectPermissions]]:
    """Resolve project permissions for user across all projects."""
    if all_group_ids is None:
        all_group_ids = await resolve_all_user_groups(user)

    projects = await m.Project.find_all().to_list()
    return {pr.id: pr.get_user_permissions(user, all_group_ids) for pr in projects}


@cached(
    ttl=120,
    tags=['groups:all', 'global_permissions:all'],
    namespace='acl',
    serializer=_serialize_global_permissions_set,
    deserializer=_deserialize_global_permissions_set,
    key_builder=_user_global_permissions_key_builder,
)
async def resolve_user_global_permissions(
    user: m.User,
    all_group_ids: set[PydanticObjectId] | None = None,
) -> set[GlobalPermissions]:
    """Resolve global permissions for user from direct global roles and group global roles."""
    global_permissions: set[GlobalPermissions] = set()

    # Direct global roles assigned to user
    for global_role_link in user.global_roles:
        global_permissions.update(global_role_link.permissions)

    # Group-based global roles
    if all_group_ids is None:
        all_group_ids = await resolve_all_user_groups(user)

    if all_group_ids:
        groups = await m.Group.find(
            bo.In(m.Group.id, all_group_ids), with_children=True
        ).to_list()

        for group in groups:
            for global_role_link in group.global_roles:
                global_permissions.update(global_role_link.permissions)

    return global_permissions


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

    try:
        params = parse_qsl(
            request.url.query or '',
            strict_parsing=True,
            keep_blank_values=True,
        )
    except ValueError as err:
        raise HTTPException(HTTPStatus.BAD_REQUEST, 'Invalid query parameters') from err
    sorted_params = sorted(params)

    hash_input = (
        request.method
        + request.url.path
        + ''.join(f'{k}={v}' for k, v in sorted_params)
    )
    real_req_hash = sha256(hash_input.encode('utf-8')).hexdigest()
    if data['req_hash'] != real_req_hash:
        raise HTTPException(
            HTTPStatus.UNAUTHORIZED,
            'Invalid request hash',
        )
    user: m.User | None = await m.User.find_one(m.User.email == data['sub'])
    return user
