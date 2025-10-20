from http import HTTPStatus
from typing import TYPE_CHECKING

import pytest

if TYPE_CHECKING:
    from fastapi.testclient import TestClient

from .create import create_group, create_issue, create_project, create_role, create_user
from .helpers import assert_error_response, assert_success_response, make_auth_headers
from .test_api import create_initial_admin


@pytest.mark.asyncio
async def test_issue_permissions_crud_workflow(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
) -> None:
    """Test full CRUD workflow for issue permissions."""
    admin_user, admin_token = create_initial_admin
    headers = make_auth_headers(admin_token)

    project_payload = {
        'name': 'Test project',
        'slug': 'test',
        'description': 'Test project description',
        'ai_description': 'Test project AI description',
    }
    response = test_client.post(
        '/api/v1/project', headers=headers, json=project_payload
    )
    assert_success_response(response)
    project_id = response.json()['payload']['id']

    user_payload = {
        'name': 'Test User',
        'email': 'testuser@example.com',
        'password': 'testpassword',
        'is_active': True,
    }
    response = test_client.post('/api/v1/user', headers=headers, json=user_payload)
    assert_success_response(response)
    user_id = response.json()['payload']['id']

    group_payload = {
        'name': 'Test Group',
        'description': 'Test group description',
    }
    response = test_client.post('/api/v1/group', headers=headers, json=group_payload)
    assert_success_response(response)
    group_id = response.json()['payload']['id']

    role_payload = {
        'name': 'Test Role',
        'description': 'Test role description',
        'permissions': ['issue:create', 'issue:read', 'issue:update'],
    }
    response = test_client.post('/api/v1/role', headers=headers, json=role_payload)
    assert_success_response(response)
    role_id = response.json()['payload']['id']

    for perm in role_payload['permissions']:
        response = test_client.post(
            f'/api/v1/role/{role_id}/permission/{perm}', headers=headers
        )
        assert_success_response(response)

    response = test_client.post(
        f'/api/v1/project/{project_id}/permission',
        headers=headers,
        json={
            'target_type': 'user',
            'target_id': admin_user,
            'role_id': role_id,
        },
    )
    assert_success_response(response)

    issue_payload = {
        'project_id': project_id,
        'subject': 'Test issue for permissions',
        'text': {'value': 'Test issue text'},
        'fields': {},
    }
    response = test_client.post('/api/v1/issue', headers=headers, json=issue_payload)
    assert_success_response(response)
    issue_id = response.json()['payload']['id']

    response = test_client.get(
        f'/api/v1/issue/{issue_id}/permissions',
        headers=headers,
    )
    assert_success_response(response)
    permissions = response.json()['payload']['items']
    # Should only have inherited project permissions, no direct issue permissions
    direct_permissions = [p for p in permissions if not p['is_inherited']]
    inherited_permissions = [p for p in permissions if p['is_inherited']]
    assert len(direct_permissions) == 0, (
        'Should have no direct issue permissions initially'
    )
    assert len(inherited_permissions) == 2, 'Should have inherited project permissions'

    response = test_client.post(
        f'/api/v1/issue/{issue_id}/permission',
        headers=headers,
        json={
            'target_type': 'user',
            'target_id': user_id,
            'role_id': role_id,
        },
    )
    assert_success_response(response)
    permission_id = response.json()['payload']['id']

    response = test_client.get(
        f'/api/v1/issue/{issue_id}/permissions',
        headers=headers,
    )
    assert_success_response(response)
    assert response.json()['payload']['count'] == 3  # 2 inherited + 1 direct
    permissions = response.json()['payload']['items']
    direct_permissions = [p for p in permissions if not p['is_inherited']]
    assert len(direct_permissions) == 1, 'Should have one direct issue permission'
    assert direct_permissions[0]['target_type'] == 'user'

    response = test_client.post(
        f'/api/v1/issue/{issue_id}/permission',
        headers=headers,
        json={
            'target_type': 'group',
            'target_id': group_id,
            'role_id': role_id,
        },
    )
    assert_success_response(response)
    group_permission_id = response.json()['payload']['id']

    response = test_client.get(
        f'/api/v1/issue/{issue_id}/permissions',
        headers=headers,
    )
    assert_success_response(response)
    assert response.json()['payload']['count'] == 4  # 2 inherited + 2 direct

    response = test_client.delete(
        f'/api/v1/issue/{issue_id}/permission/{permission_id}',
        headers=headers,
    )
    assert_success_response(response)

    response = test_client.get(
        f'/api/v1/issue/{issue_id}/permissions',
        headers=headers,
    )
    assert_success_response(response)
    assert response.json()['payload']['count'] == 3  # 2 inherited + 1 direct
    permissions = response.json()['payload']['items']
    direct_permissions = [p for p in permissions if not p['is_inherited']]
    assert len(direct_permissions) == 1, 'Should have one direct issue permission'
    assert direct_permissions[0]['target_type'] == 'group'

    response = test_client.delete(
        f'/api/v1/issue/{issue_id}/permission/{group_permission_id}',
        headers=headers,
    )
    assert_success_response(response)

    response = test_client.get(
        f'/api/v1/issue/{issue_id}/permissions',
        headers=headers,
    )
    assert_success_response(response)
    permissions = response.json()['payload']['items']
    # Should only have inherited project permissions, no direct issue permissions
    direct_permissions = [p for p in permissions if not p['is_inherited']]
    inherited_permissions = [p for p in permissions if p['is_inherited']]
    assert len(direct_permissions) == 0, (
        'Should have no direct issue permissions initially'
    )
    assert len(inherited_permissions) == 2, 'Should have inherited project permissions'


@pytest.mark.asyncio
async def test_issue_permissions_inheritance(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
) -> None:
    """Test permission inheritance from project to issue."""
    from pm.permissions import ProjectPermissions

    admin_user, admin_token = create_initial_admin
    headers = make_auth_headers(admin_token)

    project_payload = {
        'name': 'Test project',
        'slug': 'test_inherit',
        'description': 'Test project for inheritance',
        'ai_description': 'Test project AI description',
    }
    response = test_client.post(
        '/api/v1/project', headers=headers, json=project_payload
    )
    assert_success_response(response)
    project_id = response.json()['payload']['id']

    user_payload = {
        'name': 'Test User',
        'email': 'testuser@example.com',
        'password': 'testpassword',
        'is_active': True,
    }
    response = test_client.post('/api/v1/user', headers=headers, json=user_payload)
    assert_success_response(response)
    user_id = response.json()['payload']['id']

    role_payload = {
        'name': 'Reader Role',
        'description': 'Can read issues',
        'permissions': ['issue:read'],
    }
    response = test_client.post('/api/v1/role', headers=headers, json=role_payload)
    assert_success_response(response)
    role_id = response.json()['payload']['id']

    response = test_client.post(
        f'/api/v1/role/{role_id}/permission/issue:read', headers=headers
    )
    assert_success_response(response)

    admin_role_payload = {
        'name': 'Admin Role',
        'description': 'Can do everything',
        'permissions': ['issue:create', 'issue:read', 'issue:update', 'issue:delete'],
    }
    response = test_client.post(
        '/api/v1/role', headers=headers, json=admin_role_payload
    )
    assert_success_response(response)
    admin_role_id = response.json()['payload']['id']

    for perm in admin_role_payload['permissions']:
        response = test_client.post(
            f'/api/v1/role/{admin_role_id}/permission/{perm}', headers=headers
        )
        assert_success_response(response)

    response = test_client.post(
        f'/api/v1/project/{project_id}/permission',
        headers=headers,
        json={
            'target_type': 'user',
            'target_id': admin_user,
            'role_id': admin_role_id,
        },
    )
    assert_success_response(response)

    response = test_client.post(
        f'/api/v1/project/{project_id}/permission',
        headers=headers,
        json={
            'target_type': 'user',
            'target_id': user_id,
            'role_id': role_id,
        },
    )
    assert_success_response(response)

    issue_payload = {
        'project_id': project_id,
        'subject': 'Test issue for inheritance',
        'text': {'value': 'Test issue text'},
        'fields': {},
    }
    response = test_client.post('/api/v1/issue', headers=headers, json=issue_payload)
    assert_success_response(response)
    issue_id = response.json()['payload']['id']

    response = test_client.get(
        f'/api/v1/issue/{issue_id}',
        headers=headers,
    )
    assert_success_response(response)
    issue_data = response.json()['payload']
    assert issue_data['disable_project_permissions_inheritance'] is False

    # Test permission inheritance by checking resolved permissions for admin user
    response = test_client.get(
        f'/api/v1/issue/{issue_id}/permissions/resolve',
        headers=headers,
    )
    assert_success_response(response)
    permissions = response.json()['payload']
    # Admin should have all permissions
    assert len(permissions) >= 3
    assert ProjectPermissions.ISSUE_READ in permissions

    # Grant direct issue permission to user
    response = test_client.post(
        f'/api/v1/issue/{issue_id}/permission',
        headers=headers,
        json={
            'target_type': 'user',
            'target_id': user_id,
            'role_id': role_id,
        },
    )
    assert_success_response(response)

    # Test that admin still has all permissions
    response = test_client.get(
        f'/api/v1/issue/{issue_id}/permissions/resolve',
        headers=headers,
    )
    assert_success_response(response)
    permissions = response.json()['payload']
    # Admin should have all permissions
    assert len(permissions) >= 3
    assert ProjectPermissions.ISSUE_READ in permissions


@pytest.mark.asyncio
async def test_issue_permissions_resolve(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
) -> None:
    """Test permission resolution endpoint."""
    from pm.permissions import ProjectPermissions

    admin_user, admin_token = create_initial_admin
    headers = make_auth_headers(admin_token)

    project_payload = {
        'name': 'Test project',
        'slug': 'test_resolve',
        'description': 'Test project for resolution',
        'ai_description': 'Test project AI description',
    }
    response = test_client.post(
        '/api/v1/project', headers=headers, json=project_payload
    )
    assert_success_response(response)
    project_id = response.json()['payload']['id']

    user_payload = {
        'name': 'Test User',
        'email': 'testuser@example.com',
        'password': 'testpassword',
        'is_active': True,
    }
    response = test_client.post('/api/v1/user', headers=headers, json=user_payload)
    assert_success_response(response)
    user_id = response.json()['payload']['id']

    # Create role with multiple permissions
    role_payload = {
        'name': 'Multi Role',
        'description': 'Multiple permissions',
        'permissions': ['issue:read', 'issue:update'],
    }
    response = test_client.post('/api/v1/role', headers=headers, json=role_payload)
    assert_success_response(response)
    role_id = response.json()['payload']['id']

    for perm in role_payload['permissions']:
        response = test_client.post(
            f'/api/v1/role/{role_id}/permission/{perm}', headers=headers
        )
        assert_success_response(response)

    admin_role_payload = {
        'name': 'Admin Role',
        'description': 'Can do everything',
        'permissions': ['issue:create', 'issue:read', 'issue:update', 'issue:delete'],
    }
    response = test_client.post(
        '/api/v1/role', headers=headers, json=admin_role_payload
    )
    assert_success_response(response)
    admin_role_id = response.json()['payload']['id']

    for perm in admin_role_payload['permissions']:
        response = test_client.post(
            f'/api/v1/role/{admin_role_id}/permission/{perm}', headers=headers
        )
        assert_success_response(response)

    response = test_client.post(
        f'/api/v1/project/{project_id}/permission',
        headers=headers,
        json={
            'target_type': 'user',
            'target_id': admin_user,
            'role_id': admin_role_id,
        },
    )
    assert_success_response(response)

    issue_payload = {
        'project_id': project_id,
        'subject': 'Test issue for resolution',
        'text': {'value': 'Test issue text'},
        'fields': {},
    }
    response = test_client.post('/api/v1/issue', headers=headers, json=issue_payload)
    assert_success_response(response)
    issue_id = response.json()['payload']['id']

    # Test resolution for admin user (should have permissions)
    response = test_client.get(
        f'/api/v1/issue/{issue_id}/permissions/resolve',
        headers=headers,
    )
    assert_success_response(response)
    permissions = response.json()['payload']
    assert len(permissions) >= 3  # Admin has all permissions

    # Grant project permission
    response = test_client.post(
        f'/api/v1/project/{project_id}/permission',
        headers=headers,
        json={
            'target_type': 'user',
            'target_id': user_id,
            'role_id': role_id,
        },
    )
    assert_success_response(response)

    # Test resolution still works for admin
    response = test_client.get(
        f'/api/v1/issue/{issue_id}/permissions/resolve',
        headers=headers,
    )
    assert_success_response(response)
    permissions = response.json()['payload']
    assert len(permissions) >= 3  # Admin has all permissions
    assert ProjectPermissions.ISSUE_READ in permissions
    assert ProjectPermissions.ISSUE_UPDATE in permissions

    # Grant direct issue permission (different role)
    different_role_payload = {
        'name': 'Different Role',
        'description': 'Different permissions',
        'permissions': ['issue:delete'],
    }
    response = test_client.post(
        '/api/v1/role', headers=headers, json=different_role_payload
    )
    assert_success_response(response)
    different_role_id = response.json()['payload']['id']

    response = test_client.post(
        f'/api/v1/role/{different_role_id}/permission/issue:delete', headers=headers
    )
    assert_success_response(response)

    response = test_client.post(
        f'/api/v1/issue/{issue_id}/permission',
        headers=headers,
        json={
            'target_type': 'user',
            'target_id': user_id,
            'role_id': different_role_id,
        },
    )
    assert_success_response(response)

    # Test resolution with combined permissions for admin
    response = test_client.get(
        f'/api/v1/issue/{issue_id}/permissions/resolve',
        headers=headers,
    )
    assert_success_response(response)
    permissions = response.json()['payload']
    assert len(permissions) >= 3  # Admin has all permissions
    assert ProjectPermissions.ISSUE_READ in permissions
    assert ProjectPermissions.ISSUE_UPDATE in permissions
    assert ProjectPermissions.ISSUE_DELETE in permissions

    # Test that admin permissions are properly resolved
    response = test_client.get(
        f'/api/v1/issue/{issue_id}/permissions/resolve',
        headers=headers,
    )
    assert_success_response(response)
    permissions = response.json()['payload']
    assert len(permissions) >= 3  # Admin has all permissions
    assert ProjectPermissions.ISSUE_READ in permissions
    assert ProjectPermissions.ISSUE_UPDATE in permissions
    assert ProjectPermissions.ISSUE_DELETE in permissions


@pytest.mark.asyncio
async def test_issue_permissions_error_cases(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
) -> None:
    """Test error cases for issue permissions."""
    admin_user, admin_token = create_initial_admin
    headers = make_auth_headers(admin_token)

    project_payload = {
        'name': 'Test project',
        'slug': 'test_errors',
        'description': 'Test project for errors',
        'ai_description': 'Test project AI description',
    }
    response = test_client.post(
        '/api/v1/project', headers=headers, json=project_payload
    )
    assert_success_response(response)
    project_id = response.json()['payload']['id']

    admin_role_payload = {
        'name': 'Admin Role',
        'description': 'Can do everything',
        'permissions': ['issue:create', 'issue:read', 'issue:update', 'issue:delete'],
    }
    response = test_client.post(
        '/api/v1/role', headers=headers, json=admin_role_payload
    )
    assert_success_response(response)
    admin_role_id = response.json()['payload']['id']

    for perm in admin_role_payload['permissions']:
        response = test_client.post(
            f'/api/v1/role/{admin_role_id}/permission/{perm}', headers=headers
        )
        assert_success_response(response)

    response = test_client.post(
        f'/api/v1/project/{project_id}/permission',
        headers=headers,
        json={
            'target_type': 'user',
            'target_id': admin_user,
            'role_id': admin_role_id,
        },
    )
    assert_success_response(response)

    issue_payload = {
        'project_id': project_id,
        'subject': 'Test issue for errors',
        'text': {'value': 'Test issue text'},
        'fields': {},
    }
    response = test_client.post('/api/v1/issue', headers=headers, json=issue_payload)
    assert_success_response(response)
    issue_id = response.json()['payload']['id']

    # Test with non-existent issue
    fake_issue_id = '507f1f77bcf86cd799439011'
    response = test_client.get(
        f'/api/v1/issue/{fake_issue_id}/permissions',
        headers=headers,
    )
    assert_error_response(response, HTTPStatus.NOT_FOUND)

    # Test with non-existent user
    fake_user_id = '507f1f77bcf86cd799439012'
    response = test_client.post(
        f'/api/v1/issue/{issue_id}/permission',
        headers=headers,
        json={
            'target_type': 'user',
            'target_id': fake_user_id,
            'role_id': admin_role_id,
        },
    )
    assert_error_response(response, HTTPStatus.NOT_FOUND)

    # Test with non-existent role
    fake_role_id = '507f1f77bcf86cd799439013'
    response = test_client.post(
        f'/api/v1/issue/{issue_id}/permission',
        headers=headers,
        json={
            'target_type': 'user',
            'target_id': admin_user,
            'role_id': fake_role_id,
        },
    )
    assert_error_response(response, HTTPStatus.NOT_FOUND)

    # Test with invalid target type
    response = test_client.post(
        f'/api/v1/issue/{issue_id}/permission',
        headers=headers,
        json={
            'target_type': 'invalid',
            'target_id': admin_user,
            'role_id': admin_role_id,
        },
    )
    assert_error_response(response, HTTPStatus.UNPROCESSABLE_ENTITY)


@pytest.mark.asyncio
async def test_issue_has_custom_permissions_flag(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
) -> None:
    """Test has_custom_permissions flag in issue output."""
    admin_user, admin_token = create_initial_admin
    headers = make_auth_headers(admin_token)

    project_payload = {
        'name': 'Test project',
        'slug': 'test_flag',
        'description': 'Test project for flag',
        'ai_description': 'Test project AI description',
    }
    response = test_client.post(
        '/api/v1/project', headers=headers, json=project_payload
    )
    assert_success_response(response)
    project_id = response.json()['payload']['id']

    admin_role_payload = {
        'name': 'Admin Role',
        'description': 'Can do everything',
        'permissions': ['issue:create', 'issue:read', 'issue:update', 'issue:delete'],
    }
    response = test_client.post(
        '/api/v1/role', headers=headers, json=admin_role_payload
    )
    assert_success_response(response)
    admin_role_id = response.json()['payload']['id']

    for perm in admin_role_payload['permissions']:
        response = test_client.post(
            f'/api/v1/role/{admin_role_id}/permission/{perm}', headers=headers
        )
        assert_success_response(response)

    response = test_client.post(
        f'/api/v1/project/{project_id}/permission',
        headers=headers,
        json={
            'target_type': 'user',
            'target_id': admin_user,
            'role_id': admin_role_id,
        },
    )
    assert_success_response(response)

    issue_payload = {
        'project_id': project_id,
        'subject': 'Test issue for flag',
        'text': {'value': 'Test issue text'},
        'fields': {},
    }
    response = test_client.post('/api/v1/issue', headers=headers, json=issue_payload)
    assert_success_response(response)
    issue_id = response.json()['payload']['id']

    # Check initial state - no custom permissions
    response = test_client.get(
        f'/api/v1/issue/{issue_id}',
        headers=headers,
    )
    assert_success_response(response)
    issue_data = response.json()['payload']
    assert issue_data['has_custom_permissions'] is False
    assert issue_data['disable_project_permissions_inheritance'] is False

    # Add custom permission
    response = test_client.post(
        f'/api/v1/issue/{issue_id}/permission',
        headers=headers,
        json={
            'target_type': 'user',
            'target_id': admin_user,
            'role_id': admin_role_id,
        },
    )
    assert_success_response(response)
    permission_id = response.json()['payload']['id']

    # Check flag is now True
    response = test_client.get(
        f'/api/v1/issue/{issue_id}',
        headers=headers,
    )
    assert_success_response(response)
    issue_data = response.json()['payload']
    assert issue_data['has_custom_permissions'] is True

    # Remove custom permission
    response = test_client.delete(
        f'/api/v1/issue/{issue_id}/permission/{permission_id}',
        headers=headers,
    )
    assert_success_response(response)

    # Check flag is now False again
    response = test_client.get(
        f'/api/v1/issue/{issue_id}',
        headers=headers,
    )
    assert_success_response(response)
    issue_data = response.json()['payload']
    assert issue_data['has_custom_permissions'] is False

    # Test inheritance flag remains unchanged
    response = test_client.get(
        f'/api/v1/issue/{issue_id}',
        headers=headers,
    )
    assert_success_response(response)
    issue_data = response.json()['payload']
    assert issue_data['has_custom_permissions'] is False
    assert issue_data['disable_project_permissions_inheritance'] is False


@pytest.mark.asyncio
async def test_issue_permissions_user_update_embedded_links(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
) -> None:
    """Test that user updates also update issue permissions embedded links."""
    admin_user, admin_token = create_initial_admin
    headers = make_auth_headers(admin_token)

    project_payload = {
        'name': 'Test project',
        'slug': 'test_user_update',
        'description': 'Test project for user update',
        'ai_description': 'Test project AI description',
    }
    response = test_client.post(
        '/api/v1/project', headers=headers, json=project_payload
    )
    assert_success_response(response)
    project_id = response.json()['payload']['id']

    user_payload = {
        'name': 'Test User',
        'email': 'testuser@example.com',
        'password': 'testpassword',
        'is_active': True,
    }
    response = test_client.post('/api/v1/user', headers=headers, json=user_payload)
    assert_success_response(response)
    user_id = response.json()['payload']['id']

    role_payload = {
        'name': 'Test Role',
        'description': 'Test role description',
        'permissions': ['issue:read'],
    }
    response = test_client.post('/api/v1/role', headers=headers, json=role_payload)
    assert_success_response(response)
    role_id = response.json()['payload']['id']

    response = test_client.post(
        f'/api/v1/role/{role_id}/permission/issue:read', headers=headers
    )
    assert_success_response(response)

    admin_role_payload = {
        'name': 'Admin Role',
        'description': 'Can do everything',
        'permissions': ['issue:create', 'issue:read', 'issue:update', 'issue:delete'],
    }
    response = test_client.post(
        '/api/v1/role', headers=headers, json=admin_role_payload
    )
    assert_success_response(response)
    admin_role_id = response.json()['payload']['id']

    for perm in admin_role_payload['permissions']:
        response = test_client.post(
            f'/api/v1/role/{admin_role_id}/permission/{perm}', headers=headers
        )
        assert_success_response(response)

    response = test_client.post(
        f'/api/v1/project/{project_id}/permission',
        headers=headers,
        json={
            'target_type': 'user',
            'target_id': admin_user,
            'role_id': admin_role_id,
        },
    )
    assert_success_response(response)

    issue_payload = {
        'project_id': project_id,
        'subject': 'Test issue for user update',
        'text': {'value': 'Test issue text'},
        'fields': {},
    }
    response = test_client.post('/api/v1/issue', headers=headers, json=issue_payload)
    assert_success_response(response)
    issue_id = response.json()['payload']['id']

    # Grant issue permission to user
    response = test_client.post(
        f'/api/v1/issue/{issue_id}/permission',
        headers=headers,
        json={
            'target_type': 'user',
            'target_id': user_id,
            'role_id': role_id,
        },
    )
    assert_success_response(response)

    # List permissions to verify user is referenced
    response = test_client.get(
        f'/api/v1/issue/{issue_id}/permissions',
        headers=headers,
    )
    assert_success_response(response)
    permissions = response.json()['payload']['items']
    assert len(permissions) == 3  # 2 inherited + 1 direct
    direct_permissions = [p for p in permissions if not p['is_inherited']]
    assert len(direct_permissions) == 1, 'Should have one direct issue permission'
    assert direct_permissions[0]['target_type'] == 'user'
    assert direct_permissions[0]['target']['name'] == 'Test User'
    assert direct_permissions[0]['target']['email'] == 'testuser@example.com'

    # Update user information
    user_update_payload = {
        'name': 'Updated Test User',
        'email': 'updated.testuser@example.com',
    }
    response = test_client.put(
        f'/api/v1/user/{user_id}', headers=headers, json=user_update_payload
    )
    assert_success_response(response)

    # List permissions again to verify user info was updated
    response = test_client.get(
        f'/api/v1/issue/{issue_id}/permissions',
        headers=headers,
    )
    assert_success_response(response)
    permissions = response.json()['payload']['items']
    assert len(permissions) == 3  # 2 inherited + 1 direct
    direct_permissions = [p for p in permissions if not p['is_inherited']]
    assert len(direct_permissions) == 1, 'Should have one direct issue permission'
    assert direct_permissions[0]['target_type'] == 'user'
    assert direct_permissions[0]['target']['name'] == 'Updated Test User'
    assert direct_permissions[0]['target']['email'] == 'updated.testuser@example.com'


@pytest.mark.asyncio
async def test_issue_permissions_group_update_embedded_links(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
) -> None:
    """Test that group updates also update issue permissions embedded links."""
    admin_user, admin_token = create_initial_admin
    headers = make_auth_headers(admin_token)

    project_payload = {
        'name': 'Test project',
        'slug': 'test_group_update',
        'description': 'Test project for group update',
        'ai_description': 'Test project AI description',
    }
    response = test_client.post(
        '/api/v1/project', headers=headers, json=project_payload
    )
    assert_success_response(response)
    project_id = response.json()['payload']['id']

    group_payload = {
        'name': 'Test Group',
        'description': 'Test group description',
    }
    response = test_client.post('/api/v1/group', headers=headers, json=group_payload)
    assert_success_response(response)
    group_id = response.json()['payload']['id']

    role_payload = {
        'name': 'Test Role',
        'description': 'Test role description',
        'permissions': ['issue:read'],
    }
    response = test_client.post('/api/v1/role', headers=headers, json=role_payload)
    assert_success_response(response)
    role_id = response.json()['payload']['id']

    response = test_client.post(
        f'/api/v1/role/{role_id}/permission/issue:read', headers=headers
    )
    assert_success_response(response)

    admin_role_payload = {
        'name': 'Admin Role',
        'description': 'Can do everything',
        'permissions': ['issue:create', 'issue:read', 'issue:update', 'issue:delete'],
    }
    response = test_client.post(
        '/api/v1/role', headers=headers, json=admin_role_payload
    )
    assert_success_response(response)
    admin_role_id = response.json()['payload']['id']

    for perm in admin_role_payload['permissions']:
        response = test_client.post(
            f'/api/v1/role/{admin_role_id}/permission/{perm}', headers=headers
        )
        assert_success_response(response)

    response = test_client.post(
        f'/api/v1/project/{project_id}/permission',
        headers=headers,
        json={
            'target_type': 'user',
            'target_id': admin_user,
            'role_id': admin_role_id,
        },
    )
    assert_success_response(response)

    issue_payload = {
        'project_id': project_id,
        'subject': 'Test issue for group update',
        'text': {'value': 'Test issue text'},
        'fields': {},
    }
    response = test_client.post('/api/v1/issue', headers=headers, json=issue_payload)
    assert_success_response(response)
    issue_id = response.json()['payload']['id']

    # Grant issue permission to group
    response = test_client.post(
        f'/api/v1/issue/{issue_id}/permission',
        headers=headers,
        json={
            'target_type': 'group',
            'target_id': group_id,
            'role_id': role_id,
        },
    )
    assert_success_response(response)

    # List permissions to verify group is referenced
    response = test_client.get(
        f'/api/v1/issue/{issue_id}/permissions',
        headers=headers,
    )
    assert_success_response(response)
    permissions = response.json()['payload']['items']
    assert len(permissions) == 3  # 2 inherited + 1 direct
    direct_permissions = [p for p in permissions if not p['is_inherited']]
    assert len(direct_permissions) == 1, 'Should have one direct issue permission'
    assert direct_permissions[0]['target_type'] == 'group'
    assert direct_permissions[0]['target']['name'] == 'Test Group'
    assert direct_permissions[0]['target']['description'] == 'Test group description'

    # Update group information
    group_update_payload = {
        'name': 'Updated Test Group',
        'description': 'Updated group description',
    }
    response = test_client.put(
        f'/api/v1/group/{group_id}', headers=headers, json=group_update_payload
    )
    assert_success_response(response)

    # List permissions again to verify group info was updated
    response = test_client.get(
        f'/api/v1/issue/{issue_id}/permissions',
        headers=headers,
    )
    assert_success_response(response)
    permissions = response.json()['payload']['items']
    assert len(permissions) == 3  # 2 inherited + 1 direct
    direct_permissions = [p for p in permissions if not p['is_inherited']]
    assert len(direct_permissions) == 1, 'Should have one direct issue permission'
    assert direct_permissions[0]['target_type'] == 'group'
    assert direct_permissions[0]['target']['name'] == 'Updated Test Group'
    assert direct_permissions[0]['target']['description'] == 'Updated group description'
