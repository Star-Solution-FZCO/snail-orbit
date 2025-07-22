"""Tests for the query builder API endpoint."""

from http import HTTPStatus
from typing import TYPE_CHECKING

import pytest

from tests.api.custom_fields import create_custom_field
from tests.api.helpers import (
    assert_error_response,
    assert_success_response,
    make_auth_headers,
)
from tests.api.test_api import create_initial_admin

if TYPE_CHECKING:
    from fastapi.testclient import TestClient

__all__ = ()


@pytest.mark.asyncio
async def test_empty_query_parse_mode(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
) -> None:
    """Test parsing an empty query."""
    _, admin_token = create_initial_admin
    headers = make_auth_headers(admin_token)

    response = test_client.post(
        '/api/v1/issue/filters/query-builder',
        headers=headers,
        json={'query': ''},
    )
    data = assert_success_response(response)

    payload = data['payload']
    assert payload['query'] == ''
    assert payload['filters'] == []
    assert len(payload['available_fields']) > 0
    field_names = {field['name'] for field in payload['available_fields']}
    expected_reserved = {
        'subject',
        'text',
        'project',
        'updated_at',
        'created_at',
        'updated_by',
        'created_by',
        'tag',
        'id',
    }
    assert expected_reserved.issubset(field_names)


@pytest.mark.asyncio
async def test_simple_query_parse_mode(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
) -> None:
    """Test parsing a simple query with reserved fields."""
    _, admin_token = create_initial_admin
    headers = make_auth_headers(admin_token)
    query = 'subject: "Test Issue"'

    response = test_client.post(
        '/api/v1/issue/filters/query-builder',
        headers=headers,
        json={'query': query},
    )
    data = assert_success_response(response)

    payload = data['payload']
    assert payload['query'] == query
    assert len(payload['filters']) == 1

    subject_filter = payload['filters'][0]
    assert subject_filter['type'] == 'string'
    assert subject_filter['value'] == 'Test Issue'
    assert subject_filter['gid'] is None

    available_field_names = {field['name'] for field in payload['available_fields']}
    assert 'subject' not in available_field_names


@pytest.mark.asyncio
@pytest.mark.parametrize(
    'custom_field_payload',
    [
        pytest.param(
            {
                'name': 'Priority Level',
                'type': 'string',
                'description': 'Issue priority level',
                'ai_description': 'The priority level of the issue',
                'is_nullable': True,
                'default_value': None,
            },
            id='string_field',
        ),
    ],
)
async def test_custom_field_query_parse_mode(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    create_custom_field: dict,
    custom_field_payload: dict,
) -> None:
    """Test parsing query with custom fields."""
    _, admin_token = create_initial_admin
    headers = make_auth_headers(admin_token)
    query = '"Priority Level": high'

    response = test_client.post(
        '/api/v1/issue/filters/query-builder',
        headers=headers,
        json={'query': query},
    )
    data = assert_success_response(response)

    payload = data['payload']
    assert payload['query'] == query
    assert len(payload['filters']) == 1

    priority_filter = payload['filters'][0]
    assert priority_filter['type'] == 'string'
    assert priority_filter['value'] == 'high'
    assert priority_filter['gid'] is not None


@pytest.mark.asyncio
@pytest.mark.parametrize(
    'hashtag_value',
    [
        pytest.param('#resolved', id='resolved'),
        pytest.param('#unresolved', id='unresolved'),
    ],
)
async def test_hashtag_query_parse_mode(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    hashtag_value: str,
) -> None:
    """Test parsing query with hashtag values."""
    _, admin_token = create_initial_admin
    headers = make_auth_headers(admin_token)

    response = test_client.post(
        '/api/v1/issue/filters/query-builder',
        headers=headers,
        json={'query': hashtag_value},
    )
    data = assert_success_response(response)

    payload = data['payload']
    assert len(payload['filters']) == 1

    hashtag_filter = payload['filters'][0]
    assert hashtag_filter['type'] == 'hashtag'
    assert hashtag_filter['name'] == hashtag_value
    assert hashtag_filter['value'] is None


@pytest.mark.asyncio
async def test_or_operator_rejection(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
) -> None:
    """Test that OR operators are rejected."""
    _, admin_token = create_initial_admin
    headers = make_auth_headers(admin_token)
    query = 'subject: test or text: content'

    response = test_client.post(
        '/api/v1/issue/filters/query-builder',
        headers=headers,
        json={'query': query},
    )
    assert_error_response(response, HTTPStatus.BAD_REQUEST)
    error_data = response.json()
    error_messages = error_data.get('error_messages', [])
    assert any('OR operator is not supported' in msg for msg in error_messages)


@pytest.mark.asyncio
@pytest.mark.parametrize(
    'invalid_input',
    [
        pytest.param({'query': 'test', 'filters': []}, id='both_query_and_filters'),
        pytest.param({}, id='neither_query_nor_filters'),
    ],
)
async def test_invalid_input_validation(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    invalid_input: dict,
) -> None:
    """Test validation of input parameters."""
    _, admin_token = create_initial_admin
    headers = make_auth_headers(admin_token)

    response = test_client.post(
        '/api/v1/issue/filters/query-builder',
        headers=headers,
        json=invalid_input,
    )
    assert_error_response(response, HTTPStatus.UNPROCESSABLE_ENTITY)


@pytest.mark.asyncio
@pytest.mark.parametrize(
    'custom_field_payload',
    [
        pytest.param(
            {
                'name': 'Priority Level',
                'type': 'string',
                'description': 'Issue priority level',
                'ai_description': 'The priority level of the issue',
                'is_nullable': True,
                'default_value': None,
            },
            id='string_field',
        ),
    ],
)
async def test_gid_consistency(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    create_custom_field: dict,
    custom_field_payload: dict,
) -> None:
    """Test that gid values are consistent and properly set."""
    _, admin_token = create_initial_admin
    headers = make_auth_headers(admin_token)
    query = '"Priority Level": high and subject: test'

    response = test_client.post(
        '/api/v1/issue/filters/query-builder',
        headers=headers,
        json={'query': query},
    )
    data = assert_success_response(response)

    payload = data['payload']

    priority_filter = next(
        f for f in payload['filters'] if f['name'].lower() == 'priority level'
    )
    assert priority_filter['gid'] is not None

    subject_filter = next(f for f in payload['filters'] if f['name'] == 'subject')
    assert subject_filter['gid'] is None


@pytest.mark.asyncio
@pytest.mark.parametrize(
    'custom_field_payload',
    [
        pytest.param(
            {
                'name': 'Priority Level',
                'type': 'string',
                'description': 'Issue priority level',
                'ai_description': 'The priority level of the issue',
                'is_nullable': True,
                'default_value': None,
            },
            id='string_field',
        ),
    ],
)
async def test_available_fields_exclude_used(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    create_custom_field: dict,
    custom_field_payload: dict,
) -> None:
    """Test that available fields properly exclude fields already in use."""
    _, admin_token = create_initial_admin
    headers = make_auth_headers(admin_token)
    query = 'subject: test and "Priority Level": high'

    response = test_client.post(
        '/api/v1/issue/filters/query-builder',
        headers=headers,
        json={'query': query},
    )
    data = assert_success_response(response)

    payload = data['payload']
    available_names = {field['name'].lower() for field in payload['available_fields']}
    used_names = {field['name'].lower() for field in payload['filters']}

    assert not (available_names & used_names)


@pytest.mark.asyncio
async def test_discriminated_union_structure(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
) -> None:
    """Test that discriminated union structure is maintained for OpenAPI."""
    _, admin_token = create_initial_admin
    headers = make_auth_headers(admin_token)

    response = test_client.post(
        '/api/v1/issue/filters/query-builder',
        headers=headers,
        json={'query': ''},
    )
    data = assert_success_response(response)

    payload = data['payload']

    for field in payload['available_fields']:
        assert 'type' in field
        assert 'name' in field

    for field in payload['filters']:
        assert 'type' in field
        assert 'name' in field
        assert 'value' in field


@pytest.mark.asyncio
async def test_build_mode_with_filters(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
) -> None:
    """Test build mode where filters are converted to query string."""
    _, admin_token = create_initial_admin
    headers = make_auth_headers(admin_token)

    filters = [
        {
            'type': 'string',
            'name': 'subject',
            'value': 'Test Issue',
            'gid': None,
        }
    ]

    response = test_client.post(
        '/api/v1/issue/filters/query-builder',
        headers=headers,
        json={'filters': filters},
    )
    data = assert_success_response(response)

    payload = data['payload']
    assert 'subject: "Test Issue"' in payload['query']
    assert len(payload['filters']) == 1
    assert payload['filters'][0]['name'] == 'subject'
    assert payload['filters'][0]['value'] == 'Test Issue'
