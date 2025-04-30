import base64
import hashlib
import secrets
import uuid
from datetime import datetime
from http import HTTPStatus
from typing import TYPE_CHECKING

import mock
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
    ROLE_PERMISSIONS_BY_CATEGORY,
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
async def test_api_v1_project_crud(
    test_client: 'TestClient',
    create_project: str,
    create_initial_admin: tuple[str, str],
    project_payload: dict,
) -> None:
    _, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
    response = test_client.get(f'/api/v1/project/{create_project}', headers=headers)
    assert response.status_code == 200
    assert response.json() == {
        'success': True,
        'payload': {
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
        },
    }

    response = test_client.put(
        f'/api/v1/project/{create_project}',
        headers=headers,
        json={'name': 'Test project updated'},
    )
    assert response.status_code == 200
    assert response.json() == {
        'success': True,
        'payload': {
            'id': create_project,
            **project_payload,
            'custom_fields': [],
            'card_fields': [],
            'workflows': [],
            'is_subscribed': False,
            'is_active': True,
            'name': 'Test project updated',
            'avatar_type': 'default',
            'avatar': None,
            'encryption_settings': None,
            'is_encrypted': False,
        },
    }

    response = test_client.delete(f'/api/v1/project/{create_project}', headers=headers)
    assert response.status_code == 200
    assert response.json() == {'success': True, 'payload': {'id': create_project}}

    response = test_client.get(f'/api/v1/project/{create_project}', headers=headers)
    assert response.status_code == 404


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
async def test_api_v1_project_subscription(
    test_client: 'TestClient',
    create_project: str,
    create_initial_admin: tuple[str, str],
    project_payload: dict,
) -> None:
    _, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
    response = test_client.post(
        f'/api/v1/project/{create_project}/subscribe', headers=headers
    )
    assert response.status_code == 200
    assert response.json() == {
        'success': True,
        'payload': {
            'id': create_project,
            **project_payload,
            'custom_fields': [],
            'card_fields': [],
            'workflows': [],
            'is_subscribed': True,
            'is_active': True,
            'avatar_type': 'default',
            'avatar': None,
            'encryption_settings': None,
            'is_encrypted': False,
        },
    }
    response = test_client.post(
        f'/api/v1/project/{create_project}/unsubscribe', headers=headers
    )
    assert response.status_code == 200
    assert response.json() == {
        'success': True,
        'payload': {
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
        },
    }


@pytest.mark.asyncio
async def test_api_v1_profile_and_ui_settings(
    test_client: 'TestClient', create_initial_admin: tuple[str, str]
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
    test_client: 'TestClient', create_initial_admin: tuple[str, str]
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
        '/api/v1/settings/encryption_key', headers=headers, json=encryption_key_payload
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
        f'/api/v1/settings/encryption_key/{fingerprint}', headers=headers
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
        f'/api/v1/settings/encryption_key/{fingerprint}', headers=headers
    )
    assert response.status_code == 200
    assert response.json() == {'success': True}

    response = test_client.get(
        f'/api/v1/settings/encryption_key/{fingerprint}', headers=headers
    )
    assert response.status_code == 404


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
        )
    ],
)
async def test_api_v1_user_crud(
    test_client: 'TestClient',
    create_user: str,
    create_initial_admin: tuple[str, str],
    user_payload: dict,
) -> None:
    _, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
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

    assert response.status_code == 200
    assert response.json() == {
        'success': True,
        'payload': expected_payload,
    }

    response = test_client.put(
        f'/api/v1/user/{create_user}',
        headers=headers,
        json={'name': 'Test User updated'},
    )
    assert response.status_code == 200
    assert response.json() == {
        'success': True,
        'payload': {
            **expected_payload,
            'name': 'Test User updated',
        },
    }


@pytest.mark.asyncio
@pytest.mark.parametrize(
    'role_payload',
    [
        pytest.param(
            {
                'name': 'Test role',
                'description': 'Test role description',
                'permissions': ['issue:create', 'issue:read'],
            },
            id='role',
        )
    ],
)
async def test_api_v1_role_crud(
    test_client: 'TestClient',
    create_role: str,
    create_initial_admin: tuple[str, str],
    role_payload: dict,
) -> None:
    _, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
    permissions = set(role_payload.get('permissions', []))

    response = test_client.get(f'/api/v1/role/{create_role}', headers=headers)
    assert response.status_code == 200
    data = response.json()
    expected_permissions = [
        {
            'label': cat,
            'permissions': [
                {'key': perm_k, 'label': perm_l, 'granted': perm_k in permissions}
                for perm_k, perm_l in perms.items()
            ],
        }
        for cat, perms in ROLE_PERMISSIONS_BY_CATEGORY.items()
    ]
    assert data == {
        'success': True,
        'payload': {
            'id': create_role,
            **role_payload,
            'permissions': expected_permissions,
        },
    }

    response = test_client.put(
        f'/api/v1/role/{create_role}',
        headers=headers,
        json={'name': 'Test role updated'},
    )
    assert response.status_code == 200
    data = response.json()
    assert data == {
        'success': True,
        'payload': {
            'id': create_role,
            **role_payload,
            'permissions': expected_permissions,
            'name': 'Test role updated',
        },
    }


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
        )
    ],
)
async def test_api_v1_group_crud(
    test_client: 'TestClient',
    create_groups: list[str],
    create_initial_admin: tuple[str, str],
    group_payloads: list[dict],
) -> None:
    _, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
    response = test_client.get(f'/api/v1/group/{create_groups[0]}', headers=headers)
    assert response.status_code == 200
    assert response.json() == {
        'success': True,
        'payload': {'id': create_groups[0], 'origin': 'local', **group_payloads[0]},
    }

    response = test_client.get('/api/v1/group/list', headers=headers)
    assert response.status_code == 200
    assert response.json() == {
        'success': True,
        'payload': {
            'count': len(group_payloads),
            'limit': 50,
            'offset': 0,
            'items': [
                {'id': create_groups[idx], 'origin': 'local', **group_payloads[idx]}
                for idx in range(len(group_payloads))
            ],
        },
    }

    response = test_client.put(
        f'/api/v1/group/{create_groups[0]}',
        headers=headers,
        json={'name': 'Test group updated'},
    )
    assert response.status_code == 200
    assert response.json() == {
        'success': True,
        'payload': {
            'id': create_groups[0],
            'origin': 'local',
            **group_payloads[0],
            'name': 'Test group updated',
        },
    }

    response = test_client.delete(f'/api/v1/group/{create_groups[0]}', headers=headers)
    assert response.status_code == 200
    assert response.json() == {'success': True, 'payload': {'id': create_groups[0]}}
    response = test_client.get(f'/api/v1/group/{create_groups[0]}', headers=headers)
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
        )
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
    del data['payload']['created_by']
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
    del data['payload']['created_by']
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
        f'/api/v1/custom_field/{create_custom_field["id"]}', headers=headers
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
    ):
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
        '/api/v1/custom_field/group/list', params=[('limit', 50)], headers=headers
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
                }
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
        )
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
                }
            ],
            'card_fields': [],
            'workflows': [],
            'is_subscribed': False,
            'is_active': True,
            'avatar_type': 'default',
            'avatar': None,
            'encryption_settings': None,
            'is_encrypted': False,
        },
    }

    response = test_client.put(
        f'/api/v1/project/{create_project}',
        headers=headers,
        json={'card_fields': [create_custom_field['id']]},
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
                }
            ],
            'card_fields': [create_custom_field['id']],
            'workflows': [],
            'is_subscribed': False,
            'is_active': True,
            'avatar_type': 'default',
            'avatar': None,
            'encryption_settings': None,
            'is_encrypted': False,
        },
    }

    response = test_client.get(
        f'/api/v1/project/{create_project}',
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
                }
            ],
            'card_fields': [create_custom_field['id']],
            'workflows': [],
            'is_subscribed': False,
            'is_active': True,
            'avatar_type': 'default',
            'avatar': None,
            'encryption_settings': None,
            'is_encrypted': False,
        },
    }

    response = test_client.delete(
        f'/api/v1/project/{create_project}/field/{create_custom_field["id"]}',
        headers=headers,
    )
    assert response.status_code == 200
    assert response.json() == {
        'success': True,
        'payload': {
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
            test_client, create_initial_admin, create_project, cf['id']
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
        )
    ],
)
@pytest.mark.parametrize(
    'role_payload',
    [
        pytest.param(
            {'name': 'Test role', 'description': 'Test role description'}, id='role'
        )
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
        )
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
        )
    ],
)
@pytest.mark.parametrize(
    'issue_payload',
    [
        pytest.param(
            {
                'subject': 'Test issue',
                'text': 'Test issue text\nBlah blah blah',
            },
            id='issue',
        )
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

    with mock.patch('pm.tasks.actions.task_notify_by_pararam.delay') as mock_notify:
        response = test_client.post(
            f'/api/v1/issue',
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
        data['payload'], excluded_keys={'created_at', 'created_by', 'fields', 'project'}
    ) == {
        'id': issue_id,
        'aliases': [issue_readable_id],
        'id_readable': issue_readable_id,
        **issue_payload,
        'attachments': [],
        'interlinks': [],
        'tags': [],
        'is_subscribed': True,
        'updated_at': None,
        'updated_by': None,
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
        )
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
        )
    ],
)
@pytest.mark.parametrize(
    'issue_payloads',
    [
        pytest.param(
            [
                {
                    'subject': 'Test issue1',
                    'text': 'Test issue text\nBlah blah blah',
                },
                {
                    'subject': 'Test issue 2',
                    'text': 'Test issue text\nBlah blah blah',
                },
            ],
            id='issues',
        )
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
    with mock.patch('pm.tasks.actions.task_notify_by_pararam.delay'):
        for issue_payload in issue_payloads:
            response = test_client.post(
                f'/api/v1/issue',
                headers=headers,
                json={
                    'project_id': project_id,
                    **issue_payload,
                },
            )
            assert response.status_code == 200
            issues.append(response.json()['payload'])

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
        f'/api/v1/group/{group_id}/members/{user_id}', headers=headers
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
        )
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
                }
            ],
            id='custom_fields',
        )
    ],
)
@pytest.mark.parametrize(
    'search_payload,expected_status',
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
        )
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
        f'/api/v1/search/list',
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
        )
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
        )
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
        f'/api/v1/search/list',
        headers=user_headers,
    )
    data = response.json()
    assert (
        data['payload']['count'] == 0
    )  # user doesn't see shared search list because it's not in same group as admin
    await add_user_to_group(test_client, create_initial_admin, user_id, create_group)
    response = test_client.get(
        f'/api/v1/search/list',
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
        f'/api/v1/search/list',
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
        )
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
        f'/api/v1/search/{create_search}', headers=user_headers
    )
    assert response.status_code == 403
    response = test_client.delete(f'/api/v1/search/{UNKNOWN_ID}', headers=admin_headers)
    assert response.status_code == 404
    response = test_client.delete(
        f'/api/v1/search/{create_search}', headers=admin_headers
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
        )
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
        encoding=serialization.Encoding.Raw, format=serialization.PublicFormat.Raw
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
        encoding=serialization.Encoding.Raw, format=serialization.PublicFormat.Raw
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
        '/api/v1/project', json=project_data, headers=admin_headers
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
        f'/api/v1/project/{project_id}/encryption_key/list', headers=admin_headers
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
        'text': 'Unencrypted description',
        'project_id': project_id,
    }

    with mock.patch('pm.tasks.actions.task_notify_by_pararam.delay') as mock_notify:
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
        'text': encrypted_comment_text,
        'encryption': [
            {
                'fingerprint': admin_fingerprint,
                'target_type': 'user',
                'target_id': admin_id,
                'algorithm': 'X25519',
                'data': admin_enc['encrypted_key'],
                'extras': {'ephemeral_public_key': admin_enc['ephemeral_public_key']},
            },
            {
                'fingerprint': project_fingerprint,
                'target_type': 'project',
                'target_id': project_id,
                'algorithm': 'X25519',
                'data': project_enc['encrypted_key'],
                'extras': {'ephemeral_public_key': project_enc['ephemeral_public_key']},
            },
        ],
    }

    response = test_client.post(
        f'/api/v1/issue/{issue_id}/comment', json=comment_data, headers=admin_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data['success']

    comment_id = data['payload']['id']
    assert 'encryption' in data['payload']
    assert data['payload']['text'] == encrypted_comment_text
    assert data['payload']['encryption'] == comment_data['encryption']

    response = test_client.get(
        f'/api/v1/issue/{issue_id}/comment/{comment_id}', headers=admin_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    assert data['payload']['text'] == encrypted_comment_text
    assert data['payload']['encryption'] == comment_data['encryption']

    admin_decrypted_aes_key = decrypt_aes_key_with_x25519(
        data['payload']['encryption'][0]['data'],
        data['payload']['encryption'][0]['extras']['ephemeral_public_key'],
        admin_private_key_bytes,
    )
    project_decrypted_aes_key = decrypt_aes_key_with_x25519(
        data['payload']['encryption'][1]['data'],
        data['payload']['encryption'][1]['extras']['ephemeral_public_key'],
        project_private_key_bytes,
    )
    assert admin_decrypted_aes_key == project_decrypted_aes_key
    assert admin_decrypted_aes_key == comment_aes_key

    decrypted_comment_text = decrypt_with_aes(
        admin_decrypted_aes_key,
        data['payload']['text'],
    )
    assert decrypted_comment_text == comment_text
