from typing import TYPE_CHECKING

import pytest

from .helpers import (
    assert_permission_denied,
    assert_permission_granted,
    make_user_headers,
    prepare_acl_groups,
    prepare_acl_users,
)

if TYPE_CHECKING:
    from fastapi.testclient import TestClient


@pytest.mark.asyncio
async def test_board_direct_sharing(
    test_client: 'TestClient',
) -> None:
    """Test 6.1: Board Direct Sharing

    Verify that kanban boards can be shared directly using VIEW/EDIT/ADMIN permissions,
    enabling flexible team collaboration independent of any project-level access
    """
    import pm.models as m

    # Create groups
    groups = await prepare_acl_groups(
        {
            'stakeholders': {'description': 'Stakeholders group', 'global_roles': []},
            'team_members': {'description': 'Team members group', 'global_roles': []},
        }
    )

    # Create users
    users = await prepare_acl_users(
        {
            'admin': {
                'email': 'admin@example.com',
                'is_admin': True,
                'global_roles': [],
                'groups': [],
            },
            'creator': {
                'email': 'creator@example.com',
                'is_admin': False,
                'global_roles': [],
                'groups': [],
            },
            'stakeholder': {
                'email': 'stakeholder@example.com',
                'is_admin': False,
                'global_roles': [],
                'groups': [groups['stakeholders'].id],
            },
            'team_member': {
                'email': 'member@example.com',
                'is_admin': False,
                'global_roles': [],
                'groups': [groups['team_members'].id],
            },
            'no_access_user': {
                'email': 'noaccess@example.com',
                'is_admin': False,
                'global_roles': [],
                'groups': [],
            },
        }
    )

    # Get user credentials
    admin_user, admin_token = users['admin']
    admin_headers = make_user_headers(admin_token)

    creator_user, creator_token = users['creator']
    creator_headers = make_user_headers(creator_token)

    stakeholder_user, stakeholder_token = users['stakeholder']
    stakeholder_headers = make_user_headers(stakeholder_token)

    team_member_user, team_member_token = users['team_member']
    team_member_headers = make_user_headers(team_member_token)

    no_access_user, no_access_token = users['no_access_user']
    no_access_headers = make_user_headers(no_access_token)

    # Create project for board using admin credentials
    response = test_client.post(
        '/api/v1/project/',
        headers=admin_headers,
        json={
            'name': 'Board Test Project',
            'slug': 'board_test_project',
            'description': 'Project for testing board direct sharing',
            'is_active': True,
        },
    )
    assert_permission_granted(response, 'Admin project creation for board test')
    project_id = response.json()['payload']['id']

    # Create state custom field for board columns
    response = test_client.post(
        '/api/v1/custom_field/group',
        headers=admin_headers,
        json={
            'name': 'Status',
            'type': 'state',
            'is_nullable': False,
            'description': 'Issue status field for board',
            'projects': [project_id],
        },
    )
    assert_permission_granted(response, 'Admin status field creation')
    status_field = response.json()['payload']

    # Link the custom field to the project
    field_id = status_field['fields'][0]['id']
    response = test_client.post(
        f'/api/v1/project/{project_id}/field/{field_id}',
        headers=admin_headers,
    )
    assert_permission_granted(response, 'Admin link status field to project')

    # Test board creation and ownership
    response = test_client.post(
        '/api/v1/board/',
        headers=creator_headers,
        json={
            'name': 'Sprint Planning Board',
            'description': 'Board for sprint planning and task management',
            'projects': [project_id],
            'column_field': status_field['gid'],
            'columns': [],
        },
    )
    assert_permission_granted(response, 'Creator board creation')
    board_id = response.json()['payload']['id']

    # Verify creator automatically gets ADMIN permission on board
    response = test_client.get(f'/api/v1/board/{board_id}', headers=creator_headers)
    assert_permission_granted(response, 'Creator board access')
    board_data = response.json()['payload']
    assert board_data['current_permission'] == m.PermissionType.ADMIN, (
        'Creator should have ADMIN permission on created board'
    )

    # Test hierarchical sharing - Give VIEW permission to stakeholders group
    response = test_client.post(
        f'/api/v1/board/{board_id}/permission',
        headers=creator_headers,
        json={
            'target_type': 'group',
            'target': str(groups['stakeholders'].id),
            'permission_type': 'view',
        },
    )
    assert_permission_granted(response, 'Creator grant VIEW to stakeholders')

    # Give EDIT permission to team_members group
    response = test_client.post(
        f'/api/v1/board/{board_id}/permission',
        headers=creator_headers,
        json={
            'target_type': 'group',
            'target': str(groups['team_members'].id),
            'permission_type': 'edit',
        },
    )
    assert_permission_granted(response, 'Creator grant EDIT to team members')

    # Test VIEW permission capabilities - Verify stakeholder can view board content
    response = test_client.get(f'/api/v1/board/{board_id}', headers=stakeholder_headers)
    assert_permission_granted(response, 'Stakeholder board view access')
    stakeholder_board_data = response.json()['payload']
    assert stakeholder_board_data['current_permission'] == m.PermissionType.VIEW, (
        'Stakeholder should have VIEW permission on board'
    )

    # Verify stakeholder cannot modify board
    response = test_client.put(
        f'/api/v1/board/{board_id}',
        headers=stakeholder_headers,
        json={
            'name': 'Modified Sprint Planning Board',
            'description': 'Modified by stakeholder',
        },
    )
    assert_permission_denied(response, 'Stakeholder cannot modify board (VIEW only)')

    # Verify stakeholder cannot manage permissions
    response = test_client.post(
        f'/api/v1/board/{board_id}/permission',
        headers=stakeholder_headers,
        json={
            'target_type': 'user',
            'target': str(stakeholder_user.id),
            'permission_type': 'admin',
        },
    )
    assert_permission_denied(
        response, 'Stakeholder cannot manage permissions (VIEW only)'
    )

    # Test EDIT permission capabilities - Verify team_member can view and edit board content
    response = test_client.get(f'/api/v1/board/{board_id}', headers=team_member_headers)
    assert_permission_granted(response, 'Team member board view access')
    team_member_board_data = response.json()['payload']
    assert team_member_board_data['current_permission'] == m.PermissionType.EDIT, (
        'Team member should have EDIT permission on board'
    )

    # Verify team_member can modify board content
    response = test_client.put(
        f'/api/v1/board/{board_id}',
        headers=team_member_headers,
        json={
            'name': 'Sprint Planning Board - Updated by Team',
            'description': 'Updated by team member with EDIT permissions',
        },
    )
    assert_permission_granted(
        response, 'Team member can modify board (EDIT permission)'
    )

    # Verify team_member cannot delete board or manage sharing permissions
    response = test_client.delete(
        f'/api/v1/board/{board_id}', headers=team_member_headers
    )
    assert_permission_denied(
        response, 'Team member cannot delete board (EDIT only, needs ADMIN)'
    )

    response = test_client.post(
        f'/api/v1/board/{board_id}/permission',
        headers=team_member_headers,
        json={
            'target_type': 'user',
            'target': str(team_member_user.id),
            'permission_type': 'admin',
        },
    )
    assert_permission_denied(
        response, 'Team member cannot manage permissions (EDIT only, needs ADMIN)'
    )

    # Test ADMIN permission capabilities - Verify creator can manage all aspects
    response = test_client.get(
        f'/api/v1/board/{board_id}/permissions', headers=creator_headers
    )
    assert_permission_granted(response, 'Creator can view board permissions (ADMIN)')

    # Test no-access user cannot access shared board and has empty board list
    response = test_client.get(f'/api/v1/board/{board_id}', headers=no_access_headers)
    assert_permission_denied(response, 'No-access user cannot view board')

    response = test_client.get('/api/v1/board/list', headers=no_access_headers)
    assert_permission_granted(response, 'No-access user can access board list endpoint')
    board_list = response.json()['payload']['items']
    assert len(board_list) == 0, 'No-access user should see empty board list'

    response = test_client.delete(f'/api/v1/board/{board_id}', headers=creator_headers)
    assert_permission_granted(response, 'Creator can delete board (ADMIN permission)')


@pytest.mark.asyncio
async def test_report_direct_sharing(
    test_client: 'TestClient',
) -> None:
    """Test 6.2: Report Direct Sharing

    Verify that reports can be shared directly using VIEW/EDIT/ADMIN permissions,
    enabling cross-functional collaboration independent of any other system permissions
    """
    import pm.models as m

    # Create groups
    groups = await prepare_acl_groups(
        {
            'viewers': {'description': 'Report viewers group', 'global_roles': []},
            'editors': {'description': 'Report editors group', 'global_roles': []},
        }
    )

    # Create users
    users = await prepare_acl_users(
        {
            'creator': {
                'email': 'creator@example.com',
                'is_admin': False,
                'global_roles': [],
                'groups': [],
            },
            'viewer': {
                'email': 'viewer@example.com',
                'is_admin': False,
                'global_roles': [],
                'groups': [groups['viewers'].id],
            },
            'editor': {
                'email': 'editor@example.com',
                'is_admin': False,
                'global_roles': [],
                'groups': [groups['editors'].id],
            },
            'no_access_user': {
                'email': 'noaccess@example.com',
                'is_admin': False,
                'global_roles': [],
                'groups': [],
            },
        }
    )

    # Get user credentials
    creator_user, creator_token = users['creator']
    creator_headers = make_user_headers(creator_token)

    viewer_user, viewer_token = users['viewer']
    viewer_headers = make_user_headers(viewer_token)

    editor_user, editor_token = users['editor']
    editor_headers = make_user_headers(editor_token)

    no_access_user, no_access_token = users['no_access_user']
    no_access_headers = make_user_headers(no_access_token)

    # Test report creation and ownership
    response = test_client.post(
        '/api/v1/report/',
        headers=creator_headers,
        json={
            'name': 'Sales Dashboard',
            'type': 'issues_per_project',
            'description': 'Comprehensive sales performance dashboard',
            'query': 'status:active',
        },
    )
    assert_permission_granted(response, 'Creator report creation')
    report_id = response.json()['payload']['id']

    # Verify creator automatically gets ADMIN permission on report
    response = test_client.get(f'/api/v1/report/{report_id}', headers=creator_headers)
    assert_permission_granted(response, 'Creator report access')
    report_data = response.json()['payload']
    assert report_data['current_permission'] == m.PermissionType.ADMIN, (
        'Creator should have ADMIN permission on created report'
    )

    # Test hierarchical sharing - Give VIEW permission to viewers group
    response = test_client.post(
        f'/api/v1/report/{report_id}/permission',
        headers=creator_headers,
        json={
            'target_type': 'group',
            'target': str(groups['viewers'].id),
            'permission_type': 'view',
        },
    )
    assert_permission_granted(response, 'Creator grant VIEW to viewers')

    # Give EDIT permission to editors group
    response = test_client.post(
        f'/api/v1/report/{report_id}/permission',
        headers=creator_headers,
        json={
            'target_type': 'group',
            'target': str(groups['editors'].id),
            'permission_type': 'edit',
        },
    )
    assert_permission_granted(response, 'Creator grant EDIT to editors')

    # Test VIEW permission capabilities - Verify viewer can view report content
    response = test_client.get(f'/api/v1/report/{report_id}', headers=viewer_headers)
    assert_permission_granted(response, 'Viewer report view access')
    viewer_report_data = response.json()['payload']
    assert viewer_report_data['current_permission'] == m.PermissionType.VIEW, (
        'Viewer should have VIEW permission on report'
    )

    # Verify viewer cannot modify report
    response = test_client.put(
        f'/api/v1/report/{report_id}',
        headers=viewer_headers,
        json={
            'type': 'issues_per_project',
            'name': 'Modified Sales Dashboard',
            'description': 'Modified by viewer',
        },
    )
    assert_permission_denied(response, 'Viewer cannot modify report (VIEW only)')

    # Verify viewer cannot manage permissions
    response = test_client.post(
        f'/api/v1/report/{report_id}/permission',
        headers=viewer_headers,
        json={
            'target_type': 'user',
            'target': str(viewer_user.id),
            'permission_type': 'admin',
        },
    )
    assert_permission_denied(response, 'Viewer cannot manage permissions (VIEW only)')

    # Test EDIT permission capabilities - Verify editor can view and modify report content/settings
    response = test_client.get(f'/api/v1/report/{report_id}', headers=editor_headers)
    assert_permission_granted(response, 'Editor report view access')
    editor_report_data = response.json()['payload']
    assert editor_report_data['current_permission'] == m.PermissionType.EDIT, (
        'Editor should have EDIT permission on report'
    )

    # Verify editor can modify report content
    response = test_client.put(
        f'/api/v1/report/{report_id}',
        headers=editor_headers,
        json={
            'type': 'issues_per_project',
            'name': 'Sales Dashboard - Enhanced',
            'description': 'Enhanced by editor with additional metrics',
            'query': 'status:active priority:high',
        },
    )
    assert_permission_granted(response, 'Editor can modify report (EDIT permission)')

    # Verify editor cannot delete report or change sharing permissions
    response = test_client.delete(f'/api/v1/report/{report_id}', headers=editor_headers)
    assert_permission_denied(
        response, 'Editor cannot delete report (EDIT only, needs ADMIN)'
    )

    response = test_client.post(
        f'/api/v1/report/{report_id}/permission',
        headers=editor_headers,
        json={
            'target_type': 'user',
            'target': str(editor_user.id),
            'permission_type': 'admin',
        },
    )
    assert_permission_denied(
        response, 'Editor cannot manage permissions (EDIT only, needs ADMIN)'
    )

    # Test no-access user cannot access shared report and has empty report list
    response = test_client.get(f'/api/v1/report/{report_id}', headers=no_access_headers)
    assert_permission_denied(response, 'No-access user cannot view report')

    response = test_client.get('/api/v1/report/list', headers=no_access_headers)
    assert_permission_granted(
        response, 'No-access user can access report list endpoint'
    )
    report_list = response.json()['payload']['items']
    assert len(report_list) == 0, 'No-access user should see empty report list'

    # Test ADMIN permission capabilities - Verify creator can delete report
    response = test_client.delete(
        f'/api/v1/report/{report_id}', headers=creator_headers
    )
    assert_permission_granted(response, 'Creator can delete report (ADMIN permission)')


@pytest.mark.asyncio
async def test_tag_direct_sharing(
    test_client: 'TestClient',
) -> None:
    """Test 6.3: Tag Direct Sharing

    Verify tag ownership and hierarchical sharing permissions with inheritance validation
    (EDIT permission includes VIEW capabilities)
    """
    import pm.models as m

    # Create groups
    groups = await prepare_acl_groups(
        {
            'editors': {'description': 'Tag editors group', 'global_roles': []},
            'viewers': {'description': 'Tag viewers group', 'global_roles': []},
        }
    )

    # Create users
    users = await prepare_acl_users(
        {
            'creator': {
                'email': 'creator@example.com',
                'is_admin': False,
                'global_roles': [],
                'groups': [],
            },
            'editor': {
                'email': 'editor@example.com',
                'is_admin': False,
                'global_roles': [],
                'groups': [groups['editors'].id],
            },
            'viewer': {
                'email': 'viewer@example.com',
                'is_admin': False,
                'global_roles': [],
                'groups': [groups['viewers'].id],
            },
            'no_access_user': {
                'email': 'noaccess@example.com',
                'is_admin': False,
                'global_roles': [],
                'groups': [],
            },
        }
    )

    # Get user credentials
    creator_user, creator_token = users['creator']
    creator_headers = make_user_headers(creator_token)

    editor_user, editor_token = users['editor']
    editor_headers = make_user_headers(editor_token)

    viewer_user, viewer_token = users['viewer']
    viewer_headers = make_user_headers(viewer_token)

    no_access_user, no_access_token = users['no_access_user']
    no_access_headers = make_user_headers(no_access_token)

    # Test tag creation and ownership
    response = test_client.post(
        '/api/v1/tag/',
        headers=creator_headers,
        json={
            'name': 'Urgent',
            'description': 'Tag for urgent priority items',
            'color': '#ff0000',
        },
    )
    assert_permission_granted(response, 'Creator tag creation')
    tag_id = response.json()['payload']['id']

    # Verify creator automatically gets ADMIN permission on tag
    response = test_client.get(f'/api/v1/tag/{tag_id}', headers=creator_headers)
    assert_permission_granted(response, 'Creator tag access')
    tag_data = response.json()['payload']
    assert tag_data['current_permission'] == m.PermissionType.ADMIN, (
        'Creator should have ADMIN permission on created tag'
    )

    # Test hierarchical sharing - Give EDIT permission to editors group
    response = test_client.post(
        f'/api/v1/tag/{tag_id}/permission',
        headers=creator_headers,
        json={
            'target_type': 'group',
            'target': str(groups['editors'].id),
            'permission_type': 'edit',
        },
    )
    assert_permission_granted(response, 'Creator grant EDIT to editors')

    # Give VIEW permission to viewers group
    response = test_client.post(
        f'/api/v1/tag/{tag_id}/permission',
        headers=creator_headers,
        json={
            'target_type': 'group',
            'target': str(groups['viewers'].id),
            'permission_type': 'view',
        },
    )
    assert_permission_granted(response, 'Creator grant VIEW to viewers')

    # Test EDIT permission capabilities - Verify editor can view tag properties
    response = test_client.get(f'/api/v1/tag/{tag_id}', headers=editor_headers)
    assert_permission_granted(response, 'Editor tag view access')
    editor_tag_data = response.json()['payload']
    assert editor_tag_data['current_permission'] == m.PermissionType.EDIT, (
        'Editor should have EDIT permission on tag'
    )

    # Verify editor can modify tag properties
    response = test_client.put(
        f'/api/v1/tag/{tag_id}',
        headers=editor_headers,
        json={
            'name': 'Critical Urgent',
            'description': 'Updated tag for critical urgent items',
            'color': '#cc0000',
        },
    )
    assert_permission_granted(response, 'Editor can modify tag (EDIT permission)')

    # Verify editor cannot delete tag or change sharing permissions
    response = test_client.delete(f'/api/v1/tag/{tag_id}', headers=editor_headers)
    assert_permission_denied(
        response, 'Editor cannot delete tag (EDIT only, needs ADMIN)'
    )

    response = test_client.post(
        f'/api/v1/tag/{tag_id}/permission',
        headers=editor_headers,
        json={
            'target_type': 'user',
            'target': str(editor_user.id),
            'permission_type': 'admin',
        },
    )
    assert_permission_denied(
        response, 'Editor cannot manage permissions (EDIT only, needs ADMIN)'
    )

    # Test VIEW permission limitations - Verify viewer can only view tag properties
    response = test_client.get(f'/api/v1/tag/{tag_id}', headers=viewer_headers)
    assert_permission_granted(response, 'Viewer tag view access')
    viewer_tag_data = response.json()['payload']
    assert viewer_tag_data['current_permission'] == m.PermissionType.VIEW, (
        'Viewer should have VIEW permission on tag'
    )

    # Verify viewer cannot modify, delete, or manage permissions
    response = test_client.put(
        f'/api/v1/tag/{tag_id}',
        headers=viewer_headers,
        json={
            'name': 'Modified by Viewer',
            'description': 'Should not be allowed',
        },
    )
    assert_permission_denied(response, 'Viewer cannot modify tag (VIEW only)')

    response = test_client.delete(f'/api/v1/tag/{tag_id}', headers=viewer_headers)
    assert_permission_denied(response, 'Viewer cannot delete tag (VIEW only)')

    response = test_client.post(
        f'/api/v1/tag/{tag_id}/permission',
        headers=viewer_headers,
        json={
            'target_type': 'user',
            'target': str(viewer_user.id),
            'permission_type': 'admin',
        },
    )
    assert_permission_denied(response, 'Viewer cannot manage permissions (VIEW only)')

    # Test permission inheritance - Verify EDIT permission includes all VIEW capabilities
    # Editor should be able to view (like viewer) AND modify (unlike viewer)
    # This was already tested above - editor can view tag properties and modify them

    # Test no-access user cannot access shared tag and has empty tag list
    response = test_client.get(f'/api/v1/tag/{tag_id}', headers=no_access_headers)
    assert_permission_denied(response, 'No-access user cannot view tag')

    response = test_client.get('/api/v1/tag/list', headers=no_access_headers)
    assert_permission_granted(response, 'No-access user can access tag list endpoint')
    tag_list = response.json()['payload']['items']
    assert len(tag_list) == 0, 'No-access user should see empty tag list'

    # Final cleanup by creator (ADMIN permission)
    response = test_client.delete(f'/api/v1/tag/{tag_id}', headers=creator_headers)
    assert_permission_granted(response, 'Creator can delete tag (ADMIN permission)')


@pytest.mark.asyncio
async def test_search_direct_sharing(
    test_client: 'TestClient',
) -> None:
    """Test 6.4: Search Direct Sharing

    Verify that saved searches can be shared directly using VIEW/EDIT/ADMIN permissions,
    enabling collaborative search management independent of any other system permissions
    """
    import pm.models as m

    # Create groups
    groups = await prepare_acl_groups(
        {
            'viewers': {'description': 'Search viewers group', 'global_roles': []},
            'editors': {'description': 'Search editors group', 'global_roles': []},
        }
    )

    # Create users
    users = await prepare_acl_users(
        {
            'creator': {
                'email': 'creator@example.com',
                'is_admin': False,
                'global_roles': [],
                'groups': [],
            },
            'viewer': {
                'email': 'viewer@example.com',
                'is_admin': False,
                'global_roles': [],
                'groups': [groups['viewers'].id],
            },
            'editor': {
                'email': 'editor@example.com',
                'is_admin': False,
                'global_roles': [],
                'groups': [groups['editors'].id],
            },
            'no_access_user': {
                'email': 'noaccess@example.com',
                'is_admin': False,
                'global_roles': [],
                'groups': [],
            },
        }
    )

    # Get user credentials
    creator_user, creator_token = users['creator']
    creator_headers = make_user_headers(creator_token)

    viewer_user, viewer_token = users['viewer']
    viewer_headers = make_user_headers(viewer_token)

    editor_user, editor_token = users['editor']
    editor_headers = make_user_headers(editor_token)

    no_access_user, no_access_token = users['no_access_user']
    no_access_headers = make_user_headers(no_access_token)

    # Test search creation and ownership
    response = test_client.post(
        '/api/v1/search/',
        headers=creator_headers,
        json={
            'name': 'Empty Search',
            'description': 'Search with empty query',
            'query': '',
        },
    )
    assert_permission_granted(response, 'Creator search creation')
    search_id = response.json()['payload']['id']

    # Verify creator automatically gets ADMIN permission on search
    response = test_client.get(f'/api/v1/search/{search_id}', headers=creator_headers)
    assert_permission_granted(response, 'Creator search access')
    search_data = response.json()['payload']
    assert search_data['current_permission'] == m.PermissionType.ADMIN, (
        'Creator should have ADMIN permission on created search'
    )

    # Test hierarchical sharing - Give EDIT permission to editors group
    response = test_client.post(
        f'/api/v1/search/{search_id}/permission',
        headers=creator_headers,
        json={
            'target_type': 'group',
            'target': str(groups['editors'].id),
            'permission_type': 'edit',
        },
    )
    assert_permission_granted(response, 'Creator grant EDIT to editors')

    # Give VIEW permission to viewers group
    response = test_client.post(
        f'/api/v1/search/{search_id}/permission',
        headers=creator_headers,
        json={
            'target_type': 'group',
            'target': str(groups['viewers'].id),
            'permission_type': 'view',
        },
    )
    assert_permission_granted(response, 'Creator grant VIEW to viewers')

    # Test VIEW permission capabilities - Verify viewer can view search definition and use search
    response = test_client.get(f'/api/v1/search/{search_id}', headers=viewer_headers)
    assert_permission_granted(response, 'Viewer search view access')
    viewer_search_data = response.json()['payload']
    assert viewer_search_data['current_permission'] == m.PermissionType.VIEW, (
        'Viewer should have VIEW permission on search'
    )

    # Verify viewer cannot modify search criteria
    response = test_client.put(
        f'/api/v1/search/{search_id}',
        headers=viewer_headers,
        json={
            'name': 'Modified Empty Search',
            'query': '',
        },
    )
    assert_permission_denied(response, 'Viewer cannot modify search (VIEW only)')

    # Verify viewer cannot manage permissions
    response = test_client.post(
        f'/api/v1/search/{search_id}/permission',
        headers=viewer_headers,
        json={
            'target_type': 'user',
            'target': str(viewer_user.id),
            'permission_type': 'admin',
        },
    )
    assert_permission_denied(response, 'Viewer cannot manage permissions (VIEW only)')

    # Test EDIT permission capabilities - Verify editor can view and modify search criteria
    response = test_client.get(f'/api/v1/search/{search_id}', headers=editor_headers)
    assert_permission_granted(response, 'Editor search view access')
    editor_search_data = response.json()['payload']
    assert editor_search_data['current_permission'] == m.PermissionType.EDIT, (
        'Editor should have EDIT permission on search'
    )

    # Verify editor can modify search criteria
    response = test_client.put(
        f'/api/v1/search/{search_id}',
        headers=editor_headers,
        json={
            'name': 'Empty Search - Enhanced',
            'description': 'Enhanced search with additional criteria',
            'query': '',
        },
    )
    assert_permission_granted(response, 'Editor can modify search (EDIT permission)')

    # Verify editor cannot delete search or change sharing permissions
    response = test_client.delete(f'/api/v1/search/{search_id}', headers=editor_headers)
    assert_permission_denied(
        response, 'Editor cannot delete search (EDIT only, needs ADMIN)'
    )

    response = test_client.post(
        f'/api/v1/search/{search_id}/permission',
        headers=editor_headers,
        json={
            'target_type': 'user',
            'target': str(editor_user.id),
            'permission_type': 'admin',
        },
    )
    assert_permission_denied(
        response, 'Editor cannot manage permissions (EDIT only, needs ADMIN)'
    )

    # Test no-access user cannot access shared search and has empty search list
    response = test_client.get(f'/api/v1/search/{search_id}', headers=no_access_headers)
    assert_permission_denied(response, 'No-access user cannot view search')

    response = test_client.get('/api/v1/search/list', headers=no_access_headers)
    assert_permission_granted(
        response, 'No-access user can access search list endpoint'
    )
    search_list = response.json()['payload']['items']
    assert len(search_list) == 0, 'No-access user should see empty search list'

    # Test ADMIN permission capabilities - Verify creator can delete search
    response = test_client.delete(
        f'/api/v1/search/{search_id}', headers=creator_headers
    )
    assert_permission_granted(response, 'Creator can delete search (ADMIN permission)')
