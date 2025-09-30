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
    _create_project,
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
    assert len(dashboard['tiles']) == 0  # Dashboards are created without tiles

    # Check permissions - creator should have ADMIN permission
    assert dashboard['current_permission'] == 'admin'
    assert len(dashboard['permissions']) == 1
    assert dashboard['permissions'][0]['permission_type'] == 'admin'


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
    assert len(dashboard['tiles']) == 0  # Tiles managed separately


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
    }

    response = test_client.put(
        f'/api/v1/dashboard/{dashboard_id}', headers=headers, json=update_data
    )
    assert response.status_code == 200

    data = response.json()
    dashboard = data['payload']

    assert dashboard['name'] == 'Updated Dashboard'
    assert dashboard['description'] == 'Updated description'
    assert len(dashboard['tiles']) == 0  # Tiles managed separately


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


# Nested Tile CRUD Tests


@pytest.mark.asyncio
async def test_list_tiles_empty_dashboard(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
) -> None:
    """Test listing tiles in an empty dashboard."""
    admin_user, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}

    # Create dashboard
    dashboard_data = {'name': 'Empty Dashboard', 'description': 'No tiles yet'}
    response = test_client.post(
        '/api/v1/dashboard/', headers=headers, json=dashboard_data
    )
    assert response.status_code == 200
    dashboard_id = response.json()['payload']['id']

    # List tiles - should be empty
    response = test_client.get(
        f'/api/v1/dashboard/{dashboard_id}/tile/list', headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data['payload']['count'] == 0
    assert len(data['payload']['items']) == 0


@pytest.mark.asyncio
async def test_create_issue_tile(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
) -> None:
    """Test creating a tile in a dashboard."""
    admin_user, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}

    # Create dashboard
    dashboard_data = {'name': 'Test Dashboard', 'description': 'For tile testing'}
    response = test_client.post(
        '/api/v1/dashboard/', headers=headers, json=dashboard_data
    )
    assert response.status_code == 200
    dashboard_id = response.json()['payload']['id']

    # Create tile
    tile_data = {
        'type': 'issue_list',
        'name': 'My Issues',
        'query': '#assigned-to-me',
        'ui_settings': {'color': 'blue', 'position': {'x': 0, 'y': 0}},
    }

    response = test_client.post(
        f'/api/v1/dashboard/{dashboard_id}/tile', headers=headers, json=tile_data
    )
    assert response.status_code == 200
    data = response.json()
    tile = data['payload']

    assert tile['type'] == 'issue_list'
    assert tile['name'] == 'My Issues'
    assert tile['query'] == '#assigned-to-me'
    assert tile['ui_settings'] == {'color': 'blue', 'position': {'x': 0, 'y': 0}}
    assert 'id' in tile

    # Verify tile appears in dashboard
    response = test_client.get(f'/api/v1/dashboard/{dashboard_id}', headers=headers)
    assert response.status_code == 200
    dashboard = response.json()['payload']
    assert len(dashboard['tiles']) == 1
    assert dashboard['tiles'][0]['name'] == 'My Issues'


@pytest.mark.asyncio
async def test_create_issue_tile_invalid_query(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
) -> None:
    """Test creating a tile with invalid query fails."""
    admin_user, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}

    # Create dashboard
    dashboard_data = {'name': 'Test Dashboard'}
    response = test_client.post(
        '/api/v1/dashboard/', headers=headers, json=dashboard_data
    )
    assert response.status_code == 200
    dashboard_id = response.json()['payload']['id']

    # Try to create tile with invalid query
    tile_data = {
        'type': 'issue_list',
        'name': 'Invalid Tile',
        'query': 'invalid_syntax (',  # Invalid syntax
    }

    response = test_client.post(
        f'/api/v1/dashboard/{dashboard_id}/tile', headers=headers, json=tile_data
    )
    assert response.status_code == 400
    error_data = response.json()
    assert 'Invalid query' in error_data['error_messages'][0]


@pytest.mark.asyncio
async def test_get_tile(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
) -> None:
    """Test getting a specific tile by ID."""
    admin_user, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}

    # Create dashboard and tile
    dashboard_data = {'name': 'Test Dashboard'}
    response = test_client.post(
        '/api/v1/dashboard/', headers=headers, json=dashboard_data
    )
    dashboard_id = response.json()['payload']['id']

    tile_data = {
        'type': 'issue_list',
        'name': 'Specific Tile',
        'query': '#high-priority',
        'ui_settings': {'theme': 'dark'},
    }

    response = test_client.post(
        f'/api/v1/dashboard/{dashboard_id}/tile', headers=headers, json=tile_data
    )
    assert response.status_code == 200
    tile_id = response.json()['payload']['id']

    # Get the specific tile
    response = test_client.get(
        f'/api/v1/dashboard/{dashboard_id}/tile/{tile_id}', headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    tile = data['payload']

    assert tile['id'] == tile_id
    assert tile['name'] == 'Specific Tile'
    assert tile['query'] == '#high-priority'
    assert tile['ui_settings'] == {'theme': 'dark'}


@pytest.mark.asyncio
async def test_get_nonexistent_tile(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
) -> None:
    """Test getting a non-existent tile returns 404."""
    admin_user, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}

    # Create dashboard
    dashboard_data = {'name': 'Test Dashboard'}
    response = test_client.post(
        '/api/v1/dashboard/', headers=headers, json=dashboard_data
    )
    dashboard_id = response.json()['payload']['id']

    # Try to get non-existent tile
    fake_tile_id = str(uuid.uuid4())
    response = test_client.get(
        f'/api/v1/dashboard/{dashboard_id}/tile/{fake_tile_id}', headers=headers
    )
    assert response.status_code == 404
    assert 'Tile not found' in response.json()['error_messages'][0]


@pytest.mark.asyncio
async def test_update_issue_tile(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
) -> None:
    """Test updating a tile."""
    admin_user, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}

    # Create dashboard and tile
    dashboard_data = {'name': 'Test Dashboard'}
    response = test_client.post(
        '/api/v1/dashboard/', headers=headers, json=dashboard_data
    )
    dashboard_id = response.json()['payload']['id']

    tile_data = {
        'type': 'issue_list',
        'name': 'Original Tile',
        'query': '#bug',
        'ui_settings': {'color': 'red'},
    }

    response = test_client.post(
        f'/api/v1/dashboard/{dashboard_id}/tile', headers=headers, json=tile_data
    )
    tile_id = response.json()['payload']['id']

    # Update tile
    update_data = {
        'type': 'issue_list',
        'name': 'Updated Tile',
        'query': '#bug #high-priority',
        'ui_settings': {'color': 'orange', 'size': 'large'},
    }

    response = test_client.put(
        f'/api/v1/dashboard/{dashboard_id}/tile/{tile_id}',
        headers=headers,
        json=update_data,
    )
    assert response.status_code == 200
    data = response.json()
    tile = data['payload']

    assert tile['name'] == 'Updated Tile'
    assert tile['query'] == '#bug #high-priority'
    assert tile['ui_settings'] == {'color': 'orange', 'size': 'large'}


@pytest.mark.asyncio
async def test_update_issue_tile_invalid_query(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
) -> None:
    """Test updating a tile with invalid query fails."""
    admin_user, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}

    # Create dashboard and tile
    dashboard_data = {'name': 'Test Dashboard'}
    response = test_client.post(
        '/api/v1/dashboard/', headers=headers, json=dashboard_data
    )
    dashboard_id = response.json()['payload']['id']

    tile_data = {'type': 'issue_list', 'name': 'Test Tile', 'query': '#valid'}

    response = test_client.post(
        f'/api/v1/dashboard/{dashboard_id}/tile', headers=headers, json=tile_data
    )
    tile_id = response.json()['payload']['id']

    # Try to update with invalid query
    update_data = {
        'type': 'issue_list',
        'query': 'invalid_syntax (',
    }

    response = test_client.put(
        f'/api/v1/dashboard/{dashboard_id}/tile/{tile_id}',
        headers=headers,
        json=update_data,
    )
    assert response.status_code == 400
    assert 'Invalid query' in response.json()['error_messages'][0]


@pytest.mark.asyncio
async def test_delete_tile(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
) -> None:
    """Test deleting a tile."""
    admin_user, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}

    # Create dashboard and tiles
    dashboard_data = {'name': 'Test Dashboard'}
    response = test_client.post(
        '/api/v1/dashboard/', headers=headers, json=dashboard_data
    )
    dashboard_id = response.json()['payload']['id']

    # Create two tiles
    tile1_data = {'type': 'issue_list', 'name': 'Tile 1', 'query': '#bug'}
    tile2_data = {'type': 'issue_list', 'name': 'Tile 2', 'query': '#feature'}

    response1 = test_client.post(
        f'/api/v1/dashboard/{dashboard_id}/tile', headers=headers, json=tile1_data
    )
    test_client.post(
        f'/api/v1/dashboard/{dashboard_id}/tile', headers=headers, json=tile2_data
    )

    tile1_id = response1.json()['payload']['id']

    # Verify both tiles exist
    response = test_client.get(
        f'/api/v1/dashboard/{dashboard_id}/tile/list', headers=headers
    )
    assert response.json()['payload']['count'] == 2

    # Delete first tile
    response = test_client.delete(
        f'/api/v1/dashboard/{dashboard_id}/tile/{tile1_id}', headers=headers
    )
    assert response.status_code == 200

    # Verify only one tile remains
    response = test_client.get(
        f'/api/v1/dashboard/{dashboard_id}/tile/list', headers=headers
    )
    data = response.json()
    assert data['payload']['count'] == 1
    assert data['payload']['items'][0]['name'] == 'Tile 2'

    # Try to get deleted tile - should return 404
    response = test_client.get(
        f'/api/v1/dashboard/{dashboard_id}/tile/{tile1_id}', headers=headers
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_tile_operations_permission_denied(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    create_test_user: tuple[str, str],
) -> None:
    """Test tile operations require appropriate dashboard permissions."""
    admin_user, admin_token = create_initial_admin
    test_user, test_token = create_test_user
    admin_headers = {'Authorization': f'Bearer {admin_token}'}
    test_headers = {'Authorization': f'Bearer {test_token}'}

    # Admin creates dashboard
    dashboard_data = {'name': 'Admin Dashboard'}
    response = test_client.post(
        '/api/v1/dashboard/', headers=admin_headers, json=dashboard_data
    )
    dashboard_id = response.json()['payload']['id']

    # Test user tries to list tiles - should fail
    response = test_client.get(
        f'/api/v1/dashboard/{dashboard_id}/tile/list', headers=test_headers
    )
    assert response.status_code == 403

    # Test user tries to create tile - should fail
    tile_data = {'type': 'issue_list', 'name': 'Unauthorized Tile', 'query': '#test'}
    response = test_client.post(
        f'/api/v1/dashboard/{dashboard_id}/tile', headers=test_headers, json=tile_data
    )
    assert response.status_code == 403

    # Admin creates a tile first
    response = test_client.post(
        f'/api/v1/dashboard/{dashboard_id}/tile', headers=admin_headers, json=tile_data
    )
    tile_id = response.json()['payload']['id']

    # Test user tries to get tile - should fail
    response = test_client.get(
        f'/api/v1/dashboard/{dashboard_id}/tile/{tile_id}', headers=test_headers
    )
    assert response.status_code == 403

    # Test user tries to update tile - should fail
    update_data = {
        'type': 'issue_list',
        'name': 'Updated by test user',
    }
    response = test_client.put(
        f'/api/v1/dashboard/{dashboard_id}/tile/{tile_id}',
        headers=test_headers,
        json=update_data,
    )
    assert response.status_code == 403

    # Test user tries to delete tile - should fail
    response = test_client.delete(
        f'/api/v1/dashboard/{dashboard_id}/tile/{tile_id}', headers=test_headers
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_tile_operations_with_view_permission(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    create_test_user: tuple[str, str],
) -> None:
    """Test that VIEW permission allows reading tiles but not modifying them."""
    admin_user, admin_token = create_initial_admin
    test_user, test_token = create_test_user
    admin_headers = {'Authorization': f'Bearer {admin_token}'}
    test_headers = {'Authorization': f'Bearer {test_token}'}

    # Admin creates dashboard and grants VIEW permission to test user
    dashboard_data = {'name': 'Shared Dashboard'}
    response = test_client.post(
        '/api/v1/dashboard/', headers=admin_headers, json=dashboard_data
    )
    dashboard_id = response.json()['payload']['id']

    # Grant VIEW permission to test user
    permission_data = {
        'target_type': 'user',
        'target': test_user,
        'permission_type': 'view',
    }
    response = test_client.post(
        f'/api/v1/dashboard/{dashboard_id}/permission',
        headers=admin_headers,
        json=permission_data,
    )
    assert response.status_code == 200

    # Admin creates a tile
    tile_data = {'type': 'issue_list', 'name': 'Shared Tile', 'query': '#shared'}
    response = test_client.post(
        f'/api/v1/dashboard/{dashboard_id}/tile', headers=admin_headers, json=tile_data
    )
    tile_id = response.json()['payload']['id']

    # Test user can list tiles
    response = test_client.get(
        f'/api/v1/dashboard/{dashboard_id}/tile/list', headers=test_headers
    )
    assert response.status_code == 200
    assert response.json()['payload']['count'] == 1

    # Test user can get specific tile
    response = test_client.get(
        f'/api/v1/dashboard/{dashboard_id}/tile/{tile_id}', headers=test_headers
    )
    assert response.status_code == 200

    # Test user cannot create tile
    new_tile_data = {'type': 'issue_list', 'name': 'New Tile', 'query': '#new'}
    response = test_client.post(
        f'/api/v1/dashboard/{dashboard_id}/tile',
        headers=test_headers,
        json=new_tile_data,
    )
    assert response.status_code == 403

    # Test user cannot update tile
    update_data = {
        'type': 'issue_list',
        'name': 'Modified Tile',
    }
    response = test_client.put(
        f'/api/v1/dashboard/{dashboard_id}/tile/{tile_id}',
        headers=test_headers,
        json=update_data,
    )
    assert response.status_code == 403

    # Test user cannot delete tile
    response = test_client.delete(
        f'/api/v1/dashboard/{dashboard_id}/tile/{tile_id}', headers=test_headers
    )
    assert response.status_code == 403


@pytest_asyncio.fixture
async def create_test_project(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
) -> str:
    """Create a test project for report tests."""
    project_payload = {
        'name': 'Report Tile Test Project',
        'slug': 'report_tile_test',
        'description': 'Test project for report tiles',
        'ai_description': 'AI description for report tile project',
    }
    return await _create_project(test_client, create_initial_admin, project_payload)


@pytest_asyncio.fixture
async def create_test_report(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    create_test_project: str,
) -> str:
    """Create a test report for tile tests."""
    admin_user, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}

    report_data = {
        'name': 'Test Report for Tiles',
        'description': 'A test report for dashboard tiles',
        'projects': [create_test_project],
        'axis_1': {'type': 'project'},
        'ui_settings': {'report_type': 'table'},
    }

    response = test_client.post('/api/v1/report/', headers=headers, json=report_data)
    assert response.status_code == 200
    return response.json()['payload']['id']


@pytest.mark.asyncio
async def test_create_report_tile(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    create_test_report: str,
) -> None:
    """Test creating a report tile in a dashboard."""
    admin_user, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}

    # Create dashboard first
    dashboard_data = {
        'name': 'Test Dashboard for Report Tiles',
        'description': 'A test dashboard for report tile testing',
    }
    response = test_client.post(
        '/api/v1/dashboard/', headers=headers, json=dashboard_data
    )
    assert response.status_code == 200
    dashboard_id = response.json()['payload']['id']

    tile_data = {
        'type': 'report',
        'name': 'Test Report Tile',
        'report_id': create_test_report,
        'ui_settings': {'height': 300},
    }

    response = test_client.post(
        f'/api/v1/dashboard/{dashboard_id}/tile',
        headers=headers,
        json=tile_data,
    )
    assert response.status_code == 200

    data = response.json()
    assert data['success'] is True
    assert data['payload']['type'] == 'report'
    assert data['payload']['name'] == 'Test Report Tile'
    assert data['payload']['report']['id'] == create_test_report
    assert data['payload']['report']['name'] == 'Test Report for Tiles'

    # Verify dashboard has the tile
    response = test_client.get(f'/api/v1/dashboard/{dashboard_id}', headers=headers)
    assert response.status_code == 200
    dashboard = response.json()['payload']
    assert len(dashboard['tiles']) == 1
    assert dashboard['tiles'][0]['type'] == 'report'


@pytest.mark.asyncio
async def test_create_report_tile_invalid_report(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
) -> None:
    """Test creating a report tile with a nonexistent report."""
    admin_user, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}

    # Create dashboard first
    dashboard_data = {
        'name': 'Test Dashboard for Report Tiles',
        'description': 'A test dashboard for report tile testing',
    }
    response = test_client.post(
        '/api/v1/dashboard/', headers=headers, json=dashboard_data
    )
    assert response.status_code == 200
    dashboard_id = response.json()['payload']['id']

    tile_data = {
        'type': 'report',
        'name': 'Test Report Tile',
        'report_id': UNKNOWN_ID,  # Nonexistent report ID
        'ui_settings': {'height': 300},
    }

    response = test_client.post(
        f'/api/v1/dashboard/{dashboard_id}/tile',
        headers=headers,
        json=tile_data,
    )
    assert response.status_code == 400
    error_data = response.json()
    assert f'Report {UNKNOWN_ID} not found' in error_data['error_messages'][0]


@pytest.mark.asyncio
async def test_update_report_tile(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    create_test_report: str,
) -> None:
    """Test updating a report tile."""
    admin_user, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}

    # Create dashboard first
    dashboard_data = {
        'name': 'Test Dashboard for Report Tiles',
        'description': 'A test dashboard for report tile testing',
    }
    response = test_client.post(
        '/api/v1/dashboard/', headers=headers, json=dashboard_data
    )
    assert response.status_code == 200
    dashboard_id = response.json()['payload']['id']

    # Create a report tile first
    tile_data = {
        'type': 'report',
        'name': 'Original Report Tile',
        'report_id': create_test_report,
        'ui_settings': {'height': 300},
    }

    response = test_client.post(
        f'/api/v1/dashboard/{dashboard_id}/tile',
        headers=headers,
        json=tile_data,
    )
    assert response.status_code == 200
    tile_id = response.json()['payload']['id']

    # Update the tile using discriminated union
    update_data = {
        'type': 'report',
        'name': 'Updated Report Tile Name',
        'ui_settings': {'height': 400},
    }

    response = test_client.put(
        f'/api/v1/dashboard/{dashboard_id}/tile/{tile_id}',
        headers=headers,
        json=update_data,
    )
    assert response.status_code == 200

    data = response.json()
    assert data['success'] is True
    assert data['payload']['name'] == 'Updated Report Tile Name'
    assert data['payload']['ui_settings']['height'] == 400
    # Report should remain the same
    assert data['payload']['report']['id'] == create_test_report


@pytest.mark.asyncio
async def test_update_report_tile_wrong_type(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    create_test_report: str,
) -> None:
    """Test updating report tile with wrong type fails."""
    admin_user, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}

    # Create dashboard first
    dashboard_data = {
        'name': 'Test Dashboard for Report Tiles',
        'description': 'A test dashboard for report tile testing',
    }
    response = test_client.post(
        '/api/v1/dashboard/', headers=headers, json=dashboard_data
    )
    assert response.status_code == 200
    dashboard_id = response.json()['payload']['id']

    # Create a report tile first
    tile_data = {
        'type': 'report',
        'name': 'Report Tile',
        'report_id': create_test_report,
        'ui_settings': {'height': 300},
    }

    response = test_client.post(
        f'/api/v1/dashboard/{dashboard_id}/tile',
        headers=headers,
        json=tile_data,
    )
    assert response.status_code == 200
    tile_id = response.json()['payload']['id']

    # Try to update with issue list data - should fail
    update_data = {
        'type': 'issue_list',
        'name': 'Should Fail',
        'query': '#assigned-to-me',
    }

    response = test_client.put(
        f'/api/v1/dashboard/{dashboard_id}/tile/{tile_id}',
        headers=headers,
        json=update_data,
    )
    assert response.status_code == 400
    error_data = response.json()
    assert (
        'Cannot update non-issue-list tile with issue list data'
        in error_data['error_messages'][0]
    )
