from typing import TYPE_CHECKING

import pytest

if TYPE_CHECKING:
    from fastapi.testclient import TestClient

from .create import ROLE_PERMISSIONS_BY_CATEGORY, create_role
from .helpers import assert_success_response, make_auth_headers
from .test_api import create_initial_admin


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
        ),
    ],
)
async def test_role_crud_workflow(
    test_client: 'TestClient',
    create_role: str,
    create_initial_admin: tuple[str, str],
    role_payload: dict,
) -> None:
    """Test complete role CRUD workflow: create, read, update with permissions."""
    _, admin_token = create_initial_admin
    headers = make_auth_headers(admin_token)
    permissions = set(role_payload.get('permissions', []))

    # Test READ
    response = test_client.get(f'/api/v1/role/{create_role}', headers=headers)
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
    expected_payload = {
        'id': create_role,
        **role_payload,
        'permissions': expected_permissions,
    }
    assert_success_response(response, expected_payload)

    # Test UPDATE
    response = test_client.put(
        f'/api/v1/role/{create_role}',
        headers=headers,
        json={'name': 'Test role updated'},
    )
    expected_updated_payload = {
        'id': create_role,
        **role_payload,
        'permissions': expected_permissions,
        'name': 'Test role updated',
    }
    assert_success_response(response, expected_updated_payload)
