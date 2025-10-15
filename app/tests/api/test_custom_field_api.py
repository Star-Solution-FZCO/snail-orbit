"""
Tests for Custom Field API endpoints.
"""

import pytest

from .create import create_project
from .custom_fields import create_custom_fields, link_custom_field_to_project
from .test_api import create_initial_admin, create_project_with_custom_fields

UNKNOWN_ID = '675579dff68118dbf878902c'


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
                    'description': 'Status field',
                    'ai_description': 'Field to track status',
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
                            'value': 'Done',
                            'color': '#4CAF50',
                            'is_archived': False,
                            'is_resolved': True,
                            'is_closed': False,
                        },
                    ],
                }
            ],
            id='status_field_test',
        ),
    ],
)
@pytest.mark.parametrize(
    'project_payload',
    [
        pytest.param(
            {
                'name': 'Test project',
                'slug': 'test',
                'description': 'Test project description',
                'ai_description': 'Test project AI description',
            },
            id='project',
        ),
    ],
)
async def test_custom_field_group_select_with_project_filter(
    test_client,
    create_initial_admin,
    create_project_with_custom_fields,
    project_payload,
    custom_field_payloads,
):
    """Test custom field group select endpoint with project_id parameter."""
    _, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}

    project_id = create_project_with_custom_fields['project_id']
    custom_fields = create_project_with_custom_fields['custom_fields']
    custom_field = custom_fields[0]

    # Test with project that has the field
    response = test_client.get(
        f'/api/v1/custom_field/group/{custom_field["gid"]}/select',
        headers=headers,
        params=[('project_id', project_id)],
    )
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    assert len(data['payload']['items']) >= 2

    # Test with non-existent project - should return empty list
    response = test_client.get(
        f'/api/v1/custom_field/group/{custom_field["gid"]}/select',
        headers=headers,
        params=[('project_id', UNKNOWN_ID)],
    )
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    assert len(data['payload']['items']) == 0
