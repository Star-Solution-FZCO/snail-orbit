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
        {
            'name': 'Range-F',
            'type': CustomFieldTypeT.INTEGER,
            'is_nullable': True,
        },
        {
            'name': 'Date',
            'type': CustomFieldTypeT.DATE,
            'is_nullable': True,
        },
        {
            'name': 'Datetime',
            'type': CustomFieldTypeT.DATETIME,
            'is_nullable': True,
        },
        {
            'name': 'Test-field with space',
            'type': CustomFieldTypeT.STRING,
            'is_nullable': True,
        },
        {
            'name': 'Assignee',
            'type': CustomFieldTypeT.USER,
            'is_nullable': True,
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
                'assignee',
                'test-field with space',
                'date',
                'datetime',
                'h-state',
                'range-f',
                'priority',
                'project',
                'subject',
                'tag',
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
                'assignee',
                'test-field with space',
                'date',
                'datetime',
                'h-state',
                'range-f',
                'priority',
                'project',
                'subject',
                'tag',
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
                'assignee',
                'test-field with space',
                'date',
                'datetime',
                'h-state',
                'range-f',
                'priority',
                'project',
                'subject',
                'tag',
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
                'assignee',
                'test-field with space',
                'date',
                'datetime',
                'h-state',
                'range-f',
                'priority',
                'project',
                'subject',
                'tag',
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
                'assignee',
                'test-field with space',
                'date',
                'datetime',
                'h-state',
                'range-f',
                'priority',
                'project',
                'subject',
                'tag',
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
            {
                'created_at': {
                    '$gte': datetime(2024, 1, 1, 0, 0),
                    '$lte': datetime(2024, 1, 1, 23, 59, 59, 999999),
                }
            },
            id='basic valid date',
        ),
        pytest.param(
            'created_at: 2024-12-31',
            {
                'created_at': {
                    '$gte': datetime(2024, 12, 31, 0, 0),
                    '$lte': datetime(2024, 12, 31, 23, 59, 59, 999999),
                }
            },
            id='valid end of year',
        ),
        pytest.param(
            'created_at: 2024-02-29',
            {
                'created_at': {
                    '$gte': datetime(2024, 2, 29, 0, 0),
                    '$lte': datetime(2024, 2, 29, 23, 59, 59, 999999),
                }
            },
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
            {'subject': {'$regex': 'Issue\\ \\#123', '$options': 'i'}},
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
        pytest.param(
            'tag: TAG1',
            {'tags.name': {'$regex': '^TAG1$', '$options': 'i'}},
            id='tag',
        ),
        pytest.param('tag: null', {'tags': []}, id='tag null search'),
        pytest.param(
            'project: $',
            'Failed to parse query',
            id='special char $',
        ),
        pytest.param(
            'project: *',
            'Failed to parse query',
            id='special char *',
        ),
        pytest.param(
            'project: {',
            'Failed to parse query',
            id='special char {',
        ),
        pytest.param(
            'project: }',
            'Failed to parse query',
            id='special char }',
        ),
        pytest.param(
            'Unknown: test',
            'Field Unknown not found!',
            id='unknown field',
        ),
        pytest.param(
            'Datetime: -inf..2025-02-20T12:00:00',
            {
                'fields': {
                    '$elemMatch': {
                        'name': {'$regex': '^datetime$', '$options': 'i'},
                        'value': {'$lt': datetime(2025, 2, 20, 12, 0)},
                    }
                }
            },
            id='datetime range -inf..now in custom field',
        ),
        pytest.param(
            'Datetime: 2024-02-20T12:00:00..inf',
            {
                'fields': {
                    '$elemMatch': {
                        'name': {'$regex': '^datetime$', '$options': 'i'},
                        'value': {'$gt': datetime(2024, 2, 20, 12, 0)},
                    }
                }
            },
            id='datetime range now..inf in custom field',
        ),
        pytest.param(
            'Datetime: 2024-02-20T12:00:00..2025-02-20T12:00:00',
            {
                'fields': {
                    '$elemMatch': {
                        'name': {'$regex': '^datetime$', '$options': 'i'},
                        'value': {
                            '$gte': datetime(2024, 2, 20, 12, 0),
                            '$lte': datetime(2025, 2, 20, 12, 0),
                        },
                    }
                }
            },
            id='datetime range valid-datetime..valid-datetime in custom field',
        ),
        pytest.param(
            'Date: -inf..2025-02-20',
            {
                'fields': {
                    '$elemMatch': {
                        'name': {'$regex': '^date$', '$options': 'i'},
                        'value': {
                            '$lt': date(2025, 2, 20),
                        },
                    }
                }
            },
            id='date range -inf..now-date in custom field',
        ),
        pytest.param(
            'Date: 2024-02-20..inf',
            {
                'fields': {
                    '$elemMatch': {
                        'name': {'$regex': '^date$', '$options': 'i'},
                        'value': {
                            '$gt': date(2024, 2, 20),
                        },
                    }
                }
            },
            id='date range now-date..inf in custom field',
        ),
        pytest.param(
            'created_at: -inf..inf',
            'Failed to parse query',
            id='range -inf..inf',
        ),
        pytest.param(
            'Range-F: 0..1000',
            {
                'fields': {
                    '$elemMatch': {
                        'name': {'$regex': '^range-f$', '$options': 'i'},
                        'value': {'$gte': 0.0, '$lte': 1000.0},
                    }
                }
            },
            id='number range',
        ),
        pytest.param(
            'Range-F: -inf..1000',
            {
                'fields': {
                    '$elemMatch': {
                        'name': {'$regex': '^range-f$', '$options': 'i'},
                        'value': {'$lt': 1000.0},
                    }
                }
            },
            id='number range -inf..number',
        ),
        pytest.param(
            'Range-F: -inf..inf',
            'Failed to parse query',
            id='number range -inf..inf',
        ),
        pytest.param(
            'Range-F: 0..inf',
            {
                'fields': {
                    '$elemMatch': {
                        'name': {'$regex': '^range-f$', '$options': 'i'},
                        'value': {'$gt': 0.0},
                    }
                }
            },
            id='number range number..inf',
        ),
        pytest.param(
            'Range-F: 0..inf AND (Date: 2024-12-12..2025-12-12 OR created_at: 2025-02-03..inf)',
            {
                '$and': [
                    {
                        'fields': {
                            '$elemMatch': {
                                'name': {'$regex': '^range-f$', '$options': 'i'},
                                'value': {'$gt': 0.0},
                            }
                        }
                    },
                    {
                        '$or': [
                            {
                                'fields': {
                                    '$elemMatch': {
                                        'name': {'$regex': '^date$', '$options': 'i'},
                                        'value': {
                                            '$gte': date(2024, 12, 12),
                                            '$lte': date(2025, 12, 12),
                                        },
                                    }
                                }
                            },
                            {'created_at': {'$gt': date(2025, 2, 3)}},
                        ]
                    },
                ]
            },
            id='range field and date range or created_at range',
        ),
        pytest.param(
            'Test-field with space: "0000"',
            {
                'fields': {
                    '$elemMatch': {
                        'name': {'$regex': '^test-field with space$', '$options': 'i'},
                        'value': '0000',
                    }
                }
            },
            id="test-f with space: '0000'",
        ),
        pytest.param(
            'project: 7777',
            {'project.slug': {'$options': 'i', '$regex': '^7777.0$'}},
            id='project search number',
        ),
        pytest.param(
            'project: "7777"',
            {'project.slug': {'$options': 'i', '$regex': '^7777$'}},
            id='project search quoted string',
        ),
        pytest.param(
            '((State: Closed)',
            {
                'fields': {
                    '$elemMatch': {
                        'name': {'$regex': '^state$', '$options': 'i'},
                        'value.state': 'Closed',
                    }
                }
            },
            id='mismatched brackets more opens',
        ),
        pytest.param(
            'Unknown: Closed))',
            'Invalid bracket ")" at position 13!',
            id='unknown field and closed brackets',
        ),
        pytest.param(
            'State: Closed AND',
            'Unexpected end of expression after "and"!',
            id='operator at end of expression',
        ),
        pytest.param(
            'State: Closed AND ))',
            'Invalid bracket ")" at position 18!',
            id='closed brackets at end of expression',
        ),
        pytest.param(
            'State: Closed AND #unknownhashtag',
            'Failed to parse query',
            id='state open and unknown hashtag',
        ),
        pytest.param('State: open #', 'Failed to parse query', id='empty hashtag'),
        pytest.param(
            'State: 111111.3333 #unresolved',
            'Failed to parse query',
            id='invalid direct combination without operator',
        ),
        pytest.param(
            '#resolved',
            {'fields': {'$elemMatch': {'type': 'state', 'value.is_resolved': True}}},
            id='resolved hashtag',
        ),
        pytest.param(
            '#resolved OR Date: 2024-12-12..inf',
            {
                '$or': [
                    {
                        'fields': {
                            '$elemMatch': {'type': 'state', 'value.is_resolved': True}
                        }
                    },
                    {
                        'fields': {
                            '$elemMatch': {
                                'name': {'$regex': '^date$', '$options': 'i'},
                                'value': {'$gt': date(2024, 12, 12)},
                            }
                        }
                    },
                ]
            },
            id='resolved hashtag and date range',
        ),
        pytest.param('(((((((((((((((', {}, id='Many open brackets'),
        pytest.param(
            'Assignee: test1@test1.com',
            {
                'fields': {
                    '$elemMatch': {
                        'name': {'$regex': '^assignee$', '$options': 'i'},
                        'value.email': 'test1@test1.com',
                    }
                }
            },
            id='Assignee user',
        ),
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

    if (
        query.strip()
        and not any(
            err in expected
            for err in ['Invalid bracket', 'Unexpected end', 'Invalid operator']
        )
        and expected != {}
    ):
        mock__get_custom_fields.assert_awaited_once()
    else:
        mock__get_custom_fields.assert_not_awaited()
