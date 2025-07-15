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
    expected_list_payload = {
        'count': len(group_payloads),
        'limit': 50,
        'offset': 0,
        'items': [
            {'id': create_groups[idx], 'origin': 'local', **group_payloads[idx]}
            for idx in range(len(group_payloads))
        ],
    }
    assert_success_response(response, expected_list_payload)

    # Use CRUD workflow helper for GET, UPDATE, DELETE operations
    expected_group_payload = {
        'id': create_groups[0],
        'origin': 'local',
        **group_payloads[0],
    }
    expected_updated_payload = {
        'id': create_groups[0],
        'origin': 'local',
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
