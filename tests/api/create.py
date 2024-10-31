from typing import TYPE_CHECKING

import pytest
import pytest_asyncio

from tests.utils.avatar import gravatar_like_hash

if TYPE_CHECKING:
    from fastapi.testclient import TestClient

__all__ = (
    'create_project',
    'create_projects',
    'create_user',
    'create_users',
    'create_role',
    'create_roles',
    'create_group',
    'create_groups',
)


async def _create_project(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    project_payload: dict,
) -> str:
    _, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
    response = test_client.post(
        '/api/v1/project', headers=headers, json=project_payload
    )
    assert response.status_code == 200
    data = response.json()
    assert data['payload']['id']
    assert data == {
        'success': True,
        'payload': {
            'id': data['payload']['id'],
            **project_payload,
            'custom_fields': [],
            'workflows': [],
            'is_subscribed': False,
            'is_active': True,
        },
    }
    return data['payload']['id']


@pytest_asyncio.fixture
async def create_project(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    project_payload: dict,
) -> str:
    return await _create_project(test_client, create_initial_admin, project_payload)


@pytest_asyncio.fixture
async def create_projects(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    project_payloads: list[dict],
) -> list[str]:
    project_ids = []
    for project_payload in project_payloads:
        project_id = await _create_project(
            test_client, create_initial_admin, project_payload
        )
        project_ids.append(project_id)
    return project_ids


async def _create_user(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    user_payload: dict,
) -> str:
    _, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
    response = test_client.post('/api/v1/user', headers=headers, json=user_payload)
    assert response.status_code == 200
    data = response.json()
    assert data['payload']['id']
    assert data == {
        'success': True,
        'payload': {
            'id': data['payload']['id'],
            **user_payload,
            'is_admin': user_payload.get('is_admin', False),
            'avatar_type': 'default',
            'origin': 'local',
            'avatar': f'/api/avatar/{gravatar_like_hash(user_payload["email"])}',
        },
    }
    return data['payload']['id']


@pytest_asyncio.fixture
async def create_user(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    user_payload: dict,
) -> str:
    return await _create_user(test_client, create_initial_admin, user_payload)


@pytest_asyncio.fixture
async def create_users(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    user_payloads: list[dict],
) -> list[str]:
    user_ids = []
    for user_payload in user_payloads:
        user_id = await _create_user(test_client, create_initial_admin, user_payload)
        user_ids.append(user_id)
    return user_ids


async def _create_role(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    role_payload: dict,
) -> str:
    _, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
    response = test_client.post('/api/v1/role', headers=headers, json=role_payload)
    assert response.status_code == 200
    data = response.json()
    assert data['payload']['id']
    del data['payload']['permissions']
    assert data == {
        'success': True,
        'payload': {'id': data['payload']['id'], **role_payload},
    }
    return data['payload']['id']


@pytest_asyncio.fixture
async def create_role(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    role_payload: dict,
) -> str:
    return await _create_role(test_client, create_initial_admin, role_payload)


@pytest_asyncio.fixture
async def create_roles(
    request: pytest.FixtureRequest,
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    role_payloads: list[dict],
) -> list[str]:
    role_ids = []
    for role_payload in role_payloads:
        role_id = await _create_role(test_client, create_initial_admin, role_payload)
        role_ids.append(role_id)
    return role_ids


async def _create_group(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    group_payload: dict,
) -> str:
    _, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
    response = test_client.post('/api/v1/group', headers=headers, json=group_payload)
    assert response.status_code == 200
    data = response.json()
    assert data['payload']['id']
    assert data == {
        'success': True,
        'payload': {'id': data['payload']['id'], **group_payload},
    }
    return data['payload']['id']


@pytest_asyncio.fixture
async def create_group(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    group_payload: dict,
) -> str:
    return await _create_group(test_client, create_initial_admin, group_payload)


@pytest_asyncio.fixture
async def create_groups(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    group_payloads: list[dict],
) -> list[str]:
    group_ids = []
    for group_payload in group_payloads:
        group_id = await _create_group(test_client, create_initial_admin, group_payload)
        group_ids.append(group_id)
    return group_ids
