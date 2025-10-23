"""Admin-specific test helpers."""

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from fastapi.testclient import TestClient

from tests.api.helpers import make_auth_headers


def make_admin_headers(admin_token: str) -> dict[str, str]:
    """Create headers for admin API requests."""
    return make_auth_headers(admin_token)


def assert_admin_required_error(response, operation_name: str = 'operation') -> None:
    """Assert that the response indicates admin privileges are required."""
    assert response.status_code in (401, 403), (
        f'{operation_name} should require admin privileges, '
        f'got status {response.status_code}: {response.text}'
    )
