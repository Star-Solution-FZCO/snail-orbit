from typing import TYPE_CHECKING

import pytest

if TYPE_CHECKING:
    from fastapi.testclient import TestClient

from .create import create_project, create_workflows
from .helpers import (
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
        ),
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
    headers = {'Authorization': f'Bearer {admin_token}'}

    expected_base_payload = {
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
        'access_claims': [],  # Will be dynamically set by API responses
    }

    expected_updated_payload = {**expected_base_payload, 'name': 'Test project updated'}

    # Test GET with dynamic access_claims handling
    response = test_client.get(f'/api/v1/project/{create_project}', headers=headers)
    assert response.status_code == 200
    get_data = response.json()
    expected_get_payload = {
        **expected_base_payload,
        'access_claims': get_data['payload']['access_claims'],
    }
    assert get_data == {'success': True, 'payload': expected_get_payload}

    # Test PUT with dynamic access_claims handling
    response = test_client.put(
        f'/api/v1/project/{create_project}',
        headers=headers,
        json={'name': 'Test project updated'},
    )
    assert response.status_code == 200
    put_data = response.json()
    expected_put_payload = {
        **expected_updated_payload,
        'access_claims': put_data['payload']['access_claims'],
    }
    assert put_data == {'success': True, 'payload': expected_put_payload}

    # Test DELETE
    response = test_client.delete(f'/api/v1/project/{create_project}', headers=headers)
    assert response.status_code == 200
    assert response.json() == {'success': True, 'payload': {'id': create_project}}


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
        'is_favorite': False,
        'is_active': True,
        'avatar_type': 'default',
        'avatar': None,
        'encryption_settings': None,
        'is_encrypted': False,
        'access_claims': [],  # Will be dynamically set by API responses
    }

    # Test SUBSCRIBE with dynamic access_claims handling
    response = test_client.post(
        f'/api/v1/project/{create_project}/subscribe',
        headers=headers,
    )
    assert response.status_code == 200
    subscribe_data = response.json()
    subscribed_payload = {
        **base_payload,
        'is_subscribed': True,
        'access_claims': subscribe_data['payload']['access_claims'],
    }
    assert subscribe_data == {'success': True, 'payload': subscribed_payload}

    # Test UNSUBSCRIBE with dynamic access_claims handling
    response = test_client.post(
        f'/api/v1/project/{create_project}/unsubscribe',
        headers=headers,
    )
    assert response.status_code == 200
    unsubscribe_data = response.json()
    unsubscribed_payload = {
        **base_payload,
        'is_subscribed': False,
        'access_claims': unsubscribe_data['payload']['access_claims'],
    }
    assert unsubscribe_data == {'success': True, 'payload': unsubscribed_payload}


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
    'workflow_payloads',
    [
        pytest.param(
            [
                {
                    'name': 'Alpha Workflow',
                    'description': 'First test workflow',
                    'type': 'on_change',
                    'script': 'print("alpha workflow")',
                },
                {
                    'name': 'Beta Workflow',
                    'description': 'Second test workflow',
                    'type': 'scheduled',
                    'script': 'print("beta workflow")',
                    'schedule': '0 9 * * *',
                },
                {
                    'name': 'Gamma Workflow',
                    'description': None,
                    'type': 'on_change',
                    'script': 'print("gamma workflow")',
                },
                {
                    'name': 'Delta Search Test',
                    'description': 'Searchable workflow',
                    'type': 'on_change',
                    'script': 'print("delta workflow")',
                },
                {
                    'name': 'Echo Workflow',
                    'description': 'Another workflow for testing',
                    'type': 'scheduled',
                    'script': 'print("echo workflow")',
                    'schedule': '0 10 * * *',
                },
            ],
            id='workflows',
        ),
    ],
)
async def test_get_available_workflows_for_project(
    test_client: 'TestClient',
    create_project: str,
    create_workflows: list[str],
    create_initial_admin: tuple[str, str],
    project_payload: dict,
    workflow_payloads: list[dict],
) -> None:
    """Test getting available workflows for a project with various scenarios."""
    _, admin_token = create_initial_admin
    headers = make_auth_headers(admin_token)

    # Helper function to add workflow to project
    def add_workflow_to_project(workflow_id: str) -> None:
        response = test_client.post(
            f'/api/v1/project/{create_project}/workflow/{workflow_id}',
            headers=headers,
        )
        assert response.status_code == 200

    # Test 1: Project with no workflows - should return all workflows
    response = test_client.get(
        f'/api/v1/project/{create_project}/workflow/available/select',
        headers=headers,
    )
    assert_success_response(response)
    data = response.json()
    assert data['payload']['count'] == len(workflow_payloads)
    assert len(data['payload']['items']) == len(workflow_payloads)

    # Verify all test workflows are present
    workflow_names = [item['name'] for item in data['payload']['items']]
    expected_names = [wf['name'] for wf in workflow_payloads]
    assert set(workflow_names) == set(expected_names)

    # Test 2: Add some workflows to project and verify exclusion
    excluded_indices = [0, 2]  # Alpha and Gamma workflows
    included_indices = [
        i for i in range(len(workflow_payloads)) if i not in excluded_indices
    ]

    for idx in excluded_indices:
        add_workflow_to_project(create_workflows[idx])

    response = test_client.get(
        f'/api/v1/project/{create_project}/workflow/available/select',
        headers=headers,
    )
    assert_success_response(response)
    data = response.json()
    assert data['payload']['count'] == len(included_indices)

    # Verify correct workflows are included/excluded
    returned_names = [item['name'] for item in data['payload']['items']]
    for idx in excluded_indices:
        assert workflow_payloads[idx]['name'] not in returned_names
    for idx in included_indices:
        assert workflow_payloads[idx]['name'] in returned_names

    # Test 3: Add all remaining workflows - should return empty
    for idx in included_indices:
        add_workflow_to_project(create_workflows[idx])

    response = test_client.get(
        f'/api/v1/project/{create_project}/workflow/available/select',
        headers=headers,
    )
    assert_success_response(response)
    data = response.json()
    assert data['payload']['count'] == 0
    assert data['payload']['items'] == []


@pytest.mark.asyncio
async def test_project_access_by_slug_and_id(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
) -> None:
    """Test that projects can be accessed by both ObjectId and slug."""
    _, admin_token = create_initial_admin
    headers = make_auth_headers(admin_token)

    # Create a project with a known slug
    project_payload = {
        'name': 'Slug Test Project',
        'slug': 'slugtestproject',
        'description': 'Test project for slug access',
    }

    response = test_client.post(
        '/api/v1/project/', headers=headers, json=project_payload
    )
    assert response.status_code == 200
    create_data = response.json()
    project_id = create_data['payload']['id']
    project_slug = create_data['payload']['slug']

    # Test GET by ObjectId
    response_by_id = test_client.get(f'/api/v1/project/{project_id}', headers=headers)
    assert response_by_id.status_code == 200
    data_by_id = response_by_id.json()

    # Test GET by slug
    response_by_slug = test_client.get(
        f'/api/v1/project/{project_slug}', headers=headers
    )
    assert response_by_slug.status_code == 200
    data_by_slug = response_by_slug.json()

    # Both should return the same project data
    assert data_by_id == data_by_slug
    assert data_by_id['payload']['id'] == project_id
    assert data_by_id['payload']['slug'] == project_slug

    # Test UPDATE by ObjectId
    update_payload = {'name': 'Updated by ID'}
    response_update_by_id = test_client.put(
        f'/api/v1/project/{project_id}', headers=headers, json=update_payload
    )
    assert response_update_by_id.status_code == 200
    update_data_by_id = response_update_by_id.json()
    assert update_data_by_id['payload']['name'] == 'Updated by ID'

    # Test UPDATE by slug
    update_payload = {'name': 'Updated by slug'}
    response_update_by_slug = test_client.put(
        f'/api/v1/project/{project_slug}', headers=headers, json=update_payload
    )
    assert response_update_by_slug.status_code == 200
    update_data_by_slug = response_update_by_slug.json()
    assert update_data_by_slug['payload']['name'] == 'Updated by slug'

    # Test subscription by slug
    response = test_client.post(
        f'/api/v1/project/{project_slug}/subscribe', headers=headers
    )
    assert response.status_code == 200
    assert response.json()['payload']['is_subscribed'] is True

    # Test favoriting by ObjectId
    response = test_client.post(
        f'/api/v1/project/{project_id}/favorite', headers=headers
    )
    assert response.status_code == 200
    assert response.json()['payload']['is_favorite'] is True

    # Clean up - DELETE by ObjectId
    response = test_client.delete(f'/api/v1/project/{project_id}', headers=headers)
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_project_historical_slug_access(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
) -> None:
    """Test that projects can be accessed by historical slugs after slug updates."""
    _, admin_token = create_initial_admin
    headers = make_auth_headers(admin_token)

    # Create a project with initial slug
    project_payload = {
        'name': 'Historical Slug Test',
        'slug': 'originalslug',
        'description': 'Test project for historical slug access',
    }

    response = test_client.post(
        '/api/v1/project/', headers=headers, json=project_payload
    )
    assert response.status_code == 200
    create_data = response.json()
    project_id = create_data['payload']['id']
    original_slug = create_data['payload']['slug']

    # Verify access by original slug works
    response = test_client.get(f'/api/v1/project/{original_slug}', headers=headers)
    assert response.status_code == 200

    # Update the slug
    new_slug = 'updatedslug'
    update_payload = {'slug': new_slug}
    response = test_client.put(
        f'/api/v1/project/{project_id}', headers=headers, json=update_payload
    )
    assert response.status_code == 200
    update_data = response.json()
    assert update_data['payload']['slug'] == new_slug

    # Test access by new slug works
    response = test_client.get(f'/api/v1/project/{new_slug}', headers=headers)
    assert response.status_code == 200
    new_slug_data = response.json()
    assert new_slug_data['payload']['slug'] == new_slug

    # Test access by historical slug still works
    response = test_client.get(f'/api/v1/project/{original_slug}', headers=headers)
    assert response.status_code == 200
    historical_data = response.json()
    assert (
        historical_data['payload']['slug'] == new_slug
    )  # Current slug, not historical
    assert historical_data['payload']['id'] == project_id

    # Both should return the same project
    assert new_slug_data == historical_data

    # Clean up
    response = test_client.delete(f'/api/v1/project/{project_id}', headers=headers)
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_project_not_found_by_slug(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
) -> None:
    """Test that non-existent slugs return proper 404 errors."""
    _, admin_token = create_initial_admin
    headers = make_auth_headers(admin_token)

    # Test GET with non-existent slug
    response = test_client.get('/api/v1/project/nonexistentslug', headers=headers)
    assert response.status_code == 404
    assert response.json() == {
        'success': False,
        'error_messages': ['Project not found'],
    }

    # Test PUT with non-existent slug
    response = test_client.put(
        '/api/v1/project/nonexistentslug', headers=headers, json={'name': 'Updated'}
    )
    assert response.status_code == 404
    assert response.json() == {
        'success': False,
        'error_messages': ['Project not found'],
    }

    # Test DELETE with non-existent slug
    response = test_client.delete('/api/v1/project/nonexistentslug', headers=headers)
    assert response.status_code == 404
    assert response.json() == {
        'success': False,
        'error_messages': ['Project not found'],
    }


@pytest.mark.asyncio
async def test_project_crud_operations_by_slug(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
) -> None:
    """Test comprehensive CRUD operations using slug identifiers."""
    _, admin_token = create_initial_admin
    headers = make_auth_headers(admin_token)

    # Create project
    project_payload = {
        'name': 'Slug CRUD Test',
        'slug': 'slugcrudtest',
        'description': 'Comprehensive slug CRUD testing',
    }

    response = test_client.post(
        '/api/v1/project/', headers=headers, json=project_payload
    )
    assert response.status_code == 200
    create_data = response.json()
    project_slug = create_data['payload']['slug']

    # Test various endpoints using slug

    # 1. GET project permissions by slug
    response = test_client.get(
        f'/api/v1/project/{project_slug}/permissions', headers=headers
    )
    assert response.status_code == 200

    # 2. Subscribe by slug
    response = test_client.post(
        f'/api/v1/project/{project_slug}/subscribe', headers=headers
    )
    assert response.status_code == 200
    assert response.json()['payload']['is_subscribed'] is True

    # 3. Unsubscribe by slug
    response = test_client.post(
        f'/api/v1/project/{project_slug}/unsubscribe', headers=headers
    )
    assert response.status_code == 200
    assert response.json()['payload']['is_subscribed'] is False

    # 4. Favorite by slug
    response = test_client.post(
        f'/api/v1/project/{project_slug}/favorite', headers=headers
    )
    assert response.status_code == 200
    assert response.json()['payload']['is_favorite'] is True

    # 5. Unfavorite by slug
    response = test_client.post(
        f'/api/v1/project/{project_slug}/unfavorite', headers=headers
    )
    assert response.status_code == 200
    assert response.json()['payload']['is_favorite'] is False

    # 6. Get available fields by slug
    response = test_client.get(
        f'/api/v1/project/{project_slug}/field/available/select', headers=headers
    )
    assert response.status_code == 200

    # 7. Get encryption keys by slug (should work even without encryption settings)
    response = test_client.get(
        f'/api/v1/project/{project_slug}/encryption_key/list', headers=headers
    )
    # This might return 400 if no encryption settings, but shouldn't 404
    assert response.status_code == 400
    error_response = response.json()
    assert any(
        'encryption settings not found' in msg
        for msg in error_response['error_messages']
    )

    # Clean up - DELETE by slug
    response = test_client.delete(f'/api/v1/project/{project_slug}', headers=headers)
    assert response.status_code == 200

    # Verify project is actually deleted
    response = test_client.get(f'/api/v1/project/{project_slug}', headers=headers)
    assert response.status_code == 404
