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
                'priority',
                'project',
                'subject',
                'text',
                'created_at',
                'updated_at',
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
                'priority',
                'project',
                'subject',
                'text',
                'created_at',
                'updated_at',
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
                'priority',
                'project',
                'subject',
                'text',
                'created_at',
                'updated_at',
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
                'priority',
                'project',
                'subject',
                'text',
                'created_at',
                'updated_at',
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
                'priority',
                'project',
                'subject',
                'text',
                'created_at',
                'updated_at',
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
    ],
)
async def test_search_transformation(
    mock__get_custom_fields: mock.AsyncMock,
    query: str,
    expected: dict,
) -> None:
    mock__get_custom_fields.return_value = get_fake_custom_fields(_custom_fields())

    from pm.api.search.issue import transform_query

    res = await transform_query(query)
    if query.strip():
        mock__get_custom_fields.assert_awaited_once()
    assert res == expected
