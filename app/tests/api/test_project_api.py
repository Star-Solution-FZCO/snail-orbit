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

    expected_base_payload = {
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
    }

    expected_updated_payload = {**expected_base_payload, 'name': 'Test project updated'}

    # Use the CRUD workflow helper
    run_crud_workflow(
        client=test_client,
        token=admin_token,
        base_url='/api/v1/project',
        entity_id=create_project,
        expected_get_payload=expected_base_payload,
        update_data={'name': 'Test project updated'},
        expected_update_payload=expected_updated_payload,
    )


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
        'is_active': True,
        'avatar_type': 'default',
        'avatar': None,
        'encryption_settings': None,
        'is_encrypted': False,
    }

    # Test SUBSCRIBE
    response = test_client.post(
        f'/api/v1/project/{create_project}/subscribe',
        headers=headers,
    )
    subscribed_payload = {**base_payload, 'is_subscribed': True}
    assert_success_response(response, subscribed_payload)

    # Test UNSUBSCRIBE
    response = test_client.post(
        f'/api/v1/project/{create_project}/unsubscribe',
        headers=headers,
    )
    unsubscribed_payload = {**base_payload, 'is_subscribed': False}
    assert_success_response(response, unsubscribed_payload)


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
