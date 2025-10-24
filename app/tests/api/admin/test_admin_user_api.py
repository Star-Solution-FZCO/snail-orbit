"""Tests for admin user management endpoints."""

from http import HTTPStatus
from typing import TYPE_CHECKING

import pytest
from beanie import PydanticObjectId

if TYPE_CHECKING:
    from fastapi.testclient import TestClient

from unittest import mock

from pm.constants import BOT_USER_DOMAIN
from tests.api.helpers import (
    assert_error_response,
    assert_success_response,
    make_auth_headers,
)
from tests.api.test_api import create_initial_admin
from tests.utils.avatar import gravatar_like_hash

from .helpers import assert_admin_required_error, make_admin_headers


@pytest.mark.asyncio
@pytest.mark.parametrize(
    'user_payload',
    [
        pytest.param(
            {
                'email': 'test_admin_user@localhost.localdomain',
                'name': 'Test Admin User',
                'is_active': True,
                'is_admin': False,
                'send_email_invite': True,
                'send_pararam_invite': True,
            },
            id='regular_user',
        ),
        pytest.param(
            {
                'email': 'test_admin_admin@localhost.localdomain',
                'name': 'Test Admin Admin',
                'is_active': True,
                'is_admin': True,
                'send_email_invite': False,
                'send_pararam_invite': False,
            },
            id='admin_user',
        ),
    ],
)
async def test_admin_user_crud_workflow(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    user_payload: dict,
) -> None:
    """Test complete admin user CRUD workflow: create, read, update."""
    _, admin_token = create_initial_admin
    headers = make_admin_headers(admin_token)

    # Test CREATE (mock the task calls to avoid task queue errors)
    with (
        mock.patch('pm.tasks.actions.task_send_email.kiq') as mock_email,
        mock.patch('pm.tasks.actions.task_send_pararam_message.kiq') as mock_pararam,
    ):
        response = test_client.post(
            '/api/v1/admin/user/', headers=headers, json=user_payload
        )

    # Verify task calls based on user payload settings
    if user_payload.get('send_email_invite'):
        mock_email.assert_called_once()
        call_args = mock_email.call_args
        assert call_args.kwargs['recipients'] == [user_payload['email']]
        assert 'Snail orbit registration' in call_args.kwargs['subject']
    else:
        mock_email.assert_not_called()

    if user_payload.get('send_pararam_invite'):
        mock_pararam.assert_called_once()
        call_args = mock_pararam.call_args
        assert call_args.kwargs['user_email'] == user_payload['email']
    else:
        mock_pararam.assert_not_called()
    expected_payload = {
        **user_payload,
        'is_admin': user_payload.get('is_admin', False),
        'is_bot': user_payload['email'].endswith(BOT_USER_DOMAIN),
        'avatar_type': 'default',
        'origin': 'local',
        'avatar': f'/api/avatar/{gravatar_like_hash(user_payload["email"])}',
        'mfa_enabled': False,
    }
    expected_payload.pop('send_email_invite', None)
    expected_payload.pop('send_pararam_invite', None)

    assert_success_response(response)
    created_user_id = response.json()['payload']['id']
    expected_payload['id'] = created_user_id

    # Verify creation response matches expected payload
    actual_payload = response.json()['payload']
    for key, expected_value in expected_payload.items():
        assert actual_payload[key] == expected_value, f'Mismatch for {key}'

    # Test READ
    response = test_client.get(f'/api/v1/admin/user/{created_user_id}', headers=headers)
    assert_success_response(response, expected_payload)

    # Test READ by email
    user_email = expected_payload['email']
    email_response = test_client.get(
        f'/api/v1/admin/user/{user_email}', headers=headers
    )
    assert_success_response(email_response, expected_payload)
    # Verify email and ObjectId return identical data
    assert email_response.json() == response.json()

    # Test UPDATE
    update_payload = {'name': 'Test Admin User Updated'}
    response = test_client.put(
        f'/api/v1/admin/user/{created_user_id}',
        headers=headers,
        json=update_payload,
    )
    expected_updated_payload = {
        **expected_payload,
        'name': 'Test Admin User Updated',
    }
    assert_success_response(response, expected_updated_payload)

    # Test UPDATE by email
    email_update_payload = {'name': 'Test Admin User Updated via Email'}
    email_update_response = test_client.put(
        f'/api/v1/admin/user/{user_email}',
        headers=headers,
        json=email_update_payload,
    )
    expected_email_updated = {
        **expected_payload,
        'name': 'Test Admin User Updated via Email',
    }
    assert_success_response(email_update_response, expected_email_updated)

    # Cross-validation: Verify ObjectId and email operations affect the same user
    verify_response = test_client.get(
        f'/api/v1/admin/user/{created_user_id}', headers=headers
    )
    assert (
        verify_response.json()['payload']['name'] == 'Test Admin User Updated via Email'
    )


@pytest.mark.asyncio
async def test_admin_user_global_roles_workflow(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
) -> None:
    """Test admin user global roles management."""
    _, admin_token = create_initial_admin
    headers = make_admin_headers(admin_token)

    # Create a test user (mock tasks to avoid queue errors)
    user_payload = {
        'email': 'test_global_roles@localhost.localdomain',
        'name': 'Test Global Roles User',
        'is_active': True,
        'is_admin': False,
    }
    with (
        mock.patch('pm.tasks.actions.task_send_email.kiq') as mock_email,
        mock.patch('pm.tasks.actions.task_send_pararam_message.kiq') as mock_pararam,
    ):
        response = test_client.post(
            '/api/v1/admin/user/', headers=headers, json=user_payload
        )

    # Verify tasks not called (no invite flags set)
    mock_email.assert_not_called()
    mock_pararam.assert_not_called()
    assert_success_response(response)
    user_id = response.json()['payload']['id']

    # Create a test global role first
    role_payload = {
        'name': 'Test Global Role',
        'description': 'Test role for global role assignment',
    }
    response = test_client.post(
        '/api/v1/global-role/', headers=headers, json=role_payload
    )
    assert_success_response(response)
    role_id = response.json()['payload']['id']

    # Test: List user global roles (initially empty)
    response = test_client.get(
        f'/api/v1/admin/user/{user_id}/global-roles', headers=headers
    )
    assert_success_response(response)
    assert response.json()['payload']['count'] == 0
    assert response.json()['payload']['items'] == []

    # Test: Assign global role to user
    response = test_client.post(
        f'/api/v1/admin/user/{user_id}/global-role/{role_id}',
        headers=headers,
    )
    assert_success_response(response)
    assert response.json()['payload']['id'] == role_id

    # Test: List user global roles (should have one)
    response = test_client.get(
        f'/api/v1/admin/user/{user_id}/global-roles', headers=headers
    )
    assert_success_response(response)
    assert response.json()['payload']['count'] == 1
    roles = response.json()['payload']['items']
    assert len(roles) == 1
    assert roles[0]['id'] == role_id
    assert roles[0]['name'] == 'Test Global Role'

    # Test: Assign same role again (should fail with conflict)
    response = test_client.post(
        f'/api/v1/admin/user/{user_id}/global-role/{role_id}',
        headers=headers,
    )
    assert_error_response(response, HTTPStatus.CONFLICT)

    # Test: Remove global role from user
    response = test_client.delete(
        f'/api/v1/admin/user/{user_id}/global-role/{role_id}',
        headers=headers,
    )
    assert_success_response(response)
    assert response.json()['payload']['id'] == role_id

    # Test: List user global roles (should be empty again)
    response = test_client.get(
        f'/api/v1/admin/user/{user_id}/global-roles', headers=headers
    )
    assert_success_response(response)
    assert response.json()['payload']['count'] == 0

    # Test: Remove non-existent role (should fail with not found)
    response = test_client.delete(
        f'/api/v1/admin/user/{user_id}/global-role/{role_id}',
        headers=headers,
    )
    assert_error_response(response, HTTPStatus.NOT_FOUND)


@pytest.mark.asyncio
async def test_admin_user_error_cases(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
) -> None:
    """Test error cases for admin user endpoints."""
    _, admin_token = create_initial_admin
    headers = make_admin_headers(admin_token)

    # Test: Get non-existent user
    fake_user_id = '507f1f77bcf86cd799439011'
    response = test_client.get(f'/api/v1/admin/user/{fake_user_id}', headers=headers)
    assert_error_response(response, HTTPStatus.NOT_FOUND)

    # Test: Update non-existent user
    response = test_client.put(
        f'/api/v1/admin/user/{fake_user_id}',
        headers=headers,
        json={'name': 'Non-existent User'},
    )
    assert_error_response(response, HTTPStatus.NOT_FOUND)

    # Test: Create user with missing required fields
    invalid_user_payload = {
        'name': 'Invalid User',
        # Missing email
        'is_active': True,
    }
    response = test_client.post(
        '/api/v1/admin/user/', headers=headers, json=invalid_user_payload
    )
    assert_error_response(response, HTTPStatus.UNPROCESSABLE_ENTITY)

    # Create a valid user for global role error tests (mock tasks)
    user_payload = {
        'email': 'test_errors@localhost.localdomain',
        'name': 'Test Errors User',
        'is_active': True,
    }
    with (
        mock.patch('pm.tasks.actions.task_send_email.kiq'),
        mock.patch('pm.tasks.actions.task_send_pararam_message.kiq'),
    ):
        response = test_client.post(
            '/api/v1/admin/user/', headers=headers, json=user_payload
        )
    assert_success_response(response)
    user_id = response.json()['payload']['id']

    # Test: Assign non-existent global role
    fake_role_id = '507f1f77bcf86cd799439012'
    response = test_client.post(
        f'/api/v1/admin/user/{user_id}/global-role/{fake_role_id}',
        headers=headers,
    )
    assert_error_response(response, HTTPStatus.NOT_FOUND)

    # Test: Global role operations on non-existent user
    response = test_client.get(
        f'/api/v1/admin/user/{fake_user_id}/global-roles', headers=headers
    )
    assert_error_response(response, HTTPStatus.NOT_FOUND)

    response = test_client.post(
        f'/api/v1/admin/user/{fake_user_id}/global-role/{fake_role_id}',
        headers=headers,
    )
    assert_error_response(response, HTTPStatus.NOT_FOUND)

    response = test_client.delete(
        f'/api/v1/admin/user/{fake_user_id}/global-role/{fake_role_id}',
        headers=headers,
    )
    assert_error_response(response, HTTPStatus.NOT_FOUND)


@pytest.mark.asyncio
async def test_admin_user_list_functionality(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
) -> None:
    """Test admin user list endpoint functionality."""
    _, admin_token = create_initial_admin
    headers = make_admin_headers(admin_token)

    # Create several test users (keep simple for admin list testing)
    user_payloads = [
        {
            'email': f'test_list_{i}@localhost.localdomain',
            'name': f'Test List User {i}',
            'is_active': True,
            'is_admin': i == 2,  # Make one user an admin
        }
        for i in range(3)
    ]

    created_user_ids = []
    with (
        mock.patch('pm.tasks.actions.task_send_email.kiq'),
        mock.patch('pm.tasks.actions.task_send_pararam_message.kiq'),
    ):
        for payload in user_payloads:
            response = test_client.post(
                '/api/v1/admin/user/', headers=headers, json=payload
            )
            assert_success_response(response)
            created_user_ids.append(response.json()['payload']['id'])

    # Test: List all users
    response = test_client.get('/api/v1/admin/user/list', headers=headers)
    assert_success_response(response)

    users = response.json()['payload']['items']
    # Should include initial admin + our 3 created users = 4 total
    assert len(users) >= 4

    # Verify our created users are in the list
    user_emails = {user['email'] for user in users}
    for payload in user_payloads:
        assert payload['email'] in user_emails

    # Test: List with search
    response = test_client.get(
        '/api/v1/admin/user/list?search=Test List User 1',
        headers=headers,
    )
    assert_success_response(response)
    users = response.json()['payload']['items']
    assert len(users) == 1
    assert users[0]['name'] == 'Test List User 1'

    # Test: List with limit
    response = test_client.get('/api/v1/admin/user/list?limit=2', headers=headers)
    assert_success_response(response)
    users = response.json()['payload']['items']
    assert len(users) == 2


@pytest.mark.asyncio
async def test_admin_user_select_functionality(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
) -> None:
    """Test admin user select endpoint functionality."""
    _, admin_token = create_initial_admin
    headers = make_admin_headers(admin_token)

    # Create test users (keep simple for admin select testing)
    user_payloads = [
        {
            'email': f'test_select_{i}@localhost.localdomain',
            'name': f'Select User {i}',
            'is_active': True,
        }
        for i in range(2)
    ]

    with (
        mock.patch('pm.tasks.actions.task_send_email.kiq'),
        mock.patch('pm.tasks.actions.task_send_pararam_message.kiq'),
    ):
        for payload in user_payloads:
            response = test_client.post(
                '/api/v1/admin/user/', headers=headers, json=payload
            )
            assert_success_response(response)

    # Test: Select users (should be sorted by name)
    response = test_client.get('/api/v1/admin/user/select', headers=headers)
    assert_success_response(response)

    users = response.json()['payload']['items']
    assert len(users) >= 3  # initial admin + our 2 users

    # Verify sorting by name
    user_names = [user['name'] for user in users]
    assert user_names == sorted(user_names)

    # Test: Select with search
    response = test_client.get(
        '/api/v1/admin/user/select?search=Select User 0',
        headers=headers,
    )
    assert_success_response(response)
    users = response.json()['payload']['items']
    assert len(users) == 1
    assert users[0]['name'] == 'Select User 0'


@pytest.mark.asyncio
async def test_bot_user_comprehensive(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
) -> None:
    """Comprehensive test for all bot user functionality."""
    _, admin_token = create_initial_admin
    headers = make_admin_headers(admin_token)

    # Test: Bot user with email invitation should fail
    bot_user_with_email_invite = {
        'email': f'api-bot{BOT_USER_DOMAIN}',
        'name': 'Bot User Email',
        'send_email_invite': True,
        'send_pararam_invite': False,
    }

    response = test_client.post(
        '/api/v1/admin/user/', headers=headers, json=bot_user_with_email_invite
    )
    assert_error_response(response, HTTPStatus.BAD_REQUEST)
    error_data = response.json()
    assert 'Cannot send invitations to bot users' in error_data['error_messages'][0]

    # Test: Bot user with Pararam invitation should fail
    bot_user_with_pararam_invite = {
        'email': f'webhook-bot{BOT_USER_DOMAIN}',
        'name': 'Bot User Pararam',
        'send_email_invite': False,
        'send_pararam_invite': True,
    }

    response = test_client.post(
        '/api/v1/admin/user/', headers=headers, json=bot_user_with_pararam_invite
    )
    assert_error_response(response, HTTPStatus.BAD_REQUEST)
    error_data = response.json()
    assert 'Cannot send invitations to bot users' in error_data['error_messages'][0]

    # Test: Bot user with both invitations should fail
    bot_user_with_both_invites = {
        'email': f'automation{BOT_USER_DOMAIN}',
        'name': 'Bot User Both',
        'send_email_invite': True,
        'send_pararam_invite': True,
    }

    response = test_client.post(
        '/api/v1/admin/user/', headers=headers, json=bot_user_with_both_invites
    )
    assert_error_response(response, HTTPStatus.BAD_REQUEST)
    error_data = response.json()
    assert 'Cannot send invitations to bot users' in error_data['error_messages'][0]

    # Test: Bot user without invitations should succeed
    bot_user_no_invites = {
        'email': f'success-bot{BOT_USER_DOMAIN}',
        'name': 'Bot User Success',
        'send_email_invite': False,
        'send_pararam_invite': False,
    }

    response = test_client.post(
        '/api/v1/admin/user/', headers=headers, json=bot_user_no_invites
    )
    assert_success_response(response)
    bot_user_data = response.json()['payload']
    bot_user_id = bot_user_data['id']

    expected_bot_data = {
        'is_bot': True,
        'email': f'success-bot{BOT_USER_DOMAIN}',
    }

    for key, expected_value in expected_bot_data.items():
        assert bot_user_data[key] == expected_value

    # === EMAIL RESTRICTION TESTS ===

    # Create a regular user for conversion testing
    regular_user_payload = {
        'email': 'regular-user@company.com',
        'name': 'Regular User',
        'send_email_invite': False,
        'send_pararam_invite': False,
    }

    response = test_client.post(
        '/api/v1/admin/user/', headers=headers, json=regular_user_payload
    )
    assert_success_response(response)
    regular_user_data = response.json()['payload']
    regular_user_id = regular_user_data['id']

    # Verify it's a regular user
    assert regular_user_data['is_bot'] is False

    # Try to convert regular user to bot user - should fail
    convert_to_bot_payload = {
        'email': f'converted-bot{BOT_USER_DOMAIN}',
        'name': 'Converted Bot User',
    }

    response = test_client.put(
        f'/api/v1/admin/user/{regular_user_id}',
        headers=headers,
        json=convert_to_bot_payload,
    )
    assert_error_response(response, HTTPStatus.FORBIDDEN)
    error_data = response.json()
    assert (
        'Cannot convert regular user to bot user via email change'
        in error_data['error_messages'][0]
    )

    # Regular user email change to another regular domain should succeed
    regular_email_change = {
        'email': 'updated-regular@company.com',
        'name': 'Updated Regular User',
    }

    response = test_client.put(
        f'/api/v1/admin/user/{regular_user_id}',
        headers=headers,
        json=regular_email_change,
    )
    assert_success_response(response)
    updated_regular_data = response.json()['payload']

    expected_regular_data = {
        'is_bot': False,
        'email': 'updated-regular@company.com',
    }

    for key, expected_value in expected_regular_data.items():
        assert updated_regular_data[key] == expected_value

    # Try to change bot user email to regular domain - should fail
    bot_to_regular_payload = {
        'email': 'converted-regular@company.com',
        'name': 'Converted Regular User',
    }

    response = test_client.put(
        f'/api/v1/admin/user/{bot_user_id}',
        headers=headers,
        json=bot_to_regular_payload,
    )
    assert_error_response(response, HTTPStatus.FORBIDDEN)
    error_data = response.json()
    assert (
        'Cannot change email address for bot users' in error_data['error_messages'][0]
    )

    # Try to change bot user email to different bot domain - should also fail
    bot_to_bot_payload = {
        'email': f'renamed-bot{BOT_USER_DOMAIN}',
        'name': 'Renamed Bot User',
    }

    response = test_client.put(
        f'/api/v1/admin/user/{bot_user_id}', headers=headers, json=bot_to_bot_payload
    )
    assert_error_response(response, HTTPStatus.FORBIDDEN)
    error_data = response.json()
    assert (
        'Cannot change email address for bot users' in error_data['error_messages'][0]
    )

    # === ALLOWED UPDATE TESTS ===

    # Change just the name - should succeed
    name_only_update = {
        'name': 'Bot User Updated Name Only',
    }

    response = test_client.put(
        f'/api/v1/admin/user/{bot_user_id}', headers=headers, json=name_only_update
    )
    assert_success_response(response)
    updated_user_data = response.json()['payload']

    expected_name_update_data = {
        'name': 'Bot User Updated Name Only',
        'email': f'success-bot{BOT_USER_DOMAIN}',
        'is_bot': True,
    }

    for key, expected_value in expected_name_update_data.items():
        assert updated_user_data[key] == expected_value

    # Change other fields (is_admin, is_active) - should succeed
    other_fields_update = {
        'is_admin': True,
        'is_active': False,
        'name': 'Bot User All Fields Updated',
    }

    response = test_client.put(
        f'/api/v1/admin/user/{bot_user_id}', headers=headers, json=other_fields_update
    )
    assert_success_response(response)
    final_user_data = response.json()['payload']

    expected_final_data = {
        'name': 'Bot User All Fields Updated',
        'is_admin': True,
        'is_active': False,
        'email': f'success-bot{BOT_USER_DOMAIN}',
        'is_bot': True,
    }

    for key, expected_value in expected_final_data.items():
        assert final_user_data[key] == expected_value
