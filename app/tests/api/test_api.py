from typing import TYPE_CHECKING

import mock
import pytest
import pytest_asyncio

from tests.utils.avatar import gravatar_like_hash
from tests.utils.dict_utils import filter_dict

from .create import (
    ALL_PERMISSIONS,
    ROLE_PERMISSIONS_BY_CATEGORY,
    create_group,
    create_groups,
    create_project,
    create_role,
    create_user,
)
from .custom_fields import (
    create_custom_field,
    create_custom_fields,
    link_custom_field_to_project,
)

if TYPE_CHECKING:
    from fastapi.testclient import TestClient

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
)


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
async def test_api_v1_project_post(create_project: str, project_payload: dict) -> None:
    pass


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
async def test_api_v1_project_get(
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
            'workflows': [],
            'is_subscribed': False,
            'is_active': True,
        },
    }


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
async def test_api_v1_project_delete(
    test_client: 'TestClient',
    create_project: str,
    create_initial_admin: tuple[str, str],
    project_payload: dict,
) -> None:
    _, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
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
async def test_api_v1_project_put(
    test_client: 'TestClient',
    create_project: str,
    create_initial_admin: tuple[str, str],
    project_payload: dict,
) -> None:
    _, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
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
            'workflows': [],
            'is_subscribed': False,
            'is_active': True,
            'name': 'Test project updated',
        },
    }


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
            'workflows': [],
            'is_subscribed': True,
            'is_active': True,
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
            'workflows': [],
            'is_subscribed': False,
            'is_active': True,
        },
    }


@pytest.mark.asyncio
async def test_api_v1_profile_get(
    test_client: 'TestClient', create_initial_admin: tuple[str, str]
) -> None:
    admin_id, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
    response = test_client.get('/api/v1/profile', headers=headers)
    assert response.status_code == 200
    assert response.json() == {
        'success': True,
        'payload': {
            'name': 'Test Admin',
            'email': 'test_admin@localhost.localdomain',
            'is_admin': True,
            'id': admin_id,
            'is_active': True,
            'avatar': f'/api/avatar/{gravatar_like_hash("test_admin@localhost.localdomain")}',
        },
    }


@pytest.mark.asyncio
@pytest.mark.parametrize(
    'user_payload',
    [
        pytest.param(
            {
                'email': 'test_user@localhost.localdomain',
                'name': 'Test User',
                'is_active': True,
            },
            id='user',
        )
    ],
)
async def test_api_v1_user_post(create_user: str, user_payload: dict) -> None:
    pass


@pytest.mark.asyncio
@pytest.mark.parametrize(
    'user_payload',
    [
        pytest.param(
            {
                'email': 'test_user@localhost.localdomain',
                'name': 'Test User',
                'is_active': True,
            },
            id='user',
        )
    ],
)
async def test_api_v1_user_get(
    test_client: 'TestClient',
    create_user: str,
    create_initial_admin: tuple[str, str],
    user_payload: dict,
) -> None:
    _, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
    response = test_client.get(f'/api/v1/user/{create_user}', headers=headers)
    assert response.status_code == 200
    assert response.json() == {
        'success': True,
        'payload': {
            'id': create_user,
            **user_payload,
            'is_admin': False,
            'avatar_type': 'default',
            'origin': 'local',
            'avatar': f'/api/avatar/{gravatar_like_hash(user_payload["email"])}',
        },
    }


@pytest.mark.asyncio
@pytest.mark.parametrize(
    'user_payload',
    [
        pytest.param(
            {
                'email': 'test_user@localhost.localdomain',
                'name': 'Test User',
                'is_active': True,
            },
            id='user',
        )
    ],
)
async def test_api_v1_user_update(
    test_client: 'TestClient',
    create_user: str,
    create_initial_admin: tuple[str, str],
    user_payload: dict,
) -> None:
    _, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
    response = test_client.put(
        f'/api/v1/user/{create_user}',
        headers=headers,
        json={'name': 'Test User updated'},
    )
    assert response.status_code == 200
    assert response.json() == {
        'success': True,
        'payload': {
            'id': create_user,
            **user_payload,
            'is_admin': False,
            'avatar_type': 'default',
            'origin': 'local',
            'avatar': f'/api/avatar/{gravatar_like_hash(user_payload["email"])}',
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
async def test_api_v1_role_post(create_role: str, role_payload: dict) -> None:
    pass


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
async def test_api_v1_role_get(
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


@pytest.mark.asyncio
@pytest.mark.parametrize(
    'role_payload',
    [
        pytest.param(
            {'name': 'Test role', 'description': 'Test role description'}, id='role'
        )
    ],
)
async def test_api_v1_role_update(
    test_client: 'TestClient',
    create_role: str,
    create_initial_admin: tuple[str, str],
    role_payload: dict,
) -> None:
    _, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
    response = test_client.put(
        f'/api/v1/role/{create_role}',
        headers=headers,
        json={'name': 'Test role updated'},
    )
    assert response.status_code == 200
    data = response.json()
    del data['payload']['permissions']
    assert data == {
        'success': True,
        'payload': {'id': create_role, **role_payload, 'name': 'Test role updated'},
    }


@pytest.mark.asyncio
@pytest.mark.parametrize(
    'group_payload',
    [
        pytest.param(
            {
                'name': 'Test group',
                'description': 'Test group description',
            },
            id='test group',
        )
    ],
)
async def test_api_v1_group_post(create_group: str, group_payload: dict) -> None:
    pass


@pytest.mark.asyncio
@pytest.mark.parametrize(
    'group_payload',
    [
        pytest.param(
            {
                'name': 'Test group',
                'description': 'Test group description',
            },
            id='test group',
        )
    ],
)
async def test_api_v1_group_get(
    test_client: 'TestClient',
    create_group: str,
    create_initial_admin: tuple[str, str],
    group_payload: dict,
) -> None:
    _, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
    response = test_client.get(f'/api/v1/group/{create_group}', headers=headers)
    assert response.status_code == 200
    assert response.json() == {
        'success': True,
        'payload': {'id': create_group, **group_payload},
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
async def test_api_v1_group_list(
    test_client: 'TestClient',
    create_groups: list[str],
    create_initial_admin: tuple[str, str],
    group_payloads: list[dict],
) -> None:
    _, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
    response = test_client.get('/api/v1/group/list', headers=headers)
    assert response.status_code == 200
    assert response.json() == {
        'success': True,
        'payload': {
            'count': len(group_payloads),
            'limit': 50,
            'offset': 0,
            'items': [
                {'id': create_groups[idx], **group_payloads[idx]}
                for idx in range(len(group_payloads))
            ],
        },
    }


@pytest.mark.asyncio
@pytest.mark.parametrize(
    'group_payload',
    [
        pytest.param(
            {
                'name': 'Test group',
                'description': 'Test group description',
            },
            id='test group',
        )
    ],
)
async def test_api_v1_group_update(
    test_client: 'TestClient',
    create_group: str,
    create_initial_admin: tuple[str, str],
    group_payload: dict,
) -> None:
    _, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
    response = test_client.put(
        f'/api/v1/group/{create_group}',
        headers=headers,
        json={'name': 'Test group updated'},
    )
    assert response.status_code == 200
    assert response.json() == {
        'success': True,
        'payload': {'id': create_group, **group_payload, 'name': 'Test group updated'},
    }


@pytest.mark.asyncio
@pytest.mark.parametrize(
    'group_payload',
    [
        pytest.param(
            {
                'name': 'Test group',
                'description': 'Test group description',
            },
            id='test group',
        )
    ],
)
async def test_api_v1_group_delete(
    test_client: 'TestClient',
    create_group: str,
    create_initial_admin: tuple[str, str],
    group_payload: dict,
) -> None:
    _, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
    response = test_client.delete(f'/api/v1/group/{create_group}', headers=headers)
    assert response.status_code == 200
    assert response.json() == {'success': True, 'payload': {'id': create_group}}
    response = test_client.get(f'/api/v1/group/{create_group}', headers=headers)
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
    expected_payload = {
        'id': create_custom_field['id'],
        **custom_field_payload,
    }
    if custom_field_payload['type'] in (
        'enum',
        'enum_multi',
        'state',
        'version',
        'version_multi',
    ):
        expected_payload['options'] = [
            {'uuid': create_custom_field['options'][option['value']], **option}
            for option in custom_field_payload['options']
        ]

    assert response.status_code == 200
    assert response.json() == {
        'success': True,
        'payload': expected_payload,
    }

    response = test_client.get(
        '/api/v1/custom_field/list', params=[('limit', 50)], headers=headers
    )
    assert response.status_code == 200
    assert response.json() == {
        'success': True,
        'payload': {
            'count': 1,
            'limit': 50,
            'offset': 0,
            'items': [expected_payload],
        },
    }

    response = test_client.put(
        f'/api/v1/custom_field/{create_custom_field["id"]}',
        headers=headers,
        json={'name': 'Updated name'},
    )
    assert response.status_code == 200
    assert response.json() == {
        'success': True,
        'payload': {**expected_payload, 'name': 'Updated name'},
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
                {'id': create_custom_field['id'], **custom_field_payload}
            ],
            'workflows': [],
            'is_subscribed': False,
            'is_active': True,
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
                {'id': create_custom_field['id'], **custom_field_payload}
            ],
            'workflows': [],
            'is_subscribed': False,
            'is_active': True,
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
            'workflows': [],
            'is_subscribed': False,
            'is_active': True,
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
        'is_subscribed': True,
        'updated_at': None,
        'updated_by': None,
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
            f'/api/v1/issue/{issues[0]['id']}/link',
            headers=headers,
            json={
                'type': link_type[0],
                'target_issue': issues[1]['id'],
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data['success']
        assert len(data['payload']['interlinks']) == 1
        assert data['payload']['interlinks'][0]['type'] == link_type[0]
        assert data['payload']['interlinks'][0]['issue'] == filter_dict(
            issues[1], include_keys={'id', 'aliases', 'subject', 'id_readable'}
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
            issues[0], include_keys={'id', 'aliases', 'subject', 'id_readable'}
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
