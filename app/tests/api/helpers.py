"""Common helper functions for API integration tests."""

from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from fastapi.testclient import TestClient
    from requests import Response


def make_auth_headers(token: str) -> dict[str, str]:
    """Create standardized authorization headers for API requests.

    Args:
        token: The authentication token

    Returns:
        Headers dictionary with Authorization header
    """
    return {'Authorization': f'Bearer {token}'}


def assert_success_response(
    response: 'Response',
    expected_payload: Any | None = None,
    expected_status: int = 200,
) -> dict[str, Any]:
    """Assert that API response is successful and optionally check payload.

    Args:
        response: The HTTP response object
        expected_payload: Optional expected payload to compare against
        expected_status: Expected HTTP status code (default: 200)

    Returns:
        The response JSON data

    Raises:
        AssertionError: If response doesn't match expectations
    """
    assert response.status_code == expected_status, (
        f'Expected {expected_status}, got {response.status_code}: {response.text}'
    )

    data = response.json()
    assert data.get('success') is True, f'Response not successful: {data}'

    if expected_payload is not None:
        expected_response = {'success': True, 'payload': expected_payload}
        assert data == expected_response, (
            f'Payload mismatch.\nExpected: {expected_response}\nActual: {data}'
        )

    return data


def assert_error_response(
    response: 'Response',
    expected_status: int = 400,
) -> dict[str, Any]:
    """Assert that API response is an error with expected status.

    Args:
        response: The HTTP response object
        expected_status: Expected HTTP status code

    Returns:
        The response JSON data (if any)
    """
    assert response.status_code == expected_status, (
        f'Expected {expected_status}, got {response.status_code}: {response.text}'
    )

    # Some error responses may not have JSON
    try:
        return response.json()
    except (ValueError, TypeError):
        return {}


def make_api_request(
    client: 'TestClient',
    method: str,
    url: str,
    token: str,
    **kwargs,
) -> 'Response':
    """Make an authenticated API request with standardized headers.

    Args:
        client: FastAPI test client
        method: HTTP method (GET, POST, PUT, DELETE)
        url: API endpoint URL
        token: Authentication token
        **kwargs: Additional arguments passed to the request method

    Returns:
        The HTTP response object
    """
    headers = make_auth_headers(token)

    # Merge with any existing headers
    if 'headers' in kwargs:
        headers.update(kwargs['headers'])
    kwargs['headers'] = headers

    return getattr(client, method.lower())(url, **kwargs)


def run_crud_workflow(
    client: 'TestClient',
    token: str,
    base_url: str,
    entity_id: str,
    expected_get_payload: dict[str, Any],
    update_data: dict[str, Any],
    expected_update_payload: dict[str, Any],
) -> None:
    """Test standard CRUD workflow: GET, PUT, DELETE for an entity.

    Args:
        client: FastAPI test client
        token: Authentication token
        base_url: Base API URL for the entity (e.g., '/api/v1/project')
        entity_id: ID of the entity to test
        expected_get_payload: Expected payload from GET request
        update_data: Data to send in PUT request
        expected_update_payload: Expected payload from PUT request
    """
    entity_url = f'{base_url}/{entity_id}'

    # Test GET
    response = make_api_request(client, 'GET', entity_url, token)
    assert_success_response(response, expected_get_payload)

    # Test PUT
    response = make_api_request(client, 'PUT', entity_url, token, json=update_data)
    assert_success_response(response, expected_update_payload)

    # Test DELETE
    response = make_api_request(client, 'DELETE', entity_url, token)
    assert_success_response(response, {'id': entity_id})

    # Verify DELETE worked
    response = make_api_request(client, 'GET', entity_url, token)
    assert_error_response(response, 404)


async def grant_issue_permission(
    client: 'TestClient',
    admin_token: str,
    issue_id: str,
    target_id: str,
    target_type: str,
    role_id: str,
) -> str:
    """Grant permission to an issue and return the permission ID."""
    response = client.post(
        f'/api/v1/issue/{issue_id}/permission',
        headers={'Authorization': f'Bearer {admin_token}'},
        json={
            'target_type': target_type,
            'target_id': target_id,
            'role_id': role_id,
        },
    )
    assert_success_response(response)
    return response.json()['payload']['id']


async def revoke_issue_permission(
    client: 'TestClient',
    admin_token: str,
    issue_id: str,
    permission_id: str,
) -> None:
    """Revoke permission from an issue."""
    response = client.delete(
        f'/api/v1/issue/{issue_id}/permission/{permission_id}',
        headers={'Authorization': f'Bearer {admin_token}'},
    )
    assert_success_response(response)


async def set_issue_inheritance(
    client: 'TestClient',
    admin_token: str,
    issue_id: str,
    disable_inheritance: bool,
) -> None:
    """Set the inheritance flag for an issue."""
    response = client.put(
        f'/api/v1/issue/{issue_id}',
        headers={'Authorization': f'Bearer {admin_token}'},
        json={'disable_project_permissions_inheritance': disable_inheritance},
    )
    assert_success_response(response)


async def check_issue_access(
    client: 'TestClient',
    user_token: str,
    issue_id: str,
    should_have_access: bool = True,
) -> None:
    """Check if a user has access to an issue."""
    response = client.get(
        f'/api/v1/issue/{issue_id}',
        headers={'Authorization': f'Bearer {user_token}'},
    )

    if should_have_access:
        assert_success_response(response)
    else:
        assert_error_response(response, 403)


async def check_issue_in_listing(
    client: 'TestClient',
    user_token: str,
    issue_id: str,
    should_be_listed: bool = True,
) -> None:
    """Check if an issue appears in the user's issue listing."""
    response = client.get(
        '/api/v1/issue/list',
        headers={'Authorization': f'Bearer {user_token}'},
    )
    assert_success_response(response)

    issue_ids = [issue['id'] for issue in response.json()['results']]

    if should_be_listed:
        assert issue_id in issue_ids, (
            f'Issue {issue_id} should be in listing but was not found'
        )
    else:
        assert issue_id not in issue_ids, (
            f'Issue {issue_id} should not be in listing but was found'
        )


async def assert_issue_permissions_resolved(
    client: 'TestClient',
    user_token: str,
    issue_id: str,
    expected_permissions: dict[str, bool],
) -> None:
    """Assert that resolved permissions match expected values."""
    response = client.get(
        f'/api/v1/issue/{issue_id}/permissions/resolve',
        headers={'Authorization': f'Bearer {user_token}'},
    )
    assert_success_response(response)

    actual_permissions = response.json()['payload']
    for permission, expected_value in expected_permissions.items():
        assert actual_permissions[permission] == expected_value, (
            f'Permission {permission} should be {expected_value} but was {actual_permissions[permission]}'
        )
