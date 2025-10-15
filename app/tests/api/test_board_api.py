"""
Integration tests for Board API endpoints covering CRUD operations,
multiproject board creation, columns update, swimlanes, and access control.
"""

import uuid
from typing import TYPE_CHECKING

import pytest
import pytest_asyncio

from .create import (
    ALL_PERMISSIONS,
    _create_group,
    _create_project,
    _create_role,
    _create_user,
)
from .custom_fields import create_custom_fields, link_custom_field_to_project
from .test_api import create_initial_admin

if TYPE_CHECKING:
    from fastapi.testclient import TestClient

UNKNOWN_ID = '675579dff68118dbf878902c'


@pytest_asyncio.fixture
async def create_test_projects(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
) -> list[str]:
    """Create multiple test projects for board tests."""
    project_payloads = [
        {
            'name': 'Project Alpha',
            'slug': 'alpha',
            'description': 'First test project',
            'ai_description': 'AI description for project alpha',
        },
        {
            'name': 'Project Beta',
            'slug': 'beta',
            'description': 'Second test project',
            'ai_description': 'AI description for project beta',
        },
        {
            'name': 'Project Gamma',
            'slug': 'gamma',
            'description': 'Third test project',
            'ai_description': 'AI description for project gamma',
        },
    ]

    project_ids = []
    for payload in project_payloads:
        project_id = await _create_project(test_client, create_initial_admin, payload)
        project_ids.append(project_id)

    return project_ids


@pytest_asyncio.fixture
async def setup_projects_with_fields(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    create_test_projects: list[str],
    create_custom_fields: list[dict],
) -> tuple[list[str], list[dict]]:
    """Link custom fields to all test projects."""
    for project_id in create_test_projects:
        for field_data in create_custom_fields:
            await link_custom_field_to_project(
                test_client,
                create_initial_admin,
                project_id,
                field_data['id'],
            )

    return create_test_projects, create_custom_fields


@pytest_asyncio.fixture
async def create_test_role(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
) -> str:
    """Create a test role with all permissions."""
    role_payload = {
        'name': 'Board Test Role',
        'description': 'Role for board testing',
        'permissions': ALL_PERMISSIONS,
    }
    return await _create_role(test_client, create_initial_admin, role_payload)


@pytest.mark.asyncio
@pytest.mark.parametrize(
    'custom_field_payloads',
    [
        pytest.param(
            [
                {
                    'name': 'Status',
                    'type': 'state',
                    'is_nullable': False,
                    'description': 'Issue status field',
                    'ai_description': 'Field to track issue status',
                    'default_value': None,
                    'options': [
                        {
                            'value': 'New',
                            'color': '#2196F3',
                            'is_archived': False,
                            'is_resolved': False,
                            'is_closed': False,
                        },
                        {
                            'value': 'In Progress',
                            'color': '#FF9800',
                            'is_archived': False,
                            'is_resolved': False,
                            'is_closed': False,
                        },
                        {
                            'value': 'Done',
                            'color': '#4CAF50',
                            'is_archived': False,
                            'is_resolved': True,
                            'is_closed': False,
                        },
                    ],
                },
                {
                    'name': 'Priority',
                    'type': 'enum',
                    'is_nullable': True,
                    'description': 'Issue priority field',
                    'ai_description': 'Field to track issue priority',
                    'default_value': None,
                    'options': [
                        {'value': 'Low', 'color': '#9E9E9E', 'is_archived': False},
                        {'value': 'Medium', 'color': '#FF9800', 'is_archived': False},
                        {'value': 'High', 'color': '#F44336', 'is_archived': False},
                    ],
                },
                {
                    'name': 'Assignee',
                    'type': 'string',
                    'is_nullable': True,
                    'description': 'Issue assignee field',
                    'ai_description': 'Field to track who is assigned to the issue',
                    'default_value': None,
                },
            ],
            id='board_custom_fields',
        ),
    ],
)
async def test_board_crud_operations(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    setup_projects_with_fields: tuple[list[str], list[dict]],
    custom_field_payloads: list[dict],
) -> None:
    """Test basic CRUD operations for boards."""
    admin_id, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
    project_ids, custom_fields = setup_projects_with_fields

    # Use the custom fields in order: Status (state), Priority (enum), Assignee (string)
    status_field = custom_fields[0]  # First field (Status)
    priority_field = custom_fields[1]  # Second field (Priority)
    assignee_field = custom_fields[2]  # Third field (Assignee)

    # Test board creation
    board_payload = {
        'name': 'Test Board',
        'description': 'A test board for CRUD operations',
        'query': None,
        'projects': [project_ids[0]],
        'column_field': status_field['gid'],
        'columns': ['New', 'In Progress', 'Done'],
        'swimlane_field': priority_field['gid'],
        'swimlanes': ['Low', 'Medium', 'High'],
        'card_fields': [assignee_field['gid']],
        'card_colors_fields': [status_field['gid']],
        'ui_settings': {'theme': 'light'},
    }

    response = test_client.post('/api/v1/board', headers=headers, json=board_payload)
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    board_id = data['payload']['id']

    # Verify created board structure
    assert data['payload']['name'] == board_payload['name']
    assert data['payload']['description'] == board_payload['description']
    assert len(data['payload']['projects']) == 1
    assert data['payload']['projects'][0]['id'] == project_ids[0]
    assert data['payload']['created_by']['id'] == admin_id
    assert len(data['payload']['permissions']) == 1
    assert data['payload']['permissions'][0]['permission_type'] == 'admin'

    # Test board retrieval
    response = test_client.get(f'/api/v1/board/{board_id}', headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    assert data['payload']['id'] == board_id
    assert data['payload']['name'] == board_payload['name']

    # Test board update
    update_payload = {
        'name': 'Updated Test Board',
        'description': 'Updated description',
        'projects': project_ids[:2],  # Add second project
        'ui_settings': {'theme': 'dark'},
    }

    response = test_client.put(
        f'/api/v1/board/{board_id}',
        headers=headers,
        json=update_payload,
    )
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    assert data['payload']['name'] == update_payload['name']
    assert data['payload']['description'] == update_payload['description']
    assert len(data['payload']['projects']) == 2
    assert data['payload']['ui_settings']['theme'] == 'dark'

    # Test board list
    response = test_client.get('/api/v1/board/list', headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    assert data['payload']['count'] == 1
    assert data['payload']['items'][0]['id'] == board_id

    # Test board deletion
    response = test_client.delete(f'/api/v1/board/{board_id}', headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    assert data['payload']['id'] == board_id

    # Verify board is deleted
    response = test_client.get(f'/api/v1/board/{board_id}', headers=headers)
    assert response.status_code == 404


@pytest.mark.asyncio
@pytest.mark.parametrize(
    'custom_field_payloads',
    [
        pytest.param(
            [
                {
                    'name': 'Status',
                    'type': 'state',
                    'is_nullable': False,
                    'description': 'Issue status field',
                    'ai_description': 'Field to track issue status',
                    'default_value': None,
                    'options': [
                        {
                            'value': 'New',
                            'color': '#2196F3',
                            'is_archived': False,
                            'is_resolved': False,
                            'is_closed': False,
                        },
                        {
                            'value': 'In Progress',
                            'color': '#FF9800',
                            'is_archived': False,
                            'is_resolved': False,
                            'is_closed': False,
                        },
                        {
                            'value': 'Done',
                            'color': '#4CAF50',
                            'is_archived': False,
                            'is_resolved': True,
                            'is_closed': False,
                        },
                    ],
                },
                {
                    'name': 'Priority',
                    'type': 'enum',
                    'is_nullable': True,
                    'description': 'Issue priority field',
                    'ai_description': 'Field to track issue priority',
                    'default_value': None,
                    'options': [
                        {'value': 'Low', 'color': '#9E9E9E', 'is_archived': False},
                        {'value': 'Medium', 'color': '#FF9800', 'is_archived': False},
                        {'value': 'High', 'color': '#F44336', 'is_archived': False},
                    ],
                },
            ],
            id='board_fields',
        ),
    ],
)
async def test_multiproject_board_creation(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    setup_projects_with_fields: tuple[list[str], list[dict]],
    custom_field_payloads: list[dict],
) -> None:
    """Test creating boards with multiple projects."""
    _, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
    project_ids, custom_fields = setup_projects_with_fields

    status_field = custom_fields[0]  # First field (Status)
    priority_field = custom_fields[1]  # Second field (Priority)

    # Test multiproject board creation
    board_payload = {
        'name': 'Multi-Project Board',
        'description': 'Board spanning multiple projects',
        'query': None,
        'projects': project_ids,  # All three projects
        'column_field': status_field['gid'],
        'columns': ['New', 'In Progress', 'Done'],
        'swimlane_field': None,
        'swimlanes': [],
        'card_fields': [],
        'card_colors_fields': [priority_field['gid']],
        'ui_settings': {},
    }

    response = test_client.post('/api/v1/board', headers=headers, json=board_payload)
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    _board_id = data['payload']['id']

    # Verify all projects are included
    assert len(data['payload']['projects']) == 3
    project_ids_in_board = {p['id'] for p in data['payload']['projects']}
    assert project_ids_in_board == set(project_ids)

    # Test board with project filtering query
    board_with_query_payload = {
        'name': 'Filtered Multi-Project Board',
        'description': 'Board with project filtering',
        'query': 'project:alpha OR project:beta',
        'projects': project_ids,
        'column_field': status_field['gid'],
        'columns': ['New', 'In Progress'],
        'card_fields': [],
        'card_colors_fields': [],
        'ui_settings': {},
    }

    response = test_client.post(
        '/api/v1/board',
        headers=headers,
        json=board_with_query_payload,
    )
    assert response.status_code == 200
    data = response.json()
    assert data['success']

    # Test project validation - invalid project ID
    invalid_board_payload = {
        **board_payload,
        'name': 'Invalid Project Board',
        'projects': [project_ids[0], UNKNOWN_ID],
    }

    response = test_client.post(
        '/api/v1/board',
        headers=headers,
        json=invalid_board_payload,
    )
    assert response.status_code == 400
    response_data = response.json()
    # Check if it's in 'detail' or 'message' field
    error_text = response_data.get(
        'detail',
        response_data.get('message', str(response_data)),
    )
    assert 'Projects not found' in error_text


@pytest.mark.asyncio
@pytest.mark.parametrize(
    'custom_field_payloads',
    [
        pytest.param(
            [
                {
                    'name': 'Status',
                    'type': 'state',
                    'is_nullable': False,
                    'description': 'Issue status field',
                    'ai_description': 'Field to track issue status',
                    'default_value': None,
                    'options': [
                        {
                            'value': 'New',
                            'color': '#2196F3',
                            'is_archived': False,
                            'is_resolved': False,
                            'is_closed': False,
                        },
                        {
                            'value': 'In Progress',
                            'color': '#FF9800',
                            'is_archived': False,
                            'is_resolved': False,
                            'is_closed': False,
                        },
                        {
                            'value': 'Done',
                            'color': '#4CAF50',
                            'is_archived': False,
                            'is_resolved': True,
                            'is_closed': False,
                        },
                    ],
                },
                {
                    'name': 'Priority',
                    'type': 'enum',
                    'is_nullable': True,
                    'description': 'Issue priority field',
                    'ai_description': 'Field to track issue priority',
                    'default_value': None,
                    'options': [
                        {'value': 'Low', 'color': '#9E9E9E', 'is_archived': False},
                        {'value': 'Medium', 'color': '#FF9800', 'is_archived': False},
                        {'value': 'High', 'color': '#F44336', 'is_archived': False},
                    ],
                },
            ],
            id='status_priority_fields',
        ),
    ],
)
async def test_board_columns_update(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    setup_projects_with_fields: tuple[list[str], list[dict]],
    custom_field_payloads: list[dict],
) -> None:
    """Test updating board columns configuration."""
    _, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
    project_ids, custom_fields = setup_projects_with_fields

    status_field = custom_fields[0]  # First field (Status)
    priority_field = custom_fields[1]  # Second field (Priority)

    # Create board with initial columns
    board_payload = {
        'name': 'Columns Test Board',
        'description': 'Board for testing column updates',
        'projects': [project_ids[0]],
        'column_field': status_field['gid'],
        'columns': ['New', 'In Progress'],
        'card_fields': [],
        'card_colors_fields': [],
        'ui_settings': {},
    }

    response = test_client.post('/api/v1/board', headers=headers, json=board_payload)
    assert response.status_code == 200
    board_id = response.json()['payload']['id']

    # Test adding columns
    update_payload = {
        'columns': ['New', 'In Progress', 'Done'],
    }

    response = test_client.put(
        f'/api/v1/board/{board_id}',
        headers=headers,
        json=update_payload,
    )
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    assert len(data['payload']['columns']['values']) == 3

    # Test reordering columns
    update_payload = {
        'columns': ['Done', 'In Progress', 'New'],
    }

    response = test_client.put(
        f'/api/v1/board/{board_id}',
        headers=headers,
        json=update_payload,
    )
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    assert len(data['payload']['columns']['values']) == 3

    # Test removing columns
    update_payload = {
        'columns': ['New', 'Done'],
    }

    response = test_client.put(
        f'/api/v1/board/{board_id}',
        headers=headers,
        json=update_payload,
    )
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    assert len(data['payload']['columns']['values']) == 2

    # Test invalid column values
    update_payload = {
        'columns': ['Invalid Status'],
    }

    response = test_client.put(
        f'/api/v1/board/{board_id}',
        headers=headers,
        json=update_payload,
    )
    assert response.status_code == 400
    response_data = response.json()
    error_text = response_data.get(
        'detail',
        response_data.get('message', str(response_data)),
    )
    assert 'not valid for field' in error_text

    # Test changing column field
    update_payload = {
        'column_field': priority_field['gid'],
        'columns': ['Low', 'Medium', 'High'],
    }

    response = test_client.put(
        f'/api/v1/board/{board_id}',
        headers=headers,
        json=update_payload,
    )
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    assert data['payload']['columns']['field']['gid'] == priority_field['gid']


@pytest.mark.asyncio
@pytest.mark.parametrize(
    'custom_field_payloads',
    [
        pytest.param(
            [
                {
                    'name': 'Status',
                    'type': 'state',
                    'is_nullable': False,
                    'description': 'Issue status field',
                    'ai_description': 'Field to track issue status',
                    'default_value': None,
                    'options': [
                        {
                            'value': 'New',
                            'color': '#2196F3',
                            'is_archived': False,
                            'is_resolved': False,
                            'is_closed': False,
                        },
                        {
                            'value': 'In Progress',
                            'color': '#FF9800',
                            'is_archived': False,
                            'is_resolved': False,
                            'is_closed': False,
                        },
                        {
                            'value': 'Done',
                            'color': '#4CAF50',
                            'is_archived': False,
                            'is_resolved': True,
                            'is_closed': False,
                        },
                    ],
                },
                {
                    'name': 'Priority',
                    'type': 'enum',
                    'is_nullable': True,
                    'description': 'Issue priority field',
                    'ai_description': 'Field to track issue priority',
                    'default_value': None,
                    'options': [
                        {'value': 'Low', 'color': '#9E9E9E', 'is_archived': False},
                        {'value': 'Medium', 'color': '#FF9800', 'is_archived': False},
                        {'value': 'High', 'color': '#F44336', 'is_archived': False},
                    ],
                },
                {
                    'name': 'Assignee',
                    'type': 'string',
                    'is_nullable': True,
                    'description': 'Issue assignee field',
                    'ai_description': 'Field to track who is assigned to the issue',
                    'default_value': None,
                },
            ],
            id='swimlane_fields',
        ),
    ],
)
async def test_board_swimlanes_configuration(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    setup_projects_with_fields: tuple[list[str], list[dict]],
    custom_field_payloads: list[dict],
) -> None:
    """Test board swimlanes configuration."""
    _, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
    project_ids, custom_fields = setup_projects_with_fields

    status_field = custom_fields[0]  # First field (Status)
    priority_field = custom_fields[1]  # Second field (Priority)
    assignee_field = custom_fields[2]  # Third field (Assignee)

    # Create board without swimlanes
    board_payload = {
        'name': 'Swimlanes Test Board',
        'description': 'Board for testing swimlanes',
        'projects': [project_ids[0]],
        'column_field': status_field['gid'],
        'columns': ['New', 'In Progress', 'Done'],
        'swimlane_field': None,
        'swimlanes': [],
        'card_fields': [],
        'card_colors_fields': [],
        'ui_settings': {},
    }

    response = test_client.post('/api/v1/board', headers=headers, json=board_payload)
    assert response.status_code == 200
    board_id = response.json()['payload']['id']

    # Test adding swimlanes
    update_payload = {
        'swimlane_field': priority_field['gid'],
        'swimlanes': ['Low', 'Medium', 'High'],
    }

    response = test_client.put(
        f'/api/v1/board/{board_id}',
        headers=headers,
        json=update_payload,
    )
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    assert data['payload']['swimlanes']['field']['gid'] == priority_field['gid']
    assert len(data['payload']['swimlanes']['values']) == 3

    # Test removing swimlanes
    update_payload = {
        'swimlane_field': None,
        'swimlanes': [],
    }

    response = test_client.put(
        f'/api/v1/board/{board_id}',
        headers=headers,
        json=update_payload,
    )
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    assert data['payload']['swimlanes'] is None

    # Test with string field for swimlanes (should work)
    update_payload = {
        'swimlane_field': assignee_field['gid'],
        'swimlanes': ['Alice', 'Bob'],
    }

    response = test_client.put(
        f'/api/v1/board/{board_id}',
        headers=headers,
        json=update_payload,
    )
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    assert data['payload']['swimlanes']['field']['gid'] == assignee_field['gid']


@pytest.mark.asyncio
@pytest.mark.parametrize(
    'custom_field_payloads',
    [
        pytest.param(
            [
                {
                    'name': 'Status',
                    'type': 'state',
                    'is_nullable': False,
                    'description': 'Issue status field',
                    'ai_description': 'Field to track issue status',
                    'default_value': None,
                    'options': [
                        {
                            'value': 'New',
                            'color': '#2196F3',
                            'is_archived': False,
                            'is_resolved': False,
                            'is_closed': False,
                        },
                        {
                            'value': 'In Progress',
                            'color': '#FF9800',
                            'is_archived': False,
                            'is_resolved': False,
                            'is_closed': False,
                        },
                    ],
                },
            ],
            id='permissions_fields',
        ),
    ],
)
async def test_board_access_control_and_permissions(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    setup_projects_with_fields: tuple[list[str], list[dict]],
    create_test_role: str,
    custom_field_payloads: list[dict],
) -> None:
    """Test board access control and permission management."""
    admin_id, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
    project_ids, custom_fields = setup_projects_with_fields

    status_field = custom_fields[0]  # First field (Status)

    # Create a test user
    user_payload = {
        'name': 'Test User',
        'email': 'testuser@example.com',
        'is_active': True,
    }
    user_id = await _create_user(test_client, create_initial_admin, user_payload)

    # Create a test group
    group_payload = {
        'name': 'Test Group',
        'description': 'Group for board testing',
    }
    group_id = await _create_group(test_client, create_initial_admin, group_payload)

    # Create board
    board_payload = {
        'name': 'Permissions Test Board',
        'description': 'Board for testing permissions',
        'projects': [project_ids[0]],
        'column_field': status_field['gid'],
        'columns': ['New', 'In Progress'],
        'card_fields': [],
        'card_colors_fields': [],
        'ui_settings': {},
    }

    response = test_client.post('/api/v1/board', headers=headers, json=board_payload)
    assert response.status_code == 200
    board_id = response.json()['payload']['id']

    # Test granting user permission
    permission_payload = {
        'target_type': 'user',
        'target': user_id,
        'permission_type': 'view',
    }

    response = test_client.post(
        f'/api/v1/board/{board_id}/permission',
        headers=headers,
        json=permission_payload,
    )
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    permission_id = data['payload']['id']

    # Test granting group permission
    group_permission_payload = {
        'target_type': 'group',
        'target': group_id,
        'permission_type': 'edit',
    }

    response = test_client.post(
        f'/api/v1/board/{board_id}/permission',
        headers=headers,
        json=group_permission_payload,
    )
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    _group_permission_id = data['payload']['id']

    # Test listing permissions
    response = test_client.get(f'/api/v1/board/{board_id}/permissions', headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    assert data['payload']['count'] == 3  # admin + user + group permissions

    # Test updating permission
    update_permission_payload = {
        'permission_type': 'edit',
    }

    response = test_client.put(
        f'/api/v1/board/{board_id}/permission/{permission_id}',
        headers=headers,
        json=update_permission_payload,
    )
    assert response.status_code == 200
    data = response.json()
    assert data['success']

    # Test revoking permission
    response = test_client.delete(
        f'/api/v1/board/{board_id}/permission/{permission_id}',
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data['success']

    # Test duplicate permission error
    response = test_client.post(
        f'/api/v1/board/{board_id}/permission',
        headers=headers,
        json=group_permission_payload,
    )
    assert response.status_code == 409

    # Test invalid target error
    invalid_permission_payload = {
        'target_type': 'user',
        'target': UNKNOWN_ID,
        'permission_type': 'view',
    }

    response = test_client.post(
        f'/api/v1/board/{board_id}/permission',
        headers=headers,
        json=invalid_permission_payload,
    )
    assert response.status_code == 404


@pytest.mark.asyncio
@pytest.mark.parametrize(
    'custom_field_payloads',
    [
        pytest.param(
            [
                {
                    'name': 'Status',
                    'type': 'state',
                    'is_nullable': False,
                    'description': 'Issue status field',
                    'ai_description': 'Field to track issue status',
                    'default_value': None,
                    'options': [
                        {
                            'value': 'New',
                            'color': '#2196F3',
                            'is_archived': False,
                            'is_resolved': False,
                            'is_closed': False,
                        },
                    ],
                },
            ],
            id='favorites_fields',
        ),
    ],
)
async def test_board_favorites_functionality(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    setup_projects_with_fields: tuple[list[str], list[dict]],
    custom_field_payloads: list[dict],
) -> None:
    """Test board favorites functionality."""
    _, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
    project_ids, custom_fields = setup_projects_with_fields

    status_field = custom_fields[0]  # First field (Status)

    # Create board
    board_payload = {
        'name': 'Favorites Test Board',
        'description': 'Board for testing favorites',
        'projects': [project_ids[0]],
        'column_field': status_field['gid'],
        'columns': ['New'],
        'card_fields': [],
        'card_colors_fields': [],
        'ui_settings': {},
    }

    response = test_client.post('/api/v1/board', headers=headers, json=board_payload)
    assert response.status_code == 200
    board_id = response.json()['payload']['id']

    # Verify board is not favorited initially
    response = test_client.get(f'/api/v1/board/{board_id}', headers=headers)
    assert response.status_code == 200
    assert response.json()['payload']['is_favorite'] is False

    # Test adding to favorites
    response = test_client.post(f'/api/v1/board/{board_id}/favorite', headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    assert data['payload']['is_favorite'] is True

    # Test duplicate favorite error
    response = test_client.post(f'/api/v1/board/{board_id}/favorite', headers=headers)
    assert response.status_code == 409

    # Test removing from favorites
    response = test_client.post(f'/api/v1/board/{board_id}/unfavorite', headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    assert data['payload']['is_favorite'] is False

    # Test unfavorite when not favorited
    response = test_client.post(f'/api/v1/board/{board_id}/unfavorite', headers=headers)
    assert response.status_code == 409


@pytest.mark.asyncio
@pytest.mark.parametrize(
    'custom_field_payloads',
    [
        pytest.param(
            [
                {
                    'name': 'Status',
                    'type': 'state',
                    'is_nullable': False,
                    'description': 'Issue status field',
                    'ai_description': 'Field to track issue status',
                    'default_value': None,
                    'options': [
                        {
                            'value': 'New',
                            'color': '#2196F3',
                            'is_archived': False,
                            'is_resolved': False,
                            'is_closed': False,
                        },
                    ],
                },
                {
                    'name': 'Priority',
                    'type': 'enum',
                    'is_nullable': True,
                    'description': 'Issue priority field',
                    'ai_description': 'Field to track issue priority',
                    'default_value': None,
                    'options': [
                        {'value': 'Low', 'color': '#9E9E9E', 'is_archived': False},
                    ],
                },
                {
                    'name': 'Assignee',
                    'type': 'string',
                    'is_nullable': True,
                    'description': 'Issue assignee field',
                    'ai_description': 'Field to track who is assigned to the issue',
                    'default_value': None,
                },
            ],
            id='field_selection_fields',
        ),
    ],
)
async def test_board_field_selection_endpoints(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    setup_projects_with_fields: tuple[list[str], list[dict]],
    custom_field_payloads: list[dict],
) -> None:
    """Test board field selection helper endpoints."""
    _, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
    project_ids, custom_fields = setup_projects_with_fields

    # Test column field selection
    response = test_client.get(
        '/api/v1/board/column_field/select',
        headers=headers,
        params=[('project_id', project_ids[0])],
    )
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    # Should include state and enum fields only
    field_types = {item['type'] for item in data['payload']['items']}
    assert 'state' in field_types or 'enum' in field_types

    # Test swimlane field selection
    response = test_client.get(
        '/api/v1/board/swimlane_field/select',
        headers=headers,
        params=[('project_id', project_ids[0])],
    )
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    # Should exclude multi fields
    field_types = {item['type'] for item in data['payload']['items']}
    assert 'enum_multi' not in field_types
    assert 'user_multi' not in field_types

    # Test custom field selection
    response = test_client.get(
        '/api/v1/board/custom_field/select',
        headers=headers,
        params=[('project_id', project_ids[0])],
    )
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    assert data['payload']['count'] >= 3  # Our test fields

    # Test card color field selection
    response = test_client.get(
        '/api/v1/board/card_color_field/select',
        headers=headers,
        params=[('project_id', project_ids[0])],
    )
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    # Should include only enum and state fields
    field_types = {item['type'] for item in data['payload']['items']}
    assert field_types.issubset({'enum', 'state'})


@pytest.mark.asyncio
@pytest.mark.parametrize(
    'custom_field_payloads',
    [
        pytest.param(
            [
                {
                    'name': 'Status',
                    'type': 'state',
                    'is_nullable': False,
                    'description': 'Issue status field',
                    'ai_description': 'Field to track issue status',
                    'default_value': None,
                    'options': [
                        {
                            'value': 'New',
                            'color': '#2196F3',
                            'is_archived': False,
                            'is_resolved': False,
                            'is_closed': False,
                        },
                    ],
                },
                {
                    'name': 'Assignee',
                    'type': 'string',
                    'is_nullable': True,
                    'description': 'Issue assignee field',
                    'ai_description': 'Field to track who is assigned to the issue',
                    'default_value': None,
                },
            ],
            id='validation_fields',
        ),
    ],
)
async def test_board_validation_errors(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    setup_projects_with_fields: tuple[list[str], list[dict]],
    custom_field_payloads: list[dict],
) -> None:
    """Test various board validation error scenarios."""
    _, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
    project_ids, custom_fields = setup_projects_with_fields

    assignee_field = custom_fields[1]  # Second field (Assignee)

    # Test missing required fields
    invalid_board_payload = {
        'name': 'Invalid Board',
        'projects': [project_ids[0]],
        # Missing column_field and columns
    }

    response = test_client.post(
        '/api/v1/board',
        headers=headers,
        json=invalid_board_payload,
    )
    assert response.status_code == 422

    # Test invalid column field type (string instead of state/enum)
    invalid_column_field_payload = {
        'name': 'Invalid Column Field Board',
        'projects': [project_ids[0]],
        'column_field': assignee_field['gid'],  # String field
        'columns': ['Alice', 'Bob'],
        'card_fields': [],
        'card_colors_fields': [],
        'ui_settings': {},
    }

    response = test_client.post(
        '/api/v1/board',
        headers=headers,
        json=invalid_column_field_payload,
    )
    assert response.status_code == 400
    response_data = response.json()
    error_text = response_data.get(
        'detail',
        response_data.get('message', str(response_data)),
    )
    assert 'Column field must be of type STATE or ENUM' in error_text

    # Test nonexistent field
    invalid_field_payload = {
        'name': 'Nonexistent Field Board',
        'projects': [project_ids[0]],
        'column_field': str(uuid.uuid4()),  # Random UUID
        'columns': ['New'],
        'card_fields': [],
        'card_colors_fields': [],
        'ui_settings': {},
    }

    response = test_client.post(
        '/api/v1/board',
        headers=headers,
        json=invalid_field_payload,
    )
    assert response.status_code == 400
    response_data = response.json()
    error_text = response_data.get(
        'detail',
        response_data.get('message', str(response_data)),
    )
    assert 'Fields not found' in error_text


@pytest.mark.asyncio
async def test_board_error_handling(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
) -> None:
    """Test error handling for board operations."""
    _, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}

    # Test 404 for nonexistent board
    response = test_client.get(f'/api/v1/board/{UNKNOWN_ID}', headers=headers)
    assert response.status_code == 404

    response = test_client.put(
        f'/api/v1/board/{UNKNOWN_ID}',
        headers=headers,
        json={'name': 'Updated'},
    )
    assert response.status_code == 404

    response = test_client.delete(f'/api/v1/board/{UNKNOWN_ID}', headers=headers)
    assert response.status_code == 404

    # Test unauthorized access (no token)
    response = test_client.get('/api/v1/board/list')
    assert response.status_code == 401

    # Test invalid request data
    response = test_client.post(
        '/api/v1/board',
        headers=headers,
        json={'invalid': 'data'},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
@pytest.mark.parametrize(
    'custom_field_payloads',
    [
        pytest.param(
            [
                {
                    'name': 'Status',
                    'type': 'state',
                    'is_nullable': False,
                    'description': 'Issue status field',
                    'ai_description': 'Field to track issue status',
                    'default_value': None,
                    'options': [
                        {
                            'value': 'New',
                            'color': '#2196F3',
                            'is_archived': False,
                            'is_resolved': False,
                            'is_closed': False,
                        },
                        {
                            'value': 'In Progress',
                            'color': '#FF9800',
                            'is_archived': False,
                            'is_resolved': False,
                            'is_closed': False,
                        },
                        {
                            'value': 'Done',
                            'color': '#4CAF50',
                            'is_archived': False,
                            'is_resolved': True,
                            'is_closed': False,
                        },
                    ],
                },
            ],
            id='columns_select_fields',
        ),
    ],
)
async def test_board_columns_select_endpoint(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    setup_projects_with_fields: tuple[list[str], list[dict]],
    custom_field_payloads: list[dict],
) -> None:
    """Test the board columns select endpoint."""
    _, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
    project_ids, custom_fields = setup_projects_with_fields

    status_field = custom_fields[0]  # First field (Status)

    # Create board with specific column configuration
    board_payload = {
        'name': 'Columns Select Test Board',
        'description': 'Board for testing columns select endpoint',
        'projects': [project_ids[0]],
        'column_field': status_field['gid'],
        'columns': ['New', 'In Progress', 'Done'],
        'card_fields': [],
        'card_colors_fields': [],
        'ui_settings': {},
    }

    response = test_client.post('/api/v1/board', headers=headers, json=board_payload)
    assert response.status_code == 200
    board_id = response.json()['payload']['id']

    # Test board columns select endpoint
    response = test_client.get(
        f'/api/v1/board/{board_id}/columns/select',
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data['success']

    # Should return available options for the column field
    assert len(data['payload']['items']) >= 3  # At least our 3 status options
    option_values = {item['value'] for item in data['payload']['items']}
    assert 'New' in option_values
    assert 'In Progress' in option_values
    assert 'Done' in option_values

    # Test with pagination
    response = test_client.get(
        f'/api/v1/board/{board_id}/columns/select',
        headers=headers,
        params={'limit': 2, 'offset': 0},
    )
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    assert len(data['payload']['items']) <= 2

    # Test error cases
    # Non-existent board
    response = test_client.get(
        f'/api/v1/board/{UNKNOWN_ID}/columns/select',
        headers=headers,
    )
    assert response.status_code == 404

    # Unauthorized access
    response = test_client.get(f'/api/v1/board/{board_id}/columns/select')
    assert response.status_code == 401


@pytest.mark.asyncio
@pytest.mark.parametrize(
    'custom_field_payloads',
    [
        pytest.param(
            [
                {
                    'name': 'Status',
                    'type': 'state',
                    'is_nullable': False,
                    'description': 'Issue status field',
                    'ai_description': 'Field to track issue status',
                    'default_value': None,
                    'options': [
                        {
                            'value': 'New',
                            'color': '#2196F3',
                            'is_archived': False,
                            'is_resolved': False,
                            'is_closed': False,
                        },
                        {
                            'value': 'In Progress',
                            'color': '#FF9800',
                            'is_archived': False,
                            'is_resolved': False,
                            'is_closed': False,
                        },
                    ],
                },
                {
                    'name': 'Priority',
                    'type': 'enum',
                    'is_nullable': True,
                    'description': 'Issue priority field',
                    'ai_description': 'Field to track issue priority',
                    'default_value': None,
                    'options': [
                        {'value': 'Low', 'color': '#9E9E9E', 'is_archived': False},
                        {'value': 'Medium', 'color': '#FF9800', 'is_archived': False},
                        {'value': 'High', 'color': '#F44336', 'is_archived': False},
                    ],
                },
            ],
            id='swimlanes_select_fields',
        ),
    ],
)
async def test_board_swimlanes_select_endpoint(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    setup_projects_with_fields: tuple[list[str], list[dict]],
    custom_field_payloads: list[dict],
) -> None:
    """Test the board swimlanes select endpoint."""
    _, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
    project_ids, custom_fields = setup_projects_with_fields

    status_field = custom_fields[0]  # First field (Status)
    priority_field = custom_fields[1]  # Second field (Priority)

    # Create board with swimlanes
    board_payload = {
        'name': 'Swimlanes Select Test Board',
        'description': 'Board for testing swimlanes select endpoint',
        'projects': [project_ids[0]],
        'column_field': status_field['gid'],
        'columns': ['New', 'In Progress'],
        'swimlane_field': priority_field['gid'],
        'swimlanes': ['Low', 'Medium', 'High'],
        'card_fields': [],
        'card_colors_fields': [],
        'ui_settings': {},
    }

    response = test_client.post('/api/v1/board', headers=headers, json=board_payload)
    assert response.status_code == 200
    board_id = response.json()['payload']['id']

    # Test board swimlanes select endpoint
    response = test_client.get(
        f'/api/v1/board/{board_id}/swimlanes/select',
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data['success']

    # Should return available options for the swimlane field
    assert len(data['payload']['items']) >= 3  # At least our 3 priority options
    option_values = {
        item['value'] for item in data['payload']['items'] if item['value'] is not None
    }
    assert 'Low' in option_values
    assert 'Medium' in option_values
    assert 'High' in option_values

    # Test with pagination
    response = test_client.get(
        f'/api/v1/board/{board_id}/swimlanes/select',
        headers=headers,
        params={'limit': 2, 'offset': 0},
    )
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    assert len(data['payload']['items']) <= 2

    # Test error cases
    # Board without swimlanes
    board_no_swimlanes_payload = {
        'name': 'No Swimlanes Board',
        'description': 'Board without swimlanes',
        'projects': [project_ids[0]],
        'column_field': status_field['gid'],
        'columns': ['New', 'In Progress'],
        'card_fields': [],
        'card_colors_fields': [],
        'ui_settings': {},
    }

    response = test_client.post(
        '/api/v1/board', headers=headers, json=board_no_swimlanes_payload
    )
    assert response.status_code == 200
    board_no_swimlanes_id = response.json()['payload']['id']

    response = test_client.get(
        f'/api/v1/board/{board_no_swimlanes_id}/swimlanes/select',
        headers=headers,
    )
    assert response.status_code == 400
    response_data = response.json()
    error_text = response_data.get(
        'detail', response_data.get('message', str(response_data))
    )
    assert 'Board has no swimlane field configured' in error_text

    # Non-existent board
    response = test_client.get(
        f'/api/v1/board/{UNKNOWN_ID}/swimlanes/select',
        headers=headers,
    )
    assert response.status_code == 404

    # Unauthorized access
    response = test_client.get(f'/api/v1/board/{board_id}/swimlanes/select')
    assert response.status_code == 401
