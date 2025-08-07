from typing import TYPE_CHECKING

import pytest

from .helpers import (
    assert_permission_granted,
    make_user_headers,
    prepare_acl_groups,
    prepare_acl_roles,
    prepare_acl_users,
    prepare_global_roles,
)

if TYPE_CHECKING:
    from fastapi.testclient import TestClient


@pytest.mark.asyncio
async def test_complex_multi_role_permission_union(
    test_client: 'TestClient',
) -> None:
    """Test 4.1: Complex Multi-Role Permission Union

    Verify that users with overlapping roles from multiple sources (direct assignment,
    group memberships) get correct permission union with no conflicts or missing permissions
    """
    from pm.permissions import GlobalPermissions, ProjectPermissions

    # Phase 1: Preparation (Direct database operations)
    # Create global roles first
    global_roles = await prepare_global_roles(
        {
            'project_creator_role': {
                'description': 'Can create projects',
                'permissions': [GlobalPermissions.PROJECT_CREATE],
            }
        }
    )

    # Create project roles with overlapping permissions
    project_roles = await prepare_acl_roles(
        {
            'frontend_role': {
                'description': 'Frontend team permissions',
                'permissions': [
                    ProjectPermissions.PROJECT_READ,
                    ProjectPermissions.ISSUE_CREATE,
                    ProjectPermissions.ISSUE_UPDATE,
                    ProjectPermissions.COMMENT_CREATE,
                ],
            },
            'backend_role': {
                'description': 'Backend team permissions',
                'permissions': [
                    ProjectPermissions.PROJECT_READ,  # Overlaps with frontend_role
                    ProjectPermissions.ISSUE_READ,
                    ProjectPermissions.COMMENT_CREATE,  # Overlaps with frontend_role
                ],
            },
            'lead_role': {
                'description': 'Lead developer permissions',
                'permissions': [
                    ProjectPermissions.PROJECT_UPDATE,
                    ProjectPermissions.ISSUE_DELETE,
                    ProjectPermissions.COMMENT_DELETE,
                ],
            },
        }
    )

    # Create groups
    groups = await prepare_acl_groups(
        {
            'frontend_team': {
                'description': 'Frontend development team',
                'global_roles': [],
            },
            'backend_team': {
                'description': 'Backend development team',
                'global_roles': [],
            },
        }
    )

    # Create users
    users = await prepare_acl_users(
        {
            'diana': {
                'email': 'diana@example.com',
                'is_admin': False,
                'global_roles': [global_roles['project_creator_role'].id],
                'groups': [],
            },
            'alex': {
                'email': 'alex@example.com',
                'is_admin': False,
                'global_roles': [],
                'groups': [groups['frontend_team'].id, groups['backend_team'].id],
            },
        }
    )

    # Phase 2: Execution & Verification (API calls)
    diana_user, diana_token = users['diana']
    diana_headers = make_user_headers(diana_token)

    alex_user, alex_token = users['alex']
    alex_headers = make_user_headers(alex_token)

    # Setup complex role structure - Create project "Full Stack Application" with Diana
    response = test_client.post(
        '/api/v1/project/',
        headers=diana_headers,
        json={
            'name': 'Full Stack Application',
            'slug': 'full_stack_application',
            'description': 'Project for testing complex multi-role permission union',
            'is_active': True,
        },
    )
    assert_permission_granted(response, 'Diana project creation')
    project_id = response.json()['payload']['id']

    # Assign Frontend role to Frontend Team group on project
    response = test_client.post(
        f'/api/v1/project/{project_id}/permission',
        headers=diana_headers,
        json={
            'target_type': 'group',
            'target_id': str(groups['frontend_team'].id),
            'role_id': str(project_roles['frontend_role'].id),
        },
    )
    assert_permission_granted(
        response, 'Diana frontend role assignment to frontend team'
    )

    # Assign Backend role to Backend Team group on project
    response = test_client.post(
        f'/api/v1/project/{project_id}/permission',
        headers=diana_headers,
        json={
            'target_type': 'group',
            'target_id': str(groups['backend_team'].id),
            'role_id': str(project_roles['backend_role'].id),
        },
    )
    assert_permission_granted(response, 'Diana backend role assignment to backend team')

    # Assign Lead role directly to Alex on project
    response = test_client.post(
        f'/api/v1/project/{project_id}/permission',
        headers=diana_headers,
        json={
            'target_type': 'user',
            'target_id': str(alex_user.id),
            'role_id': str(project_roles['lead_role'].id),
        },
    )
    assert_permission_granted(response, 'Diana lead role assignment to Alex')

    # Test permission union computation - Get project details with Alex credentials
    response = test_client.get(f'/api/v1/project/{project_id}', headers=alex_headers)
    assert_permission_granted(
        response, 'Alex project access via multi-role permissions'
    )

    project_data = response.json()['payload']
    access_claims = set(project_data['access_claims'])

    # Verify access_claims contains expected union of permissions from all three sources:
    expected_permissions = {
        # From both frontend_team and backend_team groups (should appear only once)
        ProjectPermissions.PROJECT_READ,
        # From direct lead_role assignment
        ProjectPermissions.PROJECT_UPDATE,
        # From frontend_team group
        ProjectPermissions.ISSUE_CREATE,
        ProjectPermissions.ISSUE_UPDATE,
        # From backend_team group
        ProjectPermissions.ISSUE_READ,
        # From direct lead_role assignment
        ProjectPermissions.ISSUE_DELETE,
        # From both frontend_team and backend_team groups (should appear only once)
        ProjectPermissions.COMMENT_CREATE,
        # From direct lead_role assignment
        ProjectPermissions.COMMENT_DELETE,
    }

    # Test aggregation correctness - verify each permission appears exactly once
    # (no duplicates from multiple sources)
    access_claims_list = project_data['access_claims']
    duplicates = []
    seen_permissions = set()

    for permission in access_claims_list:
        if permission in seen_permissions:
            duplicates.append(permission)
        else:
            seen_permissions.add(permission)

    assert not duplicates, (
        f'Duplicate permissions found in access_claims: {duplicates}. '
        f'Each permission should appear exactly once despite multiple sources.'
    )

    # Test multi-source resolution - verify the permission union correctly combines
    # all three permission sources (frontend group, backend group, direct assignment)

    # Verify all expected permissions are present
    missing_permissions = expected_permissions - access_claims
    assert not missing_permissions, (
        f'Missing permissions in access_claims: {missing_permissions}. '
        f'Expected: {expected_permissions}, Got: {access_claims}'
    )

    # Verify no unexpected permissions are present (should only have expected permissions)
    unexpected_permissions = access_claims - expected_permissions
    assert not unexpected_permissions, (
        f'Unexpected permissions in access_claims: {unexpected_permissions}. '
        f'Expected: {expected_permissions}, Got: {access_claims}'
    )

    # Final verification: Ensure Alex has exactly the expected permissions
    assert access_claims == expected_permissions, (
        f'Permission union mismatch. Expected exactly: {expected_permissions}, '
        f'Got: {access_claims}'
    )
