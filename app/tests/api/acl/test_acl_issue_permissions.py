from typing import TYPE_CHECKING
from unittest import mock

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
async def test_issue_permission_system_comprehensive(
    test_client: 'TestClient',
) -> None:
    """Test 3.1: Issue Permission System Comprehensive Test

    Verify complete issue permission system including inheritance, confidential access
    with disabled inheritance, and external stakeholder access patterns
    """
    from pm.permissions import GlobalPermissions, ProjectPermissions

    # Phase 1: Preparation (Direct database operations)
    # Create global roles
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
            'developer_role': {
                'description': 'Developer permissions for projects',
                'permissions': [
                    ProjectPermissions.PROJECT_READ,
                    ProjectPermissions.ISSUE_READ,
                    ProjectPermissions.ISSUE_UPDATE,
                    ProjectPermissions.COMMENT_READ,
                    ProjectPermissions.COMMENT_CREATE,
                ],
            },
            'reader_role': {
                'description': 'Basic reader permissions',
                'permissions': [
                    ProjectPermissions.PROJECT_READ,
                    ProjectPermissions.ISSUE_READ,
                ],
            },
            'security_manager_role': {
                'description': 'Issue-specific security manager',
                'permissions': [
                    ProjectPermissions.ISSUE_READ,
                    ProjectPermissions.ISSUE_UPDATE,
                    ProjectPermissions.ISSUE_MANAGE_PERMISSIONS,
                ],
            },
            'consultant_role': {
                'description': 'External consultant issue access',
                'permissions': [
                    ProjectPermissions.ISSUE_READ,
                    ProjectPermissions.COMMENT_READ,
                    ProjectPermissions.COMMENT_CREATE,
                ],
            },
            'issue_manager_role': {
                'description': 'Enhanced issue management',
                'permissions': [
                    ProjectPermissions.ISSUE_READ,
                    ProjectPermissions.ISSUE_UPDATE,
                    ProjectPermissions.ISSUE_MANAGE_PERMISSIONS,
                    ProjectPermissions.COMMENT_DELETE,
                ],
            },
        }
    )

    # Create groups
    groups = await prepare_acl_groups(
        {'reviewers': {'description': 'Reviewers group', 'global_roles': []}}
    )

    # Create users
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
            'frank': {
                'email': 'frank@example.com',
                'is_admin': False,
                'global_roles': [],
                'groups': [],
            },
            'charlie': {
                'email': 'charlie@example.com',
                'is_admin': False,
                'global_roles': [],
                'groups': [],
            },
            'eve': {
                'email': 'eve@example.com',
                'is_admin': False,
                'global_roles': [],
                'groups': [],
            },
            'bob': {
                'email': 'bob@example.com',
                'is_admin': False,
                'global_roles': [],
                'groups': [groups['reviewers'].id],
            },
        }
    )

    # Phase 2: Execution & Verification (API calls)
    admin_user, admin_token = users['admin_user']
    admin_headers = make_user_headers(admin_token)

    diana_user, diana_token = users['diana']
    diana_headers = make_user_headers(diana_token)

    frank_user, frank_token = users['frank']
    frank_headers = make_user_headers(frank_token)

    charlie_user, charlie_token = users['charlie']
    charlie_headers = make_user_headers(charlie_token)

    eve_user, eve_token = users['eve']
    eve_headers = make_user_headers(eve_token)

    bob_user, bob_token = users['bob']
    bob_headers = make_user_headers(bob_token)

    # Test inheritance (default behavior) - Create project with Diana
    response = test_client.post(
        '/api/v1/project/',
        headers=diana_headers,
        json={
            'name': 'API Development',
            'slug': 'api_development',
            'description': 'Project for testing issue permission inheritance',
            'is_active': True,
        },
    )
    assert_permission_granted(response, 'Diana project creation')
    project_id = response.json()['payload']['id']

    # Assign Developer role to Frank on project
    response = test_client.post(
        f'/api/v1/project/{project_id}/permission',
        headers=diana_headers,
        json={
            'target_type': 'user',
            'target_id': str(frank_user.id),
            'role_id': str(project_roles['developer_role'].id),
        },
    )
    assert_permission_granted(response, 'Diana developer role assignment to Frank')

    # Create issue "Implement REST endpoints"
    response = test_client.post(
        '/api/v1/issue/',
        headers=diana_headers,
        json={
            'subject': 'Implement REST endpoints',
            'text': {'value': 'Need to implement REST API endpoints for the project'},
            'project_id': project_id,
        },
    )
    assert_permission_granted(response, 'Diana issue creation')
    issue1_id = response.json()['payload']['id']

    # Verify Frank can access issue through project permissions (inheritance)
    response = test_client.get(f'/api/v1/issue/{issue1_id}', headers=frank_headers)
    assert_permission_granted(response, 'Frank issue access via project developer role')

    # Verify Frank can update issue through project permissions
    response = test_client.put(
        f'/api/v1/issue/{issue1_id}',
        headers=frank_headers,
        json={
            'subject': 'Implement REST endpoints - Updated by Frank',
            'text': {'value': 'Updated by Frank via project permissions'},
        },
    )
    assert_permission_granted(response, 'Frank issue update via project developer role')

    # Verify Frank can create comments through project permissions
    response = test_client.post(
        f'/api/v1/issue/{issue1_id}/comment/',
        headers=frank_headers,
        json={'text': {'value': 'Frank commenting via project developer role'}},
    )
    assert_permission_granted(
        response, 'Frank comment creation via project developer role'
    )

    # Test confidential access (disable inheritance + delete unwanted permissions)
    # Create confidential issue "Security Vulnerability #123"
    response = test_client.post(
        '/api/v1/issue/',
        headers=diana_headers,
        json={
            'subject': 'Security Vulnerability #123',
            'text': {'value': 'Confidential security vulnerability details'},
            'project_id': project_id,
        },
    )
    assert_permission_granted(response, 'Diana confidential issue creation')
    confidential_issue_id = response.json()['payload']['id']

    # Assign additional Security Manager role to Charlie on specific confidential issue
    response = test_client.post(
        f'/api/v1/issue/{confidential_issue_id}/permission',
        headers=diana_headers,
        json={
            'target_type': 'user',
            'target_id': str(charlie_user.id),
            'role_id': str(project_roles['security_manager_role'].id),
        },
    )
    assert_permission_granted(
        response, 'Diana security manager role assignment to Charlie on issue'
    )

    # Now disable project permissions inheritance using dedicated endpoint
    response = test_client.post(
        f'/api/v1/issue/{confidential_issue_id}/permissions/disable-inheritance',
        headers=diana_headers,
        json={},
    )
    assert_permission_granted(
        response, 'Diana disable inheritance on confidential issue'
    )

    # Get the issue permissions to find Frank's copied permission ID
    response = test_client.get(
        f'/api/v1/issue/{confidential_issue_id}/permissions',
        headers=diana_headers,
    )
    assert_permission_granted(response, 'Diana get issue permissions')
    issue_permissions = response.json()['payload']['items']

    # Find Frank's copied Developer permission
    frank_permission_id = None
    for perm in issue_permissions:
        if perm['target_type'] == 'user' and perm['target']['id'] == str(frank_user.id):
            frank_permission_id = perm['id']
            break

    assert frank_permission_id is not None, (
        'Frank copied permission should exist after inheritance disabled'
    )

    # Delete Frank's copied permission to achieve confidentiality
    response = test_client.delete(
        f'/api/v1/issue/{confidential_issue_id}/permission/{frank_permission_id}',
        headers=diana_headers,
    )
    assert_permission_granted(
        response, 'Diana delete Frank copied permission for confidentiality'
    )

    # Verify Frank CANNOT access confidential issue after his permission is deleted
    response = test_client.get(
        f'/api/v1/issue/{confidential_issue_id}', headers=frank_headers
    )
    assert_permission_denied(
        response, 'Frank confidential issue access denied after permission deleted'
    )

    # Verify Charlie CAN access and manage the confidential issue via direct assignment
    response = test_client.get(
        f'/api/v1/issue/{confidential_issue_id}', headers=charlie_headers
    )
    assert_permission_granted(
        response, 'Charlie confidential issue access via direct role assignment'
    )

    # Verify Charlie can update confidential issue
    response = test_client.put(
        f'/api/v1/issue/{confidential_issue_id}',
        headers=charlie_headers,
        json={
            'subject': 'Security Vulnerability #123 - Updated by Security Manager',
            'text': {'value': 'Updated by Charlie with security manager permissions'},
        },
    )
    assert_permission_granted(
        response, 'Charlie confidential issue update via security manager role'
    )

    # Test external stakeholder access
    # Create issue "User Experience Review"
    response = test_client.post(
        '/api/v1/issue/',
        headers=diana_headers,
        json={
            'subject': 'User Experience Review',
            'text': {'value': 'Need external consultant review of user experience'},
            'project_id': project_id,
        },
    )
    assert_permission_granted(response, 'Diana external stakeholder issue creation')
    ux_issue_id = response.json()['payload']['id']

    # Assign Consultant role to Eve on specific issue (demonstrates external stakeholder access)
    response = test_client.post(
        f'/api/v1/issue/{ux_issue_id}/permission',
        headers=diana_headers,
        json={
            'target_type': 'user',
            'target_id': str(eve_user.id),
            'role_id': str(project_roles['consultant_role'].id),
        },
    )
    assert_permission_granted(
        response, 'Diana consultant role assignment to Eve on issue'
    )

    # Verify Eve CANNOT read project info (external consultant has no project access per ACL docs)
    response = test_client.get(f'/api/v1/project/{project_id}', headers=eve_headers)
    assert_permission_denied(
        response, 'Eve project access (should be denied - no project permissions)'
    )

    # Verify Eve CANNOT access other issues (no project permissions)
    response = test_client.get(f'/api/v1/issue/{issue1_id}', headers=eve_headers)
    assert_permission_denied(response, 'Eve other issue access (should be denied)')

    # Verify Eve CAN access only the assigned issue
    response = test_client.get(f'/api/v1/issue/{ux_issue_id}', headers=eve_headers)
    assert_permission_granted(response, 'Eve assigned issue access via consultant role')

    # Verify Eve can create comments on assigned issue
    response = test_client.post(
        f'/api/v1/issue/{ux_issue_id}/comment/',
        headers=eve_headers,
        json={'text': {'value': 'External consultant feedback on UX'}},
    )
    assert_permission_granted(response, 'Eve comment creation via consultant role')

    # Test combined permissions
    # Assign Reader role to Reviewers group on project
    response = test_client.post(
        f'/api/v1/project/{project_id}/permission',
        headers=diana_headers,
        json={
            'target_type': 'group',
            'target_id': str(groups['reviewers'].id),
            'role_id': str(project_roles['reader_role'].id),
        },
    )
    assert_permission_granted(
        response, 'Diana reader role assignment to reviewers group'
    )

    # Create issue "Complex Feature Implementation"
    response = test_client.post(
        '/api/v1/issue/',
        headers=diana_headers,
        json={
            'subject': 'Complex Feature Implementation',
            'text': {'value': 'Complex feature requiring both review and management'},
            'project_id': project_id,
        },
    )
    assert_permission_granted(response, 'Diana complex feature issue creation')
    complex_issue_id = response.json()['payload']['id']

    # Assign enhanced Issue Manager role to Bob directly on specific issue
    response = test_client.post(
        f'/api/v1/issue/{complex_issue_id}/permission',
        headers=diana_headers,
        json={
            'target_type': 'user',
            'target_id': str(bob_user.id),
            'role_id': str(project_roles['issue_manager_role'].id),
        },
    )
    assert_permission_granted(
        response, 'Diana issue manager role assignment to Bob on issue'
    )

    # Verify Bob has union of project and issue permissions
    # Bob should be able to read project via reviewers group (PROJECT_READ, ISSUE_READ)
    response = test_client.get(f'/api/v1/project/{project_id}', headers=bob_headers)
    assert_permission_granted(response, 'Bob project access via reviewers group')

    # Bob should be able to read the specific issue via project permissions
    response = test_client.get(f'/api/v1/issue/{complex_issue_id}', headers=bob_headers)
    assert_permission_granted(
        response, 'Bob complex issue read via combined permissions'
    )

    # Bob should be able to update the specific issue via direct issue manager role
    response = test_client.put(
        f'/api/v1/issue/{complex_issue_id}',
        headers=bob_headers,
        json={
            'subject': 'Complex Feature Implementation - Managed by Bob',
            'text': {'value': 'Updated by Bob via issue manager permissions'},
        },
    )
    assert_permission_granted(
        response, 'Bob complex issue update via issue manager role'
    )

    # Test auto-copy behavior when disabling inheritance - verify all project permissions are copied to issue level
    # Create issue "Auto-Copy Verification Test"
    response = test_client.post(
        '/api/v1/issue/',
        headers=diana_headers,
        json={
            'subject': 'Auto-Copy Verification Test',
            'text': {
                'value': 'Issue to test that project permissions are automatically copied when disabling inheritance'
            },
            'project_id': project_id,
        },
    )
    assert_permission_granted(response, 'Diana auto-copy test issue creation')
    auto_copy_issue_id = response.json()['payload']['id']

    # Verify Frank initially has access via project Developer role (inheritance enabled by default)
    response = test_client.get(
        f'/api/v1/issue/{auto_copy_issue_id}', headers=frank_headers
    )
    assert_permission_granted(
        response,
        'Frank initial access to auto-copy test issue via project permissions',
    )

    # Give Diana direct Issue Manager permissions on this specific issue
    response = test_client.post(
        f'/api/v1/issue/{auto_copy_issue_id}/permission',
        headers=diana_headers,
        json={
            'target_type': 'user',
            'target_id': str(diana_user.id),
            'role_id': str(project_roles['issue_manager_role'].id),
        },
    )
    assert_permission_granted(
        response, 'Diana direct issue manager role assignment for auto-copy test'
    )

    # Diana disables inheritance - this should automatically copy all project permissions to issue level
    response = test_client.post(
        f'/api/v1/issue/{auto_copy_issue_id}/permissions/disable-inheritance',
        headers=diana_headers,
        json={},
    )
    assert_permission_granted(
        response, 'Diana disable inheritance (auto-copy behavior)'
    )

    # Verify all users retain access via automatically copied permissions
    response = test_client.get(
        f'/api/v1/issue/{auto_copy_issue_id}', headers=frank_headers
    )
    assert_permission_granted(
        response,
        'Frank retains access after inheritance disabled (project permissions were auto-copied)',
    )

    # Verify Diana retains access via both direct and copied permissions
    response = test_client.get(
        f'/api/v1/issue/{auto_copy_issue_id}', headers=diana_headers
    )
    assert_permission_granted(
        response,
        'Diana retains access via direct issue permissions after inheritance disabled',
    )

    # Test comprehensive issue list ACL filtering
    # Diana should see all 5 issues (Project Owner + direct permissions on auto-copy test issue)
    response = test_client.get('/api/v1/issue/list', headers=diana_headers)
    assert_permission_granted(response, 'Diana issue list access')
    diana_issues = response.json()['payload']['items']
    diana_issue_subjects = {issue['subject'] for issue in diana_issues}
    expected_diana_subjects = {
        'Implement REST endpoints - Updated by Frank',
        'Security Vulnerability #123 - Updated by Security Manager',
        'User Experience Review',
        'Complex Feature Implementation - Managed by Bob',
        'Auto-Copy Verification Test',
    }
    assert diana_issue_subjects >= expected_diana_subjects, (
        f'Diana should see all 5 issues, got: {diana_issue_subjects}'
    )

    # Frank should see 4 issues (via project Developer role + copied permissions on auto-copy test issue, but NO access to confidential issue after permission deletion)
    response = test_client.get('/api/v1/issue/list', headers=frank_headers)
    assert_permission_granted(response, 'Frank issue list access')
    frank_issues = response.json()['payload']['items']
    frank_issue_subjects = {issue['subject'] for issue in frank_issues}
    expected_frank_subjects = {
        'Implement REST endpoints - Updated by Frank',
        'User Experience Review',  # Frank can see this via project permissions
        'Complex Feature Implementation - Managed by Bob',
        'Auto-Copy Verification Test',  # Frank can see this via copied permissions (auto-copied when inheritance disabled)
    }
    assert frank_issue_subjects >= expected_frank_subjects, (
        f'Frank should see 4 issues, got: {frank_issue_subjects}'
    )
    # Verify Frank cannot see the confidential issue (his permission was deleted)
    assert (
        'Security Vulnerability #123 - Updated by Security Manager'
        not in frank_issue_subjects
    ), 'Frank should NOT see confidential issue after his permission was deleted'

    # Charlie should see 1 issue (only direct access to confidential issue)
    response = test_client.get('/api/v1/issue/list', headers=charlie_headers)
    assert_permission_granted(response, 'Charlie issue list access')
    charlie_issues = response.json()['payload']['items']
    charlie_issue_subjects = {issue['subject'] for issue in charlie_issues}
    expected_charlie_subjects = {
        'Security Vulnerability #123 - Updated by Security Manager'
    }
    assert charlie_issue_subjects >= expected_charlie_subjects, (
        f'Charlie should see 1 issue, got: {charlie_issue_subjects}'
    )
    assert len(charlie_issues) == 1, (
        f'Charlie should see exactly 1 issue, got {len(charlie_issues)}'
    )

    # Eve should see 1 issue (only direct access to UX review issue)
    response = test_client.get('/api/v1/issue/list', headers=eve_headers)
    assert_permission_granted(response, 'Eve issue list access')
    eve_issues = response.json()['payload']['items']
    eve_issue_subjects = {issue['subject'] for issue in eve_issues}
    expected_eve_subjects = {'User Experience Review'}
    assert eve_issue_subjects >= expected_eve_subjects, (
        f'Eve should see 1 issue, got: {eve_issue_subjects}'
    )
    assert len(eve_issues) == 1, (
        f'Eve should see exactly 1 issue, got {len(eve_issues)}'
    )

    # Bob should see issues via Reader role from reviewers group + direct Issue Manager role
    response = test_client.get('/api/v1/issue/list', headers=bob_headers)
    assert_permission_granted(response, 'Bob issue list access')
    bob_issues = response.json()['payload']['items']
    bob_issue_subjects = {issue['subject'] for issue in bob_issues}

    # Bob should see all non-confidential issues via reviewers group + specific enhanced access to complex issue
    # Bob CAN see "Auto-Copy Verification Test" - inheritance was disabled but his group permissions were auto-copied
    expected_bob_subjects = {
        'Implement REST endpoints - Updated by Frank',  # via reviewers group reader role
        'User Experience Review',  # via reviewers group reader role
        'Complex Feature Implementation - Managed by Bob',  # via reviewers group + direct issue manager role
        'Auto-Copy Verification Test',  # via reviewers group reader role (auto-copied when inheritance disabled)
    }
    assert bob_issue_subjects >= expected_bob_subjects, (
        f'Bob should see 4+ issues via combined permissions, got: {bob_issue_subjects}'
    )
    assert (
        'Security Vulnerability #123 - Updated by Security Manager'
        not in bob_issue_subjects
    ), 'Bob should NOT see confidential issue'

    # Verify admin sees no issues (content-level restriction)
    response = test_client.get('/api/v1/issue/list', headers=admin_headers)
    assert_permission_granted(response, 'Admin issue list access (endpoint accessible)')
    admin_issues = response.json()['payload']['items']
    assert len(admin_issues) == 0, (
        f'Admin should see 0 issues but saw {len(admin_issues)} - content access requires explicit permissions'
    )

    # Test POST /api/v1/issue/list endpoint with same ACL rules
    # Collect all issue IDs created during the test phases
    all_issue_ids = [
        issue1_id,
        confidential_issue_id,
        ux_issue_id,
        complex_issue_id,
        auto_copy_issue_id,
    ]

    # Diana should see all 5 issues via POST endpoint (same as GET)
    response = test_client.post(
        '/api/v1/issue/list',
        headers=diana_headers,
        json={'issue_ids': all_issue_ids},
    )
    assert_permission_granted(response, 'Diana POST issue list access')
    diana_post_issues = response.json()['payload']['items']
    diana_post_issue_subjects = {issue['subject'] for issue in diana_post_issues}
    assert diana_post_issue_subjects >= expected_diana_subjects, (
        f'Diana POST endpoint should see all 5 issues, got: {diana_post_issue_subjects}'
    )
    assert len(diana_post_issues) == 5, (
        f'Diana should see 5 issues via POST, got {len(diana_post_issues)}'
    )

    # Frank should see 4 issues via POST endpoint (same as GET - cannot see confidential issue after permission deleted)
    response = test_client.post(
        '/api/v1/issue/list',
        headers=frank_headers,
        json={'issue_ids': all_issue_ids},
    )
    assert_permission_granted(response, 'Frank POST issue list access')
    frank_post_issues = response.json()['payload']['items']
    frank_post_issue_subjects = {issue['subject'] for issue in frank_post_issues}
    assert len(frank_post_issues) == 4, (
        f'Frank should see 4 issues via POST, got {len(frank_post_issues)}'
    )
    assert 'Auto-Copy Verification Test' in frank_post_issue_subjects, (
        'Frank should see auto-copy test issue via POST (project permissions were auto-copied when inheritance disabled)'
    )
    assert (
        'Security Vulnerability #123 - Updated by Security Manager'
        not in frank_post_issue_subjects
    ), 'Frank should NOT see confidential issue via POST (his permission was deleted)'

    # Charlie should see same issues via POST as GET
    response = test_client.post(
        '/api/v1/issue/list',
        headers=charlie_headers,
        json={'issue_ids': all_issue_ids},
    )
    assert_permission_granted(response, 'Charlie POST issue list access')
    charlie_post_issues = response.json()['payload']['items']
    charlie_post_issue_subjects = {issue['subject'] for issue in charlie_post_issues}
    assert 'Auto-Copy Verification Test' not in charlie_post_issue_subjects, (
        'Charlie should NOT see auto-copy test issue via POST (no project permissions copied)'
    )

    # Eve should see same issues via POST as GET
    response = test_client.post(
        '/api/v1/issue/list',
        headers=eve_headers,
        json={'issue_ids': all_issue_ids},
    )
    assert_permission_granted(response, 'Eve POST issue list access')
    eve_post_issues = response.json()['payload']['items']
    # Eve should see fewer issues (external stakeholder with limited access)
    assert len(eve_post_issues) <= len(diana_post_issues), (
        'Eve should see same or fewer issues than Diana via POST'
    )

    # Bob should see same issues via POST as GET
    response = test_client.post(
        '/api/v1/issue/list',
        headers=bob_headers,
        json={'issue_ids': all_issue_ids},
    )
    assert_permission_granted(response, 'Bob POST issue list access')
    bob_post_issues = response.json()['payload']['items']
    bob_post_issue_subjects = {issue['subject'] for issue in bob_post_issues}
    assert 'Auto-Copy Verification Test' in bob_post_issue_subjects, (
        'Bob should see auto-copy test issue via POST (project permissions were auto-copied when inheritance disabled)'
    )

    # Admin should see no issues via POST (same content-level restriction as GET)
    response = test_client.post(
        '/api/v1/issue/list',
        headers=admin_headers,
        json={'issue_ids': all_issue_ids},
    )
    assert_permission_granted(
        response, 'Admin POST issue list access (endpoint accessible)'
    )
    admin_post_issues = response.json()['payload']['items']
    assert len(admin_post_issues) == 0, (
        f'Admin should see 0 issues via POST but saw {len(admin_post_issues)} - content access requires explicit permissions'
    )
