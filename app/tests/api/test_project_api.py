from typing import TYPE_CHECKING

import pytest
import pytest_asyncio

if TYPE_CHECKING:
    from fastapi.testclient import TestClient

from .create import create_project
from .helpers import (
    assert_error_response,
    assert_success_response,
    make_auth_headers,
    run_crud_workflow,
)
from .test_api import create_initial_admin


@pytest.mark.asyncio
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
        )
    ],
)
async def test_project_crud_workflow(
    test_client: 'TestClient',
    create_project: str,
    create_initial_admin: tuple[str, str],
    project_payload: dict,
) -> None:
    """Test complete project CRUD workflow: create, read, update, delete."""
    _, admin_token = create_initial_admin

    expected_base_payload = {
        'id': create_project,
        **project_payload,
        'custom_fields': [],
        'card_fields': [],
        'workflows': [],
        'is_subscribed': False,
        'is_active': True,
        'avatar_type': 'default',
        'avatar': None,
        'encryption_settings': None,
        'is_encrypted': False,
    }

    expected_updated_payload = {**expected_base_payload, 'name': 'Test project updated'}

    # Use the CRUD workflow helper
    run_crud_workflow(
        client=test_client,
        token=admin_token,
        base_url='/api/v1/project',
        entity_id=create_project,
        expected_get_payload=expected_base_payload,
        update_data={'name': 'Test project updated'},
        expected_update_payload=expected_updated_payload,
    )


@pytest.mark.asyncio
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
        )
    ],
)
async def test_project_subscription_workflow(
    test_client: 'TestClient',
    create_project: str,
    create_initial_admin: tuple[str, str],
    project_payload: dict,
) -> None:
    """Test project subscription and unsubscription workflow."""
    _, admin_token = create_initial_admin
    headers = make_auth_headers(admin_token)

    base_payload = {
        'id': create_project,
        **project_payload,
        'custom_fields': [],
        'card_fields': [],
        'workflows': [],
        'is_active': True,
        'avatar_type': 'default',
        'avatar': None,
        'encryption_settings': None,
        'is_encrypted': False,
    }

    # Test SUBSCRIBE
    response = test_client.post(
        f'/api/v1/project/{create_project}/subscribe', headers=headers
    )
    subscribed_payload = {**base_payload, 'is_subscribed': True}
    assert_success_response(response, subscribed_payload)

    # Test UNSUBSCRIBE
    response = test_client.post(
        f'/api/v1/project/{create_project}/unsubscribe', headers=headers
    )
    unsubscribed_payload = {**base_payload, 'is_subscribed': False}
    assert_success_response(response, unsubscribed_payload)
