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
async def test_attachment_not_found(test_client, create_initial_admin):
    """Test error cases"""
    _, admin_token = create_initial_admin
    admin_headers = {'Authorization': f'Bearer {admin_token}'}

    # Test with invalid issue ID
    response = test_client.get(
        '/api/v1/issue/507f1f77bcf86cd799439011/attachment/list', headers=admin_headers
    )
    assert response.status_code == 404
