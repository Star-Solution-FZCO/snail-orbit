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
    response: 'Response', expected_status: int = 400
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
    except Exception:
        return {}


def make_api_request(
    client: 'TestClient', method: str, url: str, token: str, **kwargs
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
