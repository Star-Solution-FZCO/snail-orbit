"""Tests for the query builder API endpoint."""

from http import HTTPStatus
from typing import TYPE_CHECKING, Any

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


def _replace_gid_placeholder(obj: Any, custom_field_gids: dict[str, str]) -> Any:
    if isinstance(obj, dict):
        return {
            k: _replace_gid_placeholder(v, custom_field_gids) for k, v in obj.items()
        }
    if isinstance(obj, list):
        return [_replace_gid_placeholder(item, custom_field_gids) for item in obj]
    if isinstance(obj, str):
        return obj.format(**custom_field_gids)
    return obj


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
@pytest.mark.parametrize(
    'test_case',
    [
        pytest.param(
            {
                'name': 'filters_only',
                'input': {
                    'filters': [
                        {
                            'type': 'string',
                            'name': 'subject',
                            'value': 'Test Issue',
                            'gid': None,
                        }
                    ]
                },
                'expected_query': 'subject: "Test Issue"',
                'expected_filters': [
                    {
                        'type': 'string',
                        'name': 'subject',
                        'value': 'Test Issue',
                        'gid': None,
                    }
                ],
                'expected_sorts': [
                    {
                        'type': 'datetime',
                        'name': 'updated_at',
                        'direction': 'desc',
                        'gid': None,
                    }
                ],
            },
            id='filters_only_with_default_sort',
        ),
        pytest.param(
            {
                'name': 'sort_only_non_default',
                'input': {'sort_by': [{'name': 'subject', 'direction': 'asc'}]},
                'expected_query': 'sort by: subject',
                'expected_filters': [],
                'expected_sorts': [
                    {
                        'type': 'string',
                        'name': 'subject',
                        'direction': 'asc',
                        'gid': None,
                    }
                ],
            },
            id='sort_only_non_default',
        ),
        pytest.param(
            {
                'name': 'sort_only_default',
                'input': {'sort_by': [{'name': 'updated_at', 'direction': 'desc'}]},
                'expected_query': '',
                'expected_filters': [],
                'expected_sorts': [
                    {
                        'type': 'datetime',
                        'name': 'updated_at',
                        'direction': 'desc',
                        'gid': None,
                    }
                ],
            },
            id='sort_only_default_omitted',
        ),
        pytest.param(
            {
                'name': 'filters_and_sorts',
                'input': {
                    'filters': [
                        {
                            'type': 'string',
                            'name': 'subject',
                            'value': 'Test Issue',
                            'gid': None,
                        }
                    ],
                    'sort_by': [
                        {'name': 'updated_at', 'direction': 'desc'},
                        {'name': 'subject', 'direction': 'asc'},
                    ],
                },
                'expected_query': 'subject: "Test Issue" sort by: updated_at desc, subject',
                'expected_filters': [
                    {
                        'type': 'string',
                        'name': 'subject',
                        'value': 'Test Issue',
                        'gid': None,
                    }
                ],
                'expected_sorts': [
                    {
                        'type': 'datetime',
                        'name': 'updated_at',
                        'direction': 'desc',
                        'gid': None,
                    },
                    {
                        'type': 'string',
                        'name': 'subject',
                        'direction': 'asc',
                        'gid': None,
                    },
                ],
            },
            id='filters_and_sorts_combined',
        ),
        pytest.param(
            {
                'name': 'non_default_sort_build',
                'input': {'sort_by': [{'name': 'created_at', 'direction': 'asc'}]},
                'expected_query': 'sort by: created_at',
                'expected_filters': [],
                'expected_sorts': [
                    {
                        'type': 'datetime',
                        'name': 'created_at',
                        'direction': 'asc',
                        'gid': None,
                    }
                ],
            },
            id='non_default_sort_build_mode',
        ),
        pytest.param(
            {
                'name': 'custom_field_filter_only',
                'input': {
                    'filters': [
                        {
                            'type': 'string',
                            'name': 'Priority Level',
                            'value': 'high',
                            'gid': '{Priority Level}',
                        }
                    ]
                },
                'expected_query': 'Priority Level: high',
                'expected_filters': [
                    {
                        'type': 'string',
                        'name': 'Priority Level',
                        'value': 'high',
                        'gid': '{Priority Level}',
                    }
                ],
                'expected_sorts': [
                    {
                        'type': 'datetime',
                        'name': 'updated_at',
                        'direction': 'desc',
                        'gid': None,
                    }
                ],
            },
            id='custom_field_filter_with_default_sort',
        ),
        pytest.param(
            {
                'name': 'mixed_reserved_and_custom',
                'input': {
                    'filters': [
                        {
                            'type': 'string',
                            'name': 'subject',
                            'value': 'Test Issue',
                            'gid': None,
                        },
                        {
                            'type': 'string',
                            'name': 'Priority Level',
                            'value': 'high',
                            'gid': '{Priority Level}',
                        },
                    ],
                    'sort_by': [{'name': 'Priority Level', 'direction': 'desc'}],
                },
                'expected_query': 'subject: "Test Issue" and Priority Level: high sort by: Priority Level desc',
                'expected_filters': [
                    {
                        'type': 'string',
                        'name': 'subject',
                        'value': 'Test Issue',
                        'gid': None,
                    },
                    {
                        'type': 'string',
                        'name': 'Priority Level',
                        'value': 'high',
                        'gid': '{Priority Level}',
                    },
                ],
                'expected_sorts': [
                    {
                        'type': 'string',
                        'name': 'Priority Level',
                        'direction': 'desc',
                        'gid': '{Priority Level}',
                    }
                ],
            },
            id='mixed_reserved_and_custom_fields',
        ),
    ],
)
async def test_build_mode_scenarios(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    create_custom_field: dict,
    custom_field_payload: dict,
    test_case: dict,
) -> None:
    """Test various build mode scenarios with filters and sorts."""
    _, admin_token = create_initial_admin
    headers = make_auth_headers(admin_token)

    custom_field_gids = {custom_field_payload['name']: create_custom_field['gid']}

    test_input = test_case['input']
    expected_filters = _replace_gid_placeholder(
        test_case['expected_filters'], custom_field_gids
    )
    expected_sorts = _replace_gid_placeholder(
        test_case['expected_sorts'], custom_field_gids
    )

    response = test_client.post(
        '/api/v1/issue/filters/query-builder',
        headers=headers,
        json=test_input,
    )
    data = assert_success_response(response)

    payload = data['payload']
    assert payload['query'] == test_case['expected_query']
    assert payload['filters'] == expected_filters
    assert payload['sort_by'] == expected_sorts


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
@pytest.mark.parametrize(
    'test_case',
    [
        pytest.param(
            {
                'name': 'empty_query',
                'query': '',
                'expected_query': '',
                'expected_filters': [],
                'expected_sorts': [
                    {
                        'type': 'datetime',
                        'name': 'updated_at',
                        'direction': 'desc',
                        'gid': None,
                    }
                ],
            },
            id='empty_query_with_default_sort',
        ),
        pytest.param(
            {
                'name': 'simple_reserved_field',
                'query': 'subject: "Test Issue"',
                'expected_query': 'subject: "Test Issue"',
                'expected_filters': [
                    {
                        'type': 'string',
                        'name': 'subject',
                        'value': 'Test Issue',
                        'gid': None,
                    }
                ],
                'expected_sorts': [
                    {
                        'type': 'datetime',
                        'name': 'updated_at',
                        'direction': 'desc',
                        'gid': None,
                    }
                ],
            },
            id='simple_reserved_field_with_default_sort',
        ),
        pytest.param(
            {
                'name': 'hashtag_resolved',
                'query': '#resolved',
                'expected_query': '#resolved',
                'expected_filters': [
                    {'type': 'hashtag', 'name': '#resolved', 'value': None}
                ],
                'expected_sorts': [
                    {
                        'type': 'datetime',
                        'name': 'updated_at',
                        'direction': 'desc',
                        'gid': None,
                    }
                ],
            },
            id='hashtag_resolved_with_default_sort',
        ),
        pytest.param(
            {
                'name': 'hashtag_unresolved',
                'query': '#unresolved',
                'expected_query': '#unresolved',
                'expected_filters': [
                    {'type': 'hashtag', 'name': '#unresolved', 'value': None}
                ],
                'expected_sorts': [
                    {
                        'type': 'datetime',
                        'name': 'updated_at',
                        'direction': 'desc',
                        'gid': None,
                    }
                ],
            },
            id='hashtag_unresolved_with_default_sort',
        ),
        pytest.param(
            {
                'name': 'custom_field_only',
                'query': '"Priority Level": high',
                'expected_query': '"Priority Level": high',
                'expected_filters': [
                    {
                        'type': 'string',
                        'name': 'Priority Level',
                        'value': 'high',
                        'gid': '{Priority Level}',
                    }
                ],
                'expected_sorts': [
                    {
                        'type': 'datetime',
                        'name': 'updated_at',
                        'direction': 'desc',
                        'gid': None,
                    }
                ],
            },
            id='custom_field_with_default_sort',
        ),
        pytest.param(
            {
                'name': 'custom_field_with_sort',
                'query': '"Priority Level": high sort by: subject desc',
                'expected_query': '"Priority Level": high sort by: subject desc',
                'expected_filters': [
                    {
                        'type': 'string',
                        'name': 'Priority Level',
                        'value': 'high',
                        'gid': '{Priority Level}',
                    }
                ],
                'expected_sorts': [
                    {
                        'type': 'string',
                        'name': 'subject',
                        'direction': 'desc',
                        'gid': None,
                    }
                ],
            },
            id='custom_field_with_explicit_sort',
        ),
        pytest.param(
            {
                'name': 'multi_sort',
                'query': 'subject: "Test Issue" sort by: updated_at desc, subject asc',
                'expected_query': 'subject: "Test Issue" sort by: updated_at desc, subject asc',
                'expected_filters': [
                    {
                        'type': 'string',
                        'name': 'subject',
                        'value': 'Test Issue',
                        'gid': None,
                    }
                ],
                'expected_sorts': [
                    {
                        'type': 'datetime',
                        'name': 'updated_at',
                        'direction': 'desc',
                        'gid': None,
                    },
                    {
                        'type': 'string',
                        'name': 'subject',
                        'direction': 'asc',
                        'gid': None,
                    },
                ],
            },
            id='multi_field_sorting',
        ),
        pytest.param(
            {
                'name': 'mixed_filters_and_custom',
                'query': 'subject: "Test Issue" and "Priority Level": high',
                'expected_query': 'subject: "Test Issue" and "Priority Level": high',
                'expected_filters': [
                    {
                        'type': 'string',
                        'name': 'subject',
                        'value': 'Test Issue',
                        'gid': None,
                    },
                    {
                        'type': 'string',
                        'name': 'Priority Level',
                        'value': 'high',
                        'gid': '{Priority Level}',
                    },
                ],
                'expected_sorts': [
                    {
                        'type': 'datetime',
                        'name': 'updated_at',
                        'direction': 'desc',
                        'gid': None,
                    }
                ],
            },
            id='mixed_reserved_and_custom_filters',
        ),
    ],
)
async def test_parse_mode_scenarios(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    create_custom_field: dict,
    custom_field_payload: dict,
    test_case: dict,
) -> None:
    """Test various parse mode scenarios with filters and sorts."""
    _, admin_token = create_initial_admin
    headers = make_auth_headers(admin_token)

    custom_field_gids = {custom_field_payload['name']: create_custom_field['gid']}

    expected_filters = _replace_gid_placeholder(
        test_case['expected_filters'], custom_field_gids
    )
    expected_sorts = _replace_gid_placeholder(
        test_case['expected_sorts'], custom_field_gids
    )

    response = test_client.post(
        '/api/v1/issue/filters/query-builder',
        headers=headers,
        json={'query': test_case['query']},
    )
    data = assert_success_response(response)

    payload = data['payload']
    assert payload['query'] == test_case['expected_query']
    assert payload['filters'] == expected_filters
    assert payload['sort_by'] == expected_sorts


@pytest.mark.asyncio
@pytest.mark.parametrize(
    'test_case',
    [
        pytest.param(
            {
                'name': 'invalid_sort_field_build_mode',
                'input': {
                    'sort_by': [{'name': 'nonexistent_field', 'direction': 'desc'}]
                },
                'expected_status': HTTPStatus.BAD_REQUEST,
                'expected_error_text': None,  # Any error is acceptable for invalid field
            },
            id='invalid_sort_field_build_mode',
        ),
    ],
)
async def test_build_mode_error_scenarios(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    test_case: dict,
) -> None:
    """Test various build mode error scenarios."""
    _, admin_token = create_initial_admin
    headers = make_auth_headers(admin_token)

    response = test_client.post(
        '/api/v1/issue/filters/query-builder',
        headers=headers,
        json=test_case['input'],
    )
    assert_error_response(response, test_case['expected_status'])

    if test_case['expected_error_text']:
        error_data = response.json()
        error_messages = error_data.get('error_messages', [])
        assert any(test_case['expected_error_text'] in msg for msg in error_messages)
    error_data = response.json()
    error_messages = error_data.get('error_messages', [])
    assert any('Unknown field for sorting' in msg for msg in error_messages)


@pytest.mark.asyncio
@pytest.mark.parametrize(
    'test_case',
    [
        pytest.param(
            {
                'name': 'or_operator_rejection',
                'input': {'query': 'subject: test or text: content'},
                'expected_status': HTTPStatus.BAD_REQUEST,
                'expected_error_text': 'OR operator is not supported',
            },
            id='or_operator_rejection',
        ),
        pytest.param(
            {
                'name': 'invalid_sort_field',
                'input': {'query': 'subject: test sort by: nonexistent_field desc'},
                'expected_status': HTTPStatus.BAD_REQUEST,
                'expected_error_text': 'Unknown field for sorting',
            },
            id='invalid_sort_field_parse_mode',
        ),
        pytest.param(
            {
                'name': 'malformed_sort_expression',
                'input': {'query': 'subject: test sort by: @invalid#field desc'},
                'expected_status': HTTPStatus.BAD_REQUEST,
                'expected_error_text': None,  # Any error is acceptable for malformed syntax
            },
            id='malformed_sort_expression',
        ),
    ],
)
async def test_parse_mode_error_scenarios(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    test_case: dict,
) -> None:
    """Test various parse mode error scenarios."""
    _, admin_token = create_initial_admin
    headers = make_auth_headers(admin_token)

    response = test_client.post(
        '/api/v1/issue/filters/query-builder',
        headers=headers,
        json=test_case['input'],
    )
    assert_error_response(response, test_case['expected_status'])

    if test_case['expected_error_text']:
        error_data = response.json()
        error_messages = error_data.get('error_messages', [])
        assert any(test_case['expected_error_text'] in msg for msg in error_messages)
