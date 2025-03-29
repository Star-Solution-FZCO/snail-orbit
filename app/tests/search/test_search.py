from datetime import date, datetime

import mock
import pytest

from ._mock import get_fake_custom_fields


def _custom_fields() -> list[dict]:
    from pm.models import CustomFieldTypeT

    return [
        {
            'name': 'State',
            'type': CustomFieldTypeT.STATE,
        },
        {
            'name': 'Priority',
            'type': CustomFieldTypeT.ENUM,
        },
        {
            'name': 'H-State',
            'type': CustomFieldTypeT.STATE,
        },
        {
            'name': 'Integer',
            'type': CustomFieldTypeT.INTEGER,
        },
        {
            'name': 'Float',
            'type': CustomFieldTypeT.FLOAT,
        },
        {
            'name': 'Date',
            'type': CustomFieldTypeT.DATE,
        },
        {
            'name': 'Datetime',
            'type': CustomFieldTypeT.DATETIME,
        },
        {
            'name': 'String',
            'type': CustomFieldTypeT.STRING,
        },
        {
            'name': 'Assignee',
            'type': CustomFieldTypeT.USER,
        },
        {
            'name': 'Version',
            'type': CustomFieldTypeT.VERSION,
        },
        {
            'name': 'Feature',
            'type': CustomFieldTypeT.BOOLEAN,
        },
    ]


FIXED_NOW = datetime(2024, 2, 20, 12, 12, 1, 518243)

TEST_VERSION_FIELD_PYTEST_PARAMS = [
    pytest.param(
        f'Version: {version}',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': '^version$', '$options': 'i'},
                    'value.value': version,
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
                    'value.value': None,
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
    pytest.param('subject: null', {'subject': None}, id='subject null search'),
]
TEST_TEXT_RESERVED_FIELD_PYTEST_PARAMS = [
    pytest.param(
        'text: "search query"',
        {'$text': {'$search': 'search query'}},
        id='basic text search',
    ),
    pytest.param('text: null', {'text': None}, id='text null search'),
    pytest.param(
        'text: search AND text: search',
        'Failed to parse query',
        id='invalid text search > 1 text field',
    ),
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
            'created_at: 2024-02-20',
            {
                'created_at': {
                    '$gte': datetime(2024, 2, 20, 0, 0),
                    '$lte': datetime(2024, 2, 20, 12, 12, 1, 518243),
                }
            },
            id='created_at field with value today date (2024-02-20)',
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
                    'value.value': f'{value}' if value != 'null' else None,
                }
            }
        },
        id=f'state field with value {value}',
    )
    for value in [1.1, '1.1', 'null', '1-v', 'v-20']
]
TEST_RELATIVE_DT_PYTEST_PARAMS = [
    pytest.param(
        'Datetime: now',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': '^datetime$', '$options': 'i'},
                    'value': {
                        '$gte': datetime(2024, 2, 20, 12, 12, 0, 0),
                        '$lte': datetime(2024, 2, 20, 12, 12, 59, 999999),
                    },
                }
            }
        },
        id='relative search in datetime field with "now" value',
    ),
    pytest.param(
        'Datetime: today',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': '^datetime$', '$options': 'i'},
                    'value': {
                        '$gte': datetime(2024, 2, 20, 0, 0, 0, 0),
                        '$lte': datetime(2024, 2, 20, 23, 59, 59, 999999),
                    },
                }
            }
        },
        id='relative search in datetime field with "today" value',
    ),
    pytest.param(
        'Datetime: this week',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': '^datetime$', '$options': 'i'},
                    'value': {
                        '$gte': datetime(2024, 2, 19, 0, 0, 0, 0),
                        '$lte': datetime(2024, 2, 25, 23, 59, 59, 999999),
                    },
                }
            }
        },
        id='relative search in datetime field with "this week" value',
    ),
    pytest.param(
        'Datetime: this month',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': '^datetime$', '$options': 'i'},
                    'value': {
                        '$gte': datetime(2024, 2, 1, 0, 0, 0, 0),
                        '$lte': datetime(2024, 2, 29, 23, 59, 59, 999999),
                    },
                }
            }
        },
        id='relative search in datetime field with "this month" value for February 2024',
    ),
    pytest.param(
        'Datetime: this year',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': '^datetime$', '$options': 'i'},
                    'value': {
                        '$gte': datetime(2024, 1, 1, 0, 0, 0, 0),
                        '$lte': datetime(2024, 12, 31, 23, 59, 59, 999999),
                    },
                }
            }
        },
        id='relative search in datetime field with "this year" value',
    ),
    pytest.param(
        'Datetime: now +1h',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': '^datetime$', '$options': 'i'},
                    'value': {
                        '$gte': datetime(2024, 2, 20, 13, 12, 0, 0),
                        '$lte': datetime(2024, 2, 20, 13, 12, 59, 999999),
                    },
                }
            }
        },
        id='relative search in datetime field with "now +1h" value',
    ),
    pytest.param(
        'Datetime: today -1d',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': '^datetime$', '$options': 'i'},
                    'value': {
                        '$gte': datetime(2024, 2, 19, 0, 0, 0, 0),
                        '$lte': datetime(2024, 2, 19, 23, 59, 59, 999999),
                    },
                }
            }
        },
        id='relative search in datetime field with "today -1d" value',
    ),
    pytest.param(
        'Datetime: today..inf',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': '^datetime$', '$options': 'i'},
                    'value': {
                        '$gt': datetime(2024, 2, 20, 0, 0, 0, 0),
                    },
                }
            }
        },
        id='relative search in datetime field with "today..inf" value',
    ),
    pytest.param(
        'Datetime: now..inf',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': '^datetime$', '$options': 'i'},
                    'value': {
                        '$gt': datetime(2024, 2, 20, 12, 12, 0, 0),
                    },
                }
            }
        },
        id='relative search in datetime field with "now..inf" value',
    ),
    pytest.param(
        'Datetime: now..now +2h',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': '^datetime$', '$options': 'i'},
                    'value': {
                        '$gte': datetime(2024, 2, 20, 12, 12, 0, 0),
                        '$lte': datetime(2024, 2, 20, 14, 12, 59, 999999),
                    },
                }
            }
        },
        id='relative search in datetime field with range "now..now +2h"',
    ),
    pytest.param(
        'Datetime: today -1d..today',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': '^datetime$', '$options': 'i'},
                    'value': {
                        '$gte': datetime(2024, 2, 19, 0, 0, 0, 0),
                        '$lte': datetime(2024, 2, 20, 23, 59, 59, 999999),
                    },
                }
            }
        },
        id='relative search in datetime field with range "today -1d..today"',
    ),
    pytest.param(
        'Datetime: -inf..today',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': '^datetime$', '$options': 'i'},
                    'value': {
                        '$lt': datetime(2024, 2, 20, 23, 59, 59, 999999),
                    },
                }
            }
        },
        id='relative search in datetime field with range "-inf..today"',
    ),
    pytest.param(
        'Datetime: this week..inf',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': '^datetime$', '$options': 'i'},
                    'value': {
                        '$gt': datetime(2024, 2, 19, 0, 0, 0, 0),
                    },
                }
            }
        },
        id='relative search in datetime field with range "this week..inf"',
    ),
    pytest.param(
        'Datetime: today -1d -14h +2h',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': '^datetime$', '$options': 'i'},
                    'value': {
                        '$gte': datetime(2024, 2, 19, 00, 0, 0, 0),
                        '$lte': datetime(2024, 2, 19, 23, 59, 59, 999999),
                    },
                }
            }
        },
        id='relative search in datetime field with value "today -1d -14h"',
    ),
    pytest.param(
        'Datetime: now +3d +6h..now +20d -2h',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': '^datetime$', '$options': 'i'},
                    'value': {
                        '$gte': datetime(2024, 2, 23, 18, 12, 0, 0),
                        '$lte': datetime(2024, 3, 11, 10, 12, 59, 999999),
                    },
                }
            }
        },
        id='relative search in datetime field with complex range offset "now +3d +6h..now +20d -2h"',
    ),
    pytest.param(
        'Datetime: now + 3.5d',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': '^datetime$', '$options': 'i'},
                    'value': {
                        '$gte': datetime(2024, 2, 24, 0, 12, 0, 0),
                        '$lte': datetime(2024, 2, 24, 0, 12, 59, 999999),
                    },
                }
            }
        },
        id='relative search in datetime field with decimal offset value "now +3.5d"',
    ),
    pytest.param(
        'Datetime: now + 1.3h',
        'Failed to parse query',
        id='invalid relative search in datetime field with decimal offset value "now + 1.3h"',
    ),
    pytest.param(
        'Datetime: now + 1.7d',
        'Failed to parse query',
        id='invalid relative search in datetime field with decimal offset value "now + 1.7d"',
    ),
    pytest.param(
        'Datetime: today - 1.5d..now',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': '^datetime$', '$options': 'i'},
                    'value': {
                        '$gte': datetime(2024, 2, 19, 0, 0, 0, 0),
                        '$lte': datetime(2024, 2, 20, 12, 12, 59, 999999),
                    },
                }
            }
        },
        id='relative search in datetime field with range "today - 1.5d..now"',
    ),
    pytest.param(
        'Datetime: now + 0h',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': '^datetime$', '$options': 'i'},
                    'value': {
                        '$gte': datetime(2024, 2, 20, 12, 12, 0, 0),
                        '$lte': datetime(2024, 2, 20, 12, 12, 59, 999999),
                    },
                }
            }
        },
        id='relative search in datetime field with zero hours offset "now + 0h"',
    ),
    pytest.param(
        'Datetime: today + 0d',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': '^datetime$', '$options': 'i'},
                    'value': {
                        '$gte': datetime(2024, 2, 20, 0, 0, 0, 0),
                        '$lte': datetime(2024, 2, 20, 23, 59, 59, 999999),
                    },
                }
            }
        },
        id='relative search in datetime field with zero days offset "today + 0d"',
    ),
    pytest.param(
        'Datetime: now + 1h2',
        'Failed to parse query',
        id='invalid relative search in datetime field with incorrect format "now + 1h2"',
    ),
    pytest.param(
        'Datetime: today + 1hx',
        'Failed to parse query',
        id='invalid relative search in datetime field with incorrect format "today + 1hx"',
    ),
    pytest.param(
        'Datetime: today - 1.5d..now + 2h3',
        'Failed to parse query',
        id='invalid relative search in datetime field with incorrect format in range end "now + 2h3"',
    ),
    pytest.param(
        'Datetime: now + 5d..now + 2d',
        'Field has invalid range: start value is greater than end value',
        id='invalid relative search in datetime field with range where left > right "now + 5d..now + 2d"',
    ),
    pytest.param(
        'Date: today + 1d..today',
        'Field has invalid range: start value is greater than end value',
        id='invalid relative search in date field with range where left > right "today + 1d..today"',
    ),
    pytest.param(
        'Date: now + 3d4',
        'Failed to parse query',
        id='invalid relative search in date field with incorrect format "now + 3d4"',
    ),
    pytest.param(
        'Date: today + 2dx',
        'Failed to parse query',
        id='invalid relative search in date field with incorrect format "today + 2dx"',
    ),
    pytest.param(
        'Date: now + 0h',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': '^date$', '$options': 'i'},
                    'value': {
                        '$gte': datetime(2024, 2, 20, 12, 12, 0, 0),
                        '$lte': datetime(2024, 2, 20, 12, 12, 59, 999999),
                    },
                }
            }
        },
        id='relative search in date field with zero hours offset "now + 0h"',
    ),
    pytest.param(
        'Date: today + 0d',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': '^date$', '$options': 'i'},
                    'value': {
                        '$gte': datetime(2024, 2, 20, 0, 0, 0, 0),
                        '$lte': datetime(2024, 2, 20, 23, 59, 59, 999999),
                    },
                }
            }
        },
        id='relative search in date field with zero days offset "today + 0d"',
    ),
    pytest.param(
        'Date: today - 1.5d..now',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': '^date$', '$options': 'i'},
                    'value': {
                        '$gte': datetime(2024, 2, 19, 0, 0, 0, 0),
                        '$lte': datetime(2024, 2, 20, 12, 12, 59, 999999),
                    },
                }
            }
        },
        id='relative search in date field with range "today - 1.5d..now"',
    ),
    pytest.param(
        'Date: now + 3.5d',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': '^date$', '$options': 'i'},
                    'value': {
                        '$gte': datetime(2024, 2, 24, 0, 12, 0, 0),
                        '$lte': datetime(2024, 2, 24, 0, 12, 59, 999999),
                    },
                }
            }
        },
        id='relative search in date field with decimal offset value "now +3.5d"',
    ),
    pytest.param(
        'Date: now + 1.4h',
        'Failed to parse query',
        id='invalid relative search in date field with decimal offset value "now + 1.4h"',
    ),
    pytest.param(
        'Date: now + 1.1d',
        'Failed to parse query',
        id='invalid relative search in date field with decimal offset value "now + 1.1d"',
    ),
    pytest.param(
        'Date: now',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': '^date$', '$options': 'i'},
                    'value': {
                        '$gte': datetime(2024, 2, 20, 12, 12, 0, 0),
                        '$lte': datetime(2024, 2, 20, 12, 12, 59, 999999),
                    },
                }
            }
        },
        id='relative search in date field with "now" value',
    ),
    pytest.param(
        'Date: today',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': '^date$', '$options': 'i'},
                    'value': {
                        '$gte': datetime(2024, 2, 20, 0, 0, 0, 0),
                        '$lte': datetime(2024, 2, 20, 23, 59, 59, 999999),
                    },
                }
            }
        },
        id='relative search in date field with "today" value',
    ),
    pytest.param(
        'Date: this week',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': '^date$', '$options': 'i'},
                    'value': {
                        '$gte': datetime(2024, 2, 19, 0, 0, 0, 0),
                        '$lte': datetime(2024, 2, 25, 23, 59, 59, 999999),
                    },
                }
            }
        },
        id='relative search in date field with "this week" value',
    ),
    pytest.param(
        'Date: this month',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': '^date$', '$options': 'i'},
                    'value': {
                        '$gte': datetime(2024, 2, 1, 0, 0, 0, 0),
                        '$lte': datetime(2024, 2, 29, 23, 59, 59, 999999),
                    },
                }
            }
        },
        id='relative search in date field with "this month" value for February 2024',
    ),
    pytest.param(
        'Date: this year',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': '^date$', '$options': 'i'},
                    'value': {
                        '$gte': datetime(2024, 1, 1, 0, 0, 0, 0),
                        '$lte': datetime(2024, 12, 31, 23, 59, 59, 999999),
                    },
                }
            }
        },
        id='relative search in date field with "this year" value',
    ),
    pytest.param(
        'Date: now +2h',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': '^date$', '$options': 'i'},
                    'value': {
                        '$gte': datetime(2024, 2, 20, 14, 12, 0, 0),
                        '$lte': datetime(2024, 2, 20, 14, 12, 59, 999999),
                    },
                }
            }
        },
        id='relative search in date field with "now +2h" value',
    ),
    pytest.param(
        'Date: today -2d',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': '^date$', '$options': 'i'},
                    'value': {
                        '$gte': datetime(2024, 2, 18, 0, 0, 0, 0),
                        '$lte': datetime(2024, 2, 18, 23, 59, 59, 999999),
                    },
                }
            }
        },
        id='relative search in date field with "today -2d" value',
    ),
    pytest.param(
        'Date: today..inf',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': '^date$', '$options': 'i'},
                    'value': {
                        '$gt': datetime(2024, 2, 20, 0, 0, 0, 0),
                    },
                }
            }
        },
        id='relative search in date field with "today..inf" value',
    ),
    pytest.param(
        'Date: now..inf',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': '^date$', '$options': 'i'},
                    'value': {
                        '$gt': datetime(2024, 2, 20, 12, 12, 0, 0),
                    },
                }
            }
        },
        id='relative search in date field with "now..inf" value',
    ),
    pytest.param(
        'Date: now..now +4h',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': '^date$', '$options': 'i'},
                    'value': {
                        '$gte': datetime(2024, 2, 20, 12, 12, 0, 0),
                        '$lte': datetime(2024, 2, 20, 16, 12, 59, 999999),
                    },
                }
            }
        },
        id='relative search in date field with range "now..now +4h"',
    ),
    pytest.param(
        'Date: today -3d..today',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': '^date$', '$options': 'i'},
                    'value': {
                        '$gte': datetime(2024, 2, 17, 0, 0, 0, 0),
                        '$lte': datetime(2024, 2, 20, 23, 59, 59, 999999),
                    },
                }
            }
        },
        id='relative search in date field with range "today -3d..today"',
    ),
    pytest.param(
        'Date: -inf..today',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': '^date$', '$options': 'i'},
                    'value': {
                        '$lt': datetime(2024, 2, 20, 23, 59, 59, 999999),
                    },
                }
            }
        },
        id='relative search in date field with range "-inf..today"',
    ),
    pytest.param(
        'Date: this week..inf',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': '^date$', '$options': 'i'},
                    'value': {
                        '$gt': datetime(2024, 2, 19, 0, 0, 0, 0),
                    },
                }
            }
        },
        id='relative search in date field with range "this week..inf"',
    ),
    pytest.param(
        'Date: today -2d -8h +3h',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': '^date$', '$options': 'i'},
                    'value': {
                        '$gte': datetime(2024, 2, 18, 0, 0, 0, 0),
                        '$lte': datetime(2024, 2, 18, 23, 59, 59, 999999),
                    },
                }
            }
        },
        id='relative search in date field with value "today -2d -8h +3h"',
    ),
    pytest.param(
        'Date: now +5d +3h..now +15d -4h',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': '^date$', '$options': 'i'},
                    'value': {
                        '$gte': datetime(2024, 2, 25, 15, 12, 0, 0),
                        '$lte': datetime(2024, 3, 6, 8, 12, 59, 999999),
                    },
                }
            }
        },
        id='relative search in date field with complex range offset "now +5d +3h..now +15d -4h"',
    ),
]
TEST_USER_FIELD_PYTEST_PARAMS = [
    pytest.param(
        'Assignee: valid@example.com',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': '^assignee$', '$options': 'i'},
                    'value.email': 'valid@example.com',
                }
            }
        },
        id='user field with value valid@example.com',
    ),
    pytest.param(
        'Assignee: user.name+tag@sub.example.co.uk.ex.ex',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': '^assignee$', '$options': 'i'},
                    'value.email': 'user.name+tag@sub.example.co.uk.ex.ex',
                }
            }
        },
        id='user field with value user.name+tag@sub.example.co.uk.ex.ex',
    ),
    pytest.param(
        'Assignee: first.last@example.ex',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': '^assignee$', '$options': 'i'},
                    'value.email': 'first.last@example.ex',
                }
            }
        },
        id='user field with value first.last@example.ex',
    ),
    pytest.param(
        'Assignee: example@example-company.domen',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': '^assignee$', '$options': 'i'},
                    'value.email': 'example@example-company.domen',
                }
            }
        },
        id='user field with value example@example-company.domen',
    ),
    pytest.param(
        'Assignee: invalid-email.com',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': '^assignee$', '$options': 'i'},
                    'value.email': 'invalid-email.com',
                }
            }
        },
        id='invalid email missing @',
    ),
    pytest.param(
        'Assignee: @missinglocal.com',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': '^assignee$', '$options': 'i'},
                    'value.email': '@missinglocal.com',
                }
            }
        },
        id='invalid email missing local part',
    ),
]
SIMPLE_LEFTOVER_QUERY_SEARCH_PYTEST_PARAMS = [
    pytest.param(
        'Assignee: real@email.com test1 test2',
        {
            '$and': [
                {
                    'fields': {
                        '$elemMatch': {
                            'name': {'$regex': '^assignee$', '$options': 'i'},
                            'value.email': 'real@email.com',
                        }
                    }
                },
                {'$text': {'$search': 'test1 test2'}},
            ]
        },
        id='user field with valid value real@email.com and search context test1 test2',
    ),
    pytest.param(
        'Assignee: @missinglocal.com test',
        {
            '$and': [
                {
                    'fields': {
                        '$elemMatch': {
                            'name': {'$regex': '^assignee$', '$options': 'i'},
                            'value.email': '@missinglocal.com',
                        }
                    }
                },
                {'$text': {'$search': 'test'}},
            ]
        },
        id='user field with invalid value @missinglocal.com and search context test',
    ),
    pytest.param(
        'String: hello world additional search context',
        {
            '$and': [
                {
                    'fields': {
                        '$elemMatch': {
                            'name': {'$regex': '^string$', '$options': 'i'},
                            'value': 'hello',
                        }
                    }
                },
                {'$text': {'$search': 'world additional search context'}},
            ]
        },
        id='string field with value "hello" and search context',
    ),
    pytest.param(
        'String: "quoted value" remaining text',
        {
            '$and': [
                {
                    'fields': {
                        '$elemMatch': {
                            'name': {'$regex': '^string$', '$options': 'i'},
                            'value': 'quoted value',
                        }
                    }
                },
                {'$text': {'$search': 'remaining text'}},
            ]
        },
        id='string field with quoted value and search context',
    ),
    pytest.param(
        'Integer: 123 find this issue',
        {
            '$and': [
                {
                    'fields': {
                        '$elemMatch': {
                            'name': {'$regex': '^integer$', '$options': 'i'},
                            'value': 123.0,
                        }
                    }
                },
                {'$text': {'$search': 'find this issue'}},
            ]
        },
        id='integer field with value 123 and search context',
    ),
    pytest.param(
        'Integer: 0..100 priority issues',
        {
            '$and': [
                {
                    'fields': {
                        '$elemMatch': {
                            'name': {'$regex': '^integer$', '$options': 'i'},
                            'value': {'$gte': 0.0, '$lte': 100.0},
                        }
                    }
                },
                {'$text': {'$search': 'priority issues'}},
            ]
        },
        id='integer field with range 0..100 and search context',
    ),
    pytest.param(
        'Integer: 123.456 calculation results',
        {
            '$and': [
                {
                    'fields': {
                        '$elemMatch': {
                            'name': {'$regex': '^integer$', '$options': 'i'},
                            'value': 123.456,
                        }
                    }
                },
                {'$text': {'$search': 'calculation results'}},
            ]
        },
        id='float field with value 123.456 and search context',
    ),
    pytest.param(
        'Float: 123.456calculation results',
        {
            '$and': [
                {
                    'fields': {
                        '$elemMatch': {
                            'name': {'$regex': '^float$', '$options': 'i'},
                            'value': '123.456calculation',
                        }
                    }
                },
                {'$text': {'$search': 'results'}},
            ]
        },
        id='float field with value 123.456calculation and search context',
    ),
    pytest.param(
        'Feature: true needs testing',
        {
            '$and': [
                {
                    'fields': {
                        '$elemMatch': {
                            'name': {'$regex': '^feature$', '$options': 'i'},
                            'value': True,
                        }
                    }
                },
                {'$text': {'$search': 'needs testing'}},
            ]
        },
        id='boolean field with value true and search context',
    ),
    pytest.param(
        'Feature: false deprecated functionality',
        {
            '$and': [
                {
                    'fields': {
                        '$elemMatch': {
                            'name': {'$regex': '^feature$', '$options': 'i'},
                            'value': False,
                        }
                    }
                },
                {'$text': {'$search': 'deprecated functionality'}},
            ]
        },
        id='boolean field with value false and search context',
    ),
    pytest.param(
        'Date: 2024-02-20 notes',
        {
            '$and': [
                {
                    'fields': {
                        '$elemMatch': {
                            'name': {'$regex': '^date$', '$options': 'i'},
                            'value': date(2024, 2, 20),
                        }
                    }
                },
                {'$text': {'$search': 'notes'}},
            ]
        },
        id='date field with value 2024-02-20 and search context',
    ),
    pytest.param(
        'Date: today dev',
        {
            '$and': [
                {
                    'fields': {
                        '$elemMatch': {
                            'name': {'$regex': '^date$', '$options': 'i'},
                            'value': {
                                '$gte': datetime(2024, 2, 20, 0, 0, 0, 0),
                                '$lte': datetime(2024, 2, 20, 23, 59, 59, 999999),
                            },
                        }
                    }
                },
                {'$text': {'$search': 'dev'}},
            ]
        },
        id='date field with relative value "today" and search context',
    ),
    pytest.param(
        'Datetime: 2024-02-20T14:30:00 release notes',
        {
            '$and': [
                {
                    'fields': {
                        '$elemMatch': {
                            'name': {'$regex': '^datetime$', '$options': 'i'},
                            'value': datetime(2024, 2, 20, 14, 30, 0),
                        }
                    }
                },
                {'$text': {'$search': 'release notes'}},
            ]
        },
        id='datetime field with value 2024-02-20T14:30:00 and search context',
    ),
    pytest.param(
        'Datetime: this week -14d',
        {
            '$and': [
                {
                    'fields': {
                        '$elemMatch': {
                            'name': {'$regex': '^datetime$', '$options': 'i'},
                            'value': {
                                '$gte': datetime(2024, 2, 19, 0, 0),
                                '$lte': datetime(2024, 2, 25, 23, 59, 59, 999999),
                            },
                        }
                    }
                },
                {'$text': {'$search': '-14d'}},
            ]
        },
        id='datetime field with value "this week -14d" and search context',
    ),
    pytest.param(
        'Datetime: this week -14d..inf',
        {
            '$and': [
                {
                    'fields': {
                        '$elemMatch': {
                            'name': {'$regex': '^datetime$', '$options': 'i'},
                            'value': {
                                '$gte': datetime(2024, 2, 19, 0, 0),
                                '$lte': datetime(2024, 2, 25, 23, 59, 59, 999999),
                            },
                        }
                    }
                },
                {'$text': {'$search': '-14d..inf'}},
            ]
        },
        id='datetime field with value "this week -14d..inf" and search context',
    ),
    pytest.param(
        'Datetime: now..now +2h upcoming issues',
        {
            '$and': [
                {
                    'fields': {
                        '$elemMatch': {
                            'name': {'$regex': '^datetime$', '$options': 'i'},
                            'value': {
                                '$gte': datetime(2024, 2, 20, 12, 12, 0, 0),
                                '$lte': datetime(2024, 2, 20, 14, 12, 59, 999999),
                            },
                        }
                    }
                },
                {'$text': {'$search': 'upcoming issues'}},
            ]
        },
        id='datetime field with relative range "now..now +2h" and search context',
    ),
    pytest.param(
        'Priority: High urgent issues',
        {
            '$and': [
                {
                    'fields': {
                        '$elemMatch': {
                            'name': {'$regex': '^priority$', '$options': 'i'},
                            'value.value': 'High',
                        }
                    }
                },
                {'$text': {'$search': 'urgent issues'}},
            ]
        },
        id='enum field with value High and search context',
    ),
    pytest.param(
        'Priority: null unassigned',
        {
            '$and': [
                {
                    'fields': {
                        '$elemMatch': {
                            'name': {'$regex': '^priority$', '$options': 'i'},
                            'value.value': None,
                        }
                    }
                },
                {'$text': {'$search': 'unassigned'}},
            ]
        },
        id='enum field with null value and search context',
    ),
    pytest.param(
        'State: open active tickets',
        {
            '$and': [
                {
                    'fields': {
                        '$elemMatch': {
                            'name': {'$regex': '^state$', '$options': 'i'},
                            'value.value': 'open',
                        }
                    }
                },
                {'$text': {'$search': 'active tickets'}},
            ]
        },
        id='state field with value open and search context',
    ),
    pytest.param(
        'H-State: closed archived items',
        {
            '$and': [
                {
                    'fields': {
                        '$elemMatch': {
                            'name': {'$regex': '^h-state$', '$options': 'i'},
                            'value.value': 'closed',
                        }
                    }
                },
                {'$text': {'$search': 'archived items'}},
            ]
        },
        id='hyphenated state field with value closed and search context',
    ),
    pytest.param(
        'Version: 2.0 release notes',
        {
            '$and': [
                {
                    'fields': {
                        '$elemMatch': {
                            'name': {'$regex': '^version$', '$options': 'i'},
                            'value.value': '2.0',
                        }
                    }
                },
                {'$text': {'$search': 'release notes'}},
            ]
        },
        id='version field with value 2.0 and search context',
    ),
    pytest.param(
        'Version: latest documentation updates',
        {
            '$and': [
                {
                    'fields': {
                        '$elemMatch': {
                            'name': {'$regex': '^version$', '$options': 'i'},
                            'value.value': 'latest',
                        }
                    }
                },
                {'$text': {'$search': 'documentation updates'}},
            ]
        },
        id='version field with value "latest" and search context',
    ),
    pytest.param(
        'project: TEST frontend issues',
        {
            '$and': [
                {'project.slug': {'$regex': '^TEST$', '$options': 'i'}},
                {'$text': {'$search': 'frontend issues'}},
            ]
        },
        id='project field with value TEST and search context',
    ),
    pytest.param(
        'subject: "Error in login" test',
        {
            '$and': [
                {'subject': {'$regex': 'Error\\ in\\ login', '$options': 'i'}},
                {'$text': {'$search': 'test'}},
            ]
        },
        id='subject field with quoted string and search context',
    ),
    pytest.param(
        'text: "database connection" retry',
        {'$text': {'$search': 'database connection retry'}},
        id='text field with quoted search term and search context',
    ),
    pytest.param(
        'text: important issue text',
        {'$text': {'$search': 'important issue text'}},
        id='text field with unquoted search string and search context',
    ),
    pytest.param(
        'text: "" issue text',
        {'$text': {'$search': ' issue text'}},
        id='text field with quoted empty search string and search context',
    ),
    pytest.param(
        'tag: bugfix bugfix tasks',
        {
            '$and': [
                {'tags.name': {'$regex': '^bugfix$', '$options': 'i'}},
                {'$text': {'$search': 'bugfix tasks'}},
            ]
        },
        id='tag field with value bugfix and search context',
    ),
    pytest.param(
        '#unresolved high priority',
        {
            '$and': [
                {
                    '$or': [
                        {'fields': {'$not': {'$elemMatch': {'type': 'state'}}}},
                        {
                            'fields': {
                                '$elemMatch': {
                                    'type': 'state',
                                    '$or': [
                                        {'value': None},
                                        {'value.is_resolved': False},
                                    ],
                                }
                            }
                        },
                    ]
                },
                {'$text': {'$search': 'high priority'}},
            ]
        },
        id='unresolved hashtag with search context',
    ),
    pytest.param(
        '#resolved needs verification',
        {
            '$and': [
                {
                    '$nor': [
                        {'fields': {'$not': {'$elemMatch': {'type': 'state'}}}},
                        {
                            'fields': {
                                '$elemMatch': {
                                    'type': 'state',
                                    '$or': [
                                        {'value': None},
                                        {'value.is_resolved': False},
                                    ],
                                }
                            }
                        },
                    ]
                },
                {'$text': {'$search': 'needs verification'}},
            ]
        },
        id='resolved hashtag with search context',
    ),
    pytest.param(
        'String: 2024-13-40 search context',
        {
            '$and': [
                {
                    'fields': {
                        '$elemMatch': {
                            'name': {'$regex': '^string$', '$options': 'i'},
                            'value': '2024-13-40',
                        }
                    }
                },
                {'$text': {'$search': 'search context'}},
            ]
        },
        id='string field with invalid date format treated as string and search context',
    ),
    pytest.param(
        'String: 0..100-10d search context',  # cause of 100-10d
        'Failed to parse query',
        id='string field with invalid range pattern and search context',
    ),
    pytest.param(
        'Integer: 123..abc search context',
        'Failed to parse query',
        id='integer field with invalid range end causing parse error and search context',
    ),
    pytest.param(
        'Integer: 200..100 search context',
        'Field has invalid range: start value is greater than end value',
        id='integer field with reversed range (start > end) causing validation error and search context',
    ),
    pytest.param(
        'Integer: 123.abc search context',
        {
            '$and': [
                {
                    'fields': {
                        '$elemMatch': {
                            'name': {'$regex': '^integer$', '$options': 'i'},
                            'value': '123.abc',
                        }
                    }
                },
                {'$text': {'$search': 'search context'}},
            ]
        },
        id='integer field with invalid decimal format treated as string and search context',
    ),
    pytest.param(
        'Feature: 1 search context',
        'Field Feature must be either True or False',
        id='boolean field with numeric value causing validation error and search context',
    ),
    pytest.param(
        'Date: 2024-02-30 search context',  # valid format but semantically is invalid when in datetime.date(v)
        'Failed to parse query',
        id='date field with invalid day (Feb 30) and search context',
    ),
    pytest.param(
        'Date: 2024-13-01 search context',  # parsed as string cause of date grammar format
        {
            '$and': [
                {
                    'fields': {
                        '$elemMatch': {
                            'name': {'$regex': '^date$', '$options': 'i'},
                            'value': '2024-13-01',
                        }
                    }
                },
                {'$text': {'$search': 'search context'}},
            ]
        },
        id='date field with invalid month (13) treated as string and search context',
    ),
    pytest.param(
        'Date: this week -10d',
        {
            '$and': [
                {
                    'fields': {
                        '$elemMatch': {
                            'name': {'$regex': '^date$', '$options': 'i'},
                            'value': {
                                '$gte': datetime(2024, 2, 19, 0, 0),
                                '$lte': datetime(2024, 2, 25, 23, 59, 59, 999999),
                            },
                        }
                    }
                },
                {'$text': {'$search': '-10d'}},
            ]
        },
        id='date field with value "this week -10d" and search context',
    ),
    pytest.param(
        'Date: this week -10d..inf',
        {
            '$and': [
                {
                    'fields': {
                        '$elemMatch': {
                            'name': {'$regex': '^date$', '$options': 'i'},
                            'value': {
                                '$gte': datetime(2024, 2, 19, 0, 0),
                                '$lte': datetime(2024, 2, 25, 23, 59, 59, 999999),
                            },
                        }
                    }
                },
                {'$text': {'$search': '-10d..inf'}},
            ]
        },
        id='date field with value "this week -10d..inf" and search context',
    ),
    pytest.param(
        'Date: 2024/02/20 search context',
        'Failed to parse query',
        id='date field with incorrect separator (/) treated as number value 2024 and (/02/20) and search context',
    ),
    pytest.param(
        'Date: 2024-02-20..2024-01-20 search context',
        'Field has invalid range: start value is greater than end value',
        id='date field with reversed range causing validation error and search context',
    ),
    pytest.param(
        'Datetime: 2024-02-20T25:00:00 search context',
        'Failed to parse query',
        id='datetime field with invalid hour (25) treated as error',
    ),
    pytest.param(
        'Datetime: 2024-02-20 12:00:00 search context',
        {
            '$and': [
                {
                    'fields': {
                        '$elemMatch': {
                            'name': {'$regex': '^datetime$', '$options': 'i'},
                            'value': date(2024, 2, 20),
                        }
                    }
                },
                {'$text': {'$search': '12:00:00 search context'}},
            ]
        },
        id='datetime field with space instead of T treated as date and search context',
    ),
    pytest.param(
        'Datetime: now + 1.3h search context',
        'Failed to parse query',
        id='datetime field with invalid decimal hour offset and search context',
    ),
    pytest.param(
        'Datetime: now + 2hx search context',
        'Failed to parse query',
        id='datetime field with invalid format for hour offset and search context',
    ),
    pytest.param(
        'Datetime: this week -14d search context',
        {
            '$and': [
                {
                    'fields': {
                        '$elemMatch': {
                            'name': {'$regex': '^datetime$', '$options': 'i'},
                            'value': {
                                '$gte': datetime(2024, 2, 19, 0, 0),
                                '$lte': datetime(2024, 2, 25, 23, 59, 59, 999999),
                            },
                        }
                    }
                },
                {'$text': {'$search': '-14d search context'}},
            ]
        },
        id='datetime field with invalid period offset combination and search context',
    ),
    pytest.param(
        'Datetime: now + 5d..now + 2d search context',
        'Field has invalid range: start value is greater than end value',
        id='datetime field with reversed relative range and search context',
    ),
    pytest.param(
        'Priority: NonExistent search context',
        {
            '$and': [
                {
                    'fields': {
                        '$elemMatch': {
                            'name': {'$regex': '^priority$', '$options': 'i'},
                            'value.value': 'NonExistent',
                        }
                    }
                },
                {'$text': {'$search': 'search context'}},
            ]
        },
        id='enum field with non-existent option treated as valid string value and search context',
    ),
    pytest.param(
        'Priority: High..Low search context',
        {
            '$and': [
                {
                    'fields': {
                        '$elemMatch': {
                            'name': {'$regex': '^priority$', '$options': 'i'},
                            'value.value': 'High..Low',
                        }
                    }
                },
                {'$text': {'$search': 'search context'}},
            ]
        },
        id='enum field with range pattern treated as plain string and search context',
    ),
    pytest.param(
        'Version: 1.1..1.1.1 search context',
        'Failed to parse query',
        id='version field with invalid range format and search context',
    ),
    pytest.param(
        'Version: 3.0.alpha search context',
        {
            '$and': [
                {
                    'fields': {
                        '$elemMatch': {
                            'name': {'$regex': '^version$', '$options': 'i'},
                            'value.value': '3.0.alpha',
                        }
                    }
                },
                {'$text': {'$search': 'search context'}},
            ]
        },
        id='version field with non-existent version format treated as valid string and search context',
    ),
    pytest.param(
        'project: $ search context',
        'Failed to parse query',
        id='project field with special char causing parse error and search context',
    ),
    pytest.param(
        'created_at: 2024/01/01 search context',
        'Failed to parse query',
        id='created_at field with incorrect separator (/) treated as number value 2024 and (/02/20) and search context',
    ),
    pytest.param(
        'created_at: 2024-01-01T25:00:00 search context',
        'Failed to parse query',
        id='created_at field with invalid hour treated as string and search context',
    ),
    pytest.param(
        'Integer: "123" search context',
        {
            '$and': [
                {
                    'fields': {
                        '$elemMatch': {
                            'name': {'$regex': '^integer$', '$options': 'i'},
                            'value': '123',
                        }
                    }
                },
                {'$text': {'$search': 'search context'}},
            ]
        },
        id='integer field with quoted number and search context',
    ),
    pytest.param(
        'Date: today +0d search context',
        {
            '$and': [
                {
                    'fields': {
                        '$elemMatch': {
                            'name': {'$regex': '^date$', '$options': 'i'},
                            'value': {
                                '$gte': datetime(2024, 2, 20, 0, 0, 0, 0),
                                '$lte': datetime(2024, 2, 20, 23, 59, 59, 999999),
                            },
                        }
                    }
                },
                {'$text': {'$search': 'search context'}},
            ]
        },
        id='date field with zero day offset and search context',
    ),
    pytest.param(
        'Version: latest "search context"',
        {
            '$and': [
                {
                    'fields': {
                        '$elemMatch': {
                            'name': {'$regex': '^version$', '$options': 'i'},
                            'value.value': 'latest',
                        }
                    }
                },
                {'$text': {'$search': '"search context"'}},  # sq quoted
            ]
        },
        id='version field with valid value and quoted search context',
    ),
    pytest.param(
        'Version: latest                             ',
        {
            'fields': {
                '$elemMatch': {
                    'name': {'$options': 'i', '$regex': '^version$'},
                    'value.value': 'latest',
                }
            }
        },
        id='version field with valid value and many spaces in search context',
    ),
    pytest.param(
        'just a string',
        {'$text': {'$search': 'just a string'}},
        id='plain search context',
    ),
    pytest.param(
        'random string "quoted"',
        {'$text': {'$search': 'random string "quoted"'}},
        id='plain search context with quoted string',
    ),
    pytest.param(
        'テキストです',
        {'$text': {'$search': 'テキストです'}},
        id='plain search context　(non-ascii)',
    ),
    pytest.param(
        'subject: bug report',
        {
            '$and': [
                {'subject': {'$regex': 'bug', '$options': 'i'}},
                {'$text': {'$search': 'report'}},
            ]
        },
        id='basic invalid subject search',
    ),
    pytest.param(
        'State: open AND report',
        {
            '$and': [
                {
                    'fields': {
                        '$elemMatch': {
                            'name': {'$regex': '^state$', '$options': 'i'},
                            'value.value': 'open',
                        }
                    }
                },
                {'$text': {'$search': 'report'}},
            ]
        },
        id='search left over after valid field with and operator',
    ),
    pytest.param(
        'State: Closed AND #unknownhashtag',
        {
            '$and': [
                {
                    'fields': {
                        '$elemMatch': {
                            'name': {'$regex': '^state$', '$options': 'i'},
                            'value.value': 'Closed',
                        }
                    }
                },
                {'$text': {'$search': '#unknownhashtag'}},
            ]
        },
        id='state open and unknown hashtag',
    ),
    pytest.param(
        'State: open #',
        {
            '$and': [
                {
                    'fields': {
                        '$elemMatch': {
                            'name': {'$regex': '^state$', '$options': 'i'},
                            'value.value': 'open',
                        }
                    }
                },
                {'$text': {'$search': '#'}},
            ]
        },
        id='empty hashtag',
    ),
    pytest.param(
        'State: 111111.3333 #unresolved',
        {
            '$and': [
                {
                    'fields': {
                        '$elemMatch': {
                            'name': {'$regex': '^state$', '$options': 'i'},
                            'value.value': '111111.3333',
                        }
                    }
                },
                {'$text': {'$search': '#unresolved'}},
            ]
        },
        id='invalid direct combination without operator',
    ),
]
COMPLEX_LEFTOVER_QUERY_SEARCH_PYTEST_PARAMS = [
    pytest.param(
        'text: one two three and Assignee: admin@admin.com',
        {
            '$and': [
                {'$text': {'$search': 'one two three'}},
                {
                    'fields': {
                        '$elemMatch': {
                            'name': {'$regex': '^assignee$', '$options': 'i'},
                            'value.email': 'admin@admin.com',
                        }
                    }
                },
            ]
        },
        id='text field with search context and assignee field',
    ),
    pytest.param(
        # more than one text search implicit and explicit
        'text: one two three and Assignee: admin@admin.com another',
        'Failed to parse query',
        id='text field with search context and assignee field with search context',
    ),
    pytest.param(
        '(Priority: High note high priority or Priority: Medium note medium priority) and (Version: 0.1.2-dev dev version note or Version: latest latest version note)',
        {
            '$and': [
                {
                    '$and': [
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
                                                '$regex': '^priority$',
                                                '$options': 'i',
                                            },
                                            'value.value': 'Medium',
                                        }
                                    }
                                },
                            ]
                        },
                        {
                            '$or': [
                                {
                                    'fields': {
                                        '$elemMatch': {
                                            'name': {
                                                '$regex': '^version$',
                                                '$options': 'i',
                                            },
                                            'value.value': '0.1.2-dev',
                                        }
                                    }
                                },
                                {
                                    'fields': {
                                        '$elemMatch': {
                                            'name': {
                                                '$regex': '^version$',
                                                '$options': 'i',
                                            },
                                            'value.value': 'latest',
                                        }
                                    }
                                },
                            ]
                        },
                    ]
                },
                {
                    '$text': {
                        '$search': 'note high priority note medium priority dev version note latest version note'
                    }
                },
            ]
        },
        id='complex query with multiple conditions and search context',
    ),
]


@mock.patch('pm.api.search.issue._get_custom_fields', new_callable=mock.AsyncMock)
@mock.patch('pm.api.search.issue.utcnow', new_callable=mock.Mock)
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
                        'value.value': 'open',
                    }
                }
            },
            id='state open',
        ),
        pytest.param(
            'Version: "1.0.0"',
            {
                'fields': {
                    '$elemMatch': {
                        'name': {'$regex': '^version$', '$options': 'i'},
                        'value.value': '1.0.0',
                    }
                }
            },
        ),
        pytest.param(
            'State: open AND Priority: High',
            {
                '$and': [
                    {
                        'fields': {
                            '$elemMatch': {
                                'name': {'$regex': '^state$', '$options': 'i'},
                                'value.value': 'open',
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
                                'value.value': 'open',
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
                                        'value.value': 'open',
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
                                                'value.value': 'closed',
                                            }
                                        }
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        '$or': [
                            {'fields': {'$not': {'$elemMatch': {'type': 'state'}}}},
                            {
                                'fields': {
                                    '$elemMatch': {
                                        'type': 'state',
                                        '$or': [
                                            {'value': None},
                                            {'value.is_resolved': False},
                                        ],
                                    }
                                }
                            },
                        ]
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
                                'value.value': 'open',
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
                                        'value.value': 'closed',
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
                        'value.value': 'Closed',
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
            '#resolved',
            {
                '$nor': [
                    {'fields': {'$not': {'$elemMatch': {'type': 'state'}}}},
                    {
                        'fields': {
                            '$elemMatch': {
                                'type': 'state',
                                '$or': [{'value': None}, {'value.is_resolved': False}],
                            }
                        }
                    },
                ]
            },
            id='resolved hashtag',
        ),
        pytest.param(
            '#resolved OR Date: 2024-12-12..inf',
            {
                '$or': [
                    {
                        '$nor': [
                            {'fields': {'$not': {'$elemMatch': {'type': 'state'}}}},
                            {
                                'fields': {
                                    '$elemMatch': {
                                        'type': 'state',
                                        '$or': [
                                            {'value': None},
                                            {'value.is_resolved': False},
                                        ],
                                    }
                                }
                            },
                        ]
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
        *TEST_RELATIVE_DT_PYTEST_PARAMS,
        *TEST_USER_FIELD_PYTEST_PARAMS,
        *SIMPLE_LEFTOVER_QUERY_SEARCH_PYTEST_PARAMS,
        *COMPLEX_LEFTOVER_QUERY_SEARCH_PYTEST_PARAMS,
    ],
)
async def test_search_transformation(
    mock_utcnow: mock.Mock,
    mock__get_custom_fields: mock.AsyncMock,
    query: str,
    expected: dict,
) -> None:
    mock__get_custom_fields.return_value = get_fake_custom_fields(_custom_fields())
    mock_utcnow.return_value = FIXED_NOW

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
