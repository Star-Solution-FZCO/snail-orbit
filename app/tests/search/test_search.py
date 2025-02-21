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
            'options': ['open', 'closed', 'new', '1', '2', '3'],
        },
        {
            'name': 'Priority',
            'type': CustomFieldTypeT.ENUM,
            'is_nullable': True,
            'options': ['Low', 'Medium', 'High', '1', '2', '3'],
        },
        {
            'name': 'H-State',
            'type': CustomFieldTypeT.STATE,
            'is_nullable': True,
            'options': ['open', 'closed'],
        },
        {
            'name': 'Integer',
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
            'name': 'String',
            'type': CustomFieldTypeT.STRING,
            'is_nullable': True,
        },
        {
            'name': 'Assignee',
            'type': CustomFieldTypeT.USER,
            'is_nullable': True,
        },
        {
            'name': 'Version',
            'type': CustomFieldTypeT.VERSION,
            'is_nullable': True,
            'options': [
                'latest',
                'beta',
                '1.1-alpha',
                '2.0-rc',
                '1.1-dev',
                'v1.2.3',
                '2.0-beta.1',
                '1.0',
                '1.1.1.1.1',
                '2.0',
                '1.1',
            ],
        },
        {
            'name': 'Feature',
            'type': CustomFieldTypeT.BOOLEAN,
            'is_nullable': True,
        },
    ]


TEST_VERSION_FIELD_PYTEST_PARAMS = [
    pytest.param(
        f'Version: {version}',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': '^version$', '$options': 'i'},
                    'value.version': version,
                }
            }
        },
        id=f'version field with value {version}',
    )
    for version in [
        'latest',
        'beta',
        '1.1-alpha',
        '2.0-rc',
        '1.1-dev',
        'v1.2.3',
        '2.0-beta.1',
        '1.0',
        '1.1.1.1.1',
        '2.0',
        '1.1',
    ]
] + [
    pytest.param(
        f'Version: null',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': '^version$', '$options': 'i'},
                    'value.version': None,
                }
            }
        },
        id=f'version field with null value',
    ),
    pytest.param(
        'Version: 1.1..1.1.1',
        'Failed to parse query',
        id='version field with invalid range',
    ),
]
TEST_BOOLEAN_FIELD_PYTEST_PARAMS = [
    pytest.param(
        f'Feature: {value}',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': '^feature$', '$options': 'i'},
                    'value': value if value != 'null' else None,
                }
            }
        },
        id=f'boolean field with value {value}',
    )
    for value in [False, True, 'null']
] + [
    pytest.param(
        'Feature: 1',
        'Field Feature must be either True or False',
        id='boolean field with invalid boolean value',
    ),
]
TEST_INTEGER_FIELD_PYTEST_PARAMS = [
    pytest.param(
        'Integer: 123.456',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': '^integer$', '$options': 'i'},
                    'value': 123.456,
                }
            }
        },
        id='valid decimal output for decimal number for number field',
    ),
    pytest.param(
        'Integer: 123',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': '^integer$', '$options': 'i'},
                    'value': 123.0,
                }
            }
        },
        id='valid integer output for integer number for number field',
    ),
    pytest.param(
        'Integer: 123.',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': '^integer$', '$options': 'i'},
                    'value': '123.',
                }
            }
        },
        id='number ending with dot parsed as string for number field',
    ),
    pytest.param(
        'Integer: 123.456789',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': '^integer$', '$options': 'i'},
                    'value': 123.456789,
                }
            }
        },
        id='decimal number with many decimal places for number field',
    ),
    pytest.param(
        'Integer: 123..456.789',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': '^integer$', '$options': 'i'},
                    'value': {'$gte': 123.0, '$lte': 456.789},
                }
            }
        },
        id='valid number range with decimal end',
    ),
    pytest.param(
        'Integer: 123.456..789',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': '^integer$', '$options': 'i'},
                    'value': {'$gte': 123.456, '$lte': 789.0},
                }
            }
        },
        id='valid number range with decimal start',
    ),
    pytest.param(
        'Integer: ..',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': '^integer$', '$options': 'i'},
                    'value': '..',
                }
            }
        },
        id='range with only dots',
    ),
    pytest.param(
        'Integer: 0..1000',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': '^integer$', '$options': 'i'},
                    'value': {'$gte': 0.0, '$lte': 1000.0},
                }
            }
        },
        id='number range',
    ),
    pytest.param(
        'Integer: -inf..1000',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': '^integer$', '$options': 'i'},
                    'value': {'$lt': 1000.0},
                }
            }
        },
        id='number range -inf..number',
    ),
    pytest.param(
        'Integer: -inf..inf',
        'Failed to parse query',
        id='number range -inf..inf',
    ),
    pytest.param(
        'Integer: 0..inf',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': '^integer$', '$options': 'i'},
                    'value': {'$gt': 0.0},
                }
            }
        },
        id='number range number..inf',
    ),
]
TEST_PROJECT_RESERVED_FIELD_PYTEST_PARAMS = [
    pytest.param(
        f'project: {value}',
        'Failed to parse query',
        id=f'project field with special char {value} value',
    )
    for value in ['*', '$', '{', '}']
] + [
    pytest.param(
        'project: "7777"',
        {'project.slug': {'$options': 'i', '$regex': '^7777$'}},
        id='project field with value in quoted string',
    ),
    pytest.param(
        'project: null', {'project.slug': None}, id='project field with null value'
    ),
]
TEST_SUBJECT_RESERVED_FIELD_PYTEST_PARAMS = [
    pytest.param(
        'subject: "Issue #123"',
        {'subject': {'$regex': 'Issue\\ \\#123', '$options': 'i'}},
        id='basic subject search',
    ),
    pytest.param(
        'subject: bug report',
        'Failed to parse query',
        id='basic invalid subject search',
    ),
    pytest.param('subject: null', {'subject': None}, id='subject null search'),
]
TEST_TEXT_RESERVED_FIELD_PYTEST_PARAMS = [
    pytest.param(
        'text: "search query"',
        {'$text': {'$search': 'search query'}},
        id='basic text search',
    ),
    pytest.param(
        'text: search query',
        'Failed to parse query',
        id='basic invalid text search',
    ),
    pytest.param('text: null', {'text': None}, id='text null search'),
]
TEST_CREATED_AT_RESERVED_FIELD_PYTEST_PARAMS = (
    [
        pytest.param(
            'created_at: 2024-01-01',
            {
                'created_at': {
                    '$gte': datetime(2024, 1, 1, 0, 0),
                    '$lte': datetime(2024, 1, 1, 23, 59, 59, 999999),
                }
            },
            id='created_at field with value 2024-01-01 and valid date in date',
        ),
        pytest.param(
            'created_at: 2024-12-31',
            {
                'created_at': {
                    '$gte': datetime(2024, 12, 31, 0, 0),
                    '$lte': datetime(2024, 12, 31, 23, 59, 59, 999999),
                }
            },
            id='created_at field with value 2024-12-31 and valid end of year in date',
        ),
        pytest.param(
            'created_at: 2024-02-29',
            {
                'created_at': {
                    '$gte': datetime(2024, 2, 29, 0, 0),
                    '$lte': datetime(2024, 2, 29, 23, 59, 59, 999999),
                }
            },
            id='created_at field with value 2024-02-29 and valid leap year in date',
        ),
        pytest.param(
            'created_at: 2024-01-01T00:00:00',
            {'created_at': datetime(2024, 1, 1, 0, 0, 0)},
            id='created_at field with value 2024-01-01T00:00:00 and valid datetime',
        ),
        pytest.param(
            'created_at: 2024-12-31T23:59:59',
            {'created_at': datetime(2024, 12, 31, 23, 59, 59)},
            id='created_at field with value 2024-12-31T23:59:59 and valid end of year with datetime',
        ),
        pytest.param(
            'created_at: 2024-02-29T12:30:45',
            {'created_at': datetime(2024, 2, 29, 12, 30, 45)},
            id='created_at field with value 2024-02-29T12:30:45 and valid leap year with datetime',
        ),
    ]
    + [
        pytest.param(
            f'created_at: {value}',
            'Failed to parse query',
            id=f'created_at field with value {value} and {id}',
        )
        for value, id in [
            ('-inf..inf', 'range -inf..inf'),
            ('2024-02-30', 'invalid days of date'),
            ('2024-01-01T12:00:60', 'invalid second of datetime'),
            ('2024-01-01T12:60:00', 'invalid minute of datetime'),
            ('2024-01-01T24:00:00', 'invalid hour of datetime'),
            ('2024/01/01', 'forward slashes'),
            ('2024-01-01 12:00:00', 'space instead of T'),
            ('2024-01-01T12', 'datetime field without minutes and seconds'),
        ]
    ]
    + [
        pytest.param(
            f'created_at: {value}',
            {'created_at': f'{value}'},
            id=f'created_at field with value {value} and {id}',
        )
        for value, id in [
            ('2024-00-01', 'zero month'),
            ('2024-01-32', 'invalid day'),
            ('2024-01-00', 'zero day'),
            ('2024-13-01', 'invalid month'),
            ('2024.01.01', 'dots'),
            ('2024-1-01', 'single digit month'),
            ('2024-01-1', 'single digit day'),
        ]
    ]
)
TEST_TAG_RESERVED_FIELD_PYTEST_PARAMS = [
    pytest.param(
        'tag: TAG1',
        {'tags.name': {'$regex': '^TAG1$', '$options': 'i'}},
        id='tag',
    ),
    pytest.param('tag: null', {'tags': []}, id='tag null search'),
]
TEST_DATETIME_FIELD_PYTEST_PARAMS = [
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
        id='datetime range -inf..now in datetime field',
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
        id='datetime range now..inf in datetime field',
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
        id='datetime range valid datetime..valid datetime in datetime field',
    ),
]
TEST_DATE_FIELD_PYTEST_PARAMS = [
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
        id='date range -inf..now-date in date field',
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
        id='date range now-date..inf in date field',
    ),
]
TEST_STRING_FIELD_PYTEST_PARAMS = [
    pytest.param(
        f'String: {value}',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': '^string$', '$options': 'i'},
                    'value': f'{value}' if value != 'null' else None,
                }
            }
        },
        id=f'string field with value {value}',
    )
    for value in ['null', 'dddd', '2011-40-40', '200-11-11']
] + [
    pytest.param(
        f'String: "0000"',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': '^string$', '$options': 'i'},
                    'value': '0000',
                }
            }
        },
        id=f'string field with value "0000"',
    ),
]
TEST_ENUM_FIELD_PYTEST_PARAMS = [
    pytest.param(
        f'Priority: {priority}',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': '^priority$', '$options': 'i'},
                    'value.value': f'{priority}' if priority != 'null' else None,
                }
            }
        },
        id=f'enum field with value {priority}',
    )
    for priority in ['null', '1.', '1.1', 1.1]
]
TEST_STATE_FIELD_PYTEST_PARAMS = [
    pytest.param(
        f'State: {value}',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': '^state$', '$options': 'i'},
                    'value.state': f'{value}' if value != 'null' else None,
                }
            }
        },
        id=f'state field with value {value}',
    )
    for value in [1.1, '1.1', 'null', '1-v', 'v-20']
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
                'feature',
                'version',
                'state',
                'assignee',
                'string',
                'date',
                'datetime',
                'h-state',
                'integer',
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
                'feature',
                'version',
                'state',
                'assignee',
                'string',
                'date',
                'datetime',
                'h-state',
                'integer',
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
                'feature',
                'version',
                'state',
                'assignee',
                'string',
                'date',
                'datetime',
                'h-state',
                'integer',
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
                'feature',
                'version',
                'state',
                'assignee',
                'string',
                'date',
                'datetime',
                'h-state',
                'integer',
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
                'feature',
                'version',
                'state',
                'assignee',
                'string',
                'date',
                'datetime',
                'h-state',
                'integer',
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
        pytest.param(
            'State: ',
            {'open', 'closed', 'new', 'null', '1', '2', '3'},
            id='state empty',
        ),
        pytest.param('State', {':'}, id='only field name'),
        pytest.param('St', {'tate', 'tring'}, id='partial field name'),
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
            'Unknown: test',
            'Field Unknown not found',
            id='unknown field',
        ),
        pytest.param(
            'Integer: 0..inf AND (Date: 2024-12-12..2025-12-12 OR created_at: 2025-02-03..inf)',
            {
                '$and': [
                    {
                        'fields': {
                            '$elemMatch': {
                                'name': {'$regex': '^integer$', '$options': 'i'},
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
            'Invalid bracket ")" at position 15',
            id='unknown field and closed brackets',
        ),
        pytest.param(
            'State: Closed AND',
            'Unexpected end of expression after "and"',
            id='operator at end of expression',
        ),
        pytest.param(
            'State: Closed AND ))',
            'Invalid bracket ")" at position 18',
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
        *TEST_VERSION_FIELD_PYTEST_PARAMS,
        *TEST_BOOLEAN_FIELD_PYTEST_PARAMS,
        *TEST_INTEGER_FIELD_PYTEST_PARAMS,
        *TEST_PROJECT_RESERVED_FIELD_PYTEST_PARAMS,
        *TEST_SUBJECT_RESERVED_FIELD_PYTEST_PARAMS,
        *TEST_TEXT_RESERVED_FIELD_PYTEST_PARAMS,
        *TEST_CREATED_AT_RESERVED_FIELD_PYTEST_PARAMS,
        *TEST_TAG_RESERVED_FIELD_PYTEST_PARAMS,
        *TEST_DATETIME_FIELD_PYTEST_PARAMS,
        *TEST_DATE_FIELD_PYTEST_PARAMS,
        *TEST_STRING_FIELD_PYTEST_PARAMS,
        *TEST_ENUM_FIELD_PYTEST_PARAMS,
        *TEST_STATE_FIELD_PYTEST_PARAMS,
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
        assert str(exc_info.value) == expected
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
