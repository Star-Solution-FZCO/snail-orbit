"""
ACL Test Helpers

This module provides reusable helper functions for ACL (Access Control List) system tests.
These helpers follow the established two-phase testing pattern:
- Phase 1: Setup entities using direct database operations for efficiency
- Phase 2: Test ACL behavior using API calls for realistic testing
"""

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from fastapi.testclient import TestClient

    import pm.models as m


async def prepare_acl_users(user_specs: dict) -> dict[str, tuple['m.User', str]]:
    """Create users directly in database with specified global roles and group memberships

    Args:
        user_specs: {
            'user_name': {
                'email': 'user@example.com',
                'is_admin': False,
                'global_roles': ['role_id1', 'role_id2'],
                'groups': ['group_id1', 'group_id2']
            }
        }

    Returns:
        dict mapping user names to (User model instance, api_token) tuples
    """
    import pm.models as m

    users = {}
    for name, spec in user_specs.items():
        user = m.User(
            name=name,
            email=spec['email'],
            is_admin=spec.get('is_admin', False),
        )
        await user.save()

        # Create API token for the user
        token, token_obj = user.gen_new_api_token(f'{name}_test_token')
        user.api_tokens.append(token_obj)

        # Assign global roles
        if 'global_roles' in spec:
            for role_id in spec['global_roles']:
                role = await m.GlobalRole.find_one(m.GlobalRole.id == role_id)
                if role:
                    user.global_roles.append(m.GlobalRoleLinkField.from_obj(role))

        # Assign groups
        if 'groups' in spec:
            for group_id_raw in spec['groups']:
                from beanie import PydanticObjectId

                if isinstance(group_id_raw, str):
                    group_id = PydanticObjectId(group_id_raw)
                else:
                    group_id = group_id_raw
                group = await m.Group.find_one(
                    m.Group.id == group_id, with_children=True
                )
                if group:
                    user.groups.append(m.GroupLinkField.from_obj(group))

        await user.save()
        users[name] = (user, token)

    return users


async def prepare_acl_groups(group_specs: dict) -> dict[str, 'm.Group']:
    """Create groups directly in database with specified global role assignments

    Args:
        group_specs: {
            'group_name': {
                'description': 'Group description',
                'global_roles': ['role_id1', 'role_id2']
            }
        }

    Returns:
        dict mapping group names to Group model instances
    """
    import pm.models as m

    groups = {}
    for name, spec in group_specs.items():
        group = m.LocalGroup(
            name=name,
            description=spec.get('description', ''),
        )
        await group.save()

        # Assign global roles
        if 'global_roles' in spec:
            for role_id in spec['global_roles']:
                role = await m.GlobalRole.find_one(m.GlobalRole.id == role_id)
                if role:
                    group.global_roles.append(m.GlobalRoleLinkField.from_obj(role))
            await group.save()

        groups[name] = group

    return groups


async def prepare_acl_roles(role_specs: dict) -> dict[str, 'm.ProjectRole']:
    """Create project roles directly in database with specified permissions

    Args:
        role_specs: {
            'role_name': {
                'description': 'Role description',
                'permissions': [ProjectPermissions.PROJECT_READ, ProjectPermissions.ISSUE_CREATE]
            }
        }

    Returns:
        dict mapping role names to ProjectRole model instances
    """
    import pm.models as m

    roles = {}
    for name, spec in role_specs.items():
        role = m.ProjectRole(
            name=name,
            description=spec.get('description', ''),
            permissions=spec.get('permissions', []),
        )
        await role.save()
        roles[name] = role

    return roles


async def prepare_global_roles(role_specs: dict) -> dict[str, 'm.GlobalRole']:
    """Create global roles directly in database with specified permissions

    Args:
        role_specs: {
            'role_name': {
                'description': 'Role description',
                'permissions': [GlobalPermissions.PROJECT_CREATE]
            }
        }

    Returns:
        dict mapping role names to GlobalRole model instances
    """
    import pm.models as m

    roles = {}
    for name, spec in role_specs.items():
        role = m.GlobalRole(
            name=name,
            description=spec.get('description', ''),
            permissions=spec.get('permissions', []),
        )
        await role.save()
        roles[name] = role

    return roles


def make_user_headers(api_token: str) -> dict:
    """Create authentication headers for API requests using API token

    Args:
        api_token: API token string for authentication

    Returns:
        dict containing Authorization header for API requests
    """
    return {'Authorization': f'Bearer {api_token}'}


async def create_group_via_api(
    test_client: 'TestClient',
    admin_headers: dict,
    name: str,
    description: str | None = None,
) -> str:
    """Create a group via API and return its ID

    Args:
        test_client: FastAPI test client
        admin_headers: Authentication headers with admin privileges
        name: Group name
        description: Optional group description

    Returns:
        Group ID as string

    Raises:
        AssertionError: If group creation fails
    """
    response = test_client.post(
        '/api/v1/group/',
        headers=admin_headers,
        json={'name': name, 'description': description or f'{name} group'},
    )
    assert response.status_code == 200, (
        f'Group creation failed: {response.status_code} - {response.json()}'
    )
    return response.json()['payload']['id']


async def assign_global_role_to_group_via_api(
    test_client: 'TestClient', admin_headers: dict, group_id: str, role_id: str
) -> None:
    """Assign a global role to a group via API

    Args:
        test_client: FastAPI test client
        admin_headers: Authentication headers with admin privileges
        group_id: Group ID as string
        role_id: Global role ID as string

    Raises:
        AssertionError: If role assignment fails
    """
    response = test_client.post(
        f'/api/v1/group/{group_id}/global-role/{role_id}', headers=admin_headers
    )
    assert response.status_code == 200, (
        f'Global role assignment failed: {response.status_code} - {response.json()}'
    )


async def create_project_via_api(
    test_client: 'TestClient',
    user_headers: dict,
    name: str,
    slug: str,
    description: str | None = None,
    is_active: bool = True,
) -> str:
    """Create a project via API and return its ID

    Args:
        test_client: FastAPI test client
        user_headers: Authentication headers for user with PROJECT_CREATE permission
        name: Project name
        slug: Project slug (must match ^\\w+$ pattern - use underscores, not hyphens)
        description: Optional project description
        is_active: Whether project is active

    Returns:
        Project ID as string

    Raises:
        AssertionError: If project creation fails
    """
    response = test_client.post(
        '/api/v1/project/',
        headers=user_headers,
        json={
            'name': name,
            'slug': slug,
            'description': description or f'Project: {name}',
            'is_active': is_active,
        },
    )
    assert response.status_code == 200, (
        f'Project creation failed: {response.status_code} - {response.json()}'
    )
    return response.json()['payload']['id']


def assert_permission_granted(response, operation_name: str = 'operation') -> None:
    """Assert that an API operation was granted (status 200)

    Args:
        response: HTTP response object
        operation_name: Name of operation for error message

    Raises:
        AssertionError: If operation was not granted
    """
    assert response.status_code == 200, (
        f'{operation_name} should be granted but got {response.status_code}: '
        f'{response.json() if hasattr(response, "json") else response.text}'
    )


def assert_permission_denied(response, operation_name: str = 'operation') -> None:
    """Assert that an API operation was denied (status 403)

    Args:
        response: HTTP response object
        operation_name: Name of operation for error message

    Raises:
        AssertionError: If operation was not properly denied
    """
    assert response.status_code == 403, (
        f'{operation_name} should be denied (403) but got {response.status_code}: '
        f'{response.json() if hasattr(response, "json") else response.text}'
    )


def assert_not_found(response, resource_name: str = 'resource') -> None:
    """Assert that a resource was not found (status 404)

    Args:
        response: HTTP response object
        resource_name: Name of resource for error message

    Raises:
        AssertionError: If response is not 404
    """
    assert response.status_code == 404, (
        f'{resource_name} should not be found (404) but got {response.status_code}: '
        f'{response.json() if hasattr(response, "json") else response.text}'
    )
