from typing import TYPE_CHECKING

import pytest

from .helpers import (
    assert_permission_denied,
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
async def test_project_role_permission_test(
    test_client: 'TestClient',
) -> None:
    """Test 2.1: Project Role Permission Test

    Verify project role-based permissions including Project Owner comprehensive access,
    limited role restrictions, and multiple role aggregation
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

    # Create project roles
    project_roles = await prepare_acl_roles(
        {
            'designer_role': {
                'description': 'Designer permissions',
                'permissions': [
                    ProjectPermissions.PROJECT_READ,
                    ProjectPermissions.ISSUE_READ,
                    ProjectPermissions.ISSUE_CREATE,
                    ProjectPermissions.ISSUE_UPDATE,
                    ProjectPermissions.COMMENT_READ,
                    ProjectPermissions.COMMENT_CREATE,
                ],
            },
            'developer_role': {
                'description': 'Developer permissions',
                'permissions': [
                    ProjectPermissions.ISSUE_CREATE,
                    ProjectPermissions.ISSUE_UPDATE,
                    ProjectPermissions.COMMENT_CREATE,
                ],
            },
            'tester_role': {
                'description': 'Tester permissions',
                'permissions': [
                    ProjectPermissions.ISSUE_READ,
                    ProjectPermissions.COMMENT_READ,
                    ProjectPermissions.COMMENT_CREATE,
                ],
            },
        }
    )

    # Create groups
    groups = await prepare_acl_groups(
        {
            'design_team': {'description': 'Design team group', 'global_roles': []},
            'testers': {'description': 'Testers group', 'global_roles': []},
        }
    )

    # Create users with different permission scenarios
    users = await prepare_acl_users(
        {
            'admin_user': {
                'email': 'admin@example.com',
                'is_admin': True,
                'global_roles': [],
                'groups': [],
            },
            'diana': {
                'email': 'diana@example.com',
                'is_admin': False,
                'global_roles': [global_roles['project_creator_role'].id],
                'groups': [],
            },
            'bob': {
                'email': 'bob@example.com',
                'is_admin': False,
                'global_roles': [],
                'groups': [groups['design_team'].id],
            },
            'eva': {
                'email': 'eva@example.com',
                'is_admin': False,
                'global_roles': [],
                'groups': [groups['testers'].id],
            },
        }
    )

    # Phase 2: Execution & Verification (API calls)
    admin_user, admin_token = users['admin_user']
    admin_headers = make_user_headers(admin_token)

    diana_user, diana_token = users['diana']
    diana_headers = make_user_headers(diana_token)

    bob_user, bob_token = users['bob']
    bob_headers = make_user_headers(bob_token)

    eva_user, eva_token = users['eva']
    eva_headers = make_user_headers(eva_token)

    # Test Project Owner comprehensive access - Create project with Diana
    response = test_client.post(
        '/api/v1/project/',
        headers=diana_headers,
        json={
            'name': 'Mobile App Development',
            'slug': 'mobile_app_development',
            'description': 'Project for testing comprehensive Project Owner access',
            'is_active': True,
        },
    )
    assert_permission_granted(response, 'Diana project creation')
    mobile_project_id = response.json()['payload']['id']

    # Verify Diana can perform all project operations (she gets Project Owner role automatically)
    response = test_client.get(
        f'/api/v1/project/{mobile_project_id}', headers=diana_headers
    )
    assert_permission_granted(response, 'Diana project access')

    # Verify Diana can update project settings
    response = test_client.put(
        f'/api/v1/project/{mobile_project_id}',
        headers=diana_headers,
        json={'description': 'Updated description by Project Owner'},
    )
    assert_permission_granted(response, 'Diana project update')

    # Verify Diana can create issues
    response = test_client.post(
        '/api/v1/issue/',
        headers=diana_headers,
        json={
            'subject': 'Test Issue for Project Owner',
            'text': {'value': 'Testing Project Owner can create issues'},
            'project_id': mobile_project_id,
        },
    )
    assert_permission_granted(response, 'Diana issue creation')
    diana_issue_id = response.json()['payload']['id']

    # Verify Diana can create comments
    response = test_client.post(
        f'/api/v1/issue/{diana_issue_id}/comment/',
        headers=diana_headers,
        json={'text': {'value': 'Project Owner comment on issue'}},
    )
    assert_permission_granted(response, 'Diana comment creation')

    # Test limited role permissions - Create second project for role testing
    response = test_client.post(
        '/api/v1/project/',
        headers=diana_headers,
        json={
            'name': 'Website Redesign',
            'slug': 'website_redesign',
            'description': 'Project for testing limited role permissions',
            'is_active': True,
        },
    )
    assert_permission_granted(response, 'Diana second project creation')
    website_project_id = response.json()['payload']['id']

    # Assign Designer role to Design Team group on Website Redesign project
    response = test_client.post(
        f'/api/v1/project/{website_project_id}/permission',
        headers=diana_headers,
        json={
            'target_type': 'group',
            'target_id': str(groups['design_team'].id),
            'role_id': str(project_roles['designer_role'].id),
        },
    )
    assert_permission_granted(response, 'Diana designer role assignment to design team')

    # Verify Bob can read project through designer role
    response = test_client.get(
        f'/api/v1/project/{website_project_id}', headers=bob_headers
    )
    assert_permission_granted(response, 'Bob project read via designer role')

    # Verify Bob can create issues (designer role has ISSUE_CREATE)
    response = test_client.post(
        '/api/v1/issue/',
        headers=bob_headers,
        json={
            'subject': 'Designer Issue',
            'text': {'value': 'Issue created by designer role'},
            'project_id': website_project_id,
        },
    )
    assert_permission_granted(response, 'Bob issue creation via designer role')
    bob_issue_id = response.json()['payload']['id']

    # Verify Bob can update issues (designer role has ISSUE_UPDATE)
    response = test_client.put(
        f'/api/v1/issue/{bob_issue_id}',
        headers=bob_headers,
        json={
            'subject': 'Updated Designer Issue',
            'text': {'value': 'Updated issue text by designer'},
        },
    )
    assert_permission_granted(response, 'Bob issue update via designer role')

    # Verify Bob can create comments (designer role has COMMENT_CREATE)
    response = test_client.post(
        f'/api/v1/issue/{bob_issue_id}/comment/',
        headers=bob_headers,
        json={'text': {'value': 'Comment from designer'}},
    )
    assert_permission_granted(response, 'Bob comment creation via designer role')

    # Verify Bob cannot update project settings (designer role lacks PROJECT_UPDATE)
    response = test_client.put(
        f'/api/v1/project/{website_project_id}',
        headers=bob_headers,
        json={'description': 'Bob trying to update project settings'},
    )
    assert_permission_denied(response, 'Bob project update (should fail)')

    # Test multiple role aggregation - Assign Developer role directly to Eva
    response = test_client.post(
        f'/api/v1/project/{website_project_id}/permission',
        headers=diana_headers,
        json={
            'target_type': 'user',
            'target_id': str(eva_user.id),
            'role_id': str(project_roles['developer_role'].id),
        },
    )
    assert_permission_granted(response, 'Diana developer role assignment to Eva')

    # Assign Tester role to Testers group on Website Redesign project
    response = test_client.post(
        f'/api/v1/project/{website_project_id}/permission',
        headers=diana_headers,
        json={
            'target_type': 'group',
            'target_id': str(groups['testers'].id),
            'role_id': str(project_roles['tester_role'].id),
        },
    )
    assert_permission_granted(response, 'Diana tester role assignment to testers group')

    # Verify Eva can create issues via developer role
    # Note: Eva has both "Developer" role (ISSUE_CREATE, ISSUE_UPDATE) and "Tester" role (ISSUE_READ)
    # Issue creation requires both ISSUE_CREATE and ISSUE_READ permissions - combination provides both
    response = test_client.post(
        '/api/v1/issue/',
        headers=eva_headers,
        json={
            'subject': 'Developer Issue by Eva',
            'text': {'value': 'Issue created by Eva with developer permissions'},
            'project_id': website_project_id,
        },
    )
    assert_permission_granted(response, 'Eva issue creation via developer role')
    eva_issue_id = response.json()['payload']['id']

    # Verify Eva can update issues via developer role
    # Note: Issue updates require both ISSUE_UPDATE and ISSUE_READ permissions - combination provides both
    response = test_client.put(
        f'/api/v1/issue/{eva_issue_id}',
        headers=eva_headers,
        json={
            'subject': 'Updated Developer Issue by Eva',
            'text': {'value': 'Updated issue text by Eva'},
        },
    )
    assert_permission_granted(response, 'Eva issue update via developer role')

    # Verify Eva can read issues (tester role permissions from group)
    response = test_client.get(f'/api/v1/issue/{bob_issue_id}', headers=eva_headers)
    assert_permission_granted(response, 'Eva issue read via tester role')

    # Verify Eva can create comments (available in both developer and tester roles)
    response = test_client.post(
        f'/api/v1/issue/{eva_issue_id}/comment/',
        headers=eva_headers,
        json={'text': {'value': 'Comment from Eva with multiple roles'}},
    )
    assert_permission_granted(response, 'Eva comment creation via multiple roles')

    # Test admin override for project-level operations (but NOT content-level)

    # Verify admin can read any project without permissions
    response = test_client.get(
        f'/api/v1/project/{mobile_project_id}', headers=admin_headers
    )
    assert_permission_granted(response, 'Admin project read override')

    response = test_client.get(
        f'/api/v1/project/{website_project_id}', headers=admin_headers
    )
    assert_permission_granted(response, 'Admin project read override')

    # Verify admin can update project settings without permissions
    response = test_client.put(
        f'/api/v1/project/{website_project_id}',
        headers=admin_headers,
        json={'description': 'Updated by admin override'},
    )
    assert_permission_granted(response, 'Admin project settings update override')

    # Verify admin can manage project permissions without permissions
    response = test_client.post(
        f'/api/v1/project/{mobile_project_id}/permission',
        headers=admin_headers,
        json={
            'target_type': 'user',
            'target_id': str(bob_user.id),
            'role_id': str(project_roles['tester_role'].id),
        },
    )
    assert_permission_granted(response, 'Admin permission management override')

    # Verify admin CANNOT create issues without explicit permissions (content-level restriction)
    response = test_client.post(
        '/api/v1/issue/',
        headers=admin_headers,
        json={
            'subject': 'Admin trying to create issue',
            'text': {
                'value': 'Admin should not be able to create issues without permissions'
            },
            'project_id': website_project_id,
        },
    )
    assert_permission_denied(response, 'Admin issue creation (should be denied)')

    # Verify admin CANNOT create comments without explicit permissions (content-level restriction)
    response = test_client.post(
        f'/api/v1/issue/{eva_issue_id}/comment/',
        headers=admin_headers,
        json={
            'text': {'value': 'Admin should not be able to comment without permissions'}
        },
    )
    assert_permission_denied(response, 'Admin comment creation (should be denied)')

    # Verify admin CANNOT read issues (issue list should be empty due to ACL filtering)
    response = test_client.get('/api/v1/issue/list', headers=admin_headers)
    assert_permission_granted(response, 'Admin issue list access (endpoint accessible)')

    # Admin should see no issues due to content-level ACL filtering
    visible_issues = response.json()['payload']['items']
    assert len(visible_issues) == 0, (
        f'Admin should see 0 issues but saw {len(visible_issues)} - content access requires explicit permissions'
    )
