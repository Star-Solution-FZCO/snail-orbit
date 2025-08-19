import base64
import hashlib
import uuid
from datetime import datetime
from http import HTTPStatus
from typing import TYPE_CHECKING
from unittest import mock

import pytest
import pytest_asyncio
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.x25519 import X25519PrivateKey

from tests.utils.avatar import gravatar_like_hash
from tests.utils.dict_utils import filter_dict
from tests.utils.encryption import (
    decrypt_aes_key_with_x25519,
    decrypt_with_aes,
    encrypt_aes_key_with_x25519,
    encrypt_with_aes,
)

from .create import (
    ALL_PERMISSIONS,
    _upload_attachment,
    create_group,
    create_groups,
    create_project,
    create_role,
    create_tag,
    create_user,
)
from .custom_fields import (
    create_custom_field,
    create_custom_fields,
    link_custom_field_to_project,
)

if TYPE_CHECKING:
    from fastapi.testclient import TestClient

UNKNOWN_ID = '675579dff68118dbf878902c'

INTERLINK_TYPES = (
    ('related', 'related'),
    ('required_for', 'depends_on'),
    ('depends_on', 'required_for'),
    ('duplicated_by', 'duplicates'),
    ('duplicates', 'duplicated_by'),
    ('subtask_of', 'parent_of'),
    ('parent_of', 'subtask_of'),
    ('blocks', 'blocked_by'),
    ('blocked_by', 'blocks'),
    ('clones', 'cloned_by'),
    ('cloned_by', 'clones'),
)


def _format_dt_to_response(dt: datetime) -> str:
    if dt.microsecond:
        return dt.isoformat(timespec='milliseconds') + '000'
    return dt.isoformat()


@pytest_asyncio.fixture
async def create_initial_admin() -> tuple[str, str]:
    from pm.models import User, UserOriginType

    user = User(
        email='test_admin@localhost.localdomain',
        name='Test Admin',
        is_active=True,
        is_admin=True,
        origin=UserOriginType.LOCAL,
    )
    await user.insert()
    token, token_obj = user.gen_new_api_token('test_token')
    user.api_tokens.append(token_obj)
    await user.save()
    return str(user.id), token


@pytest.mark.asyncio
async def test_api_v1_version_get(test_client: 'TestClient') -> None:
    response = test_client.get('/api/v1/version')
    assert response.status_code == 200
    assert response.json() == {'success': True, 'payload': {'version': '__DEV__'}}


@pytest.mark.asyncio
async def test_api_v1_profile_and_ui_settings(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
) -> None:
    admin_id, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}

    expected_profile_payload = {
        'name': 'Test Admin',
        'email': 'test_admin@localhost.localdomain',
        'is_admin': True,
        'id': admin_id,
        'is_active': True,
        'avatar': f'/api/avatar/{gravatar_like_hash("test_admin@localhost.localdomain")}',
        'ui_settings': {},
        'access_claims': [],
    }

    response = test_client.get('/api/v1/profile', headers=headers)
    assert response.status_code == 200
    assert response.json() == {
        'success': True,
        'payload': expected_profile_payload,
    }

    ui_settings_payload = {'ui_settings': {'test_key': 'test_value'}}

    response = test_client.put(
        '/api/v1/settings/ui_settings',
        headers=headers,
        json=ui_settings_payload,
    )
    assert response.status_code == 200
    assert response.json() == {
        'success': True,
        'payload': ui_settings_payload,
    }

    response = test_client.get('/api/v1/profile', headers=headers)
    assert response.status_code == 200
    assert response.json() == {
        'success': True,
        'payload': {
            **expected_profile_payload,
            **ui_settings_payload,
        },
    }


@pytest.mark.asyncio
async def test_api_v1_settings(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
) -> None:
    admin_id, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}

    fingerprint = 'ffffffff'
    encryption_key_payload = {
        'name': 'test',
        'public_key': 'A' * 64,
        'fingerprint': fingerprint,
        'algorithm': 'ED25519',
        'is_active': True,
        'created_on': 'test machine',
    }

    response = test_client.post(
        '/api/v1/settings/encryption_key',
        headers=headers,
        json=encryption_key_payload,
    )
    assert response.status_code == 200
    response_data = response.json()
    assert response_data['payload']['created_at']
    created_at = datetime.fromisoformat(response_data['payload'].pop('created_at'))
    assert response_data == {
        'success': True,
        'payload': encryption_key_payload,
    }

    response = test_client.get(
        f'/api/v1/settings/encryption_key/{fingerprint}',
        headers=headers,
    )
    assert response.status_code == 200
    assert response.json() == {
        'success': True,
        'payload': {
            **encryption_key_payload,
            'created_at': _format_dt_to_response(created_at),
        },
    }

    response = test_client.put(
        f'/api/v1/settings/encryption_key/{fingerprint}',
        headers=headers,
        json={'name': 'test updated', 'is_active': False},
    )
    assert response.status_code == 200
    assert response.json() == {
        'success': True,
        'payload': {
            **encryption_key_payload,
            'created_at': _format_dt_to_response(created_at),
            'name': 'test updated',
            'is_active': False,
        },
    }

    response = test_client.delete(
        f'/api/v1/settings/encryption_key/{fingerprint}',
        headers=headers,
    )
    assert response.status_code == 200
    assert response.json() == {'success': True}

    response = test_client.get(
        f'/api/v1/settings/encryption_key/{fingerprint}',
        headers=headers,
    )
    assert response.status_code == 404


@pytest.mark.asyncio
@pytest.mark.parametrize(
    'tag_payload',
    [
        pytest.param(
            {
                'name': 'Test tag',
                'description': 'Test tag description',
                'ai_description': 'Test tag AI description',
                'color': '#ff0000',
                'untag_on_resolve': True,
                'untag_on_close': True,
            },
            id='tag',
        ),
    ],
)
async def test_api_v1_tag(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    create_tag: str,
    tag_payload: dict,
) -> None:
    admin_id, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
    tag_id = create_tag

    response = test_client.get(
        f'/api/v1/tag/{tag_id}',
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    # Verify permission fields are present
    assert 'permissions' in data['payload']
    assert 'current_permission' in data['payload']
    assert data['payload']['current_permission'] == 'admin'
    assert len(data['payload']['permissions']) == 1
    assert data['payload']['permissions'][0]['permission_type'] == 'admin'
    # Clean up permission fields for payload comparison
    del data['payload']['created_by']
    del data['payload']['permissions']
    del data['payload']['current_permission']
    assert data['payload'] == {'id': tag_id, **tag_payload}

    response = test_client.put(
        f'/api/v1/tag/{tag_id}',
        headers=headers,
        json={'name': 'Updated name'},
    )
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    assert data['payload']['created_by']['id'] == admin_id
    # Verify permission fields are still present after update
    assert data['payload']['current_permission'] == 'admin'
    assert len(data['payload']['permissions']) == 1
    # Clean up permission fields for payload comparison
    del data['payload']['created_by']
    del data['payload']['permissions']
    del data['payload']['current_permission']
    assert data['payload'] == {
        'id': tag_id,
        **tag_payload,
        'name': 'Updated name',
    }

    response = test_client.delete(
        f'/api/v1/tag/{tag_id}',
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    assert data['payload'] == {'id': tag_id}

    response = test_client.get(
        f'/api/v1/tag/{tag_id}',
        headers=headers,
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_api_v1_tag_permissions(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
) -> None:
    """Test tag permission management endpoints."""
    admin_id, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}

    # Create a test user
    user_payload = {
        'name': 'Test User',
        'email': 'testuser@example.com',
        'is_active': True,
    }
    from .create import _create_user

    user_id = await _create_user(test_client, create_initial_admin, user_payload)

    # Create a test group
    group_payload = {
        'name': 'Test Group',
        'description': 'Group for tag testing',
    }
    from .create import _create_group

    group_id = await _create_group(test_client, create_initial_admin, group_payload)

    # Create tag
    tag_payload = {
        'name': 'Permissions Test Tag',
        'description': 'Tag for testing permissions',
        'color': '#FF5733',
    }

    response = test_client.post('/api/v1/tag', headers=headers, json=tag_payload)
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    tag_id = data['payload']['id']

    # Test granting user permission
    permission_payload = {
        'target_type': 'user',
        'target': user_id,
        'permission_type': 'view',
    }

    response = test_client.post(
        f'/api/v1/tag/{tag_id}/permission',
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
        f'/api/v1/tag/{tag_id}/permission',
        headers=headers,
        json=group_permission_payload,
    )
    assert response.status_code == 200
    data = response.json()
    assert data['success']

    # Test listing permissions
    response = test_client.get(f'/api/v1/tag/{tag_id}/permissions', headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    assert data['payload']['count'] == 3  # admin + user + group permissions

    # Test updating permission
    update_permission_payload = {
        'permission_type': 'edit',
    }

    response = test_client.put(
        f'/api/v1/tag/{tag_id}/permission/{permission_id}',
        headers=headers,
        json=update_permission_payload,
    )
    assert response.status_code == 200
    data = response.json()
    assert data['success']

    # Test revoking permission
    response = test_client.delete(
        f'/api/v1/tag/{tag_id}/permission/{permission_id}',
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data['success']

    # Verify permission was removed
    response = test_client.get(f'/api/v1/tag/{tag_id}/permissions', headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    assert data['payload']['count'] == 2  # admin + group permissions


@pytest.mark.asyncio
async def test_api_v1_tag_access_control(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
) -> None:
    """Test tag access control based on permissions."""
    admin_id, admin_token = create_initial_admin
    admin_headers = {'Authorization': f'Bearer {admin_token}'}

    # Create a test user
    user_payload = {
        'name': 'Test User',
        'email': 'testuser@example.com',
        'is_active': True,
    }
    from .create import _create_user

    user_id = await _create_user(test_client, create_initial_admin, user_payload)

    # Admin creates two tags
    tag1_payload = {
        'name': 'Admin Tag 1',
        'description': 'First tag created by admin',
        'color': '#FF5733',
    }
    response = test_client.post('/api/v1/tag', headers=admin_headers, json=tag1_payload)
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    tag1_id = data['payload']['id']

    tag2_payload = {
        'name': 'Admin Tag 2',
        'description': 'Second tag created by admin',
        'color': '#33FF57',
    }
    response = test_client.post('/api/v1/tag', headers=admin_headers, json=tag2_payload)
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    tag2_id = data['payload']['id']

    # Grant view permission to user for tag1 only
    permission_payload = {
        'target_type': 'user',
        'target': user_id,
        'permission_type': 'view',
    }
    response = test_client.post(
        f'/api/v1/tag/{tag1_id}/permission',
        headers=admin_headers,
        json=permission_payload,
    )
    assert response.status_code == 200

    # Test filtering: admin should see both tags
    response = test_client.get('/api/v1/tag/list', headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    admin_tag_ids = [item['id'] for item in data['payload']['items']]
    assert tag1_id in admin_tag_ids
    assert tag2_id in admin_tag_ids

    # Test that permissions affect which tags show correct current_permission
    tag1_data = next(item for item in data['payload']['items'] if item['id'] == tag1_id)
    tag2_data = next(item for item in data['payload']['items'] if item['id'] == tag2_id)
    assert tag1_data['current_permission'] == 'admin'  # Admin created it
    assert tag2_data['current_permission'] == 'admin'  # Admin created it

    # Verify tag1 has 2 permissions (admin + user view)
    assert len(tag1_data['permissions']) == 2
    # Verify tag2 has 1 permission (admin only)
    assert len(tag2_data['permissions']) == 1

    # Test permission-based access checks
    # Admin can access both tags
    response = test_client.get(f'/api/v1/tag/{tag1_id}', headers=admin_headers)
    assert response.status_code == 200
    response = test_client.get(f'/api/v1/tag/{tag2_id}', headers=admin_headers)
    assert response.status_code == 200

    # Admin can update both tags
    update_payload = {'name': 'Updated by admin'}
    response = test_client.put(
        f'/api/v1/tag/{tag1_id}', headers=admin_headers, json=update_payload
    )
    assert response.status_code == 200
    response = test_client.put(
        f'/api/v1/tag/{tag2_id}', headers=admin_headers, json=update_payload
    )
    assert response.status_code == 200

    # Admin can delete both tags (will do this at the end)
    # Test delete permission on tag2 first
    response = test_client.delete(f'/api/v1/tag/{tag2_id}', headers=admin_headers)
    assert response.status_code == 200

    # Verify tag2 is deleted
    response = test_client.get(f'/api/v1/tag/{tag2_id}', headers=admin_headers)
    assert response.status_code == 404


@pytest.mark.asyncio
@pytest.mark.parametrize(
    'custom_field_payload',
    [
        pytest.param(
            {
                'name': 'Test string field',
                'type': 'string',
                'is_nullable': True,
                'description': 'String custom field description',
                'ai_description': 'String custom field AI description',
                'default_value': None,
            },
            id='string',
        ),
        pytest.param(
            {
                'name': 'Test integer field',
                'type': 'integer',
                'is_nullable': False,
                'description': 'Integer custom field description',
                'ai_description': 'Integer custom field AI description',
                'default_value': 3,
            },
            id='integer',
        ),
        pytest.param(
            {
                'name': 'Test float field',
                'type': 'float',
                'is_nullable': True,
                'description': 'Float custom field description',
                'ai_description': 'Float custom field AI description',
                'default_value': 5.6,
            },
            id='float',
        ),
        pytest.param(
            {
                'name': 'Test float field 2',
                'type': 'float',
                'is_nullable': True,
                'description': 'Float custom field description',
                'ai_description': 'Float custom field AI description',
                'default_value': 500,
            },
            id='int_as_float',
        ),
        pytest.param(
            {
                'name': 'Test boolean field',
                'type': 'boolean',
                'is_nullable': False,
                'description': 'Boolean custom field description',
                'ai_description': 'Boolean custom field AI description',
                'default_value': False,
            },
            id='boolean',
        ),
        pytest.param(
            {
                'name': 'Test datetime field',
                'type': 'datetime',
                'is_nullable': True,
                'description': 'Datetime custom field description',
                'ai_description': 'Datetime custom field AI description',
                'default_value': '2022-02-25T15:22:10',
            },
            id='datetime',
        ),
        pytest.param(
            {
                'name': 'Test date field',
                'type': 'date',
                'is_nullable': False,
                'description': 'Date custom field description',
                'ai_description': 'Date custom field AI description',
                'default_value': '2021-01-01',
            },
            id='date',
        ),
        pytest.param(
            {
                'name': 'Test duration field',
                'type': 'duration',
                'is_nullable': False,
                'description': 'Duration custom field description',
                'ai_description': 'Duration custom field AI description',
                'default_value': 3600,
            },
            id='duration',
        ),
        pytest.param(
            {
                'name': 'Test enum field',
                'type': 'enum',
                'is_nullable': True,
                'description': 'Enum custom field description',
                'ai_description': None,
                'default_value': None,
                'options': [
                    {'value': 'Option 1', 'color': '#0000ff', 'is_archived': False},
                    {'value': 'Option 2', 'color': '#ff0000', 'is_archived': False},
                ],
            },
            id='enum',
        ),
        pytest.param(
            {
                'name': 'Test enum multi field',
                'type': 'enum_multi',
                'is_nullable': True,
                'description': 'Enum multi custom field description',
                'ai_description': None,
                'default_value': [],
                'options': [
                    {'value': 'Option 1', 'color': '#0000ff', 'is_archived': False},
                    {'value': 'Option 2', 'color': '#ff0000', 'is_archived': False},
                ],
            },
            id='enum multi',
        ),
        pytest.param(
            {
                'name': 'Test state field',
                'type': 'state',
                'is_nullable': True,
                'description': 'State custom field description',
                'ai_description': None,
                'default_value': None,
                'options': [
                    {
                        'value': 'Option 1',
                        'color': '#0000ff',
                        'is_archived': False,
                        'is_resolved': False,
                        'is_closed': False,
                    },
                    {
                        'value': 'Option 2',
                        'color': '#ff0000',
                        'is_archived': False,
                        'is_resolved': True,
                        'is_closed': False,
                    },
                    {
                        'value': 'Option 3',
                        'color': '#00ff00',
                        'is_archived': False,
                        'is_resolved': True,
                        'is_closed': True,
                    },
                ],
            },
            id='state',
        ),
        pytest.param(
            {
                'name': 'Test version field',
                'type': 'version',
                'is_nullable': True,
                'description': 'Version custom field description',
                'ai_description': None,
                'default_value': None,
                'options': [
                    {
                        'value': '1.1',
                        'release_date': '2022-02-25',
                        'is_archived': False,
                        'is_released': False,
                    },
                    {
                        'value': 'dev',
                        'release_date': None,
                        'is_archived': False,
                        'is_released': False,
                    },
                    {
                        'value': '1.2',
                        'release_date': '2022-03-25',
                        'is_archived': False,
                        'is_released': True,
                    },
                ],
            },
            id='version',
        ),
        pytest.param(
            {
                'name': 'Test version multi field',
                'type': 'version_multi',
                'is_nullable': True,
                'description': 'Multi version custom field description',
                'ai_description': 'Multi version custom field AI description',
                'default_value': [],
                'options': [
                    {
                        'value': '1.1',
                        'release_date': '2022-02-25',
                        'is_archived': False,
                        'is_released': False,
                    },
                    {
                        'value': 'dev',
                        'release_date': None,
                        'is_archived': False,
                        'is_released': False,
                    },
                    {
                        'value': '1.2',
                        'release_date': '2022-03-25',
                        'is_archived': False,
                        'is_released': True,
                    },
                ],
            },
            id='version_multi',
        ),
        pytest.param(
            {
                'name': 'Test owned field',
                'type': 'owned',
                'is_nullable': True,
                'description': 'Owned custom field description',
                'ai_description': 'Owned custom field AI description',
                'default_value': None,
                'options': [
                    {
                        'value': 'High Priority',
                        'owner': {
                            'id': '507f1f77bcf86cd799439011',
                            'name': 'Admin User',
                            'email': 'admin@example.com',
                        },
                        'color': '#ff0000',
                        'is_archived': False,
                    },
                    {
                        'value': 'Medium Priority',
                        'owner': None,
                        'color': '#ffff00',
                        'is_archived': False,
                    },
                    {
                        'value': 'Low Priority',
                        'owner': {
                            'id': '507f1f77bcf86cd799439012',
                            'name': 'User Two',
                            'email': 'user2@example.com',
                        },
                        'color': '#00ff00',
                        'is_archived': False,
                    },
                ],
            },
            id='owned',
        ),
        pytest.param(
            {
                'name': 'Test owned multi field',
                'type': 'owned_multi',
                'is_nullable': True,
                'description': 'Multi-owned custom field description',
                'ai_description': 'Multi-owned custom field AI description',
                'default_value': None,
                'options': [
                    {
                        'value': 'Team Lead',
                        'owner': {
                            'id': '507f1f77bcf86cd799439013',
                            'name': 'Team Lead',
                            'email': 'teamlead@example.com',
                        },
                        'color': '#ff0000',
                        'is_archived': False,
                    },
                    {
                        'value': 'Developer',
                        'owner': {
                            'id': '507f1f77bcf86cd799439014',
                            'name': 'Developer User',
                            'email': 'developer@example.com',
                        },
                        'color': '#00ff00',
                        'is_archived': False,
                    },
                    {
                        'value': 'Unassigned',
                        'owner': None,
                        'color': '#808080',
                        'is_archived': False,
                    },
                ],
            },
            id='owned_multi',
        ),
    ],
)
async def test_api_v1_custom_field_get_list_update(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    create_custom_field: dict,
    custom_field_payload: dict,
) -> None:
    _, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
    response = test_client.get(
        f'/api/v1/custom_field/{create_custom_field["id"]}',
        headers=headers,
    )
    field_expected_payload = {
        'id': create_custom_field['id'],
        'gid': create_custom_field['gid'],
        'label': 'default',
        **custom_field_payload,
        'projects': [],
    }

    if custom_field_payload['type'] in (
        'enum',
        'enum_multi',
        'state',
        'version',
        'version_multi',
        'owned',
        'owned_multi',
    ):
        if custom_field_payload['type'] in ('owned', 'owned_multi'):
            # For owned fields, use the actual API response data instead of original test data
            field_expected_payload['options'] = [
                {
                    'uuid': create_custom_field['options'][option['value']],
                    **create_custom_field['_option_data'][option['value']],
                }
                for option in custom_field_payload['options']
            ]
        else:
            field_expected_payload['options'] = [
                {'uuid': create_custom_field['options'][option['value']], **option}
                for option in custom_field_payload['options']
            ]

    assert response.status_code == 200
    assert response.json() == {
        'success': True,
        'payload': field_expected_payload,
    }

    response = test_client.get(
        '/api/v1/custom_field/group/list',
        params=[('limit', 50)],
        headers=headers,
    )
    assert response.status_code == 200
    assert response.json() == {
        'success': True,
        'payload': {
            'count': 1,
            'limit': 50,
            'offset': 0,
            'items': [
                {
                    'gid': create_custom_field['gid'],
                    'name': custom_field_payload['name'],
                    'type': custom_field_payload['type'],
                    'description': custom_field_payload['description'],
                    'ai_description': custom_field_payload['ai_description'],
                    'fields': [field_expected_payload],
                },
            ],
        },
    }

    response = test_client.put(
        f'/api/v1/custom_field/group/{create_custom_field["gid"]}',
        headers=headers,
        json={'name': 'Updated name'},
    )
    assert response.status_code == 200
    assert response.json() == {
        'success': True,
        'payload': {
            'gid': create_custom_field['gid'],
            'name': 'Updated name',
            'type': custom_field_payload['type'],
            'description': custom_field_payload['description'],
            'ai_description': custom_field_payload['ai_description'],
            'fields': [{**field_expected_payload, 'name': 'Updated name'}],
        },
    }


@pytest.mark.asyncio
@pytest.mark.parametrize(
    'custom_field_payload',
    [
        pytest.param(
            {
                'name': 'Test field',
                'type': 'string',
                'is_nullable': True,
                'description': 'Enum custom field description',
                'ai_description': None,
                'default_value': None,
            },
            id='string',
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
async def test_api_v1_custom_field_project_link(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    create_project: str,
    create_custom_field: dict,
    project_payload: dict,
    custom_field_payload: dict,
) -> None:
    _, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
    response = test_client.post(
        f'/api/v1/project/{create_project}/field/{create_custom_field["id"]}',
        headers=headers,
    )
    assert response.status_code == 200
    assert response.json() == {
        'success': True,
        'payload': {
            'id': create_project,
            **project_payload,
            'custom_fields': [
                {
                    'id': create_custom_field['id'],
                    'gid': create_custom_field['gid'],
                    'label': 'default',
                    **custom_field_payload,
                },
            ],
            'card_fields': [],
            'workflows': [],
            'is_subscribed': False,
            'is_favorite': False,
            'is_active': True,
            'avatar_type': 'default',
            'avatar': None,
            'encryption_settings': None,
            'is_encrypted': False,
            'access_claims': response.json()['payload'][
                'access_claims'
            ],  # Dynamic field from permissions
        },
    }

    response = test_client.put(
        f'/api/v1/project/{create_project}',
        headers=headers,
        json={'card_fields': [create_custom_field['id']]},
    )
    assert response.status_code == 200
    put_response_data = response.json()
    assert put_response_data == {
        'success': True,
        'payload': {
            'id': create_project,
            **project_payload,
            'custom_fields': [
                {
                    'id': create_custom_field['id'],
                    'gid': create_custom_field['gid'],
                    'label': 'default',
                    **custom_field_payload,
                },
            ],
            'card_fields': [create_custom_field['id']],
            'workflows': [],
            'is_subscribed': False,
            'is_favorite': False,
            'is_active': True,
            'avatar_type': 'default',
            'avatar': None,
            'encryption_settings': None,
            'is_encrypted': False,
            'access_claims': put_response_data['payload'][
                'access_claims'
            ],  # Dynamic field from permissions
        },
    }

    response = test_client.get(
        f'/api/v1/project/{create_project}',
        headers=headers,
    )
    assert response.status_code == 200
    get_response_data = response.json()
    assert get_response_data == {
        'success': True,
        'payload': {
            'id': create_project,
            **project_payload,
            'custom_fields': [
                {
                    'id': create_custom_field['id'],
                    'gid': create_custom_field['gid'],
                    'label': 'default',
                    **custom_field_payload,
                },
            ],
            'card_fields': [create_custom_field['id']],
            'workflows': [],
            'is_subscribed': False,
            'is_favorite': False,
            'is_active': True,
            'avatar_type': 'default',
            'avatar': None,
            'encryption_settings': None,
            'is_encrypted': False,
            'access_claims': get_response_data['payload'][
                'access_claims'
            ],  # Dynamic field from permissions
        },
    }

    response = test_client.delete(
        f'/api/v1/project/{create_project}/field/{create_custom_field["id"]}',
        headers=headers,
    )
    assert response.status_code == 200
    delete_response_data = response.json()
    assert delete_response_data == {
        'success': True,
        'payload': {
            'id': create_project,
            **project_payload,
            'custom_fields': [],
            'card_fields': [],
            'workflows': [],
            'is_subscribed': False,
            'is_favorite': False,
            'is_active': True,
            'avatar_type': 'default',
            'avatar': None,
            'encryption_settings': None,
            'is_encrypted': False,
            'access_claims': delete_response_data['payload'][
                'access_claims'
            ],  # Dynamic field from permissions
        },
    }


@pytest_asyncio.fixture
async def create_project_with_custom_fields(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    create_project: str,
    create_custom_fields: list[dict],
) -> dict:
    for cf in create_custom_fields:
        await link_custom_field_to_project(
            test_client,
            create_initial_admin,
            create_project,
            cf['id'],
        )
    return {
        'project_id': create_project,
        'custom_fields': create_custom_fields,
    }


@pytest.mark.asyncio
@pytest.mark.parametrize(
    'custom_field_payloads',
    [
        pytest.param(
            [
                {
                    'name': 'Test field',
                    'type': 'string',
                    'is_nullable': True,
                    'description': 'Custom field description',
                    'ai_description': None,
                    'default_value': None,
                },
                {
                    'name': 'Test field 2',
                    'type': 'integer',
                    'is_nullable': True,
                    'description': 'Custom field description',
                    'ai_description': None,
                    'default_value': None,
                },
            ],
            id='custom_fields',
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
@pytest.mark.parametrize(
    'role_payload',
    [
        pytest.param(
            {'name': 'Test role', 'description': 'Test role description'},
            id='role',
        ),
    ],
)
async def test_api_v1_custom_field_project_link_multiple(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    create_project_with_custom_fields: dict,
    project_payload: dict,
    custom_field_payloads: list[dict],
    create_role: str,
) -> None:
    _, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
    project_id = create_project_with_custom_fields['project_id']
    cf_ids = {cf['id'] for cf in create_project_with_custom_fields['custom_fields']}
    response = test_client.get(
        f'/api/v1/project/{project_id}',
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    assert data['payload']['id'] == project_id
    assert cf_ids == {cf['id'] for cf in data['payload']['custom_fields']}


@pytest.mark.asyncio
@pytest.mark.parametrize(
    'custom_field_payloads',
    [
        pytest.param(
            [
                {
                    'name': 'Test field',
                    'type': 'string',
                    'is_nullable': True,
                    'description': 'Custom field description',
                    'ai_description': None,
                    'default_value': None,
                },
                {
                    'name': 'Test field 2',
                    'type': 'integer',
                    'is_nullable': True,
                    'description': 'Custom field description',
                    'ai_description': None,
                    'default_value': None,
                },
            ],
            id='custom_fields',
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
@pytest.mark.parametrize(
    'role_payload',
    [
        pytest.param(
            {
                'name': 'Test role',
                'description': 'Test role description',
                'permissions': ALL_PERMISSIONS,
            },
            id='role',
        ),
    ],
)
@pytest.mark.parametrize(
    'issue_payload',
    [
        pytest.param(
            {
                'subject': 'Test issue',
                'text': {
                    'value': 'Test issue text\nBlah blah blah',
                    'encryption': None,
                },
            },
            id='issue',
        ),
    ],
)
async def test_api_v1_issue(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    create_role: str,
    create_project_with_custom_fields: dict,
    custom_field_payloads: list[dict],
    issue_payload: dict,
) -> None:
    admin_id, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
    project_id = create_project_with_custom_fields['project_id']

    response = test_client.post(
        f'/api/v1/project/{project_id}/permission',
        headers=headers,
        json={
            'target_type': 'user',
            'target_id': admin_id,
            'role_id': create_role,
        },
    )
    assert response.status_code == 200

    with mock.patch(
        'pm.api.routes.api.v1.issue.issue.schedule_batched_notification',
    ) as mock_notify:
        response = test_client.post(
            '/api/v1/issue',
            headers=headers,
            json={
                'project_id': project_id,
                **issue_payload,
            },
        )
        mock_notify.assert_called_once()
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    issue_id = data['payload']['id']
    issue_readable_id = data['payload']['id_readable']

    response = test_client.get(
        f'/api/v1/issue/{issue_id}',
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    assert filter_dict(
        data['payload'],
        excluded_keys={
            'created_at',
            'created_by',
            'fields',
            'project',
            'permissions',
            'disable_project_permissions_inheritance',
            'has_custom_permissions',
            'access_claims',
        },
    ) == {
        'id': issue_id,
        'aliases': [issue_readable_id],
        'id_readable': issue_readable_id,
        **issue_payload,
        'attachments': [],
        'interlinks': [],
        'tags': [],
        'is_subscribed': True,
        'updated_at': data['payload']['created_at'],
        'updated_by': data['payload']['created_by'],
        'is_resolved': False,
        'resolved_at': None,
        'is_closed': False,
        'closed_at': None,
    }
    assert data['payload']['project']['id'] == project_id
    assert data['payload']['created_by']['id'] == admin_id
    assert data['payload']['fields'].keys() == {
        cf['name'] for cf in custom_field_payloads
    }
    # Verify access_claims field is present and contains expected permissions
    assert 'access_claims' in data['payload']
    assert 'issue:manage_permissions' in data['payload']['access_claims']

    response = test_client.get(
        f'/api/v1/issue/{issue_readable_id}',
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    assert data['payload']['id'] == issue_id

    response = test_client.get('/api/v1/issue/list', headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    assert data['payload']['count'] == 1
    assert data['payload']['items'][0]['id'] == issue_id


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
        ),
    ],
)
@pytest.mark.parametrize(
    'role_payload',
    [
        pytest.param(
            {
                'name': 'Test role',
                'description': 'Test role description',
                'permissions': ALL_PERMISSIONS,
            },
            id='role',
        ),
    ],
)
@pytest.mark.parametrize(
    'issue_payloads',
    [
        pytest.param(
            [
                {
                    'subject': 'Test issue1',
                    'text': {
                        'value': 'Test issue text\nBlah blah blah',
                        'encryption': None,
                    },
                },
                {
                    'subject': 'Test issue 2',
                    'text': {
                        'value': 'Test issue text\nBlah blah blah',
                        'encryption': None,
                    },
                },
            ],
            id='issues',
        ),
    ],
)
async def test_api_v1_issue_link(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    create_role: str,
    create_project: str,
    issue_payloads: list[dict],
) -> None:
    admin_id, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
    project_id = create_project

    response = test_client.post(
        f'/api/v1/project/{project_id}/permission',
        headers=headers,
        json={
            'target_type': 'user',
            'target_id': admin_id,
            'role_id': create_role,
        },
    )
    assert response.status_code == 200

    issues = []
    with mock.patch('pm.api.routes.api.v1.issue.issue.schedule_batched_notification'):
        for issue_payload in issue_payloads:
            response = test_client.post(
                '/api/v1/issue',
                headers=headers,
                json={
                    'project_id': project_id,
                    **issue_payload,
                },
            )
            assert response.status_code == 200
            issues.append(response.json()['payload'])

    # Test link target selection endpoint (this was failing with PermAnd error)
    response = test_client.get(
        f'/api/v1/issue/{issues[0]["id"]}/link/target/select?limit=10&offset=0',
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    assert 'payload' in data
    assert 'items' in data['payload']
    assert 'count' in data['payload']

    # Should not include the current issue itself
    target_issue_ids = [item['id'] for item in data['payload']['items']]
    assert issues[0]['id'] not in target_issue_ids

    # Should have other created issues as linkable targets
    assert data['payload']['count'] == len(issues) - 1

    for link_type in INTERLINK_TYPES:
        response = test_client.post(
            f'/api/v1/issue/{issues[0]["id"]}/link',
            headers=headers,
            json={
                'type': link_type[0],
                'target_issues': [issues[1]['id']],
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data['success']
        assert len(data['payload']['interlinks']) == 1
        assert data['payload']['interlinks'][0]['type'] == link_type[0]
        assert data['payload']['interlinks'][0]['issue'] == filter_dict(
            issues[1],
            include_keys={
                'id',
                'aliases',
                'subject',
                'id_readable',
                'is_closed',
                'is_resolved',
            },
        )
        interlink_id = data['payload']['interlinks'][0]['id']

        response = test_client.get(
            f'/api/v1/issue/{issues[1]["id"]}',
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data['success']
        assert len(data['payload']['interlinks']) == 1
        assert data['payload']['interlinks'][0]['type'] == link_type[1]
        assert data['payload']['interlinks'][0]['issue'] == filter_dict(
            issues[0],
            include_keys={
                'id',
                'aliases',
                'subject',
                'id_readable',
                'is_closed',
                'is_resolved',
            },
        )
        assert data['payload']['interlinks'][0]['id'] == interlink_id

        response = test_client.delete(
            f'/api/v1/issue/{issues[0]["id"]}/link/{interlink_id}',
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data['success']
        assert len(data['payload']['interlinks']) == 0

        response = test_client.get(
            f'/api/v1/issue/{issues[1]["id"]}',
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data['success']
        assert len(data['payload']['interlinks']) == 0


@pytest_asyncio.fixture
async def create_initial_user() -> tuple[str, str]:
    from pm.models import User, UserOriginType

    user = User(
        email='test_user@localhost.localdomain',
        name='Test User',
        is_active=True,
        is_admin=False,
        origin=UserOriginType.LOCAL,
    )
    await user.insert()
    token, token_obj = user.gen_new_api_token('test_token')
    user.api_tokens.append(token_obj)
    await user.save()
    return str(user.id), token


async def _create_search(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    search_payload: dict,
) -> str:
    _, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
    response = test_client.post('/api/v1/search/', headers=headers, json=search_payload)
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    return str(data['payload']['id'])


@pytest_asyncio.fixture
async def create_search(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    search_payload: dict,
    create_custom_fields: list[dict],
) -> str:
    return await _create_search(test_client, create_initial_admin, search_payload)


async def add_user_to_group(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    user_id: str,
    group_id: str,
) -> None:
    _, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
    response = test_client.post(
        f'/api/v1/group/{group_id}/members/{user_id}',
        headers=headers,
    )
    assert response.status_code == 200


@pytest.mark.parametrize(
    'custom_field_payloads',
    [
        pytest.param(
            [
                {
                    'name': 'Test field',
                    'type': 'string',
                    'is_nullable': True,
                    'description': 'Custom field description',
                    'ai_description': None,
                    'default_value': None,
                },
            ],
            id='custom_fields',
        ),
    ],
)
@pytest.mark.parametrize(
    'search_payload',
    [
        pytest.param(
            {
                'name': 'Test Search Share',
                'query': 'Test field: "test query"',
            },
            id='share_search',
        ),
    ],
)
@pytest.mark.asyncio
async def test_api_v1_search_create(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    create_search: str,
    search_payload: dict,
):
    pass


@pytest.mark.parametrize(
    'custom_field_payloads',
    [
        pytest.param(
            [
                {
                    'name': 'Test field',
                    'type': 'string',
                    'is_nullable': True,
                    'description': 'Test field',
                    'default_value': None,
                    'ai_description': None,
                },
            ],
            id='custom_fields',
        ),
    ],
)
@pytest.mark.parametrize(
    ('search_payload', 'expected_status'),
    [
        pytest.param(
            {
                'name': 'Field Search',
                'query': 'Test field:"test value"',
            },
            200,
            id='valid_search',
        ),
        pytest.param(
            {
                'name': 'Invalid Search',
                'query': 'Test field::',
            },
            400,
            id='invalid_query_syntax',
        ),
        pytest.param(
            {
                'name': 'Non-existent Field',
                'query': 'NonExistentField:value',
            },
            400,
            id='unknown_field',
        ),
        pytest.param(
            {
                'query': 'Test field:"test value"',
            },
            422,
            id='no_search_name',
        ),
        pytest.param(
            {
                'name': 'Test',
            },
            422,
            id='no_search_query',
        ),
    ],
)
@pytest.mark.asyncio
async def test_api_v1_search_create_test_body_params(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    create_custom_fields: list[dict],
    search_payload: dict,
    expected_status: int,
) -> None:
    _, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
    response = test_client.post('/api/v1/search', headers=headers, json=search_payload)
    assert response.status_code == expected_status
    if expected_status == 200:
        data = response.json()
        assert data['success']
        assert data['payload']['name'] == search_payload['name']
        assert data['payload']['query'] == search_payload['query']
        assert len(data['payload']['permissions']) == 1


@pytest.mark.parametrize(
    'custom_field_payloads',
    [
        pytest.param(
            [
                {
                    'name': 'Test field',
                    'type': 'string',
                    'is_nullable': True,
                    'description': 'Custom field description',
                    'ai_description': None,
                    'default_value': None,
                },
            ],
            id='custom_fields',
        ),
    ],
)
@pytest.mark.parametrize(
    'search_payload',
    [
        pytest.param(
            {
                'name': 'Test Search Share',
                'query': 'Test field: "test query"',
            },
            id='share_search',
        ),
    ],
)
@pytest.mark.asyncio
async def test_api_v1_search_grant_permission_with_user_flow(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    create_search: str,
    search_payload: dict,
    create_custom_fields: list[dict],
    create_initial_user,
) -> None:
    admin_id, admin_token = create_initial_admin
    user_id, user_token = create_initial_user
    admin_headers = {'Authorization': f'Bearer {admin_token}'}
    user_headers = {'Authorization': f'Bearer {user_token}'}
    share_payload = {
        'target_type': 'user',
        'target': user_id,
        'permission_type': 'view',
    }

    # Share search with unknown user
    response = test_client.post(
        f'/api/v1/search/{create_search}/permission',
        headers=admin_headers,
        json={
            'target_type': 'user',
            'target': UNKNOWN_ID,
            'permission_type': 'view',
        },
    )
    assert response.status_code == HTTPStatus.BAD_REQUEST

    response = test_client.post(
        f'/api/v1/search/{create_search}/permission',
        headers=admin_headers,
        json={'target_type': 'user', 'target': admin_id, 'permission_type': 'view'},
    )
    assert response.status_code == 409
    response = test_client.post(
        f'/api/v1/search/{create_search}/permission',
        headers=admin_headers,
        json=share_payload,
    )
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    response = test_client.post(
        f'/api/v1/search/{create_search}/permission',
        headers=admin_headers,
        json=share_payload,
    )
    assert response.status_code == 409
    response = test_client.get(
        '/api/v1/search/list',
        headers=user_headers,
    )
    data = response.json()
    assert data['payload']['count'] == 1


@pytest.mark.parametrize(
    'group_payload',
    [
        pytest.param(
            {
                'name': 'Test Group',
                'description': 'Test group for search sharing',
            },
            id='share_group',
        ),
    ],
)
@pytest.mark.parametrize(
    'search_payload',
    [
        pytest.param(
            {
                'name': 'Test Search Share',
                'query': 'Test field: "test query"',
            },
            id='share_search',
        ),
    ],
)
@pytest.mark.parametrize(
    'custom_field_payloads',
    [
        pytest.param(
            [
                {
                    'name': 'Test field',
                    'type': 'string',
                    'is_nullable': True,
                    'description': 'Custom field description',
                    'ai_description': None,
                    'default_value': None,
                },
            ],
            id='custom_fields',
        ),
    ],
)
@pytest.mark.asyncio
async def test_api_v1_search_grant_and_revoke_permission_with_group_flow(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    create_search: str,
    create_group: str,
    search_payload: dict,
    create_custom_fields: list[dict],
    create_initial_user,
) -> None:
    admin_id, admin_token = create_initial_admin
    user_id, user_token = create_initial_user
    admin_headers = {'Authorization': f'Bearer {admin_token}'}
    user_headers = {'Authorization': f'Bearer {user_token}'}
    share_payload = {
        'target_type': 'group',
        'target': create_group,
        'permission_type': 'view',
    }

    # Share with unknown group
    response = test_client.post(
        f'/api/v1/search/{create_search}/permission',
        headers=admin_headers,
        json={
            'target_type': 'group',
            'target': UNKNOWN_ID,
            'permission_type': 'view',
        },
    )
    assert response.status_code == HTTPStatus.BAD_REQUEST

    response = test_client.post(
        f'/api/v1/search/{create_search}/permission',
        headers=admin_headers,
        json=share_payload,
    )
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    id = data['payload']['id']
    response = test_client.get(
        '/api/v1/search/list',
        headers=user_headers,
    )
    data = response.json()
    assert (
        data['payload']['count'] == 0
    )  # user doesn't see shared search list because it's not in same group as admin
    await add_user_to_group(test_client, create_initial_admin, user_id, create_group)
    response = test_client.get(
        '/api/v1/search/list',
        headers=user_headers,
    )
    data = response.json()
    assert data['payload']['count'] == 1
    response = test_client.post(
        f'/api/v1/search/{create_search}/permission',
        headers=admin_headers,
        json=share_payload,
    )
    assert response.status_code == 409
    response = test_client.delete(
        f'/api/v1/search/{create_search}/permission/{uuid.uuid4()}',
        headers=user_headers,
    )
    assert response.status_code == 403
    response = test_client.delete(
        f'/api/v1/search/{create_search}/permission/{id}',
        headers=admin_headers,
    )
    assert response.status_code == 200
    assert response.json()['payload']['id'] == id
    response = test_client.delete(
        f'/api/v1/search/{create_search}/permission/{id}',
        headers=admin_headers,
    )
    assert response.status_code == 404
    response = test_client.get(
        '/api/v1/search/list',
        headers=user_headers,
    )
    assert response.json()['payload']['count'] == 0


@pytest.mark.parametrize(
    'custom_field_payloads',
    [
        pytest.param(
            [
                {
                    'name': 'Test field',
                    'type': 'string',
                    'is_nullable': True,
                    'description': 'Custom field description',
                    'ai_description': None,
                    'default_value': None,
                },
            ],
            id='custom_fields',
        ),
    ],
)
@pytest.mark.parametrize(
    'search_payload',
    [
        pytest.param(
            {
                'name': 'Test Search Share',
                'query': 'Test field: "test query"',
            },
            id='share_search',
        ),
    ],
)
@pytest.mark.asyncio
async def test_api_v1_search_delete(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    create_search: str,
    search_payload: dict,
    create_custom_fields: list[dict],
    create_initial_user,
    custom_field_payloads,
) -> None:
    admin_id, admin_token = create_initial_admin
    user_id, user_token = create_initial_user
    admin_headers = {'Authorization': f'Bearer {admin_token}'}
    user_headers = {'Authorization': f'Bearer {user_token}'}
    response = test_client.delete(
        f'/api/v1/search/{create_search}',
        headers=user_headers,
    )
    assert response.status_code == 403
    response = test_client.delete(f'/api/v1/search/{UNKNOWN_ID}', headers=admin_headers)
    assert response.status_code == 404
    response = test_client.delete(
        f'/api/v1/search/{create_search}',
        headers=admin_headers,
    )
    data = response.json()
    assert data['success']
    assert data['payload']['id'] == create_search


@pytest.mark.asyncio
@pytest.mark.parametrize(
    'role_payload',
    [
        pytest.param(
            {
                'name': 'Test role',
                'description': 'Test role description',
                'permissions': ALL_PERMISSIONS,
            },
            id='role',
        ),
    ],
)
async def test_api_v1_encrypted_project(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    create_role: str,
) -> None:
    admin_id, admin_token = create_initial_admin
    admin_headers = {'Authorization': f'Bearer {admin_token}'}

    project_private_key = X25519PrivateKey.generate()
    project_public_key = project_private_key.public_key()
    project_private_key_bytes = project_private_key.private_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PrivateFormat.Raw,
        encryption_algorithm=serialization.NoEncryption(),
    )
    project_public_key_bytes = project_public_key.public_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PublicFormat.Raw,
    )
    project_public_key_b64 = base64.b64encode(project_public_key_bytes).decode('utf-8')
    project_fingerprint = hashlib.sha256(project_private_key_bytes).hexdigest()[0:8]

    admin_private_key = X25519PrivateKey.generate()
    admin_public_key = admin_private_key.public_key()
    admin_private_key_bytes = admin_private_key.private_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PrivateFormat.Raw,
        encryption_algorithm=serialization.NoEncryption(),
    )
    admin_public_key_bytes = admin_public_key.public_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PublicFormat.Raw,
    )
    admin_public_key_b64 = base64.b64encode(admin_public_key_bytes).decode('utf-8')
    admin_fingerprint = hashlib.sha256(admin_private_key_bytes).hexdigest()[0:8]

    response = test_client.post(
        '/api/v1/settings/encryption_key',
        json={
            'name': 'Admin test Key',
            'public_key': admin_public_key_b64,
            'fingerprint': admin_fingerprint,
            'algorithm': 'X25519',
            'is_active': True,
            'created_on': 'test machine',
        },
        headers=admin_headers,
    )
    assert response.status_code == 200

    key_data = {
        'name': 'Project test Key',
        'public_key': project_public_key_b64,
        'fingerprint': project_fingerprint,
        'algorithm': 'X25519',
        'is_active': True,
        'created_on': 'test machine',
    }

    project_data = {
        'name': 'Encrypted Project',
        'slug': 'ENCR',
        'description': 'This project is encrypted',
        'ai_description': 'This project is encrypted',
        'is_active': True,
        'encryption_settings': {
            'key': key_data,
            'users': [
                admin_id,
            ],
            'encrypt_comments': True,
            'encrypt_description': False,
        },
    }

    response = test_client.post(
        '/api/v1/project',
        json=project_data,
        headers=admin_headers,
    )
    assert response.status_code == 200
    response_data = response.json()
    assert response_data['success'] is True
    project = response_data['payload']
    assert project['encryption_settings']['encrypt_comments'] is True
    assert project['encryption_settings']['encrypt_attachments'] is True
    assert project['encryption_settings']['encrypt_description'] is False
    project_id = project['id']

    response = test_client.get(
        f'/api/v1/project/{project_id}/encryption_key/list',
        headers=admin_headers,
    )
    assert response.status_code == 200
    response_data = response.json()
    assert response_data['success']
    keys = response_data['payload']['items']
    assert len(keys) == response_data['payload']['count'] == 2
    assert keys == [
        {
            'fingerprint': project_fingerprint,
            'target_type': 'project',
            'target_id': project_id,
            'public_key': project_public_key_b64,
            'algorithm': 'X25519',
        },
        {
            'fingerprint': admin_fingerprint,
            'target_type': 'user',
            'target_id': admin_id,
            'public_key': admin_public_key_b64,
            'algorithm': 'X25519',
        },
    ]

    response = test_client.post(
        f'/api/v1/project/{project_id}/permission',
        headers=admin_headers,
        json={
            'target_type': 'user',
            'target_id': admin_id,
            'role_id': create_role,
        },
    )
    assert response.status_code == 200

    issue_payload = {
        'subject': 'Test encrypted issue',
        'text': {'value': 'Unencrypted description', 'encryption': None},
        'project_id': project_id,
    }

    with mock.patch(
        'pm.api.routes.api.v1.issue.issue.schedule_batched_notification',
    ) as mock_notify:
        response = test_client.post(
            '/api/v1/issue',
            headers=admin_headers,
            json=issue_payload,
        )
        mock_notify.assert_called_once()

    assert response.status_code == 200
    issue_id = response.json()['payload']['id']

    comment_text = 'This is an encrypted comment'
    comment_aes_key, encrypted_comment_text = encrypt_with_aes(comment_text)
    admin_enc = encrypt_aes_key_with_x25519(
        comment_aes_key,
        admin_public_key_bytes,
    )
    project_enc = encrypt_aes_key_with_x25519(
        comment_aes_key,
        project_public_key_bytes,
    )

    comment_data = {
        'text': {
            'value': encrypted_comment_text,
            'encryption': [
                {
                    'fingerprint': admin_fingerprint,
                    'target_type': 'user',
                    'target_id': admin_id,
                    'algorithm': 'X25519',
                    'data': admin_enc['encrypted_key'],
                    'extras': {
                        'ephemeral_public_key': admin_enc['ephemeral_public_key'],
                    },
                },
                {
                    'fingerprint': project_fingerprint,
                    'target_type': 'project',
                    'target_id': project_id,
                    'algorithm': 'X25519',
                    'data': project_enc['encrypted_key'],
                    'extras': {
                        'ephemeral_public_key': project_enc['ephemeral_public_key'],
                    },
                },
            ],
        },
    }

    with mock.patch(
        'pm.api.routes.api.v1.issue.comment.schedule_batched_notification',
    ) as mock_comment_notify:
        response = test_client.post(
            f'/api/v1/issue/{issue_id}/comment',
            json=comment_data,
            headers=admin_headers,
        )
        mock_comment_notify.assert_called_once()
    assert response.status_code == 200
    data = response.json()
    assert data['success']

    comment_id = data['payload']['id']
    assert data['payload']['text'] == {
        'value': encrypted_comment_text,
        'encryption': comment_data['text']['encryption'],
    }

    response = test_client.get(
        f'/api/v1/issue/{issue_id}/comment/{comment_id}',
        headers=admin_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    assert data['payload']['text'] == {
        'value': encrypted_comment_text,
        'encryption': comment_data['text']['encryption'],
    }

    admin_decrypted_aes_key = decrypt_aes_key_with_x25519(
        data['payload']['text']['encryption'][0]['data'],
        data['payload']['text']['encryption'][0]['extras']['ephemeral_public_key'],
        admin_private_key_bytes,
    )
    project_decrypted_aes_key = decrypt_aes_key_with_x25519(
        data['payload']['text']['encryption'][1]['data'],
        data['payload']['text']['encryption'][1]['extras']['ephemeral_public_key'],
        project_private_key_bytes,
    )
    assert admin_decrypted_aes_key == project_decrypted_aes_key
    assert admin_decrypted_aes_key == comment_aes_key

    decrypted_comment_text = decrypt_with_aes(
        admin_decrypted_aes_key,
        data['payload']['text']['value'],
    )
    assert decrypted_comment_text == comment_text

    # issue encryption meta
    issue_attachment = _upload_attachment(
        test_client,
        admin_headers,
        filename='issue_attachment.txt',
    )
    encryption_meta = comment_data['text']['encryption']
    with mock.patch(
        'pm.api.routes.api.v1.issue.issue.schedule_batched_notification',
    ) as mock_notify:
        response = test_client.put(
            f'/api/v1/issue/{issue_id}',
            headers=admin_headers,
            json={
                'attachments': [
                    {'id': issue_attachment, 'encryption': encryption_meta},
                ],
            },
        )
        mock_notify.assert_called_once()
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    assert len(data['payload']['attachments']) == 1
    assert data['payload']['attachments'][0]['id'] == issue_attachment
    assert data['payload']['attachments'][0]['encryption'] == encryption_meta
    response = test_client.get(f'/api/v1/issue/{issue_id}', headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    assert len(data['payload']['attachments']) == 1
    assert data['payload']['attachments'][0]['id'] == issue_attachment
    assert data['payload']['attachments'][0]['encryption'] == encryption_meta

    # issue draft encryption meta
    draft_attachment = _upload_attachment(
        test_client,
        admin_headers,
        filename='draft_attachment.txt',
    )
    resp = test_client.post(
        '/api/v1/issue/draft',
        headers=admin_headers,
        json={
            'project_id': project_id,
            'subject': 'Draft with attachment',
            'attachments': [{'id': draft_attachment, 'encryption': encryption_meta}],
        },
    )
    assert resp.status_code == 200
    draft = resp.json()['payload']
    draft_id = draft['id']
    assert draft['attachments'][0]['encryption'] == encryption_meta
    resp = test_client.get(f'/api/v1/issue/draft/{draft_id}', headers=admin_headers)
    assert resp.status_code == 200
    draft = resp.json()['payload']
    assert draft['attachments'][0]['encryption'] == encryption_meta

    # comment encryption meta
    comment_attachment = _upload_attachment(
        test_client,
        admin_headers,
        filename='comment_attachment.txt',
    )
    with mock.patch(
        'pm.api.routes.api.v1.issue.comment.schedule_batched_notification',
    ) as mock_comment_notify:
        resp = test_client.post(
            f'/api/v1/issue/{issue_id}/comment/',
            headers=admin_headers,
            json={
                'text': {'value': 'Comment with attachment', 'encryption': None},
                'attachments': [
                    {'id': comment_attachment, 'encryption': encryption_meta}
                ],
            },
        )
        mock_comment_notify.assert_called_once()
    assert resp.status_code == 200
    comment = resp.json()['payload']
    comment_id = comment['id']
    assert comment['attachments'][0]['encryption'] == encryption_meta
    resp = test_client.get(
        f'/api/v1/issue/{issue_id}/comment/{comment_id}',
        headers=admin_headers,
    )
    assert resp.status_code == 200
    comment = resp.json()['payload']
    assert comment['attachments'][0]['encryption'] == encryption_meta


@pytest.mark.asyncio
@pytest.mark.parametrize(
    'project_payload',
    [
        pytest.param(
            {
                'name': 'Test Project',
                'slug': 'test_project',
                'description': 'Test project for tag filtering',
                'ai_description': 'Test project AI description',
            }
        ),
    ],
)
@pytest.mark.parametrize(
    'role_payload',
    [
        pytest.param(
            {
                'name': 'Test Role',
                'description': 'Role for testing tag permissions',
                'permissions': ['issue:read', 'issue:create', 'issue:update'],
            }
        ),
    ],
)
async def test_issue_tag_permission_filtering(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    create_initial_user: tuple[str, str],
    create_project: str,
    create_role: str,
) -> None:
    """Test that users only see tags they have permission to view in issue responses"""
    admin_id, admin_token = create_initial_admin
    admin_headers = {'Authorization': f'Bearer {admin_token}'}

    user_id, user_token = create_initial_user
    user_headers = {'Authorization': f'Bearer {user_token}'}

    project_id = create_project
    role_id = create_role

    # Add admin user to project with the role (admin needs explicit project permissions)
    admin_permission_resp = test_client.post(
        f'/api/v1/project/{project_id}/permission',
        headers=admin_headers,
        json={
            'target_type': 'user',
            'target_id': admin_id,
            'role_id': role_id,
        },
    )
    assert admin_permission_resp.status_code == 200

    # Add user to project with the role
    user_permission_resp = test_client.post(
        f'/api/v1/project/{project_id}/permission',
        headers=admin_headers,
        json={
            'target_type': 'user',
            'target_id': user_id,
            'role_id': role_id,
        },
    )
    assert user_permission_resp.status_code == 200

    # Create two tags - user will have permission to one but not the other
    tag1_resp = test_client.post(
        '/api/v1/tag/',
        headers=admin_headers,
        json={'name': 'accessible-tag', 'color': '#FF0000'},
    )
    assert tag1_resp.status_code == 200
    accessible_tag_id = tag1_resp.json()['payload']['id']

    tag2_resp = test_client.post(
        '/api/v1/tag/',
        headers=admin_headers,
        json={'name': 'restricted-tag', 'color': '#00FF00'},
    )
    assert tag2_resp.status_code == 200
    restricted_tag_id = tag2_resp.json()['payload']['id']

    # Grant user permission to first tag only
    tag_perm_resp = test_client.post(
        f'/api/v1/tag/{accessible_tag_id}/permission',
        headers=admin_headers,
        json={'target_type': 'user', 'target': user_id, 'permission_type': 'view'},
    )
    assert tag_perm_resp.status_code == 200

    # Create issue
    issue_resp = test_client.post(
        '/api/v1/issue/',
        headers=admin_headers,
        json={'project_id': project_id, 'subject': 'Test issue'},
    )
    assert issue_resp.status_code == 200
    issue_id = issue_resp.json()['payload']['id']

    # Add both tags to issue
    test_client.put(
        f'/api/v1/issue/{issue_id}/tag',
        headers=admin_headers,
        json={'tag_id': accessible_tag_id},
    )
    test_client.put(
        f'/api/v1/issue/{issue_id}/tag',
        headers=admin_headers,
        json={'tag_id': restricted_tag_id},
    )

    # Admin should see both tags
    admin_resp = test_client.get(f'/api/v1/issue/{issue_id}', headers=admin_headers)
    assert admin_resp.status_code == 200
    admin_tags = admin_resp.json()['payload']['tags']
    assert len(admin_tags) == 2
    admin_tag_ids = {tag['id'] for tag in admin_tags}
    assert accessible_tag_id in admin_tag_ids
    assert restricted_tag_id in admin_tag_ids

    # User should only see accessible tag
    user_resp = test_client.get(f'/api/v1/issue/{issue_id}', headers=user_headers)
    assert user_resp.status_code == 200
    user_tags = user_resp.json()['payload']['tags']
    assert len(user_tags) == 1
    assert user_tags[0]['id'] == accessible_tag_id
    assert user_tags[0]['name'] == 'accessible-tag'


@pytest.mark.asyncio
@pytest.mark.parametrize(
    'project_payload',
    [
        pytest.param(
            {
                'name': 'Test Project List',
                'slug': 'test_project_list',
                'description': 'Test project for issue list tag filtering',
                'ai_description': 'Test project AI description',
            }
        ),
    ],
)
@pytest.mark.parametrize(
    'role_payload',
    [
        pytest.param(
            {
                'name': 'Test Role List',
                'description': 'Role for testing tag list filtering',
                'permissions': ['issue:read', 'issue:create', 'issue:update'],
            }
        ),
    ],
)
async def test_issue_list_tag_filtering(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    create_initial_user: tuple[str, str],
    create_project: str,
    create_role: str,
) -> None:
    """Test that issue list endpoint filters tags based on permissions"""
    admin_id, admin_token = create_initial_admin
    admin_headers = {'Authorization': f'Bearer {admin_token}'}

    user_id, user_token = create_initial_user
    user_headers = {'Authorization': f'Bearer {user_token}'}

    project_id = create_project
    role_id = create_role

    # Add admin user to project with the role (admin needs explicit project permissions)
    admin_permission_resp = test_client.post(
        f'/api/v1/project/{project_id}/permission',
        headers=admin_headers,
        json={
            'target_type': 'user',
            'target_id': admin_id,
            'role_id': role_id,
        },
    )
    assert admin_permission_resp.status_code == 200

    # Add user to project with the role
    user_permission_resp = test_client.post(
        f'/api/v1/project/{project_id}/permission',
        headers=admin_headers,
        json={
            'target_type': 'user',
            'target_id': user_id,
            'role_id': role_id,
        },
    )
    assert user_permission_resp.status_code == 200

    # Create tag accessible to user
    tag_resp = test_client.post(
        '/api/v1/tag/',
        headers=admin_headers,
        json={'name': 'user-tag', 'color': '#FF0000'},
    )
    accessible_tag_id = tag_resp.json()['payload']['id']

    # Grant user permission to tag
    test_client.post(
        f'/api/v1/tag/{accessible_tag_id}/permission',
        headers=admin_headers,
        json={'target_type': 'user', 'target': user_id, 'permission_type': 'view'},
    )

    # Create restricted tag
    restricted_tag_resp = test_client.post(
        '/api/v1/tag/',
        headers=admin_headers,
        json={'name': 'admin-only-tag', 'color': '#00FF00'},
    )
    restricted_tag_id = restricted_tag_resp.json()['payload']['id']

    # Create issue with both tags
    issue_resp = test_client.post(
        '/api/v1/issue/',
        headers=admin_headers,
        json={'project_id': project_id, 'subject': 'Test issue for list'},
    )
    issue_id = issue_resp.json()['payload']['id']

    test_client.put(
        f'/api/v1/issue/{issue_id}/tag',
        headers=admin_headers,
        json={'tag_id': accessible_tag_id},
    )
    test_client.put(
        f'/api/v1/issue/{issue_id}/tag',
        headers=admin_headers,
        json={'tag_id': restricted_tag_id},
    )

    # User list should filter tags
    user_list_resp = test_client.get('/api/v1/issue/list', headers=user_headers)
    assert user_list_resp.status_code == 200
    issues = user_list_resp.json()['payload']['items']

    found_issue = None
    for issue in issues:
        if issue['id'] == issue_id:
            found_issue = issue
            break

    assert found_issue is not None
    assert len(found_issue['tags']) == 1
    assert found_issue['tags'][0]['id'] == accessible_tag_id


@pytest.mark.asyncio
@pytest.mark.parametrize(
    'project_payload',
    [
        pytest.param(
            {
                'name': 'Test Project Untag',
                'slug': 'test_project_untag',
                'description': 'Test project for tag/untag permission checks',
                'ai_description': 'Test project AI description',
            }
        ),
    ],
)
@pytest.mark.parametrize(
    'role_payload',
    [
        pytest.param(
            {
                'name': 'Test Role Untag',
                'description': 'Role for testing tag/untag permission checks',
                'permissions': ['issue:read', 'issue:create', 'issue:update'],
            }
        ),
    ],
)
async def test_tag_untag_permission_checks(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    create_initial_user: tuple[str, str],
    create_project: str,
    create_role: str,
) -> None:
    """Test that tag/untag operations require tag permissions"""
    admin_id, admin_token = create_initial_admin
    admin_headers = {'Authorization': f'Bearer {admin_token}'}

    user_id, user_token = create_initial_user
    user_headers = {'Authorization': f'Bearer {user_token}'}

    project_id = create_project
    role_id = create_role

    # Add admin user to project with the role (admin needs explicit project permissions)
    admin_permission_resp = test_client.post(
        f'/api/v1/project/{project_id}/permission',
        headers=admin_headers,
        json={
            'target_type': 'user',
            'target_id': admin_id,
            'role_id': role_id,
        },
    )
    assert admin_permission_resp.status_code == 200

    # Add user to project with the role
    user_permission_resp = test_client.post(
        f'/api/v1/project/{project_id}/permission',
        headers=admin_headers,
        json={
            'target_type': 'user',
            'target_id': user_id,
            'role_id': role_id,
        },
    )
    assert user_permission_resp.status_code == 200

    # Create restricted tag (user has no permission)
    tag_resp = test_client.post(
        '/api/v1/tag/',
        headers=admin_headers,
        json={'name': 'restricted-tag', 'color': '#FF0000'},
    )
    restricted_tag_id = tag_resp.json()['payload']['id']

    # Create issue
    issue_resp = test_client.post(
        '/api/v1/issue/',
        headers=admin_headers,
        json={'project_id': project_id, 'subject': 'Test issue'},
    )
    issue_id = issue_resp.json()['payload']['id']

    # User should not be able to tag issue with restricted tag
    tag_resp = test_client.put(
        f'/api/v1/issue/{issue_id}/tag',
        headers=user_headers,
        json={'tag_id': restricted_tag_id},
    )
    assert tag_resp.status_code == 403
    response_json = tag_resp.json()
    assert response_json['success'] is False
    assert 'Tag access denied' in response_json['error_messages']

    # Admin can tag the issue
    admin_tag_resp = test_client.put(
        f'/api/v1/issue/{issue_id}/tag',
        headers=admin_headers,
        json={'tag_id': restricted_tag_id},
    )
    assert admin_tag_resp.status_code == 200

    # User should not be able to untag either
    untag_resp = test_client.put(
        f'/api/v1/issue/{issue_id}/untag',
        headers=user_headers,
        json={'tag_id': restricted_tag_id},
    )
    assert untag_resp.status_code == 403
    untag_response_json = untag_resp.json()
    assert untag_response_json['success'] is False
    assert 'Tag access denied' in untag_response_json['error_messages']

    # Grant user VIEW permission to tag
    test_client.post(
        f'/api/v1/tag/{restricted_tag_id}/permission',
        headers=admin_headers,
        json={'target_type': 'user', 'target': user_id, 'permission_type': 'view'},
    )

    # Now user should be able to untag
    untag_resp = test_client.put(
        f'/api/v1/issue/{issue_id}/untag',
        headers=user_headers,
        json={'tag_id': restricted_tag_id},
    )
    assert untag_resp.status_code == 200


@pytest.mark.parametrize(
    'custom_field_payload',
    [
        pytest.param(
            {
                'name': 'Test String Field',
                'type': 'string',
                'description': 'A test string field',
                'ai_description': None,
                'is_nullable': True,
                'default_value': None,
            },
            id='string',
        ),
        pytest.param(
            {
                'name': 'Test Int Field',
                'type': 'integer',
                'description': 'A test integer field',
                'ai_description': 'some ai description',
                'is_nullable': False,
                'default_value': 3,
            },
            id='int_with_default',
        ),
        pytest.param(
            {
                'name': 'Test Enum Field',
                'type': 'enum',
                'description': 'A test enum field',
                'ai_description': None,
                'is_nullable': True,
                'default_value': None,
                'options': [
                    {'value': 'option1', 'color': '#ff0000', 'is_archived': False},
                    {'value': 'option2', 'color': '#00ff00', 'is_archived': False},
                ],
            },
            id='enum',
        ),
        pytest.param(
            {
                'name': 'Test Enum Field with Default',
                'type': 'enum',
                'description': 'A test enum field with default value',
                'ai_description': None,
                'is_nullable': False,
                'default_value': 'option1',
                'options': [
                    {'value': 'option1', 'color': '#ff0000', 'is_archived': False},
                    {'value': 'option2', 'color': '#00ff00', 'is_archived': False},
                ],
            },
            id='enum_with_default',
        ),
    ],
)
@pytest.mark.asyncio
async def test_api_v1_custom_field_copy(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    create_custom_field: dict,
    custom_field_payload: dict,
) -> None:
    _, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}

    # Copy the custom field with a new label
    copy_response = test_client.post(
        f'/api/v1/custom_field/{create_custom_field["id"]}/copy',
        headers=headers,
        json={'label': 'copied_label'},
    )
    assert copy_response.status_code == 200
    copy_data = copy_response.json()
    assert copy_data['success'] is True

    copied_field = copy_data['payload']

    # Verify the copied field has the same group properties
    assert copied_field['gid'] == create_custom_field['gid']
    assert copied_field['name'] == custom_field_payload['name']
    assert copied_field['type'] == custom_field_payload['type']
    assert copied_field['description'] == custom_field_payload['description']
    assert copied_field['ai_description'] == custom_field_payload['ai_description']

    # Verify the copied field has the new label
    assert copied_field['label'] == 'copied_label'

    # Verify other field properties are copied
    assert copied_field['is_nullable'] == custom_field_payload['is_nullable']

    # For fields with default values, compare the processed default value
    if custom_field_payload.get('default_value') is not None:
        if custom_field_payload['type'] == 'enum' and isinstance(
            copied_field['default_value'], dict
        ):
            # For enum fields, default_value becomes an option object with value property
            assert (
                copied_field['default_value']['value']
                == custom_field_payload['default_value']
            )
        else:
            assert (
                copied_field['default_value'] == custom_field_payload['default_value']
            )
    else:
        assert copied_field['default_value'] == custom_field_payload['default_value']

    # Verify it has a different ID
    assert copied_field['id'] != create_custom_field['id']

    # Verify projects list is empty (not linked to any projects)
    assert copied_field['projects'] == []

    # Verify options are copied for enum type
    if custom_field_payload['type'] == 'enum':
        assert 'options' in copied_field
        assert len(copied_field['options']) == len(custom_field_payload['options'])
        # Options should have same values but different IDs
        copied_values = {opt['value'] for opt in copied_field['options']}
        original_values = {opt['value'] for opt in custom_field_payload['options']}
        assert copied_values == original_values

        # Get original field to compare option IDs
        original_response = test_client.get(
            f'/api/v1/custom_field/{create_custom_field["id"]}',
            headers=headers,
        )
        original_field = original_response.json()['payload']

        # Verify that option IDs are different (new UUIDs generated)
        if 'options' in original_field:
            original_option_ids = {opt['uuid'] for opt in original_field['options']}
            copied_option_ids = {opt['uuid'] for opt in copied_field['options']}
            assert original_option_ids.isdisjoint(copied_option_ids), (
                'Option IDs should be different'
            )

    # Verify default value is properly copied and validated for enum fields with default values
    if custom_field_payload['type'] == 'enum' and custom_field_payload.get(
        'default_value'
    ):
        assert copied_field['default_value'] is not None
        assert (
            copied_field['default_value']['value']
            == custom_field_payload['default_value']
        )
        # Verify the default value has an ID (it was validated and converted to an option object)
        assert 'id' in copied_field['default_value']

        # Verify the default value option has a new ID (different from original)
        original_response = test_client.get(
            f'/api/v1/custom_field/{create_custom_field["id"]}',
            headers=headers,
        )
        original_field = original_response.json()['payload']
        if original_field.get('default_value'):
            assert (
                copied_field['default_value']['id']
                != original_field['default_value']['id']
            ), 'Default value should have new ID'


@pytest.mark.asyncio
async def test_api_v1_custom_field_copy_not_found(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
) -> None:
    _, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}

    # Try to copy a non-existent custom field
    response = test_client.post(
        '/api/v1/custom_field/507f1f77bcf86cd799439011/copy',
        headers=headers,
        json={'label': 'test_label'},
    )
    assert response.status_code == 404
    assert response.json()['success'] is False
