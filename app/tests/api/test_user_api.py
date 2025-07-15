from typing import TYPE_CHECKING

import pytest

if TYPE_CHECKING:
    from fastapi.testclient import TestClient

from tests.utils.avatar import gravatar_like_hash

from .create import create_user
from .helpers import assert_success_response, make_auth_headers
from .test_api import create_initial_admin


@pytest.mark.asyncio
@pytest.mark.parametrize(
    'user_payload',
    [
        pytest.param(
            {
                'email': 'test_user@localhost.localdomain',
                'name': 'Test User',
                'is_active': True,
                'send_email_invite': True,
                'send_pararam_invite': True,
            },
            id='user',
        ),
    ],
)
async def test_user_crud_workflow(
    test_client: 'TestClient',
    create_user: str,
    create_initial_admin: tuple[str, str],
    user_payload: dict,
) -> None:
    """Test complete user CRUD workflow: create, read, update."""
    _, admin_token = create_initial_admin
    headers = make_auth_headers(admin_token)

    # Test READ
    response = test_client.get(f'/api/v1/user/{create_user}', headers=headers)
    expected_payload = {
        **user_payload,
        'is_admin': user_payload.get('is_admin', False),
        'avatar_type': 'default',
        'origin': 'local',
        'avatar': f'/api/avatar/{gravatar_like_hash(user_payload["email"])}',
        'mfa_enabled': False,
        'id': create_user,
    }
    expected_payload.pop('send_email_invite', None)
    expected_payload.pop('send_pararam_invite', None)

    assert_success_response(response, expected_payload)

    # Test UPDATE
    response = test_client.put(
        f'/api/v1/user/{create_user}',
        headers=headers,
        json={'name': 'Test User updated'},
    )
    expected_updated_payload = {
        **expected_payload,
        'name': 'Test User updated',
    }
    assert_success_response(response, expected_updated_payload)
