import pytest

from .create import _create_project, _upload_attachment
from .test_api import create_initial_admin


@pytest.mark.asyncio
async def test_attachment_endpoints_basic(test_client, create_initial_admin):
    """Basic test of attachment endpoints with minimal setup"""
    admin_id, admin_token = create_initial_admin
    admin_headers = {'Authorization': f'Bearer {admin_token}'}

    # Upload a test file first
    attachment_id = _upload_attachment(test_client, admin_headers, filename='test.txt')

    # Create project
    project_payload = {
        'name': 'Test Project',
        'slug': 'test_project',
        'description': 'Project for attachment tests',
        'ai_description': 'AI description for test project',
    }
    project_id = await _create_project(
        test_client, create_initial_admin, project_payload
    )

    # Create issue
    issue_response = test_client.post(
        '/api/v1/issue',
        headers=admin_headers,
        json={'project_id': project_id, 'subject': 'Test Issue', 'fields': {}},
    )
    assert issue_response.status_code == 200
    issue_id = issue_response.json()['payload']['id']

    # Test 1: List attachments (should be empty)
    response = test_client.get(
        f'/api/v1/issue/{issue_id}/attachment/list', headers=admin_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data['success'] is True
    assert data['payload']['count'] == 0

    # Test 2: Add attachment
    response = test_client.post(
        f'/api/v1/issue/{issue_id}/attachment',
        headers=admin_headers,
        json={'id': attachment_id},
    )
    assert response.status_code == 200
    data = response.json()
    assert data['success'] is True
    assert data['payload']['id'] == attachment_id
    assert data['payload']['source_type'] == 'issue'

    # Test 3: List attachments (should have 1)
    response = test_client.get(
        f'/api/v1/issue/{issue_id}/attachment/list', headers=admin_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data['success'] is True
    assert data['payload']['count'] == 1

    # Test 4: Delete attachment
    response = test_client.delete(
        f'/api/v1/issue/{issue_id}/attachment/{attachment_id}', headers=admin_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data['success'] is True
    assert data['payload']['id'] == attachment_id


@pytest.mark.asyncio
async def test_batch_create_and_delete_success(test_client, create_initial_admin):
    """Test successful batch creation and deletion of attachments"""
    admin_id, admin_token = create_initial_admin
    admin_headers = {'Authorization': f'Bearer {admin_token}'}

    # Upload test files first
    attachment_id_1 = _upload_attachment(
        test_client, admin_headers, filename='test1.txt', content='content 1'
    )
    attachment_id_2 = _upload_attachment(
        test_client, admin_headers, filename='test2.txt', content='content 2'
    )
    attachment_id_3 = _upload_attachment(
        test_client, admin_headers, filename='test3.txt', content='content 3'
    )

    # Create project
    project_payload = {
        'name': 'Test Project',
        'slug': 'test_project_batch',
        'description': 'Project for batch attachment tests',
        'ai_description': 'AI description for test project',
    }
    project_id = await _create_project(
        test_client, create_initial_admin, project_payload
    )

    # Create issue
    issue_response = test_client.post(
        '/api/v1/issue',
        headers=admin_headers,
        json={'project_id': project_id, 'subject': 'Test Issue', 'fields': {}},
    )
    assert issue_response.status_code == 200
    issue_id = issue_response.json()['payload']['id']

    # Test batch create multiple attachments
    create_response = test_client.post(
        f'/api/v1/issue/{issue_id}/attachments/batch-create',
        headers=admin_headers,
        json={
            'attachments': [
                {'id': attachment_id_1},
                {'id': attachment_id_2},
                {'id': attachment_id_3},
            ]
        },
    )
    assert create_response.status_code == 207
    create_data = create_response.json()
    assert len(create_data['successes']) == 3
    assert len(create_data['failures']) == 0
    assert create_data['total'] == 3
    assert create_data['success_count'] == 3
    assert create_data['failure_count'] == 0

    # Verify all attachments were created
    for success_item in create_data['successes']:
        attachment = success_item['payload']
        assert attachment['source_type'] == 'issue'
        assert attachment['source_id'] == issue_id
        assert attachment['name'] in ['test1.txt', 'test2.txt', 'test3.txt']

    # Verify attachments are listed
    list_response = test_client.get(
        f'/api/v1/issue/{issue_id}/attachment/list', headers=admin_headers
    )
    assert list_response.status_code == 200
    list_data = list_response.json()
    assert list_data['payload']['count'] == 3

    # Test batch delete 2 attachments (leave one)
    delete_response = test_client.post(
        f'/api/v1/issue/{issue_id}/attachments/batch-delete',
        headers=admin_headers,
        json={'attachment_ids': [attachment_id_1, attachment_id_2]},
    )
    assert delete_response.status_code == 207
    delete_data = delete_response.json()
    assert len(delete_data['successes']) == 2
    assert len(delete_data['failures']) == 0
    assert delete_data['total'] == 2
    assert delete_data['success_count'] == 2
    assert delete_data['failure_count'] == 0

    deleted_ids = [s['payload'] for s in delete_data['successes']]
    assert attachment_id_1 in deleted_ids
    assert attachment_id_2 in deleted_ids

    # Verify only 1 attachment remains
    list_response = test_client.get(
        f'/api/v1/issue/{issue_id}/attachment/list', headers=admin_headers
    )
    assert list_response.status_code == 200
    assert list_response.json()['payload']['count'] == 1


@pytest.mark.asyncio
async def test_batch_create_and_delete_partial_failures(
    test_client, create_initial_admin
):
    """Test batch creation and deletion with partial failures"""
    admin_id, admin_token = create_initial_admin
    admin_headers = {'Authorization': f'Bearer {admin_token}'}

    # Upload test files
    attachment_id_1 = _upload_attachment(
        test_client, admin_headers, filename='valid1.txt'
    )
    attachment_id_2 = _upload_attachment(
        test_client, admin_headers, filename='valid2.txt'
    )

    # Create project and issue
    project_payload = {
        'name': 'Test Project',
        'slug': 'test_project_partial',
        'description': 'Project for batch attachment partial failure tests',
        'ai_description': 'AI description for test project',
    }
    project_id = await _create_project(
        test_client, create_initial_admin, project_payload
    )

    issue_response = test_client.post(
        '/api/v1/issue',
        headers=admin_headers,
        json={'project_id': project_id, 'subject': 'Test Issue', 'fields': {}},
    )
    assert issue_response.status_code == 200
    issue_id = issue_response.json()['payload']['id']

    # First, add one attachment individually to set up duplicate scenario
    test_client.post(
        f'/api/v1/issue/{issue_id}/attachment',
        headers=admin_headers,
        json={'id': attachment_id_1},
    )

    # Test batch create: one new (success) + one duplicate (failure)
    create_response = test_client.post(
        f'/api/v1/issue/{issue_id}/attachments/batch-create',
        headers=admin_headers,
        json={
            'attachments': [
                {'id': attachment_id_2},  # New - should succeed
                {'id': attachment_id_1},  # Duplicate - should fail
            ]
        },
    )
    assert create_response.status_code == 207
    create_data = create_response.json()
    assert len(create_data['successes']) == 1
    assert len(create_data['failures']) == 1
    assert create_data['total'] == 2
    assert create_data['success_count'] == 1
    assert create_data['failure_count'] == 1

    # Check creation results
    assert create_data['successes'][0]['payload']['id'] == attachment_id_2
    failure = create_data['failures'][0]
    assert failure['payload']['id'] == attachment_id_1
    assert 'already exists' in failure['error_messages'][0]
    assert failure['error_code'] == 409  # HTTP_CONFLICT

    # Verify we now have 2 attachments total
    list_response = test_client.get(
        f'/api/v1/issue/{issue_id}/attachment/list', headers=admin_headers
    )
    assert list_response.status_code == 200
    assert list_response.json()['payload']['count'] == 2

    # Test batch delete: one valid (success) + one non-existent (failure)
    invalid_attachment_id = '11111111-1111-1111-1111-111111111111'
    delete_response = test_client.post(
        f'/api/v1/issue/{issue_id}/attachments/batch-delete',
        headers=admin_headers,
        json={'attachment_ids': [attachment_id_1, invalid_attachment_id]},
    )
    assert delete_response.status_code == 207
    delete_data = delete_response.json()
    assert len(delete_data['successes']) == 1
    assert len(delete_data['failures']) == 1
    assert delete_data['total'] == 2
    assert delete_data['success_count'] == 1
    assert delete_data['failure_count'] == 1

    # Check deletion results
    assert delete_data['successes'][0]['payload'] == attachment_id_1
    delete_failure = delete_data['failures'][0]
    assert delete_failure['payload'] == invalid_attachment_id
    assert 'not found' in delete_failure['error_messages'][0]
    assert delete_failure['error_code'] == 404  # HTTP_NOT_FOUND

    # Verify only 1 attachment remains
    list_response = test_client.get(
        f'/api/v1/issue/{issue_id}/attachment/list', headers=admin_headers
    )
    assert list_response.status_code == 200
    assert list_response.json()['payload']['count'] == 1


@pytest.mark.asyncio
async def test_batch_operations_empty_requests(test_client, create_initial_admin):
    """Test batch operations with empty requests"""
    admin_id, admin_token = create_initial_admin
    admin_headers = {'Authorization': f'Bearer {admin_token}'}

    # Create project and issue
    project_payload = {
        'name': 'Empty Test Project',
        'slug': 'empty_test_project',
        'description': 'Project for empty batch tests',
        'ai_description': 'AI description for test project',
    }
    project_id = await _create_project(
        test_client, create_initial_admin, project_payload
    )

    issue_response = test_client.post(
        '/api/v1/issue',
        headers=admin_headers,
        json={'project_id': project_id, 'subject': 'Test Issue', 'fields': {}},
    )
    assert issue_response.status_code == 200
    issue_id = issue_response.json()['payload']['id']

    # Test empty batch create
    response = test_client.post(
        f'/api/v1/issue/{issue_id}/attachments/batch-create',
        headers=admin_headers,
        json={'attachments': []},
    )
    assert response.status_code == 207
    data = response.json()
    assert len(data['successes']) == 0
    assert len(data['failures']) == 0
    assert data['total'] == 0
    assert data['success_count'] == 0
    assert data['failure_count'] == 0

    # Test empty batch delete
    response = test_client.post(
        f'/api/v1/issue/{issue_id}/attachments/batch-delete',
        headers=admin_headers,
        json={'attachment_ids': []},
    )
    assert response.status_code == 207
    data = response.json()
    assert len(data['successes']) == 0
    assert len(data['failures']) == 0
    assert data['total'] == 0
    assert data['success_count'] == 0
    assert data['failure_count'] == 0
