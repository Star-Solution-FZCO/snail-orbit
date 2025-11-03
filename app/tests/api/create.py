import io
from typing import TYPE_CHECKING
from unittest import mock

import pytest
import pytest_asyncio

from tests.utils.avatar import gravatar_like_hash
from tests.utils.dict_utils import filter_dict

if TYPE_CHECKING:
    from fastapi.testclient import TestClient

__all__ = (
    'ALL_PERMISSIONS',
    'ROLE_PERMISSIONS_BY_CATEGORY',
    'create_group',
    'create_groups',
    'create_issue',
    'create_issues',
    'create_project',
    'create_projects',
    'create_role',
    'create_roles',
    'create_user',
    'create_user_with_token',
    'create_users',
    'create_workflow',
    'create_workflows',
    'grant_issue_permission',
)


ROLE_PERMISSIONS_BY_CATEGORY = {
    'Project': {
        'project:read': 'Read project',
        'project:update': 'Update project',
        'project:delete': 'Delete project',
        'project:manage_permissions': 'Manage project permissions',
    },
    'Issue': {
        'issue:create': 'Create issue',
        'issue:read': 'Read issue',
        'issue:update': 'Update issue',
        'issue:delete': 'Delete issue',
        'issue:manage_permissions': 'Manage issue permissions',
    },
    'Comment': {
        'comment:create': 'Create comment',
        'comment:read': 'Read comment',
        'comment:update': 'Update comment',
        'comment:delete_own': 'Delete own comment',
        'comment:delete': 'Delete comment',
        'comment:hide': 'Hide comment',
        'comment:restore': 'Restore hidden comment',
    },
    'History': {
        'history:hide': 'Hide history record',
        'history:restore': 'Restore hidden history record',
    },
}

EMPTY_ROLE_PERMISSIONS = [
    {
        'label': cat,
        'permissions': [
            {'key': perm_k, 'label': perm_l, 'granted': False}
            for perm_k, perm_l in perms.items()
        ],
    }
    for cat, perms in ROLE_PERMISSIONS_BY_CATEGORY.items()
]
FULL_ROLE_PERMISSION_CLAIMS = [
    perm for perms in ROLE_PERMISSIONS_BY_CATEGORY.values() for perm in perms
]

ALL_PERMISSIONS = {
    perm for perms in ROLE_PERMISSIONS_BY_CATEGORY.values() for perm in perms
}


def get_category_by_permission(permission: str) -> str:
    for cat, perms in ROLE_PERMISSIONS_BY_CATEGORY.items():
        if permission in perms:
            return cat
    raise ValueError(f'Unknown permission: {permission}')


async def _create_project(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    project_payload: dict,
) -> str:
    _, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
    response = test_client.post(
        '/api/v1/project',
        headers=headers,
        json=project_payload,
    )
    assert response.status_code == 200
    data = response.json()
    assert data['payload']['id']
    # Admin should have all project permissions
    assert set(data['payload']['access_claims']) == set(FULL_ROLE_PERMISSION_CLAIMS), (
        f'Admin should have all permissions. '
        f'Missing: {set(FULL_ROLE_PERMISSION_CLAIMS) - set(data["payload"]["access_claims"])}, '
        f'Extra: {set(data["payload"]["access_claims"]) - set(FULL_ROLE_PERMISSION_CLAIMS)}'
    )

    assert data == {
        'success': True,
        'payload': {
            'id': data['payload']['id'],
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
            'access_claims': data['payload'][
                'access_claims'
            ],  # Use actual returned permissions (verified above)
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
            test_client,
            create_initial_admin,
            project_payload,
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
    with (
        mock.patch('pm.tasks.actions.task_send_email.kiq') as mock_email,
        mock.patch('pm.tasks.actions.task_send_pararam_message.kiq') as mock_pararam,
    ):
        response = test_client.post(
            '/api/v1/admin/user', headers=headers, json=user_payload
        )
        if user_payload.get('send_email_invite', False):
            mock_email.assert_called_once()
        else:
            mock_email.assert_not_called()
        if user_payload.get('send_pararam_invite', False):
            mock_pararam.assert_called_once()
        else:
            mock_pararam.assert_not_called()

    assert response.status_code == 200
    data = response.json()
    assert data['payload']['id']

    from pm.constants import BOT_USER_DOMAIN

    expected_payload = {
        **user_payload,
        'is_admin': user_payload.get('is_admin', False),
        'is_bot': user_payload['email'].endswith(BOT_USER_DOMAIN),
        'avatar_type': 'default',
        'origin': 'local',
        'avatar': f'/api/avatar/{gravatar_like_hash(user_payload["email"])}',
        'mfa_enabled': False,
        'id': data['payload']['id'],
    }
    expected_payload.pop('send_email_invite', None)
    expected_payload.pop('send_pararam_invite', None)

    assert data == {
        'success': True,
        'payload': expected_payload,
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


async def _create_user_with_token(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    user_payload: dict,
) -> tuple[str, str]:
    """Create a user and return both user_id and auth_token for the created user."""
    import pm.models as m

    # First create the user via API
    user_id = await _create_user(test_client, create_initial_admin, user_payload)

    # Then get the user from DB and generate a token for them
    user = await m.User.get(user_id)
    token, token_obj = user.gen_new_api_token('test_token')
    user.api_tokens.append(token_obj)
    await user.save()

    return user_id, token


@pytest_asyncio.fixture
async def create_user_with_token(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    user_payload: dict,
) -> tuple[str, str]:
    """Create a user and return (user_id, auth_token) for testing as that user."""
    return await _create_user_with_token(
        test_client, create_initial_admin, user_payload
    )


async def grant_permission(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    role_id: str,
    permission_key: str,
) -> None:
    _, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
    response = test_client.post(
        f'/api/v1/role/{role_id}/permission/{permission_key}',
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    assert data['payload']['id'] == role_id
    cat_perm = next(
        cat['permissions']
        for cat in data['payload']['permissions']
        if cat['label'] == get_category_by_permission(permission_key)
    )
    assert cat_perm, f'{data["payload"]["permissions"]=}'
    assert any(
        perm['key'] == permission_key and perm['granted'] for perm in cat_perm
    ), f'{cat_perm=}'


async def _create_role(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    role_payload: dict,
) -> str:
    _, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
    role_payload_ = filter_dict(role_payload, excluded_keys=('permissions',))
    permissions = set(role_payload.get('permissions', []))

    response = test_client.post('/api/v1/role', headers=headers, json=role_payload_)
    assert response.status_code == 200
    data = response.json()
    assert data['payload']['id']
    assert data == {
        'success': True,
        'payload': {
            'id': data['payload']['id'],
            **role_payload,
            'permissions': EMPTY_ROLE_PERMISSIONS,
        },
    }, f'{data=}'

    for perm in permissions:
        await grant_permission(
            test_client,
            create_initial_admin,
            data['payload']['id'],
            perm,
        )

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
        'payload': {'id': data['payload']['id'], 'type': 'local', **group_payload},
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


async def _create_tag(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    tag_payload: dict,
) -> str:
    _, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
    response = test_client.post('/api/v1/tag', headers=headers, json=tag_payload)
    assert response.status_code == 200
    data = response.json()
    assert data['payload']['id']
    assert data['payload']['created_by']['id'] == create_initial_admin[0]
    # Verify permission fields are present
    assert 'permissions' in data['payload']
    assert 'current_permission' in data['payload']
    assert data['payload']['current_permission'] == 'admin'
    assert len(data['payload']['permissions']) == 1
    assert data['payload']['permissions'][0]['permission_type'] == 'admin'
    # Clean up permission fields and created_by for payload comparison
    del data['payload']['created_by']
    del data['payload']['permissions']
    del data['payload']['current_permission']
    assert data == {
        'success': True,
        'payload': {'id': data['payload']['id'], **tag_payload},
    }
    return data['payload']['id']


@pytest_asyncio.fixture
async def create_tag(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    tag_payload: dict,
) -> str:
    return await _create_tag(test_client, create_initial_admin, tag_payload)


@pytest_asyncio.fixture
async def create_tags(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    tag_payloads: list[dict],
) -> list[str]:
    tag_ids = []
    for tag_payload in tag_payloads:
        tag_id = await _create_tag(test_client, create_initial_admin, tag_payload)
        tag_ids.append(tag_id)
    return tag_ids


def _upload_attachment(
    client: 'TestClient',
    headers: dict[str, str],
    *,
    filename: str = 'file.txt',
    content: bytes | str = b'dummy content',
) -> str:
    if isinstance(content, str):
        content = content.encode()
    files = {'file': (filename, io.BytesIO(content), 'application/octet-stream')}
    response = client.post('/api/v1/files', headers=headers, files=files)
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload['success']
    return payload['payload']['id']


async def _create_issue(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    issue_payload: dict,
) -> str:
    _, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
    with mock.patch(
        'pm.tasks.actions.ocr_process.process_attachments_ocr.kiq'
    ) as mock_ocr:
        response = test_client.post(
            '/api/v1/issue', headers=headers, json=issue_payload
        )
        assert response.status_code == 200
        data = response.json()
        if any(
            not a.get('encryption')
            for a in issue_payload['payload'].get('attachments', [])
        ):
            mock_ocr.assert_called_once()
        else:
            mock_ocr.assert_not_called()
        assert data['payload']['id']
        return data['payload']['id']


@pytest_asyncio.fixture
async def create_issue(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    issue_payload: dict,
) -> str:
    return await _create_issue(test_client, create_initial_admin, issue_payload)


@pytest_asyncio.fixture
async def create_issues(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    issue_payloads: list[dict],
) -> list[str]:
    issue_ids = []
    for issue_payload in issue_payloads:
        issue_id = await _create_issue(test_client, create_initial_admin, issue_payload)
        issue_ids.append(issue_id)
    return issue_ids


async def grant_issue_permission(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    issue_id: str,
    target_id: str,
    target_type: str,
    role_id: str,
) -> str:
    """Grant permission to an issue and return the permission ID."""
    _, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
    response = test_client.post(
        f'/api/v1/issue/{issue_id}/permission',
        headers=headers,
        json={
            'target_type': target_type,
            'target_id': target_id,
            'role_id': role_id,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    return data['payload']['id']


async def _create_workflow(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    workflow_payload: dict,
) -> str:
    _, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
    response = test_client.post(
        '/api/v1/workflow', headers=headers, json=workflow_payload
    )
    assert response.status_code == 200
    data = response.json()
    assert data['payload']['id']

    expected_payload = {
        'id': data['payload']['id'],
        **workflow_payload,
    }

    assert data == {
        'success': True,
        'payload': expected_payload,
    }
    return data['payload']['id']


@pytest_asyncio.fixture
async def create_workflow(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    workflow_payload: dict,
) -> str:
    return await _create_workflow(test_client, create_initial_admin, workflow_payload)


@pytest_asyncio.fixture
async def create_workflows(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    workflow_payloads: list[dict],
) -> list[str]:
    workflow_ids = []
    for workflow_payload in workflow_payloads:
        workflow_id = await _create_workflow(
            test_client,
            create_initial_admin,
            workflow_payload,
        )
        workflow_ids.append(workflow_id)
    return workflow_ids
