from typing import TYPE_CHECKING

import pytest

if TYPE_CHECKING:
    from fastapi.testclient import TestClient

from .create import create_groups
from .helpers import (
    assert_success_response,
    make_auth_headers,
    run_crud_workflow,
)
from .test_api import create_initial_admin


@pytest.mark.asyncio
@pytest.mark.parametrize(
    'group_payloads',
    [
        pytest.param(
            [
                {
                    'name': 'Test group 1',
                    'description': 'Test group description 1',
                },
                {
                    'name': 'Test group 2',
                    'description': 'Test group description 2',
                },
            ],
            id='groups',
        ),
    ],
)
async def test_group_crud_and_list_workflow(
    test_client: 'TestClient',
    create_groups: list[str],
    create_initial_admin: tuple[str, str],
    group_payloads: list[dict],
) -> None:
    """Test complete group workflow: create, read, list, update, delete."""
    _, admin_token = create_initial_admin
    headers = make_auth_headers(admin_token)

    # Test LIST groups first (before CRUD operations that will delete the group)
    response = test_client.get('/api/v1/group/list', headers=headers)
    assert_success_response(response)

    # Verify the response contains both system groups and test groups
    data = response.json()
    assert data['payload']['count'] >= len(group_payloads), (
        'Should have at least the test groups'
    )
    assert data['payload']['limit'] == 50
    assert data['payload']['offset'] == 0

    # Check that system groups are present
    group_types = [item['type'] for item in data['payload']['items']]
    assert 'all_users' in group_types, 'Should contain All Users system group'
    assert 'system_admins' in group_types, 'Should contain System Admins group'

    # Check that our test groups are present
    test_group_names = [group['name'] for group in group_payloads]
    actual_group_names = [item['name'] for item in data['payload']['items']]
    for test_name in test_group_names:
        assert test_name in actual_group_names, (
            f"Test group '{test_name}' should be in the list"
        )

    # Use CRUD workflow helper for GET, UPDATE, DELETE operations
    expected_group_payload = {
        'id': create_groups[0],
        'type': 'local',
        **group_payloads[0],
    }
    expected_updated_payload = {
        'id': create_groups[0],
        'type': 'local',
        **group_payloads[0],
        'name': 'Test group updated',
    }

    run_crud_workflow(
        client=test_client,
        token=admin_token,
        base_url='/api/v1/group',
        entity_id=create_groups[0],
        expected_get_payload=expected_group_payload,
        update_data={'name': 'Test group updated'},
        expected_update_payload=expected_updated_payload,
    )
