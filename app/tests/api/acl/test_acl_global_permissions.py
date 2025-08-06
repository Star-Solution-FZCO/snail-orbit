from typing import TYPE_CHECKING

import pytest

from .helpers import (
    assert_permission_denied,
    assert_permission_granted,
    assign_global_role_to_group_via_api,
    create_group_via_api,
    make_user_headers,
    prepare_acl_users,
)

if TYPE_CHECKING:
    from fastapi.testclient import TestClient


@pytest.mark.asyncio
async def test_admin_global_operations_override(
    test_client: 'TestClient',
) -> None:
    """Test 1.1: Admin Global Operations Override

    Verify that system administrators can perform all global operations
    (user management, role management, system configuration) regardless
    of assigned global roles
    """

    # Phase 1: Preparation (Direct database operations)
    # Create users (no roles or groups needed for this test)
    users = await prepare_acl_users(
        {
            'admin_user': {
                'email': 'admin@example.com',
                'is_admin': True,  # System administrator
                'global_roles': [],  # No global roles assigned
                'groups': [],  # No groups
            },
            'test_user': {
                'email': 'testuser@example.com',
                'is_admin': False,
                'global_roles': [],
                'groups': [],
            },
        }
    )

    # Phase 2: Execution & Verification (API calls)
    admin_user, admin_token = users['admin_user']
    admin_headers = make_user_headers(admin_token)

    # Test user management - Create new user with admin credentials
    response = test_client.post(
        '/api/v1/user/',
        headers=admin_headers,
        json={
            'name': 'Test User 2',
            'email': 'testuser2@example.com',
            'password': 'testpassword123',
            'is_active': True,
        },
    )
    assert_permission_granted(response, 'Admin user creation')
    new_user_id = response.json()['payload']['id']

    # Verify user creation succeeded
    response = test_client.get(f'/api/v1/user/{new_user_id}', headers=admin_headers)
    assert_permission_granted(response, 'Admin user retrieval')
    assert response.json()['payload']['name'] == 'Test User 2'

    # Test user update with admin credentials
    response = test_client.put(
        f'/api/v1/user/{new_user_id}',
        headers=admin_headers,
        json={'name': 'Test User 2 Updated'},
    )
    assert_permission_granted(response, 'Admin user update')
    assert response.json()['payload']['name'] == 'Test User 2 Updated'

    # TODO: Test user deletion with admin credentials - no DELETE /api/v1/user/{user_id} endpoint available
    # When the endpoint is implemented, test that admin can delete users regardless of global role assignments

    # Test role management - Create new project role with admin credentials
    response = test_client.post(
        '/api/v1/role/',
        headers=admin_headers,
        json={
            'name': 'Test Project Role',
            'description': 'Test role for admin override verification',
            'permissions': ['project:read', 'issue:create'],
        },
    )
    assert_permission_granted(response, 'Admin role creation')
    role_id = response.json()['payload']['id']

    # Verify role creation succeeded
    response = test_client.get(f'/api/v1/role/{role_id}', headers=admin_headers)
    assert_permission_granted(response, 'Admin role retrieval')
    assert response.json()['payload']['name'] == 'Test Project Role'

    # Test group management - Create new group with admin credentials
    response = test_client.post(
        '/api/v1/group/',
        headers=admin_headers,
        json={'name': 'Test Group', 'description': 'Test group for admin override'},
    )
    assert_permission_granted(response, 'Admin group creation')
    group_id = response.json()['payload']['id']

    # Verify group creation succeeded
    response = test_client.get(f'/api/v1/group/{group_id}', headers=admin_headers)
    assert_permission_granted(response, 'Admin group retrieval')
    assert response.json()['payload']['name'] == 'Test Group'

    # Add user to group with admin credentials
    test_user, _ = users['test_user']
    response = test_client.post(
        f'/api/v1/group/{group_id}/members/{test_user.id}', headers=admin_headers
    )
    assert_permission_granted(response, 'Admin group member addition')

    # Test workflow management - Create new workflow script with admin credentials
    response = test_client.post(
        '/api/v1/workflow/',
        headers=admin_headers,
        json={
            'name': 'Test Workflow Script',
            'description': 'Test workflow for admin override verification',
            'type': 'on_change',
            'script': 'print("Test workflow executed")',
        },
    )
    assert_permission_granted(response, 'Admin workflow creation')
    workflow_id = response.json()['payload']['id']

    # Verify workflow creation succeeded
    response = test_client.get(f'/api/v1/workflow/{workflow_id}', headers=admin_headers)
    assert_permission_granted(response, 'Admin workflow retrieval')
    assert response.json()['payload']['name'] == 'Test Workflow Script'

    # Verify all admin-only operations succeeded despite no explicit global role assignments
    # Admin override should allow all operations regardless of role-based permissions


@pytest.mark.asyncio
async def test_project_create_permission(
    test_client: 'TestClient',
) -> None:
    """Test 1.2: PROJECT_CREATE Permission Test

    Verify PROJECT_CREATE global permission functionality including direct role assignment,
    group inheritance, admin override, and permission validation
    """
    # Phase 1: Preparation (Direct database operations)
    # Create global role with PROJECT_CREATE permission
    import pm.models as m
    from pm.permissions import GlobalPermissions

    project_creator_role = m.GlobalRole(
        name='project_creator_role',
        description='Can create projects',
        permissions=[GlobalPermissions.PROJECT_CREATE],
    )
    await project_creator_role.save()

    # Create admin user to use for API operations
    temp_users = await prepare_acl_users(
        {
            'temp_admin': {
                'email': 'temp_admin@example.com',
                'is_admin': True,
                'global_roles': [],
                'groups': [],
            }
        }
    )
    temp_admin_user, temp_admin_token = temp_users['temp_admin']
    admin_headers = make_user_headers(temp_admin_token)

    # Create group via API and assign global role
    project_managers_group_id = await create_group_via_api(
        test_client, admin_headers, 'project_managers', 'Project managers group'
    )
    await assign_global_role_to_group_via_api(
        test_client,
        admin_headers,
        project_managers_group_id,
        str(project_creator_role.id),
    )

    # Create users with different permission scenarios
    users = await prepare_acl_users(
        {
            'admin_user': {
                'email': 'admin@example.com',
                'is_admin': True,  # Admin override
                'global_roles': [],  # No global roles
                'groups': [],  # No groups
            },
            'alice': {
                'email': 'alice@example.com',
                'is_admin': False,
                'global_roles': [project_creator_role.id],  # Direct role assignment
                'groups': [],
            },
            'bob': {
                'email': 'bob@example.com',
                'is_admin': False,
                'global_roles': [],  # No permissions
                'groups': [],
            },
            'charlie': {
                'email': 'charlie@example.com',
                'is_admin': False,
                'global_roles': [],  # No direct roles
                'groups': [project_managers_group_id],  # Group inheritance
            },
        }
    )

    # Phase 2: Execution & Verification (API calls)
    admin_user, admin_token = users['admin_user']
    admin_headers = make_user_headers(admin_token)

    alice_user, alice_token = users['alice']
    alice_headers = make_user_headers(alice_token)

    bob_user, bob_token = users['bob']
    bob_headers = make_user_headers(bob_token)

    charlie_user, charlie_token = users['charlie']
    charlie_headers = make_user_headers(charlie_token)

    # Test direct global role assignment - Alice can create project
    response = test_client.post(
        '/api/v1/project/',
        headers=alice_headers,
        json={
            'name': 'Website Redesign',
            'slug': 'website_redesign',
            'description': 'Project created by Alice with direct role assignment',
            'is_active': True,
        },
    )
    assert_permission_granted(response, 'Alice project creation')
    alice_project_id = response.json()['payload']['id']

    # Verify Alice can access and manage the new project
    response = test_client.get(
        f'/api/v1/project/{alice_project_id}', headers=alice_headers
    )
    assert_permission_granted(response, 'Alice project access')
    assert response.json()['payload']['name'] == 'Website Redesign'

    # Test absence of permissions - Bob cannot create project
    response = test_client.post(
        '/api/v1/project/',
        headers=bob_headers,
        json={
            'name': 'Unauthorized Project',
            'slug': 'unauthorized_project',
            'description': 'This should fail',
            'is_active': True,
        },
    )
    assert_permission_denied(response, 'Bob project creation')

    # Test admin override for project creation
    response = test_client.post(
        '/api/v1/project/',
        headers=admin_headers,
        json={
            'name': 'Admin Project',
            'slug': 'admin_project',
            'description': 'Project created by admin override',
            'is_active': True,
        },
    )
    assert_permission_granted(
        response, 'Admin project creation (override)'
    )  # Succeeds despite no PROJECT_CREATE permission

    # Test group inheritance - Charlie can create project through group membership
    response = test_client.post(
        '/api/v1/project/',
        headers=charlie_headers,
        json={
            'name': 'Group Permission Test',
            'slug': 'group_permission_test',
            'description': 'Project created via group permission inheritance',
            'is_active': True,
        },
    )
    assert_permission_granted(
        response, 'Charlie project creation via group inheritance'
    )
    charlie_project_id = response.json()['payload']['id']

    # Verify Charlie can access the project he created via group permissions
    response = test_client.get(
        f'/api/v1/project/{charlie_project_id}', headers=charlie_headers
    )
    assert_permission_granted(response, 'Charlie project access via group inheritance')
    assert response.json()['payload']['name'] == 'Group Permission Test'
