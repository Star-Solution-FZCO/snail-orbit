"""
Integration tests for Dashboard API endpoints covering CRUD operations,
tile management, and access control.
"""

import uuid
from typing import TYPE_CHECKING

import pytest
import pytest_asyncio

from .create import (
    _create_group,
)
from .test_api import create_initial_admin

if TYPE_CHECKING:
    from fastapi.testclient import TestClient

UNKNOWN_ID = '675579dff68118dbf878902c'


@pytest_asyncio.fixture
async def create_test_user(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
) -> tuple[str, str]:
    """Create a test user for dashboard tests."""
    # Import the User model to create user directly like in the admin fixture
    from pm.models import User, UserOriginType

    user = User(
        email='dashboard@test.com',
        name='Dashboard Test User',
        is_active=True,
        is_admin=False,
        origin=UserOriginType.LOCAL,
    )
    await user.insert()
    token, token_obj = user.gen_new_api_token('test_token')
    user.api_tokens.append(token_obj)
    await user.save()

    return str(user.id), token


@pytest_asyncio.fixture
async def create_test_group(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
) -> str:
    """Create a test group for sharing tests."""
    group_payload = {
        'name': 'Dashboard Test Group',
        'description': 'Group for dashboard sharing tests',
    }
    return await _create_group(test_client, create_initial_admin, group_payload)


@pytest.mark.asyncio
async def test_create_dashboard(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
) -> None:
    """Test creating a new dashboard with tiles."""
    admin_user, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}

    dashboard_data = {
        'name': 'Test Dashboard',
        'description': 'A test dashboard for development',
        'tiles': [
            {
                'type': 'issue_list',
                'name': 'All Issues',
                'query': '',  # Empty query to get all issues
            },
            {
                'type': 'issue_list',
                'name': 'Resolved Issues',
                'query': '#resolved',  # Use hashtag which should be available
            },
        ],
    }

    response = test_client.post(
        '/api/v1/dashboard/', headers=headers, json=dashboard_data
    )
    if response.status_code != 200:
        print(f'Error response: {response.json()}')
    assert response.status_code == 200

    data = response.json()
    assert 'payload' in data
    dashboard = data['payload']

    assert dashboard['name'] == 'Test Dashboard'
    assert dashboard['description'] == 'A test dashboard for development'
    assert len(dashboard['tiles']) == 2

    # Check first tile
    tile1 = dashboard['tiles'][0]
    assert tile1['type'] == 'issue_list'
    assert tile1['name'] == 'All Issues'
    assert tile1['query'] == ''
    # Issues should not be included - frontend will handle queries
    assert 'issues' not in tile1
    # Position should not be included - not needed
    assert 'position' not in tile1

    # Check permissions - creator should have ADMIN permission
    assert dashboard['current_permission'] == 'admin'
    assert len(dashboard['permissions']) == 1
    assert dashboard['permissions'][0]['permission_type'] == 'admin'


@pytest.mark.asyncio
async def test_create_dashboard_invalid_query(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
) -> None:
    """Test creating dashboard with invalid query fails."""
    admin_user, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}

    dashboard_data = {
        'name': 'Test Dashboard',
        'tiles': [
            {
                'type': 'issue_list',
                'name': 'Invalid Query Tile',
                'position': 0,
                'query': 'invalid_syntax (',  # Invalid query syntax
            },
        ],
    }

    response = test_client.post(
        '/api/v1/dashboard/', headers=headers, json=dashboard_data
    )
    if response.status_code != 400:
        print(f'Unexpected response: {response.json()}')
    assert response.status_code == 400
    response_data = response.json()
    print(f'Error response: {response_data}')
    # The actual error might be in 'error_messages' instead of 'detail'
    error_text = response_data.get('detail', '') or str(
        response_data.get('error_messages', '')
    )
    assert 'Invalid query' in error_text or 'query' in error_text.lower()


@pytest.mark.asyncio
async def test_list_dashboards(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
) -> None:
    """Test listing dashboards."""
    admin_user, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}

    # Create test dashboards
    dashboard_names = ['Dashboard A', 'Dashboard B', 'Dashboard C']
    for name in dashboard_names:
        dashboard_data = {
            'name': name,
            'description': f'Description for {name}',
            'tiles': [],
        }
        response = test_client.post(
            '/api/v1/dashboard/', headers=headers, json=dashboard_data
        )
        assert response.status_code == 200

    # List dashboards
    response = test_client.get('/api/v1/dashboard/list', headers=headers)
    assert response.status_code == 200

    data = response.json()
    assert 'payload' in data
    dashboards = data['payload']['items']

    assert len(dashboards) == 3
    # Should be sorted by name
    assert dashboards[0]['name'] == 'Dashboard A'
    assert dashboards[1]['name'] == 'Dashboard B'
    assert dashboards[2]['name'] == 'Dashboard C'


@pytest.mark.asyncio
async def test_get_dashboard(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
) -> None:
    """Test getting a specific dashboard."""
    admin_user, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}

    # Create dashboard
    dashboard_data = {
        'name': 'Get Test Dashboard',
        'description': 'Dashboard for get testing',
        'tiles': [
            {
                'type': 'issue_list',
                'name': 'Test Tile',
                'position': 0,
                'query': '',
            },
        ],
    }

    create_response = test_client.post(
        '/api/v1/dashboard/', headers=headers, json=dashboard_data
    )
    assert create_response.status_code == 200
    dashboard_id = create_response.json()['payload']['id']

    # Get dashboard
    response = test_client.get(f'/api/v1/dashboard/{dashboard_id}', headers=headers)
    assert response.status_code == 200

    data = response.json()
    dashboard = data['payload']

    assert dashboard['name'] == 'Get Test Dashboard'
    assert dashboard['description'] == 'Dashboard for get testing'
    assert len(dashboard['tiles']) == 1
    assert dashboard['tiles'][0]['name'] == 'Test Tile'


@pytest.mark.asyncio
async def test_get_nonexistent_dashboard(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
) -> None:
    """Test getting non-existent dashboard returns 404."""
    admin_user, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}

    response = test_client.get(f'/api/v1/dashboard/{UNKNOWN_ID}', headers=headers)
    assert response.status_code == 404
    response_data = response.json()
    # Handle different error response formats
    error_messages = response_data.get('error_messages', [])
    assert 'Dashboard not found' in error_messages


@pytest.mark.asyncio
async def test_update_dashboard(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
) -> None:
    """Test updating a dashboard."""
    admin_user, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}

    # Create dashboard
    dashboard_data = {
        'name': 'Original Dashboard',
        'description': 'Original description',
        'tiles': [
            {
                'type': 'issue_list',
                'name': 'Original Tile',
                'position': 0,
                'query': '',
            },
        ],
    }

    create_response = test_client.post(
        '/api/v1/dashboard/', headers=headers, json=dashboard_data
    )
    assert create_response.status_code == 200
    dashboard_id = create_response.json()['payload']['id']

    # Update dashboard
    update_data = {
        'name': 'Updated Dashboard',
        'description': 'Updated description',
        'tiles': [
            {
                'type': 'issue_list',
                'name': 'Updated Tile',
                'position': 0,
                'query': '#resolved',
            },
            {
                'type': 'issue_list',
                'name': 'New Tile',
                'position': 1,
                'query': '#unresolved',
            },
        ],
    }

    response = test_client.put(
        f'/api/v1/dashboard/{dashboard_id}', headers=headers, json=update_data
    )
    assert response.status_code == 200

    data = response.json()
    dashboard = data['payload']

    assert dashboard['name'] == 'Updated Dashboard'
    assert dashboard['description'] == 'Updated description'
    assert len(dashboard['tiles']) == 2
    assert dashboard['tiles'][0]['name'] == 'Updated Tile'
    assert dashboard['tiles'][1]['name'] == 'New Tile'


@pytest.mark.asyncio
async def test_delete_dashboard(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
) -> None:
    """Test deleting a dashboard."""
    admin_user, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}

    # Create dashboard
    dashboard_data = {
        'name': 'Dashboard to Delete',
        'tiles': [],
    }

    create_response = test_client.post(
        '/api/v1/dashboard/', headers=headers, json=dashboard_data
    )
    assert create_response.status_code == 200
    dashboard_id = create_response.json()['payload']['id']

    # Delete dashboard
    response = test_client.delete(f'/api/v1/dashboard/{dashboard_id}', headers=headers)
    assert response.status_code == 200

    # Verify deletion
    get_response = test_client.get(f'/api/v1/dashboard/{dashboard_id}', headers=headers)
    assert get_response.status_code == 404


@pytest.mark.asyncio
async def test_dashboard_permissions_grant_view(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    create_test_user: tuple[str, str],
) -> None:
    """Test granting VIEW permission to a user."""
    admin_user, admin_token = create_initial_admin
    test_user_id, test_user_token = create_test_user
    admin_headers = {'Authorization': f'Bearer {admin_token}'}
    user_headers = {'Authorization': f'Bearer {test_user_token}'}

    # Create dashboard as admin
    dashboard_data = {
        'name': 'Shared Dashboard',
        'tiles': [],
    }

    create_response = test_client.post(
        '/api/v1/dashboard/', headers=admin_headers, json=dashboard_data
    )
    assert create_response.status_code == 200
    dashboard_id = create_response.json()['payload']['id']

    # Test user cannot access initially
    response = test_client.get(
        f'/api/v1/dashboard/{dashboard_id}', headers=user_headers
    )
    assert response.status_code == 403

    # Grant VIEW permission
    permission_data = {
        'target_type': 'user',
        'target': test_user_id,
        'permission_type': 'view',
    }

    response = test_client.post(
        f'/api/v1/dashboard/{dashboard_id}/permission',
        headers=admin_headers,
        json=permission_data,
    )
    assert response.status_code == 200

    # Test user can now view
    response = test_client.get(
        f'/api/v1/dashboard/{dashboard_id}', headers=user_headers
    )
    assert response.status_code == 200
    dashboard = response.json()['payload']
    assert dashboard['current_permission'] == 'view'

    # But cannot edit
    update_data = {'name': 'Attempted Edit'}
    response = test_client.put(
        f'/api/v1/dashboard/{dashboard_id}', headers=user_headers, json=update_data
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_dashboard_permissions_grant_edit(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    create_test_user: tuple[str, str],
) -> None:
    """Test granting EDIT permission to a user."""
    admin_user, admin_token = create_initial_admin
    test_user_id, test_user_token = create_test_user
    admin_headers = {'Authorization': f'Bearer {admin_token}'}
    user_headers = {'Authorization': f'Bearer {test_user_token}'}

    # Create dashboard as admin
    dashboard_data = {
        'name': 'Editable Dashboard',
        'tiles': [],
    }

    create_response = test_client.post(
        '/api/v1/dashboard/', headers=admin_headers, json=dashboard_data
    )
    assert create_response.status_code == 200
    dashboard_id = create_response.json()['payload']['id']

    # Grant EDIT permission
    permission_data = {
        'target_type': 'user',
        'target': test_user_id,
        'permission_type': 'edit',
    }

    response = test_client.post(
        f'/api/v1/dashboard/{dashboard_id}/permission',
        headers=admin_headers,
        json=permission_data,
    )
    assert response.status_code == 200

    # Test user can view and edit
    response = test_client.get(
        f'/api/v1/dashboard/{dashboard_id}', headers=user_headers
    )
    assert response.status_code == 200
    dashboard = response.json()['payload']
    assert dashboard['current_permission'] == 'edit'

    update_data = {'name': 'User Edited Dashboard'}
    response = test_client.put(
        f'/api/v1/dashboard/{dashboard_id}', headers=user_headers, json=update_data
    )
    assert response.status_code == 200

    # But cannot delete or manage permissions
    response = test_client.delete(
        f'/api/v1/dashboard/{dashboard_id}', headers=user_headers
    )
    assert response.status_code == 403

    response = test_client.get(
        f'/api/v1/dashboard/{dashboard_id}/permissions', headers=user_headers
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_dashboard_permissions_grant_to_group(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    create_test_group: str,
    create_test_user: tuple[str, str],
) -> None:
    """Test granting permission to a group."""
    admin_user, admin_token = create_initial_admin
    test_user_id, test_user_token = create_test_user
    admin_headers = {'Authorization': f'Bearer {admin_token}'}
    user_headers = {'Authorization': f'Bearer {test_user_token}'}

    # Add user to group first
    response = test_client.post(
        f'/api/v1/group/{create_test_group}/members/{test_user_id}',
        headers=admin_headers,
    )
    assert response.status_code == 200

    # Create dashboard as admin
    dashboard_data = {
        'name': 'Group Shared Dashboard',
        'tiles': [],
    }

    create_response = test_client.post(
        '/api/v1/dashboard/', headers=admin_headers, json=dashboard_data
    )
    assert create_response.status_code == 200
    dashboard_id = create_response.json()['payload']['id']

    # Grant VIEW permission to group
    permission_data = {
        'target_type': 'group',
        'target': create_test_group,
        'permission_type': 'view',
    }

    response = test_client.post(
        f'/api/v1/dashboard/{dashboard_id}/permission',
        headers=admin_headers,
        json=permission_data,
    )
    assert response.status_code == 200

    # Test user can access via group membership
    response = test_client.get(
        f'/api/v1/dashboard/{dashboard_id}', headers=user_headers
    )
    assert response.status_code == 200
    dashboard = response.json()['payload']
    assert dashboard['current_permission'] == 'view'


@pytest.mark.asyncio
async def test_dashboard_permissions_revoke(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    create_test_user: tuple[str, str],
) -> None:
    """Test revoking permission from a user."""
    admin_user, admin_token = create_initial_admin
    test_user_id, test_user_token = create_test_user
    admin_headers = {'Authorization': f'Bearer {admin_token}'}
    user_headers = {'Authorization': f'Bearer {test_user_token}'}

    # Create dashboard as admin
    dashboard_data = {
        'name': 'Permission Revoke Test',
        'tiles': [],
    }

    create_response = test_client.post(
        '/api/v1/dashboard/', headers=admin_headers, json=dashboard_data
    )
    assert create_response.status_code == 200
    dashboard_id = create_response.json()['payload']['id']

    # Grant permission
    permission_data = {
        'target_type': 'user',
        'target': test_user_id,
        'permission_type': 'view',
    }

    grant_response = test_client.post(
        f'/api/v1/dashboard/{dashboard_id}/permission',
        headers=admin_headers,
        json=permission_data,
    )
    assert grant_response.status_code == 200
    permission_id = grant_response.json()['payload']['id']

    # Verify user can access
    response = test_client.get(
        f'/api/v1/dashboard/{dashboard_id}', headers=user_headers
    )
    assert response.status_code == 200

    # Revoke permission
    response = test_client.delete(
        f'/api/v1/dashboard/{dashboard_id}/permission/{permission_id}',
        headers=admin_headers,
    )
    assert response.status_code == 200

    # Verify user can no longer access
    response = test_client.get(
        f'/api/v1/dashboard/{dashboard_id}', headers=user_headers
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_dashboard_must_have_admin(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
) -> None:
    """Test that dashboard must have at least one admin."""
    admin_user, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}

    # Create dashboard
    dashboard_data = {
        'name': 'Admin Test Dashboard',
        'tiles': [],
    }

    create_response = test_client.post(
        '/api/v1/dashboard/', headers=headers, json=dashboard_data
    )
    assert create_response.status_code == 200
    dashboard_id = create_response.json()['payload']['id']

    # Get the admin permission ID
    permissions_response = test_client.get(
        f'/api/v1/dashboard/{dashboard_id}/permissions', headers=headers
    )
    assert permissions_response.status_code == 200
    permissions = permissions_response.json()['payload']['items']
    admin_permission = next(p for p in permissions if p['permission_type'] == 'admin')

    # Try to revoke the only admin permission - should fail
    response = test_client.delete(
        f'/api/v1/dashboard/{dashboard_id}/permission/{admin_permission["id"]}',
        headers=headers,
    )
    assert response.status_code == 403
    response_data = response.json()
    # Handle different error response formats
    error_messages = response_data.get('error_messages', [])
    assert any('must have at least one admin' in msg for msg in error_messages)


@pytest.mark.asyncio
async def test_dashboard_list_filtering_by_permission(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    create_test_user: tuple[str, str],
) -> None:
    """Test that dashboard list only shows dashboards user has permission to access."""
    admin_user, admin_token = create_initial_admin
    test_user_id, test_user_token = create_test_user
    admin_headers = {'Authorization': f'Bearer {admin_token}'}
    user_headers = {'Authorization': f'Bearer {test_user_token}'}

    # Create multiple dashboards as admin
    dashboard_names = [
        'Admin Only Dashboard',
        'Shared Dashboard',
        'Another Admin Dashboard',
    ]
    dashboard_ids = []

    for name in dashboard_names:
        dashboard_data = {
            'name': name,
            'tiles': [],
        }
        response = test_client.post(
            '/api/v1/dashboard/', headers=admin_headers, json=dashboard_data
        )
        assert response.status_code == 200
        dashboard_ids.append(response.json()['payload']['id'])

    # Share only the second dashboard with test user
    permission_data = {
        'target_type': 'user',
        'target': test_user_id,
        'permission_type': 'view',
    }

    response = test_client.post(
        f'/api/v1/dashboard/{dashboard_ids[1]}/permission',
        headers=admin_headers,
        json=permission_data,
    )
    assert response.status_code == 200

    # Admin should see all dashboards
    response = test_client.get('/api/v1/dashboard/list', headers=admin_headers)
    assert response.status_code == 200
    admin_dashboards = response.json()['payload']['items']
    assert len(admin_dashboards) == 3

    # Test user should only see the shared dashboard
    response = test_client.get('/api/v1/dashboard/list', headers=user_headers)
    assert response.status_code == 200
    user_dashboards = response.json()['payload']['items']
    assert len(user_dashboards) == 1
    assert user_dashboards[0]['name'] == 'Shared Dashboard'
