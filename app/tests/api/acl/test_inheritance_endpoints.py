"""
Tests for dedicated permission inheritance management endpoints
"""

from typing import TYPE_CHECKING

import pytest

from .helpers import (
    assert_conflict,
    assert_permission_denied,
    assert_permission_granted,
    make_user_headers,
    prepare_acl_roles,
    prepare_acl_users,
    prepare_global_roles,
)

if TYPE_CHECKING:
    from fastapi.testclient import TestClient


@pytest.mark.asyncio
async def test_inheritance_management_workflow(
    test_client: 'TestClient',
) -> None:
    """Test complete workflow of inheritance management with dedicated endpoints"""
    from pm.permissions import GlobalPermissions, ProjectPermissions

    # Create roles and users
    global_roles = await prepare_global_roles(
        {
            'project_creator_role': {
                'description': 'Can create projects',
                'permissions': [GlobalPermissions.PROJECT_CREATE],
            }
        }
    )

    project_roles = await prepare_acl_roles(
        {
            'manager_role': {
                'description': 'Issue manager role',
                'permissions': [
                    ProjectPermissions.ISSUE_READ,
                    ProjectPermissions.ISSUE_UPDATE,
                    ProjectPermissions.ISSUE_MANAGE_PERMISSIONS,
                ],
            }
        }
    )

    users = await prepare_acl_users(
        {
            'project_owner': {
                'email': 'owner@example.com',
                'is_admin': False,
                'global_roles': [global_roles['project_creator_role'].id],
                'groups': [],
            },
            'regular_user': {
                'email': 'user@example.com',
                'is_admin': False,
                'global_roles': [],
                'groups': [],
            },
        }
    )

    owner_user, owner_token = users['project_owner']
    owner_headers = make_user_headers(owner_token)

    regular_user, regular_token = users['regular_user']
    regular_headers = make_user_headers(regular_token)

    # Create project
    response = test_client.post(
        '/api/v1/project/',
        headers=owner_headers,
        json={
            'name': 'Test Project',
            'slug': 'test_project',
            'description': 'Test project for inheritance management',
            'is_active': True,
        },
    )
    assert_permission_granted(response, 'Project creation')
    project_id = response.json()['payload']['id']

    # Assign manager role to regular user on project
    response = test_client.post(
        f'/api/v1/project/{project_id}/permission',
        headers=owner_headers,
        json={
            'target_type': 'user',
            'target_id': str(regular_user.id),
            'role_id': str(project_roles['manager_role'].id),
        },
    )
    assert_permission_granted(response, 'Assign manager role to regular user')

    # Create issue for duplicate permission detection test
    response = test_client.post(
        '/api/v1/issue/',
        headers=owner_headers,
        json={
            'subject': 'Test Issue for Duplicate Detection',
            'text': {'value': 'Test issue for duplicate permission detection'},
            'project_id': project_id,
        },
    )
    assert_permission_granted(response, 'Create test issue for duplicate detection')
    test_issue_id = response.json()['payload']['id']

    # Assign regular_user a direct permission on the issue first
    response = test_client.post(
        f'/api/v1/issue/{test_issue_id}/permission',
        headers=owner_headers,
        json={
            'target_type': 'user',
            'target_id': str(regular_user.id),
            'role_id': str(project_roles['manager_role'].id),
        },
    )
    assert_permission_granted(
        response, 'Assign direct issue permission for duplicate test'
    )

    # Test duplicate permission detection: copy project permissions when user already has direct permission
    response = test_client.post(
        f'/api/v1/issue/{test_issue_id}/permissions/copy-from-project',
        headers=owner_headers,
        json={},
    )
    assert_permission_granted(
        response, 'Copy project permissions (duplicate detection test)'
    )

    # Verify no duplicate permissions were created - get issue permissions
    response = test_client.get(
        f'/api/v1/issue/{test_issue_id}/permissions', headers=owner_headers
    )
    assert_permission_granted(response, 'Get issue permissions')
    issue_permissions = response.json()['payload']['items']

    # Count permissions for regular_user - should not have duplicates after copy operation
    regular_user_issue_permissions = [
        p
        for p in issue_permissions
        if p['target_type'] == 'user' and p['target']['id'] == str(regular_user.id)
    ]
    # Should have exactly 1 permission (no duplicates created by copy operation)
    assert len(regular_user_issue_permissions) == 1, (
        f'Should have exactly 1 issue permission for regular_user after copy, got {len(regular_user_issue_permissions)}'
    )

    # Create issue
    response = test_client.post(
        '/api/v1/issue/',
        headers=owner_headers,
        json={
            'subject': 'Test Issue',
            'text': {'value': 'Test issue for inheritance management'},
            'project_id': project_id,
        },
    )
    assert_permission_granted(response, 'Issue creation')
    issue_id = response.json()['payload']['id']

    # Verify regular user can access issue via project permissions (inheritance enabled)
    response = test_client.get(f'/api/v1/issue/{issue_id}', headers=regular_headers)
    assert_permission_granted(
        response, 'Regular user can access issue via project permissions'
    )

    # Test 1: Try to disable inheritance directly (should fail - owner would lose permissions)
    response = test_client.post(
        f'/api/v1/issue/{issue_id}/permissions/disable-inheritance',
        headers=owner_headers,
        json={},
    )
    assert_conflict(
        response, 'Owner cannot disable inheritance without direct permissions'
    )

    # Test 1b: Copy project permissions first, then disable inheritance
    response = test_client.post(
        f'/api/v1/issue/{issue_id}/permissions/copy-from-project',
        headers=owner_headers,
        json={},
    )
    assert_permission_granted(response, 'Copy project permissions to issue first')

    # Now disable inheritance (should work)
    response = test_client.post(
        f'/api/v1/issue/{issue_id}/permissions/disable-inheritance',
        headers=owner_headers,
        json={},
    )
    assert_permission_granted(
        response, 'Owner can disable inheritance after copying permissions'
    )

    # Test 2: Verify inheritance is now disabled
    response = test_client.get(f'/api/v1/issue/{issue_id}', headers=owner_headers)
    assert_permission_granted(response, 'Owner can still read issue')
    issue_data = response.json()['payload']
    assert issue_data['disable_project_permissions_inheritance'] is True, (
        'Inheritance should be disabled'
    )

    # Test 3: Regular user should still have access via copied permissions
    # (We copied permissions before disabling inheritance, so user has direct permissions now)
    response = test_client.get(f'/api/v1/issue/{issue_id}', headers=regular_headers)
    assert_permission_granted(
        response, 'Regular user can access issue via copied permissions'
    )

    # Test 6: Re-enable inheritance
    response = test_client.post(
        f'/api/v1/issue/{issue_id}/permissions/enable-inheritance',
        headers=owner_headers,
        json={},
    )
    assert_permission_granted(response, 'Re-enable inheritance')

    # Test 7: Verify inheritance is now enabled
    response = test_client.get(f'/api/v1/issue/{issue_id}', headers=owner_headers)
    assert_permission_granted(response, 'Owner can still read issue')
    issue_data = response.json()['payload']
    assert issue_data['disable_project_permissions_inheritance'] is False, (
        'Inheritance should be enabled'
    )


@pytest.mark.asyncio
async def test_inheritance_safety_validation(
    test_client: 'TestClient',
) -> None:
    """Test that disabling inheritance prevents self-lockout"""
    from pm.permissions import GlobalPermissions, ProjectPermissions

    # Create basic setup without management permissions for the user
    global_roles = await prepare_global_roles(
        {
            'project_creator_role': {
                'description': 'Can create projects',
                'permissions': [GlobalPermissions.PROJECT_CREATE],
            }
        }
    )

    project_roles = await prepare_acl_roles(
        {
            'reader_role': {
                'description': 'Basic reader',
                'permissions': [
                    ProjectPermissions.ISSUE_READ,  # No management permissions
                ],
            }
        }
    )

    users = await prepare_acl_users(
        {
            'project_owner': {
                'email': 'owner@example.com',
                'is_admin': False,
                'global_roles': [global_roles['project_creator_role'].id],
                'groups': [],
            },
            'reader': {
                'email': 'reader@example.com',
                'is_admin': False,
                'global_roles': [],
                'groups': [],
            },
        }
    )

    owner_user, owner_token = users['project_owner']
    owner_headers = make_user_headers(owner_token)

    reader_user, reader_token = users['reader']
    reader_headers = make_user_headers(reader_token)

    # Create project and issue
    response = test_client.post(
        '/api/v1/project/',
        headers=owner_headers,
        json={
            'name': 'Test Project',
            'slug': 'test_project_safety',
            'description': 'Test project for safety validation',
            'is_active': True,
        },
    )
    assert_permission_granted(response, 'Project creation')
    project_id = response.json()['payload']['id']

    # Assign only reader role to user (no management permissions)
    response = test_client.post(
        f'/api/v1/project/{project_id}/permission',
        headers=owner_headers,
        json={
            'target_type': 'user',
            'target_id': str(reader_user.id),
            'role_id': str(project_roles['reader_role'].id),
        },
    )
    assert_permission_granted(response, 'Assign reader role')

    response = test_client.post(
        '/api/v1/issue/',
        headers=owner_headers,
        json={
            'subject': 'Test Issue',
            'text': {'value': 'Test issue for safety validation'},
            'project_id': project_id,
        },
    )
    assert_permission_granted(response, 'Issue creation')
    issue_id = response.json()['payload']['id']

    # Test: Reader should NOT be able to disable inheritance (lacks ISSUE_MANAGE_PERMISSIONS)
    response = test_client.post(
        f'/api/v1/issue/{issue_id}/permissions/disable-inheritance',
        headers=reader_headers,
        json={},
    )
    assert_permission_denied(
        response, 'Reader cannot disable inheritance (lacks management permissions)'
    )


@pytest.mark.asyncio
async def test_permission_deletion_lockout_protection(
    test_client: 'TestClient',
) -> None:
    """Test that users cannot delete their last management permission on an issue"""
    from pm.permissions import GlobalPermissions, ProjectPermissions

    # Create basic setup
    global_roles = await prepare_global_roles(
        {
            'project_creator_role': {
                'description': 'Can create projects',
                'permissions': [GlobalPermissions.PROJECT_CREATE],
            }
        }
    )

    project_roles = await prepare_acl_roles(
        {
            'manager_role': {
                'description': 'Issue manager role',
                'permissions': [
                    ProjectPermissions.ISSUE_READ,
                    ProjectPermissions.ISSUE_UPDATE,
                    ProjectPermissions.ISSUE_MANAGE_PERMISSIONS,
                ],
            },
            'reader_role': {
                'description': 'Basic reader',
                'permissions': [
                    ProjectPermissions.ISSUE_READ,
                ],
            },
        }
    )

    users = await prepare_acl_users(
        {
            'project_owner': {
                'email': 'owner@example.com',
                'is_admin': False,
                'global_roles': [global_roles['project_creator_role'].id],
                'groups': [],
            }
        }
    )

    owner_user, owner_token = users['project_owner']
    owner_headers = make_user_headers(owner_token)

    # Create project and issue
    response = test_client.post(
        '/api/v1/project/',
        headers=owner_headers,
        json={
            'name': 'Test Project',
            'slug': 'test_project_lockout',
            'description': 'Test project for lockout protection',
            'is_active': True,
        },
    )
    assert_permission_granted(response, 'Project creation')
    project_id = response.json()['payload']['id']

    response = test_client.post(
        '/api/v1/issue/',
        headers=owner_headers,
        json={
            'subject': 'Test Issue',
            'text': {'value': 'Test issue for lockout protection'},
            'project_id': project_id,
        },
    )
    assert_permission_granted(response, 'Issue creation')
    issue_id = response.json()['payload']['id']

    # Test inheritance enabled lockout protection: try to delete project permission while inheritance is enabled
    # Get current project permissions first
    response = test_client.get(
        f'/api/v1/project/{project_id}/permissions', headers=owner_headers
    )
    assert_permission_granted(response, 'Get project permissions')
    project_permissions = response.json()['payload']['items']

    # Find owner's project permission (Project Owner role)
    owner_project_permissions = [
        p
        for p in project_permissions
        if p['target_type'] == 'user' and p['target']['id'] == str(owner_user.id)
    ]
    assert len(owner_project_permissions) > 0, 'Owner should have project permissions'
    project_permission_id = owner_project_permissions[0]['id']

    # Try to delete project permission while inheritance is enabled
    # Note: This should succeed because project permission deletion doesn't have the same lockout protection
    # as issue permission deletion. Project owners can delete their own project permissions.
    response = test_client.delete(
        f'/api/v1/project/{project_id}/permission/{project_permission_id}',
        headers=owner_headers,
    )
    assert_permission_granted(
        response,
        'Project permission deletion should succeed (project-level operations allowed)',
    )

    # Restore the project permission for the rest of the test
    response = test_client.post(
        f'/api/v1/project/{project_id}/permission',
        headers=owner_headers,
        json={
            'target_type': 'user',
            'target_id': str(owner_user.id),
            'role_id': str(owner_project_permissions[0]['role']['id']),
        },
    )
    assert_permission_granted(
        response, 'Restore project permission for test continuation'
    )

    # Copy project permissions first, then disable inheritance (owner has project-level management permissions)
    response = test_client.post(
        f'/api/v1/issue/{issue_id}/permissions/copy-from-project',
        headers=owner_headers,
        json={},
    )
    assert_permission_granted(response, 'Copy project permissions')

    response = test_client.post(
        f'/api/v1/issue/{issue_id}/permissions/disable-inheritance',
        headers=owner_headers,
        json={},
    )
    assert_permission_granted(response, 'Disable inheritance')

    # Get the management permission that was copied from the project
    response = test_client.get(
        f'/api/v1/issue/{issue_id}/permissions', headers=owner_headers
    )
    assert_permission_granted(response, 'Get issue permissions')
    permissions = response.json()['payload']['items']

    # The copy-from-project should have copied the Project Owner role with management permissions
    # Find the copied permission (should be Project Owner role with management permissions)
    copied_permissions = [
        p
        for p in permissions
        if p['target_type'] == 'user' and p['target']['id'] == str(owner_user.id)
    ]
    assert len(copied_permissions) > 0, 'Should have copied project permissions'
    copied_permission_id = copied_permissions[0]['id']

    # Give owner additional reader permission to ensure it's not the only permission
    response = test_client.post(
        f'/api/v1/issue/{issue_id}/permission',
        headers=owner_headers,
        json={
            'target_type': 'user',
            'target_id': str(owner_user.id),
            'role_id': str(project_roles['reader_role'].id),
        },
    )
    assert_permission_granted(response, 'Grant additional reader permission')
    reader_permission_id = response.json()['payload']['id']

    # Try to delete the copied management permission (should fail - would cause lockout)
    response = test_client.delete(
        f'/api/v1/issue/{issue_id}/permission/{copied_permission_id}',
        headers=owner_headers,
    )
    assert_permission_denied(response, 'Cannot delete last management permission')

    # Verify the reader permission can be deleted (doesn't affect management)
    response = test_client.delete(
        f'/api/v1/issue/{issue_id}/permission/{reader_permission_id}',
        headers=owner_headers,
    )
    assert_permission_granted(response, 'Can delete non-management permission')

    # Add another management permission first
    response = test_client.post(
        f'/api/v1/issue/{issue_id}/permission',
        headers=owner_headers,
        json={
            'target_type': 'user',
            'target_id': str(owner_user.id),
            'role_id': str(project_roles['manager_role'].id),
        },
    )
    assert_permission_granted(response, 'Add second management permission')

    # Now should be able to delete the original management permission
    response = test_client.delete(
        f'/api/v1/issue/{issue_id}/permission/{copied_permission_id}',
        headers=owner_headers,
    )
    assert_permission_granted(
        response, 'Can delete management permission when another exists'
    )


@pytest.mark.asyncio
async def test_admin_lockout_protection(
    test_client: 'TestClient',
) -> None:
    """Test that even administrators are protected from lockout (consistent UX)"""
    from pm.permissions import ProjectPermissions

    # Create roles
    project_roles = await prepare_acl_roles(
        {
            'manager_role': {
                'description': 'Issue manager role',
                'permissions': [
                    ProjectPermissions.ISSUE_READ,
                    ProjectPermissions.ISSUE_UPDATE,
                    ProjectPermissions.ISSUE_MANAGE_PERMISSIONS,
                ],
            }
        }
    )

    users = await prepare_acl_users(
        {
            'admin_user': {
                'email': 'admin@example.com',
                'is_admin': True,  # This user is an admin
                'global_roles': [],
                'groups': [],
            }
        }
    )

    admin_user, admin_token = users['admin_user']
    admin_headers = make_user_headers(admin_token)

    # Create project and issue as admin
    response = test_client.post(
        '/api/v1/project/',
        headers=admin_headers,
        json={
            'name': 'Admin Test Project',
            'slug': 'admin_test_project',
            'description': 'Test project for admin lockout protection',
            'is_active': True,
        },
    )
    assert_permission_granted(response, 'Admin project creation')
    project_id = response.json()['payload']['id']

    response = test_client.post(
        '/api/v1/issue/',
        headers=admin_headers,
        json={
            'subject': 'Admin Test Issue',
            'text': {'value': 'Test issue for admin lockout protection'},
            'project_id': project_id,
        },
    )
    assert_permission_granted(response, 'Admin issue creation')
    issue_id = response.json()['payload']['id']

    # Disable inheritance first (admin loses project management permissions)
    response = test_client.post(
        f'/api/v1/issue/{issue_id}/permissions/copy-from-project',
        headers=admin_headers,
        json={},
    )
    assert_permission_granted(response, 'Admin copy project permissions')

    response = test_client.post(
        f'/api/v1/issue/{issue_id}/permissions/disable-inheritance',
        headers=admin_headers,
        json={},
    )
    assert_permission_granted(response, 'Admin disable inheritance')

    # Get admin's copied permission
    response = test_client.get(
        f'/api/v1/issue/{issue_id}/permissions', headers=admin_headers
    )
    assert_permission_granted(response, 'Admin get issue permissions')
    permissions = response.json()['payload']['items']

    admin_permissions = [
        p
        for p in permissions
        if p['target_type'] == 'user' and p['target']['id'] == str(admin_user.id)
    ]
    assert len(admin_permissions) > 0, 'Admin should have copied permissions'
    admin_permission_id = admin_permissions[0]['id']

    # Even admins should not be able to delete their last management permission
    response = test_client.delete(
        f'/api/v1/issue/{issue_id}/permission/{admin_permission_id}',
        headers=admin_headers,
    )
    assert_permission_denied(
        response, 'Even admins cannot delete their last management permission'
    )

    # Add another permission for the admin
    response = test_client.post(
        f'/api/v1/issue/{issue_id}/permission',
        headers=admin_headers,
        json={
            'target_type': 'user',
            'target_id': str(admin_user.id),
            'role_id': str(project_roles['manager_role'].id),
        },
    )
    assert_permission_granted(response, 'Admin add second management permission')

    # Now admin should be able to delete the original permission
    response = test_client.delete(
        f'/api/v1/issue/{issue_id}/permission/{admin_permission_id}',
        headers=admin_headers,
    )
    assert_permission_granted(
        response, 'Admin can delete management permission when backup exists'
    )
