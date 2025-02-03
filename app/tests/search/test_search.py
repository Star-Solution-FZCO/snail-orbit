from datetime import date, datetime

import mock
import pytest

from ._mock import get_fake_custom_fields, get_fake_projects

PROJECTS = ['TEST', 'SnailOrbit']


def _custom_fields():
    from pm.models import CustomFieldTypeT

    return [
        {
            'name': 'State',
            'type': CustomFieldTypeT.STATE,
            'is_nullable': True,
            'options': ['open', 'closed', 'new'],
        },
        {
            'name': 'Priority',
            'type': CustomFieldTypeT.ENUM,
            'is_nullable': True,
            'options': ['Low', 'Medium', 'High'],
        },
        {
            'name': 'H-State',
            'type': CustomFieldTypeT.STATE,
            'is_nullable': True,
            'options': ['open', 'closed'],
        },
    ]


@mock.patch('pm.api.search.issue._get_custom_fields', new_callable=mock.AsyncMock)
@mock.patch('pm.api.search.issue._get_projects', new_callable=mock.AsyncMock)
@pytest.mark.asyncio
@pytest.mark.parametrize(
    'query, expected',
    [
        pytest.param(
            '',
            {
                'state',
                'h-state',
                'priority',
                'project',
                'subject',
                'text',
                'created_at',
                'created_by',
                'updated_at',
                'updated_by',
                '#unresolved',
                '#resolved',
                '(',
            },
            id='empty',
        ),
        pytest.param(
            ' ',
            {
                'state',
                'h-state',
                'priority',
                'project',
                'subject',
                'text',
                'created_at',
                'created_by',
                'updated_at',
                'updated_by',
                '#unresolved',
                '#resolved',
                '(',
            },
            id='only space',
        ),
        pytest.param(
            ' (',
            {
                'state',
                'h-state',
                'priority',
                'project',
                'subject',
                'text',
                'created_at',
                'created_by',
                'updated_at',
                'updated_by',
                '#unresolved',
                '#resolved',
                '(',
            },
            id='open bracket',
        ),
        pytest.param('State: open', {'AND', 'OR'}, id='state open'),
        pytest.param(
            'State: open AND',
            {
                'state',
                'h-state',
                'priority',
                'project',
                'subject',
                'text',
                'created_at',
                'created_by',
                'updated_at',
                'updated_by',
                '#unresolved',
                '#resolved',
                '(',
            },
            id='state open and',
        ),
        pytest.param(
            'State: open AND Priority: High',
            {'AND', 'OR'},
            id='state open and priority high',
        ),
        pytest.param(
            '(State: open ', {'AND', 'OR', ')'}, id='incomplete bracket sequence'
        ),
        pytest.param(
            '(State: open AND',
            {
                'state',
                'h-state',
                'priority',
                'project',
                'subject',
                'text',
                'created_at',
                'created_by',
                'updated_at',
                'updated_by',
                '#unresolved',
                '#resolved',
                '(',
            },
            id='state open and',
        ),
        pytest.param(
            '(State: open AND Priority: High',
            {'AND', 'OR', ')'},
            id='state open and priority high incomplite bracket sequence',
        ),
        pytest.param('State: ', {'open', 'closed', 'new', 'null'}, id='state empty'),
        pytest.param('State', {':'}, id='only field name'),
        pytest.param('St', {'tate'}, id='partial field name'),
        pytest.param(
            'State: o',
            {'pen'},
            id='partial state value (o)',
        ),
        pytest.param(
            'State: n',
            {'ew', 'ull'},
            id='partial state value (n)',
        ),
        pytest.param('#', {'unresolved', 'resolved'}, id='hash'),
        pytest.param('#u', {'nresolved'}, id='partial hash'),
        pytest.param('#unresolved', {'AND', 'OR'}, id='hash unresolved'),
    ],
)
async def test_suggestions(
    mock__get_projects: mock.AsyncMock,
    mock__get_custom_fields: mock.AsyncMock,
    query: str,
    expected: set[str],
) -> None:
    mock__get_custom_fields.return_value = get_fake_custom_fields(_custom_fields())
    mock__get_projects.return_value = get_fake_projects(PROJECTS)

    from pm.api.search.issue import get_suggestions

    res = await get_suggestions(query)
    mock__get_custom_fields.assert_awaited_once()
    mock__get_projects.assert_awaited_once()
    assert set(res) == expected
    assert len(res) == len(expected)


@mock.patch('pm.api.search.issue._get_custom_fields', new_callable=mock.AsyncMock)
@pytest.mark.asyncio
@pytest.mark.parametrize(
    'query, expected',
    [
        pytest.param('', {}, id='empty'),
        pytest.param(' ', {}, id='only space'),
        pytest.param(
            'State: open',
            {
                'fields': {
                    '$elemMatch': {
                        'name': {'$regex': '^state$', '$options': 'i'},
                        'value.state': 'open',
                    }
                }
            },
            id='state open',
        ),
        pytest.param(
            'State: open AND Priority: High',
            {
                '$and': [
                    {
                        'fields': {
                            '$elemMatch': {
                                'name': {'$regex': '^state$', '$options': 'i'},
                                'value.state': 'open',
                            },
                        }
                    },
                    {
                        'fields': {
                            '$elemMatch': {
                                'name': {'$regex': '^priority$', '$options': 'i'},
                                'value.value': 'High',
                            },
                        }
                    },
                ],
            },
            id='state open and priority high',
        ),
        pytest.param(
            'State: open OR Priority: High',
            {
                '$or': [
                    {
                        'fields': {
                            '$elemMatch': {
                                'name': {'$regex': '^state$', '$options': 'i'},
                                'value.state': 'open',
                            },
                        }
                    },
                    {
                        'fields': {
                            '$elemMatch': {
                                'name': {'$regex': '^priority$', '$options': 'i'},
                                'value.value': 'High',
                            },
                        }
                    },
                ],
            },
            id='state open or priority high',
        ),
        pytest.param(
            'State: open AND (Priority: High OR State: closed) OR #unresolved',
            {
                '$or': [
                    {
                        '$and': [
                            {
                                'fields': {
                                    '$elemMatch': {
                                        'name': {'$regex': '^state$', '$options': 'i'},
                                        'value.state': 'open',
                                    },
                                }
                            },
                            {
                                '$or': [
                                    {
                                        'fields': {
                                            '$elemMatch': {
                                                'name': {
                                                    '$regex': '^priority$',
                                                    '$options': 'i',
                                                },
                                                'value.value': 'High',
                                            }
                                        }
                                    },
                                    {
                                        'fields': {
                                            '$elemMatch': {
                                                'name': {
                                                    '$regex': '^state$',
                                                    '$options': 'i',
                                                },
                                                'value.state': 'closed',
                                            }
                                        }
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        'fields': {
                            '$elemMatch': {'type': 'state', 'value.is_resolved': False}
                        }
                    },
                ],
            },
            id='state open and (priority high or state closed) unresolved',
        ),
        pytest.param(
            'H-State: open OR ( Priority: High and H-State: closed )',
            {
                '$or': [
                    {
                        'fields': {
                            '$elemMatch': {
                                'name': {'$regex': '^h-state$', '$options': 'i'},
                                'value.state': 'open',
                            },
                        }
                    },
                    {
                        '$and': [
                            {
                                'fields': {
                                    '$elemMatch': {
                                        'name': {
                                            '$regex': '^priority$',
                                            '$options': 'i',
                                        },
                                        'value.value': 'High',
                                    },
                                }
                            },
                            {
                                'fields': {
                                    '$elemMatch': {
                                        'name': {
                                            '$regex': '^h-state$',
                                            '$options': 'i',
                                        },
                                        'value.state': 'closed',
                                    },
                                }
                            },
                        ],
                    },
                ],
            },
            id='hyphen in field name',
        ),
        pytest.param(
            'created_at: 2024-01-01',
            {'created_at': date(2024, 1, 1)},
            id='basic valid date',
        ),
        pytest.param(
            'created_at: 2024-12-31',
            {'created_at': date(2024, 12, 31)},
            id='valid end of year',
        ),
        pytest.param(
            'created_at: 2024-02-29',
            {'created_at': date(2024, 2, 29)},
            id='valid leap year',
        ),
        pytest.param(
            'created_at: 2024-13-01', 'Failed to parse query', id='invalid month'
        ),
        pytest.param(
            'created_at: 2024-00-01', 'Failed to parse query', id='zero month'
        ),
        pytest.param(
            'created_at: 2024-01-32', 'Failed to parse query', id='invalid day'
        ),
        pytest.param('created_at: 2024-01-00', 'Failed to parse query', id='zero day'),
        pytest.param(
            'created_at: 2024-01-01T00:00:00',
            {'created_at': datetime(2024, 1, 1, 0, 0, 0)},
            id='basic valid datetime',
        ),
        pytest.param(
            'created_at: 2024-12-31T23:59:59',
            {'created_at': datetime(2024, 12, 31, 23, 59, 59)},
            id='valid end of year with time',
        ),
        pytest.param(
            'created_at: 2024-02-29T12:30:45',
            {'created_at': datetime(2024, 2, 29, 12, 30, 45)},
            id='valid leap year with time',
        ),
        pytest.param(
            'created_at: 2024-01-01T24:00:00',
            'Failed to parse query',
            id='invalid hour',
        ),
        pytest.param(
            'created_at: 2024-01-01T12:60:00',
            'Failed to parse query',
            id='invalid minute',
        ),
        pytest.param(
            'created_at: 2024-01-01T12:00:60',
            'Failed to parse query',
            id='invalid second',
        ),
        pytest.param(
            'created_at: 2024-02-30',
            'Failed to parse query',
            id='invalid days in month (30th february)',
        ),
        pytest.param(
            'text: "search query"',
            {'$text': {'$search': 'search query'}},
            id='basic text search',
        ),
        pytest.param(
            'text: 12345',
            {'$text': {'$search': '12345.0'}},
            id='number in text search',
        ),
        pytest.param(
            'text: search query',
            'Failed to parse query',
            id='basic invalid text search',
        ),
        pytest.param('text: null', {'text': None}, id='text null search'),
        pytest.param(
            'subject: "Issue #123"',
            {'subject': {'$regex': 'Issue #123', '$options': 'i'}},
            id='basic subject search',
        ),
        pytest.param(
            'subject: 12345',
            {'subject': {'$regex': '12345.0', '$options': 'i'}},
            id='number in subject search',
        ),
        pytest.param(
            'subject: bug report',
            'Failed to parse query',
            id='basic invalid subject search',
        ),
        pytest.param('subject: null', {'subject': None}, id='subject null search'),
        pytest.param('project: null', {'project.slug': None}, id='project null search'),
    ],
)
async def test_search_transformation(
    mock__get_custom_fields: mock.AsyncMock,
    query: str,
    expected: dict,
) -> None:
    mock__get_custom_fields.return_value = get_fake_custom_fields(_custom_fields())

    from pm.api.search.issue import TransformError, transform_query

    if isinstance(expected, str):
        with pytest.raises(TransformError) as exc_info:
            await transform_query(query)
        if expected.startswith('Failed to parse query'):
            assert str(exc_info.value) == 'Failed to parse query'
    else:
        res = await transform_query(query)
        assert res == expected

    if query.strip():
        mock__get_custom_fields.assert_awaited_once()
    else:
        mock__get_custom_fields.assert_not_awaited()
