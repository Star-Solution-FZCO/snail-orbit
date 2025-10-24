"""Tests for regular user endpoints (read-only operations)."""

from typing import TYPE_CHECKING

import pytest

if TYPE_CHECKING:
    from fastapi.testclient import TestClient

from tests.utils.avatar import gravatar_like_hash

from .create import create_user_with_token
from .helpers import assert_success_response, make_auth_headers
from .test_api import create_initial_admin


@pytest.mark.asyncio
@pytest.mark.parametrize(
    'user_payload',
    [
        {
            'email': 'regular_user@localhost.localdomain',
            'name': 'Regular User',
            'is_active': True,
            'is_admin': False,
        }
    ],
)
async def test_user_endpoints(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    create_user_with_token: tuple[str, str],
    user_payload: dict,
) -> None:
    """Test all regular user endpoints (read, list, select) with non-admin user."""
    user_id, regular_token = create_user_with_token
    headers = make_auth_headers(regular_token)

    # Test READ by ID (user reading themselves)
    response = test_client.get(f'/api/v1/user/{user_id}', headers=headers)
    expected_payload = {
        'email': user_payload['email'],
        'name': user_payload['name'],
        'is_active': user_payload['is_active'],
        'is_bot': False,  # Regular user email doesn't end with bot domain
        'avatar': f'/api/avatar/{gravatar_like_hash(user_payload["email"])}',
        'id': user_id,
    }
    assert_success_response(response, expected_payload)

    # Test READ by email
    user_email = user_payload['email']
    email_response = test_client.get(f'/api/v1/user/{user_email}', headers=headers)
    assert_success_response(email_response, expected_payload)
    # Verify email and ObjectId return identical data
    assert email_response.json() == response.json()

    # Test LIST functionality
    response = test_client.get('/api/v1/user/list', headers=headers)
    assert_success_response(response)

    users = response.json()['payload']['items']
    assert len(users) == 2  # user and admin

    # Verify users have expected limited fields (UserOutput, not UserFullOutput)
    for user in users:
        expected_fields = {'id', 'name', 'email', 'is_active', 'is_bot', 'avatar'}
        forbidden_fields = {
            'is_admin',
            'mfa_enabled',
            'origin',
            'global_roles',
            'avatar_type',
        }
        assert set(user.keys()) == expected_fields
        assert not any(field in user for field in forbidden_fields)

    # Test list with search
    response = test_client.get(
        '/api/v1/user/list?search=admin',
        headers=headers,
    )
    assert_success_response(response)

    # Test list with limit
    response = test_client.get('/api/v1/user/list?limit=1', headers=headers)
    assert_success_response(response)
    users = response.json()['payload']['items']
    assert len(users) == 1

    # Test SELECT functionality
    response = test_client.get('/api/v1/user/select', headers=headers)
    assert_success_response(response)

    users = response.json()['payload']['items']
    assert len(users) == 2  # user and admin

    # Verify sorting by name
    user_names = [user['name'] for user in users]
    assert user_names == sorted(user_names)

    # Verify users have expected limited fields (UserOutput, not UserFullOutput)
    for user in users:
        expected_fields = {'id', 'name', 'email', 'is_active', 'is_bot', 'avatar'}
        forbidden_fields = {
            'is_admin',
            'mfa_enabled',
            'origin',
            'global_roles',
            'avatar_type',
        }
        assert set(user.keys()) == expected_fields
        assert not any(field in user for field in forbidden_fields)

    # Test select with search
    response = test_client.get(
        '/api/v1/user/select?search=admin',
        headers=headers,
    )
    assert_success_response(response)

    # Test select with limit
    response = test_client.get('/api/v1/user/select?limit=1', headers=headers)
    assert_success_response(response)
    users = response.json()['payload']['items']
    assert len(users) == 1
