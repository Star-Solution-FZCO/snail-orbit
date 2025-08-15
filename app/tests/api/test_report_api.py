"""
Integration tests for Report API endpoints covering CRUD operations,
discriminated unions, permission management, and access control.
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
    """Create multiple test projects for report tests."""
    project_payloads = [
        {
            'name': 'Report Project Alpha',
            'slug': 'report_alpha',
            'description': 'First test project for reports',
            'ai_description': 'AI description for report project alpha',
        },
        {
            'name': 'Report Project Beta',
            'slug': 'report_beta',
            'description': 'Second test project for reports',
            'ai_description': 'AI description for report project beta',
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
        'name': 'Report Test Role',
        'description': 'Role for report testing',
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
                    'name': 'Component',
                    'type': 'enum',
                    'is_nullable': True,
                    'description': 'Issue component field',
                    'ai_description': 'Field to track issue component',
                    'default_value': None,
                    'options': [
                        {'value': 'Frontend', 'color': '#2196F3', 'is_archived': False},
                        {'value': 'Backend', 'color': '#4CAF50', 'is_archived': False},
                        {'value': 'Database', 'color': '#FF9800', 'is_archived': False},
                    ],
                },
            ],
            id='report_custom_fields',
        ),
    ],
)
async def test_issues_per_project_report_crud(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    setup_projects_with_fields: tuple[list[str], list[dict]],
    custom_field_payloads: list[dict],
) -> None:
    """Test CRUD operations for IssuesPerProject report type."""
    admin_id, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
    project_ids, custom_fields = setup_projects_with_fields

    # Test report creation
    report_payload = {
        'name': 'Issues Per Project Report',
        'description': 'Test report for issues per project',
        'query': 'status:open',
        'projects': [project_ids[0]],
        'axis_1': {'type': 'project'},
    }

    response = test_client.post('/api/v1/report', headers=headers, json=report_payload)
    if response.status_code != 200:
        print(f'Report creation failed with status {response.status_code}')
        print(f'Response: {response.text}')
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    report_id = data['payload']['id']
    print(f'Created report with ID: {report_id}')

    # Verify axis-based structure
    assert data['payload']['name'] == report_payload['name']
    assert data['payload']['description'] == report_payload['description']
    assert data['payload']['query'] == report_payload['query']
    assert len(data['payload']['projects']) == 1
    assert data['payload']['projects'][0]['id'] == project_ids[0]
    assert data['payload']['created_by']['id'] == admin_id
    assert len(data['payload']['permissions']) == 1
    assert data['payload']['permissions'][0]['permission_type'] == 'admin'
    assert not data['payload']['is_favorite']

    # Verify axis configuration
    assert data['payload']['axis_1']['type'] == 'project'
    assert data['payload']['axis_1']['custom_field'] is None
    assert data['payload']['axis_2'] is None

    # Test report retrieval
    print(
        f'Attempting to retrieve report with ID: {report_id} (type: {type(report_id)})'
    )
    response = test_client.get(f'/api/v1/report/{report_id}', headers=headers)
    if response.status_code != 200:
        print(f'Report retrieval failed with status {response.status_code}')
        print(f'Response: {response.text}')
        # Try to list all reports to see what exists
        list_response = test_client.get('/api/v1/report/list', headers=headers)
        print(f'List response: {list_response.json()}')
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    assert data['payload']['id'] == report_id
    assert data['payload']['axis_1']['type'] == 'project'
    assert data['payload']['name'] == report_payload['name']

    # Test report update
    update_payload = {
        'name': 'Updated Issues Per Project Report',
        'description': 'Updated description',
        'query': 'status:open OR status:closed',
        'projects': project_ids,  # Add second project
        'axis_1': {'type': 'project'},
    }

    response = test_client.put(
        f'/api/v1/report/{report_id}',
        headers=headers,
        json=update_payload,
    )
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    assert data['payload']['axis_1']['type'] == 'project'
    assert data['payload']['name'] == update_payload['name']
    assert data['payload']['description'] == update_payload['description']
    assert data['payload']['query'] == update_payload['query']
    assert len(data['payload']['projects']) == 2

    # Test report list
    response = test_client.get('/api/v1/report/list', headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    assert data['payload']['count'] == 1
    assert data['payload']['items'][0]['id'] == report_id

    # Test favorite functionality
    response = test_client.post(f'/api/v1/report/{report_id}/favorite', headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    assert data['payload']['is_favorite']

    # Test already favorited error
    response = test_client.post(f'/api/v1/report/{report_id}/favorite', headers=headers)
    assert response.status_code == 409  # Conflict

    # Test unfavorite functionality
    response = test_client.post(
        f'/api/v1/report/{report_id}/unfavorite', headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    assert not data['payload']['is_favorite']

    # Test not favorited error
    response = test_client.post(
        f'/api/v1/report/{report_id}/unfavorite', headers=headers
    )
    assert response.status_code == 409  # Conflict

    # Test report deletion
    response = test_client.delete(f'/api/v1/report/{report_id}', headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    assert data['payload']['id'] == report_id

    # Verify report is deleted
    response = test_client.get(f'/api/v1/report/{report_id}', headers=headers)
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
            id='field_report_fields',
        ),
    ],
)
async def test_issues_per_field_report_crud(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    setup_projects_with_fields: tuple[list[str], list[dict]],
    custom_field_payloads: list[dict],
) -> None:
    """Test CRUD operations for IssuesPerField report type."""
    admin_id, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
    project_ids, custom_fields = setup_projects_with_fields

    status_field = custom_fields[0]  # First field (Status)
    priority_field = custom_fields[1]  # Second field (Priority)

    # Test report creation
    report_payload = {
        'name': 'Issues Per Field Report',
        'description': 'Test report for issues per field',
        'query': None,
        'projects': [project_ids[0]],
        'axis_1': {'type': 'custom_field', 'custom_field_gid': status_field['gid']},
    }

    response = test_client.post('/api/v1/report', headers=headers, json=report_payload)
    if response.status_code != 200:
        print(f'Field report creation failed with status {response.status_code}')
        print(f'Response: {response.text}')
        print(f'Request payload: {report_payload}')
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    report_id = data['payload']['id']

    # Verify axis-based structure with custom field
    assert data['payload']['name'] == report_payload['name']
    assert data['payload']['axis_1']['type'] == 'custom_field'
    assert data['payload']['axis_1']['custom_field']['gid'] == status_field['gid']
    assert (
        data['payload']['axis_1']['custom_field']['name'] == 'Status'
    )  # Use the actual field name
    assert (
        data['payload']['axis_1']['custom_field']['type'] == 'state'
    )  # Use the actual field type
    assert data['payload']['axis_2'] is None

    # Test report retrieval
    response = test_client.get(f'/api/v1/report/{report_id}', headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    assert data['payload']['axis_1']['type'] == 'custom_field'
    assert data['payload']['axis_1']['custom_field']['gid'] == status_field['gid']

    # Test report update with different field
    update_payload = {
        'name': 'Updated Issues Per Field Report',
        'description': 'Updated description',
        'axis_1': {'type': 'custom_field', 'custom_field_gid': priority_field['gid']},
    }

    response = test_client.put(
        f'/api/v1/report/{report_id}',
        headers=headers,
        json=update_payload,
    )
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    assert data['payload']['axis_1']['type'] == 'custom_field'
    assert data['payload']['name'] == update_payload['name']
    assert data['payload']['axis_1']['custom_field']['gid'] == priority_field['gid']

    # Test invalid field_gid
    invalid_update_payload = {
        'axis_1': {
            'type': 'custom_field',
            'custom_field_gid': str(uuid.uuid4()),
        },  # Random UUID
    }

    response = test_client.put(
        f'/api/v1/report/{report_id}',
        headers=headers,
        json=invalid_update_payload,
    )
    assert response.status_code == 400
    response_data = response.json()
    error_text = response_data.get(
        'detail', response_data.get('message', str(response_data))
    )
    assert 'not found' in error_text

    # Clean up
    response = test_client.delete(f'/api/v1/report/{report_id}', headers=headers)
    assert response.status_code == 200


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
                {
                    'name': 'Component',
                    'type': 'enum',
                    'is_nullable': True,
                    'description': 'Issue component field',
                    'ai_description': 'Field to track issue component',
                    'default_value': None,
                    'options': [
                        {'value': 'Frontend', 'color': '#2196F3', 'is_archived': False},
                        {'value': 'Backend', 'color': '#4CAF50', 'is_archived': False},
                    ],
                },
            ],
            id='two_fields_report_fields',
        ),
    ],
)
async def test_issues_per_two_fields_report_crud(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    setup_projects_with_fields: tuple[list[str], list[dict]],
    custom_field_payloads: list[dict],
) -> None:
    """Test CRUD operations for IssuesPerTwoFields report type."""
    admin_id, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
    project_ids, custom_fields = setup_projects_with_fields

    status_field = custom_fields[0]  # First field (Status)
    priority_field = custom_fields[1]  # Second field (Priority)
    component_field = custom_fields[2]  # Third field (Component)

    # Test report creation
    report_payload = {
        'name': 'Issues Per Two Fields Report',
        'description': 'Test report for issues per two fields',
        'query': None,
        'projects': project_ids,
        'axis_1': {'type': 'custom_field', 'custom_field_gid': status_field['gid']},
        'axis_2': {'type': 'custom_field', 'custom_field_gid': priority_field['gid']},
    }

    response = test_client.post('/api/v1/report', headers=headers, json=report_payload)
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    report_id = data['payload']['id']

    # Verify axis-based structure with two custom fields
    assert data['payload']['name'] == report_payload['name']
    assert data['payload']['axis_1']['type'] == 'custom_field'
    assert data['payload']['axis_1']['custom_field']['gid'] == status_field['gid']
    assert (
        data['payload']['axis_1']['custom_field']['name'] == 'Status'
    )  # Use actual field name
    assert data['payload']['axis_2']['type'] == 'custom_field'
    assert data['payload']['axis_2']['custom_field']['gid'] == priority_field['gid']
    assert (
        data['payload']['axis_2']['custom_field']['name'] == 'Priority'
    )  # Use actual field name

    # Test report retrieval
    response = test_client.get(f'/api/v1/report/{report_id}', headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    assert data['payload']['axis_1']['type'] == 'custom_field'
    assert data['payload']['axis_2']['type'] == 'custom_field'
    assert data['payload']['axis_1']['custom_field']['gid'] == status_field['gid']
    assert data['payload']['axis_2']['custom_field']['gid'] == priority_field['gid']

    # Test report update with different fields
    update_payload = {
        'name': 'Updated Issues Per Two Fields Report',
        'description': 'Updated description',
        'axis_1': {'type': 'custom_field', 'custom_field_gid': priority_field['gid']},
        'axis_2': {'type': 'custom_field', 'custom_field_gid': component_field['gid']},
    }

    response = test_client.put(
        f'/api/v1/report/{report_id}',
        headers=headers,
        json=update_payload,
    )
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    assert data['payload']['axis_1']['type'] == 'custom_field'
    assert data['payload']['axis_2']['type'] == 'custom_field'
    assert data['payload']['name'] == update_payload['name']
    assert data['payload']['axis_1']['custom_field']['gid'] == priority_field['gid']
    assert data['payload']['axis_2']['custom_field']['gid'] == component_field['gid']

    # Test partial update - only row field
    partial_update_payload = {
        'axis_1': {'type': 'custom_field', 'custom_field_gid': status_field['gid']},
    }

    response = test_client.put(
        f'/api/v1/report/{report_id}',
        headers=headers,
        json=partial_update_payload,
    )
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    assert data['payload']['axis_1']['custom_field']['gid'] == status_field['gid']
    assert (
        data['payload']['axis_2']['custom_field']['gid'] == component_field['gid']
    )  # Should remain unchanged

    # Test invalid field_gid
    invalid_update_payload = {
        'axis_1': {
            'type': 'custom_field',
            'custom_field_gid': str(uuid.uuid4()),
        },  # Random UUID
    }

    response = test_client.put(
        f'/api/v1/report/{report_id}',
        headers=headers,
        json=invalid_update_payload,
    )
    assert response.status_code == 400
    response_data = response.json()
    error_text = response_data.get(
        'detail', response_data.get('message', str(response_data))
    )
    assert 'not found' in error_text

    # Clean up
    response = test_client.delete(f'/api/v1/report/{report_id}', headers=headers)
    assert response.status_code == 200


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
            id='permissions_fields',
        ),
    ],
)
async def test_report_permission_management(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    setup_projects_with_fields: tuple[list[str], list[dict]],
    create_test_role: str,
    custom_field_payloads: list[dict],
) -> None:
    """Test report permission management."""
    admin_id, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
    project_ids, custom_fields = setup_projects_with_fields

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
        'description': 'Group for report testing',
    }
    group_id = await _create_group(test_client, create_initial_admin, group_payload)

    # Create report
    report_payload = {
        'name': 'Permissions Test Report',
        'description': 'Report for testing permissions',
        'projects': [project_ids[0]],
        'axis_1': {'type': 'project'},
    }

    response = test_client.post('/api/v1/report', headers=headers, json=report_payload)
    assert response.status_code == 200
    report_id = response.json()['payload']['id']

    # Test granting user permission
    permission_payload = {
        'target_type': 'user',
        'target': user_id,
        'permission_type': 'view',
    }

    response = test_client.post(
        f'/api/v1/report/{report_id}/permission',
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
        f'/api/v1/report/{report_id}/permission',
        headers=headers,
        json=group_permission_payload,
    )
    assert response.status_code == 200
    data = response.json()
    assert data['success']

    # Test duplicate permission error
    response = test_client.post(
        f'/api/v1/report/{report_id}/permission',
        headers=headers,
        json=permission_payload,
    )
    assert response.status_code == 409

    # Test invalid target error
    invalid_permission_payload = {
        'target_type': 'user',
        'target': UNKNOWN_ID,
        'permission_type': 'view',
    }

    response = test_client.post(
        f'/api/v1/report/{report_id}/permission',
        headers=headers,
        json=invalid_permission_payload,
    )
    assert response.status_code == 400
    response_data = response.json()
    error_text = response_data.get(
        'detail', response_data.get('message', str(response_data))
    )
    assert 'not found' in error_text

    # Test revoking permission
    response = test_client.delete(
        f'/api/v1/report/{report_id}/permission/{permission_id}',
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data['success']

    # Test revoking nonexistent permission
    response = test_client.delete(
        f'/api/v1/report/{report_id}/permission/{uuid.uuid4()!s}',
        headers=headers,
    )
    assert response.status_code == 404

    # Clean up
    response = test_client.delete(f'/api/v1/report/{report_id}', headers=headers)
    assert response.status_code == 200


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
            id='validation_fields',
        ),
    ],
)
async def test_report_validation_errors(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    setup_projects_with_fields: tuple[list[str], list[dict]],
    custom_field_payloads: list[dict],
) -> None:
    """Test various report validation error scenarios."""
    _, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
    project_ids, custom_fields = setup_projects_with_fields

    # Test missing required fields
    invalid_report_payload = {
        'name': 'Invalid Report',
        # Missing type
        'projects': [project_ids[0]],
    }

    response = test_client.post(
        '/api/v1/report',
        headers=headers,
        json=invalid_report_payload,
    )
    assert response.status_code == 422

    # Test invalid project ID
    invalid_project_payload = {
        'name': 'Invalid Project Report',
        'axis_1': {'type': 'project'},
        'projects': [project_ids[0], UNKNOWN_ID],
    }

    response = test_client.post(
        '/api/v1/report',
        headers=headers,
        json=invalid_project_payload,
    )
    assert response.status_code == 400
    response_data = response.json()
    error_text = response_data.get(
        'detail', response_data.get('message', str(response_data))
    )
    assert 'not found' in error_text

    # Test invalid field_gid for issues_per_field
    invalid_field_payload = {
        'name': 'Invalid Field Report',
        'projects': [project_ids[0]],
        'axis_1': {
            'type': 'custom_field',
            'custom_field_gid': str(uuid.uuid4()),
        },  # Random UUID
    }

    response = test_client.post(
        '/api/v1/report',
        headers=headers,
        json=invalid_field_payload,
    )
    assert response.status_code == 400
    response_data = response.json()
    error_text = response_data.get(
        'detail', response_data.get('message', str(response_data))
    )
    assert 'not found' in error_text

    # Test missing field_gid for issues_per_field
    missing_field_payload = {
        'name': 'Missing Field Report',
        'projects': [project_ids[0]],
        # Missing field_gid
    }

    response = test_client.post(
        '/api/v1/report',
        headers=headers,
        json=missing_field_payload,
    )
    assert response.status_code == 422

    # Test missing fields for issues_per_two_fields
    missing_two_fields_payload = {
        'name': 'Missing Two Fields Report',
        'projects': [project_ids[0]],
        # Missing row_field_gid and column_field_gid
    }

    response = test_client.post(
        '/api/v1/report',
        headers=headers,
        json=missing_two_fields_payload,
    )
    assert response.status_code == 422

    # Test invalid row_field_gid for issues_per_two_fields
    invalid_row_field_payload = {
        'name': 'Invalid Row Field Report',
        'projects': [project_ids[0]],
        'axis_1': {
            'type': 'custom_field',
            'custom_field_gid': str(uuid.uuid4()),
        },  # Random UUID
        'axis_2': {'type': 'custom_field', 'custom_field_gid': custom_fields[0]['gid']},
    }

    response = test_client.post(
        '/api/v1/report',
        headers=headers,
        json=invalid_row_field_payload,
    )
    assert response.status_code == 400
    response_data = response.json()
    error_text = response_data.get(
        'detail', response_data.get('message', str(response_data))
    )
    assert 'not found' in error_text

    # Test invalid column_field_gid for issues_per_two_fields
    invalid_column_field_payload = {
        'name': 'Invalid Column Field Report',
        'projects': [project_ids[0]],
        'axis_1': {'type': 'custom_field', 'custom_field_gid': custom_fields[0]['gid']},
        'axis_2': {
            'type': 'custom_field',
            'custom_field_gid': str(uuid.uuid4()),
        },  # Random UUID
    }

    response = test_client.post(
        '/api/v1/report',
        headers=headers,
        json=invalid_column_field_payload,
    )
    assert response.status_code == 400
    response_data = response.json()
    error_text = response_data.get(
        'detail', response_data.get('message', str(response_data))
    )
    assert 'not found' in error_text


@pytest.mark.asyncio
async def test_report_error_handling(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
) -> None:
    """Test error handling for report operations."""
    _, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}

    # Test 404 for nonexistent report
    response = test_client.get(f'/api/v1/report/{UNKNOWN_ID}', headers=headers)
    assert response.status_code == 404

    response = test_client.put(
        f'/api/v1/report/{UNKNOWN_ID}',
        headers=headers,
        json={'name': 'Updated', 'axis_1': {'type': 'project'}},
    )
    assert response.status_code == 404

    response = test_client.delete(f'/api/v1/report/{UNKNOWN_ID}', headers=headers)
    assert response.status_code == 404

    # Test unauthorized access (no token)
    response = test_client.get('/api/v1/report/list')
    assert response.status_code == 401

    # Test invalid request data
    response = test_client.post(
        '/api/v1/report',
        headers=headers,
        json={'invalid': 'data'},
    )
    assert response.status_code == 422

    # Test invalid discriminated union type
    response = test_client.post(
        '/api/v1/report',
        headers=headers,
        json={'name': 'Test', 'type': 'invalid_type'},
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
                    ],
                },
            ],
            id='search_fields',
        ),
    ],
)
async def test_report_search_and_filtering(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    setup_projects_with_fields: tuple[list[str], list[dict]],
    custom_field_payloads: list[dict],
) -> None:
    """Test report search and filtering functionality."""
    _, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
    project_ids, custom_fields = setup_projects_with_fields

    # Create multiple reports
    reports = []
    for i in range(3):
        report_payload = {
            'name': f'Test Report {i}',
            'description': f'Description {i}',
            'axis_1': {'type': 'project'},
            'projects': [project_ids[0]],
        }
        response = test_client.post(
            '/api/v1/report', headers=headers, json=report_payload
        )
        assert response.status_code == 200
        reports.append(response.json()['payload']['id'])

    # Test list all reports
    response = test_client.get('/api/v1/report/list', headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    assert data['payload']['count'] == 3

    # Test search by name
    response = test_client.get(
        '/api/v1/report/list',
        headers=headers,
        params={'search': 'Test Report 1'},
    )
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    assert data['payload']['count'] == 1
    assert data['payload']['items'][0]['name'] == 'Test Report 1'

    # Test pagination
    response = test_client.get(
        '/api/v1/report/list',
        headers=headers,
        params={'limit': 2, 'offset': 0},
    )
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    assert len(data['payload']['items']) == 2

    response = test_client.get(
        '/api/v1/report/list',
        headers=headers,
        params={'limit': 2, 'offset': 2},
    )
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    assert len(data['payload']['items']) == 1

    # Clean up
    for report_id in reports:
        response = test_client.delete(f'/api/v1/report/{report_id}', headers=headers)
        assert response.status_code == 200


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
            id='discriminated_union_fields',
        ),
    ],
)
async def test_discriminated_union_functionality(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    setup_projects_with_fields: tuple[list[str], list[dict]],
    custom_field_payloads: list[dict],
) -> None:
    """Test discriminated union functionality across all report types."""
    _, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
    project_ids, custom_fields = setup_projects_with_fields

    status_field = custom_fields[0]

    # Create reports of different types using new axis-based format
    report_types = [
        {
            'name': 'Issues Per Project Test',
            'projects': [project_ids[0]],
            'axis_1': {'type': 'project'},
        },
        {
            'name': 'Issues Per Field Test',
            'projects': [project_ids[0]],
            'axis_1': {'type': 'custom_field', 'custom_field_gid': status_field['gid']},
        },
        {
            'name': 'Issues Per Two Fields Test',
            'projects': [project_ids[0]],
            'axis_1': {'type': 'custom_field', 'custom_field_gid': status_field['gid']},
            'axis_2': {'type': 'custom_field', 'custom_field_gid': status_field['gid']},
        },
    ]

    report_ids = []
    for report_payload in report_types:
        response = test_client.post(
            '/api/v1/report', headers=headers, json=report_payload
        )
        assert response.status_code == 200
        data = response.json()
        assert data['success']
        report_ids.append(data['payload']['id'])

        # Verify axis-based structure
        assert data['payload']['name'] == report_payload['name']

        # Verify axis_1 configuration
        assert 'axis_1' in data['payload']
        assert data['payload']['axis_1']['type'] == report_payload['axis_1']['type']

        if report_payload['axis_1']['type'] == 'custom_field':
            assert (
                data['payload']['axis_1']['custom_field']['gid'] == status_field['gid']
            )
        else:  # project type
            assert data['payload']['axis_1']['custom_field'] is None

        # Verify axis_2 configuration
        if 'axis_2' in report_payload:
            assert 'axis_2' in data['payload']
            assert data['payload']['axis_2'] is not None
            assert data['payload']['axis_2']['type'] == report_payload['axis_2']['type']
            if report_payload['axis_2']['type'] == 'custom_field':
                assert (
                    data['payload']['axis_2']['custom_field']['gid']
                    == status_field['gid']
                )
        else:
            assert data['payload']['axis_2'] is None

    # Test list returns all types correctly
    response = test_client.get('/api/v1/report/list', headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    assert data['payload']['count'] == 3

    # Verify each item in list has correct axis-based structure
    for item in data['payload']['items']:
        assert 'axis_1' in item
        assert 'axis_2' in item
        assert item['axis_1']['type'] in ['project', 'custom_field']
        # axis_2 can be None or have custom_field type
        if item['axis_2'] is not None:
            assert item['axis_2']['type'] == 'custom_field'

    # Test favorite functionality with different report types
    for report_id in report_ids:
        # Test favorite
        response = test_client.post(
            f'/api/v1/report/{report_id}/favorite', headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data['success']
        assert data['payload']['is_favorite']

        # Test unfavorite
        response = test_client.post(
            f'/api/v1/report/{report_id}/unfavorite', headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data['success']
        assert not data['payload']['is_favorite']

    # Clean up
    for report_id in report_ids:
        response = test_client.delete(f'/api/v1/report/{report_id}', headers=headers)
        assert response.status_code == 200
