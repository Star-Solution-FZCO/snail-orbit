import mock
import pytest


def _custom_fields() -> dict:
    from pm.models import CustomFieldTypeT

    fields = {
        'State': CustomFieldTypeT.STATE,
        'Priority': CustomFieldTypeT.ENUM,
        'H-State': CustomFieldTypeT.STATE,
        'Integer': CustomFieldTypeT.INTEGER,
        'Float': CustomFieldTypeT.FLOAT,
        'Date': CustomFieldTypeT.DATE,
        'Datetime': CustomFieldTypeT.DATETIME,
        'String': CustomFieldTypeT.STRING,
        'Assignee': CustomFieldTypeT.USER,
        'Version': CustomFieldTypeT.VERSION,
        'Boolean': CustomFieldTypeT.BOOLEAN,
        'Field Name': CustomFieldTypeT.STRING,
        'Priority Multi': CustomFieldTypeT.ENUM_MULTI,
        'Version Multi': CustomFieldTypeT.VERSION_MULTI,
        'Assignee Multi': CustomFieldTypeT.USER_MULTI,
    }

    return {k.lower(): v for k, v in fields.items()}


@mock.patch('pm.api.issue_query.sort.get_custom_fields', new_callable=mock.AsyncMock)
@pytest.mark.asyncio
@pytest.mark.parametrize(
    'sort_expr, expected',
    [
        pytest.param('', [], id='empty'),
        pytest.param('project', [{'$sort': {'project.name': 1}}], id='project_asc'),
        pytest.param(
            'project, project',
            [{'$sort': {'project.name': 1}}],
            id='double_project_fields_asc',
        ),
        pytest.param(
            'project, project desc',
            [{'$sort': {'project.name': -1}}],
            id='double_project_fields_desc',
        ),
        pytest.param('id', [{'$sort': {'_id': 1}}], id='id_asc'),
        pytest.param('subject', [{'$sort': {'subject': 1}}], id='subject_asc'),
        pytest.param('updated_at', [{'$sort': {'updated_at': 1}}], id='updated_at_asc'),
        pytest.param(
            'updated_at, updated_at desc',
            [{'$sort': {'updated_at': -1}}],
            id='double_updated_at_fields_desc',
        ),
        pytest.param('created_at', [{'$sort': {'created_at': 1}}], id='created_at_asc'),
        pytest.param(
            'created_by', [{'$sort': {'created_by.email': 1}}], id='created_by_asc'
        ),
        pytest.param(
            'updated_by', [{'$sort': {'updated_by.email': 1}}], id='updated_by_asc'
        ),
        pytest.param(
            'project asc', [{'$sort': {'project.name': 1}}], id='project_asc_explicit'
        ),
        pytest.param(
            'project desc', [{'$sort': {'project.name': -1}}], id='project_desc'
        ),
        pytest.param('id desc', [{'$sort': {'_id': -1}}], id='id_desc'),
        pytest.param('subject desc', [{'$sort': {'subject': -1}}], id='subject_desc'),
        pytest.param(
            'updated_at desc', [{'$sort': {'updated_at': -1}}], id='updated_at_desc'
        ),
        pytest.param(
            'created_at desc', [{'$sort': {'created_at': -1}}], id='created_at_desc'
        ),
        pytest.param(
            'state',
            [
                {
                    '$addFields': {
                        'state__sort': {
                            '$ifNull': [
                                {
                                    '$arrayElemAt': [
                                        {
                                            '$map': {
                                                'input': {
                                                    '$filter': {
                                                        'input': '$fields',
                                                        'as': 'field',
                                                        'cond': {
                                                            '$regexMatch': {
                                                                'input': '$$field.name',
                                                                'regex': '^state$',
                                                                'options': 'i',
                                                            }
                                                        },
                                                    }
                                                },
                                                'as': 'matchedField',
                                                'in': '$$matchedField.value.value',
                                            }
                                        },
                                        0,
                                    ]
                                },
                                None,
                            ]
                        }
                    }
                },
                {'$sort': {'state__sort': 1}},
                {'$project': {'state__sort': 0}},
            ],
            id='state_asc',
        ),
        pytest.param(
            'state desc',
            [
                {
                    '$addFields': {
                        'state__sort': {
                            '$ifNull': [
                                {
                                    '$arrayElemAt': [
                                        {
                                            '$map': {
                                                'input': {
                                                    '$filter': {
                                                        'input': '$fields',
                                                        'as': 'field',
                                                        'cond': {
                                                            '$regexMatch': {
                                                                'input': '$$field.name',
                                                                'regex': '^state$',
                                                                'options': 'i',
                                                            }
                                                        },
                                                    }
                                                },
                                                'as': 'matchedField',
                                                'in': '$$matchedField.value.value',
                                            }
                                        },
                                        0,
                                    ]
                                },
                                None,
                            ]
                        }
                    }
                },
                {'$sort': {'state__sort': -1}},
                {'$project': {'state__sort': 0}},
            ],
            id='state_desc',
        ),
        pytest.param(
            'priority',
            [
                {
                    '$addFields': {
                        'priority__sort': {
                            '$ifNull': [
                                {
                                    '$arrayElemAt': [
                                        {
                                            '$map': {
                                                'input': {
                                                    '$filter': {
                                                        'input': '$fields',
                                                        'as': 'field',
                                                        'cond': {
                                                            '$regexMatch': {
                                                                'input': '$$field.name',
                                                                'regex': '^priority$',
                                                                'options': 'i',
                                                            }
                                                        },
                                                    }
                                                },
                                                'as': 'matchedField',
                                                'in': '$$matchedField.value.value',
                                            }
                                        },
                                        0,
                                    ]
                                },
                                None,
                            ]
                        }
                    }
                },
                {'$sort': {'priority__sort': 1}},
                {'$project': {'priority__sort': 0}},
            ],
            id='priority_asc',
        ),
        pytest.param(
            'priority desc',
            [
                {
                    '$addFields': {
                        'priority__sort': {
                            '$ifNull': [
                                {
                                    '$arrayElemAt': [
                                        {
                                            '$map': {
                                                'input': {
                                                    '$filter': {
                                                        'input': '$fields',
                                                        'as': 'field',
                                                        'cond': {
                                                            '$regexMatch': {
                                                                'input': '$$field.name',
                                                                'regex': '^priority$',
                                                                'options': 'i',
                                                            }
                                                        },
                                                    }
                                                },
                                                'as': 'matchedField',
                                                'in': '$$matchedField.value.value',
                                            }
                                        },
                                        0,
                                    ]
                                },
                                None,
                            ]
                        }
                    }
                },
                {'$sort': {'priority__sort': -1}},
                {'$project': {'priority__sort': 0}},
            ],
            id='priority_desc',
        ),
        pytest.param(
            'integer',
            [
                {
                    '$addFields': {
                        'integer__sort': {
                            '$ifNull': [
                                {
                                    '$arrayElemAt': [
                                        {
                                            '$map': {
                                                'input': {
                                                    '$filter': {
                                                        'input': '$fields',
                                                        'as': 'field',
                                                        'cond': {
                                                            '$regexMatch': {
                                                                'input': '$$field.name',
                                                                'regex': '^integer$',
                                                                'options': 'i',
                                                            }
                                                        },
                                                    }
                                                },
                                                'as': 'matchedField',
                                                'in': '$$matchedField.value',
                                            }
                                        },
                                        0,
                                    ]
                                },
                                None,
                            ]
                        }
                    }
                },
                {'$sort': {'integer__sort': 1}},
                {'$project': {'integer__sort': 0}},
            ],
            id='integer_asc',
        ),
        pytest.param(
            'integer desc',
            [
                {
                    '$addFields': {
                        'integer__sort': {
                            '$ifNull': [
                                {
                                    '$arrayElemAt': [
                                        {
                                            '$map': {
                                                'input': {
                                                    '$filter': {
                                                        'input': '$fields',
                                                        'as': 'field',
                                                        'cond': {
                                                            '$regexMatch': {
                                                                'input': '$$field.name',
                                                                'regex': '^integer$',
                                                                'options': 'i',
                                                            }
                                                        },
                                                    }
                                                },
                                                'as': 'matchedField',
                                                'in': '$$matchedField.value',
                                            }
                                        },
                                        0,
                                    ]
                                },
                                None,
                            ]
                        }
                    }
                },
                {'$sort': {'integer__sort': -1}},
                {'$project': {'integer__sort': 0}},
            ],
            id='integer_desc',
        ),
        pytest.param(
            'float',
            [
                {
                    '$addFields': {
                        'float__sort': {
                            '$ifNull': [
                                {
                                    '$arrayElemAt': [
                                        {
                                            '$map': {
                                                'input': {
                                                    '$filter': {
                                                        'input': '$fields',
                                                        'as': 'field',
                                                        'cond': {
                                                            '$regexMatch': {
                                                                'input': '$$field.name',
                                                                'regex': '^float$',
                                                                'options': 'i',
                                                            }
                                                        },
                                                    }
                                                },
                                                'as': 'matchedField',
                                                'in': '$$matchedField.value',
                                            }
                                        },
                                        0,
                                    ]
                                },
                                None,
                            ]
                        }
                    }
                },
                {'$sort': {'float__sort': 1}},
                {'$project': {'float__sort': 0}},
            ],
            id='float_asc',
        ),
        pytest.param(
            'float desc',
            [
                {
                    '$addFields': {
                        'float__sort': {
                            '$ifNull': [
                                {
                                    '$arrayElemAt': [
                                        {
                                            '$map': {
                                                'input': {
                                                    '$filter': {
                                                        'input': '$fields',
                                                        'as': 'field',
                                                        'cond': {
                                                            '$regexMatch': {
                                                                'input': '$$field.name',
                                                                'regex': '^float$',
                                                                'options': 'i',
                                                            }
                                                        },
                                                    }
                                                },
                                                'as': 'matchedField',
                                                'in': '$$matchedField.value',
                                            }
                                        },
                                        0,
                                    ]
                                },
                                None,
                            ]
                        }
                    }
                },
                {'$sort': {'float__sort': -1}},
                {'$project': {'float__sort': 0}},
            ],
            id='float_desc',
        ),
        pytest.param(
            'date',
            [
                {
                    '$addFields': {
                        'date__sort': {
                            '$ifNull': [
                                {
                                    '$arrayElemAt': [
                                        {
                                            '$map': {
                                                'input': {
                                                    '$filter': {
                                                        'input': '$fields',
                                                        'as': 'field',
                                                        'cond': {
                                                            '$regexMatch': {
                                                                'input': '$$field.name',
                                                                'regex': '^date$',
                                                                'options': 'i',
                                                            }
                                                        },
                                                    }
                                                },
                                                'as': 'matchedField',
                                                'in': '$$matchedField.value',
                                            }
                                        },
                                        0,
                                    ]
                                },
                                None,
                            ]
                        }
                    }
                },
                {'$sort': {'date__sort': 1}},
                {'$project': {'date__sort': 0}},
            ],
            id='date_asc',
        ),
        pytest.param(
            'date desc',
            [
                {
                    '$addFields': {
                        'date__sort': {
                            '$ifNull': [
                                {
                                    '$arrayElemAt': [
                                        {
                                            '$map': {
                                                'input': {
                                                    '$filter': {
                                                        'input': '$fields',
                                                        'as': 'field',
                                                        'cond': {
                                                            '$regexMatch': {
                                                                'input': '$$field.name',
                                                                'regex': '^date$',
                                                                'options': 'i',
                                                            }
                                                        },
                                                    }
                                                },
                                                'as': 'matchedField',
                                                'in': '$$matchedField.value',
                                            }
                                        },
                                        0,
                                    ]
                                },
                                None,
                            ]
                        }
                    }
                },
                {'$sort': {'date__sort': -1}},
                {'$project': {'date__sort': 0}},
            ],
            id='date_desc',
        ),
        pytest.param(
            'datetime',
            [
                {
                    '$addFields': {
                        'datetime__sort': {
                            '$ifNull': [
                                {
                                    '$arrayElemAt': [
                                        {
                                            '$map': {
                                                'input': {
                                                    '$filter': {
                                                        'input': '$fields',
                                                        'as': 'field',
                                                        'cond': {
                                                            '$regexMatch': {
                                                                'input': '$$field.name',
                                                                'regex': '^datetime$',
                                                                'options': 'i',
                                                            }
                                                        },
                                                    }
                                                },
                                                'as': 'matchedField',
                                                'in': '$$matchedField.value',
                                            }
                                        },
                                        0,
                                    ]
                                },
                                None,
                            ]
                        }
                    }
                },
                {'$sort': {'datetime__sort': 1}},
                {'$project': {'datetime__sort': 0}},
            ],
            id='datetime_asc',
        ),
        pytest.param(
            'datetime desc',
            [
                {
                    '$addFields': {
                        'datetime__sort': {
                            '$ifNull': [
                                {
                                    '$arrayElemAt': [
                                        {
                                            '$map': {
                                                'input': {
                                                    '$filter': {
                                                        'input': '$fields',
                                                        'as': 'field',
                                                        'cond': {
                                                            '$regexMatch': {
                                                                'input': '$$field.name',
                                                                'regex': '^datetime$',
                                                                'options': 'i',
                                                            }
                                                        },
                                                    }
                                                },
                                                'as': 'matchedField',
                                                'in': '$$matchedField.value',
                                            }
                                        },
                                        0,
                                    ]
                                },
                                None,
                            ]
                        }
                    }
                },
                {'$sort': {'datetime__sort': -1}},
                {'$project': {'datetime__sort': 0}},
            ],
            id='datetime_desc',
        ),
        pytest.param(
            'string',
            [
                {
                    '$addFields': {
                        'string__sort': {
                            '$ifNull': [
                                {
                                    '$arrayElemAt': [
                                        {
                                            '$map': {
                                                'input': {
                                                    '$filter': {
                                                        'input': '$fields',
                                                        'as': 'field',
                                                        'cond': {
                                                            '$regexMatch': {
                                                                'input': '$$field.name',
                                                                'regex': '^string$',
                                                                'options': 'i',
                                                            }
                                                        },
                                                    }
                                                },
                                                'as': 'matchedField',
                                                'in': '$$matchedField.value',
                                            }
                                        },
                                        0,
                                    ]
                                },
                                None,
                            ]
                        }
                    }
                },
                {'$sort': {'string__sort': 1}},
                {'$project': {'string__sort': 0}},
            ],
            id='string_asc',
        ),
        pytest.param(
            'string desc',
            [
                {
                    '$addFields': {
                        'string__sort': {
                            '$ifNull': [
                                {
                                    '$arrayElemAt': [
                                        {
                                            '$map': {
                                                'input': {
                                                    '$filter': {
                                                        'input': '$fields',
                                                        'as': 'field',
                                                        'cond': {
                                                            '$regexMatch': {
                                                                'input': '$$field.name',
                                                                'regex': '^string$',
                                                                'options': 'i',
                                                            }
                                                        },
                                                    }
                                                },
                                                'as': 'matchedField',
                                                'in': '$$matchedField.value',
                                            }
                                        },
                                        0,
                                    ]
                                },
                                None,
                            ]
                        }
                    }
                },
                {'$sort': {'string__sort': -1}},
                {'$project': {'string__sort': 0}},
            ],
            id='string_desc',
        ),
        pytest.param(
            'assignee',
            [
                {
                    '$addFields': {
                        'assignee__sort': {
                            '$ifNull': [
                                {
                                    '$arrayElemAt': [
                                        {
                                            '$map': {
                                                'input': {
                                                    '$filter': {
                                                        'input': '$fields',
                                                        'as': 'field',
                                                        'cond': {
                                                            '$regexMatch': {
                                                                'input': '$$field.name',
                                                                'regex': '^assignee$',
                                                                'options': 'i',
                                                            }
                                                        },
                                                    }
                                                },
                                                'as': 'matchedField',
                                                'in': '$$matchedField.value.email',
                                            }
                                        },
                                        0,
                                    ]
                                },
                                None,
                            ]
                        }
                    }
                },
                {'$sort': {'assignee__sort': 1}},
                {'$project': {'assignee__sort': 0}},
            ],
            id='assignee_asc',
        ),
        pytest.param(
            'assignee desc',
            [
                {
                    '$addFields': {
                        'assignee__sort': {
                            '$ifNull': [
                                {
                                    '$arrayElemAt': [
                                        {
                                            '$map': {
                                                'input': {
                                                    '$filter': {
                                                        'input': '$fields',
                                                        'as': 'field',
                                                        'cond': {
                                                            '$regexMatch': {
                                                                'input': '$$field.name',
                                                                'regex': '^assignee$',
                                                                'options': 'i',
                                                            }
                                                        },
                                                    }
                                                },
                                                'as': 'matchedField',
                                                'in': '$$matchedField.value.email',
                                            }
                                        },
                                        0,
                                    ]
                                },
                                None,
                            ]
                        }
                    }
                },
                {'$sort': {'assignee__sort': -1}},
                {'$project': {'assignee__sort': 0}},
            ],
            id='assignee_desc',
        ),
        pytest.param(
            'version',
            [
                {
                    '$addFields': {
                        'version__sort': {
                            '$ifNull': [
                                {
                                    '$arrayElemAt': [
                                        {
                                            '$map': {
                                                'input': {
                                                    '$filter': {
                                                        'input': '$fields',
                                                        'as': 'field',
                                                        'cond': {
                                                            '$regexMatch': {
                                                                'input': '$$field.name',
                                                                'regex': '^version$',
                                                                'options': 'i',
                                                            }
                                                        },
                                                    }
                                                },
                                                'as': 'matchedField',
                                                'in': '$$matchedField.value.value',
                                            }
                                        },
                                        0,
                                    ]
                                },
                                None,
                            ]
                        }
                    }
                },
                {'$sort': {'version__sort': 1}},
                {'$project': {'version__sort': 0}},
            ],
            id='version_asc',
        ),
        pytest.param(
            'version desc',
            [
                {
                    '$addFields': {
                        'version__sort': {
                            '$ifNull': [
                                {
                                    '$arrayElemAt': [
                                        {
                                            '$map': {
                                                'input': {
                                                    '$filter': {
                                                        'input': '$fields',
                                                        'as': 'field',
                                                        'cond': {
                                                            '$regexMatch': {
                                                                'input': '$$field.name',
                                                                'regex': '^version$',
                                                                'options': 'i',
                                                            }
                                                        },
                                                    }
                                                },
                                                'as': 'matchedField',
                                                'in': '$$matchedField.value.value',
                                            }
                                        },
                                        0,
                                    ]
                                },
                                None,
                            ]
                        }
                    }
                },
                {'$sort': {'version__sort': -1}},
                {'$project': {'version__sort': 0}},
            ],
            id='version_desc',
        ),
        pytest.param(
            'boolean',
            [
                {
                    '$addFields': {
                        'boolean__sort': {
                            '$ifNull': [
                                {
                                    '$arrayElemAt': [
                                        {
                                            '$map': {
                                                'input': {
                                                    '$filter': {
                                                        'input': '$fields',
                                                        'as': 'field',
                                                        'cond': {
                                                            '$regexMatch': {
                                                                'input': '$$field.name',
                                                                'regex': '^boolean$',
                                                                'options': 'i',
                                                            }
                                                        },
                                                    }
                                                },
                                                'as': 'matchedField',
                                                'in': '$$matchedField.value',
                                            }
                                        },
                                        0,
                                    ]
                                },
                                None,
                            ]
                        }
                    }
                },
                {'$sort': {'boolean__sort': 1}},
                {'$project': {'boolean__sort': 0}},
            ],
            id='boolean_asc',
        ),
        pytest.param(
            'boolean desc',
            [
                {
                    '$addFields': {
                        'boolean__sort': {
                            '$ifNull': [
                                {
                                    '$arrayElemAt': [
                                        {
                                            '$map': {
                                                'input': {
                                                    '$filter': {
                                                        'input': '$fields',
                                                        'as': 'field',
                                                        'cond': {
                                                            '$regexMatch': {
                                                                'input': '$$field.name',
                                                                'regex': '^boolean$',
                                                                'options': 'i',
                                                            }
                                                        },
                                                    }
                                                },
                                                'as': 'matchedField',
                                                'in': '$$matchedField.value',
                                            }
                                        },
                                        0,
                                    ]
                                },
                                None,
                            ]
                        }
                    }
                },
                {'$sort': {'boolean__sort': -1}},
                {'$project': {'boolean__sort': 0}},
            ],
            id='boolean_desc',
        ),
        pytest.param(
            'h-state',
            [
                {
                    '$addFields': {
                        'h-state__sort': {
                            '$ifNull': [
                                {
                                    '$arrayElemAt': [
                                        {
                                            '$map': {
                                                'input': {
                                                    '$filter': {
                                                        'input': '$fields',
                                                        'as': 'field',
                                                        'cond': {
                                                            '$regexMatch': {
                                                                'input': '$$field.name',
                                                                'regex': '^h-state$',
                                                                'options': 'i',
                                                            }
                                                        },
                                                    }
                                                },
                                                'as': 'matchedField',
                                                'in': '$$matchedField.value.value',
                                            }
                                        },
                                        0,
                                    ]
                                },
                                None,
                            ]
                        }
                    }
                },
                {'$sort': {'h-state__sort': 1}},
                {'$project': {'h-state__sort': 0}},
            ],
            id='h-state_asc',
        ),
        pytest.param(
            'h-state desc',
            [
                {
                    '$addFields': {
                        'h-state__sort': {
                            '$ifNull': [
                                {
                                    '$arrayElemAt': [
                                        {
                                            '$map': {
                                                'input': {
                                                    '$filter': {
                                                        'input': '$fields',
                                                        'as': 'field',
                                                        'cond': {
                                                            '$regexMatch': {
                                                                'input': '$$field.name',
                                                                'regex': '^h-state$',
                                                                'options': 'i',
                                                            }
                                                        },
                                                    }
                                                },
                                                'as': 'matchedField',
                                                'in': '$$matchedField.value.value',
                                            }
                                        },
                                        0,
                                    ]
                                },
                                None,
                            ]
                        }
                    }
                },
                {'$sort': {'h-state__sort': -1}},
                {'$project': {'h-state__sort': 0}},
            ],
            id='h-state_desc',
        ),
        pytest.param(
            'INTEGER',
            [
                {
                    '$addFields': {
                        'integer__sort': {
                            '$ifNull': [
                                {
                                    '$arrayElemAt': [
                                        {
                                            '$map': {
                                                'input': {
                                                    '$filter': {
                                                        'input': '$fields',
                                                        'as': 'field',
                                                        'cond': {
                                                            '$regexMatch': {
                                                                'input': '$$field.name',
                                                                'regex': '^integer$',
                                                                'options': 'i',
                                                            }
                                                        },
                                                    }
                                                },
                                                'as': 'matchedField',
                                                'in': '$$matchedField.value',
                                            }
                                        },
                                        0,
                                    ]
                                },
                                None,
                            ]
                        }
                    }
                },
                {'$sort': {'integer__sort': 1}},
                {'$project': {'integer__sort': 0}},
            ],
            id='integer_uppercase',
        ),
        pytest.param(
            'project, id',
            [
                {'$sort': {'project.name': 1, '_id': 1}},
            ],
            id='multiple_builtin_fields',
        ),
        pytest.param(
            'project desc, id asc',
            [
                {'$sort': {'project.name': -1, '_id': 1}},
            ],
            id='multiple_builtin_with_direction',
        ),
        pytest.param(
            'string, project desc',
            [
                {
                    '$addFields': {
                        'string__sort': {
                            '$ifNull': [
                                {
                                    '$arrayElemAt': [
                                        {
                                            '$map': {
                                                'input': {
                                                    '$filter': {
                                                        'input': '$fields',
                                                        'as': 'field',
                                                        'cond': {
                                                            '$regexMatch': {
                                                                'input': '$$field.name',
                                                                'regex': '^string$',
                                                                'options': 'i',
                                                            }
                                                        },
                                                    }
                                                },
                                                'as': 'matchedField',
                                                'in': '$$matchedField.value',
                                            }
                                        },
                                        0,
                                    ]
                                },
                                None,
                            ]
                        }
                    }
                },
                {'$sort': {'string__sort': 1, 'project.name': -1}},
                {'$project': {'string__sort': 0}},
            ],
            id='custom_and_builtin_fields',
        ),
        pytest.param(
            'integer, string desc',
            [
                {
                    '$addFields': {
                        'integer__sort': {
                            '$ifNull': [
                                {
                                    '$arrayElemAt': [
                                        {
                                            '$map': {
                                                'input': {
                                                    '$filter': {
                                                        'input': '$fields',
                                                        'as': 'field',
                                                        'cond': {
                                                            '$regexMatch': {
                                                                'input': '$$field.name',
                                                                'regex': '^integer$',
                                                                'options': 'i',
                                                            }
                                                        },
                                                    }
                                                },
                                                'as': 'matchedField',
                                                'in': '$$matchedField.value',
                                            }
                                        },
                                        0,
                                    ]
                                },
                                None,
                            ]
                        },
                        'string__sort': {
                            '$ifNull': [
                                {
                                    '$arrayElemAt': [
                                        {
                                            '$map': {
                                                'input': {
                                                    '$filter': {
                                                        'input': '$fields',
                                                        'as': 'field',
                                                        'cond': {
                                                            '$regexMatch': {
                                                                'input': '$$field.name',
                                                                'regex': '^string$',
                                                                'options': 'i',
                                                            }
                                                        },
                                                    }
                                                },
                                                'as': 'matchedField',
                                                'in': '$$matchedField.value',
                                            }
                                        },
                                        0,
                                    ]
                                },
                                None,
                            ]
                        },
                    }
                },
                {'$sort': {'integer__sort': 1, 'string__sort': -1}},
                {'$project': {'integer__sort': 0, 'string__sort': 0}},
            ],
            id='multiple_custom_fields',
        ),
        pytest.param(
            'priority desc, assignee, created_at desc',
            [
                {
                    '$addFields': {
                        'priority__sort': {
                            '$ifNull': [
                                {
                                    '$arrayElemAt': [
                                        {
                                            '$map': {
                                                'input': {
                                                    '$filter': {
                                                        'input': '$fields',
                                                        'as': 'field',
                                                        'cond': {
                                                            '$regexMatch': {
                                                                'input': '$$field.name',
                                                                'regex': '^priority$',
                                                                'options': 'i',
                                                            }
                                                        },
                                                    }
                                                },
                                                'as': 'matchedField',
                                                'in': '$$matchedField.value.value',
                                            }
                                        },
                                        0,
                                    ]
                                },
                                None,
                            ]
                        },
                        'assignee__sort': {
                            '$ifNull': [
                                {
                                    '$arrayElemAt': [
                                        {
                                            '$map': {
                                                'input': {
                                                    '$filter': {
                                                        'input': '$fields',
                                                        'as': 'field',
                                                        'cond': {
                                                            '$regexMatch': {
                                                                'input': '$$field.name',
                                                                'regex': '^assignee$',
                                                                'options': 'i',
                                                            }
                                                        },
                                                    }
                                                },
                                                'as': 'matchedField',
                                                'in': '$$matchedField.value.email',
                                            }
                                        },
                                        0,
                                    ]
                                },
                                None,
                            ]
                        },
                    }
                },
                {
                    '$sort': {
                        'priority__sort': -1,
                        'assignee__sort': 1,
                        'created_at': -1,
                    }
                },
                {'$project': {'priority__sort': 0, 'assignee__sort': 0}},
            ],
            id='complex_multi_type_sort',
        ),
        pytest.param(
            'field name',
            [
                {
                    '$addFields': {
                        'field name__sort': {
                            '$ifNull': [
                                {
                                    '$arrayElemAt': [
                                        {
                                            '$map': {
                                                'input': {
                                                    '$filter': {
                                                        'input': '$fields',
                                                        'as': 'field',
                                                        'cond': {
                                                            '$regexMatch': {
                                                                'input': '$$field.name',
                                                                'regex': '^field name$',
                                                                'options': 'i',
                                                            }
                                                        },
                                                    }
                                                },
                                                'as': 'matchedField',
                                                'in': '$$matchedField.value',
                                            }
                                        },
                                        0,
                                    ]
                                },
                                None,
                            ]
                        }
                    }
                },
                {'$sort': {'field name__sort': 1}},
                {'$project': {'field name__sort': 0}},
            ],
            id='field_with_space',
        ),
        pytest.param(
            'state, priority desc, integer, float desc, date, string desc',
            [
                {
                    '$addFields': {
                        'state__sort': {
                            '$ifNull': [
                                {
                                    '$arrayElemAt': [
                                        {
                                            '$map': {
                                                'input': {
                                                    '$filter': {
                                                        'input': '$fields',
                                                        'as': 'field',
                                                        'cond': {
                                                            '$regexMatch': {
                                                                'input': '$$field.name',
                                                                'regex': '^state$',
                                                                'options': 'i',
                                                            }
                                                        },
                                                    }
                                                },
                                                'as': 'matchedField',
                                                'in': '$$matchedField.value.value',
                                            }
                                        },
                                        0,
                                    ]
                                },
                                None,
                            ]
                        },
                        'priority__sort': {
                            '$ifNull': [
                                {
                                    '$arrayElemAt': [
                                        {
                                            '$map': {
                                                'input': {
                                                    '$filter': {
                                                        'input': '$fields',
                                                        'as': 'field',
                                                        'cond': {
                                                            '$regexMatch': {
                                                                'input': '$$field.name',
                                                                'regex': '^priority$',
                                                                'options': 'i',
                                                            }
                                                        },
                                                    }
                                                },
                                                'as': 'matchedField',
                                                'in': '$$matchedField.value.value',
                                            }
                                        },
                                        0,
                                    ]
                                },
                                None,
                            ]
                        },
                        'integer__sort': {
                            '$ifNull': [
                                {
                                    '$arrayElemAt': [
                                        {
                                            '$map': {
                                                'input': {
                                                    '$filter': {
                                                        'input': '$fields',
                                                        'as': 'field',
                                                        'cond': {
                                                            '$regexMatch': {
                                                                'input': '$$field.name',
                                                                'regex': '^integer$',
                                                                'options': 'i',
                                                            }
                                                        },
                                                    }
                                                },
                                                'as': 'matchedField',
                                                'in': '$$matchedField.value',
                                            }
                                        },
                                        0,
                                    ]
                                },
                                None,
                            ]
                        },
                        'float__sort': {
                            '$ifNull': [
                                {
                                    '$arrayElemAt': [
                                        {
                                            '$map': {
                                                'input': {
                                                    '$filter': {
                                                        'input': '$fields',
                                                        'as': 'field',
                                                        'cond': {
                                                            '$regexMatch': {
                                                                'input': '$$field.name',
                                                                'regex': '^float$',
                                                                'options': 'i',
                                                            }
                                                        },
                                                    }
                                                },
                                                'as': 'matchedField',
                                                'in': '$$matchedField.value',
                                            }
                                        },
                                        0,
                                    ]
                                },
                                None,
                            ]
                        },
                        'date__sort': {
                            '$ifNull': [
                                {
                                    '$arrayElemAt': [
                                        {
                                            '$map': {
                                                'input': {
                                                    '$filter': {
                                                        'input': '$fields',
                                                        'as': 'field',
                                                        'cond': {
                                                            '$regexMatch': {
                                                                'input': '$$field.name',
                                                                'regex': '^date$',
                                                                'options': 'i',
                                                            }
                                                        },
                                                    }
                                                },
                                                'as': 'matchedField',
                                                'in': '$$matchedField.value',
                                            }
                                        },
                                        0,
                                    ]
                                },
                                None,
                            ]
                        },
                        'string__sort': {
                            '$ifNull': [
                                {
                                    '$arrayElemAt': [
                                        {
                                            '$map': {
                                                'input': {
                                                    '$filter': {
                                                        'input': '$fields',
                                                        'as': 'field',
                                                        'cond': {
                                                            '$regexMatch': {
                                                                'input': '$$field.name',
                                                                'regex': '^string$',
                                                                'options': 'i',
                                                            }
                                                        },
                                                    }
                                                },
                                                'as': 'matchedField',
                                                'in': '$$matchedField.value',
                                            }
                                        },
                                        0,
                                    ]
                                },
                                None,
                            ]
                        },
                    }
                },
                {
                    '$sort': {
                        'state__sort': 1,
                        'priority__sort': -1,
                        'integer__sort': 1,
                        'float__sort': -1,
                        'date__sort': 1,
                        'string__sort': -1,
                    }
                },
                {
                    '$project': {
                        'state__sort': 0,
                        'priority__sort': 0,
                        'integer__sort': 0,
                        'float__sort': 0,
                        'date__sort': 0,
                        'string__sort': 0,
                    }
                },
            ],
            id='many_fields_sorting',
        ),
        pytest.param(
            'PrIoRiTy DESC, StAtE',
            [
                {
                    '$addFields': {
                        'priority__sort': {
                            '$ifNull': [
                                {
                                    '$arrayElemAt': [
                                        {
                                            '$map': {
                                                'input': {
                                                    '$filter': {
                                                        'input': '$fields',
                                                        'as': 'field',
                                                        'cond': {
                                                            '$regexMatch': {
                                                                'input': '$$field.name',
                                                                'regex': '^priority$',
                                                                'options': 'i',
                                                            }
                                                        },
                                                    }
                                                },
                                                'as': 'matchedField',
                                                'in': '$$matchedField.value.value',
                                            }
                                        },
                                        0,
                                    ]
                                },
                                None,
                            ]
                        },
                        'state__sort': {
                            '$ifNull': [
                                {
                                    '$arrayElemAt': [
                                        {
                                            '$map': {
                                                'input': {
                                                    '$filter': {
                                                        'input': '$fields',
                                                        'as': 'field',
                                                        'cond': {
                                                            '$regexMatch': {
                                                                'input': '$$field.name',
                                                                'regex': '^state$',
                                                                'options': 'i',
                                                            }
                                                        },
                                                    }
                                                },
                                                'as': 'matchedField',
                                                'in': '$$matchedField.value.value',
                                            }
                                        },
                                        0,
                                    ]
                                },
                                None,
                            ]
                        },
                    }
                },
                {'$sort': {'priority__sort': -1, 'state__sort': 1}},
                {'$project': {'priority__sort': 0, 'state__sort': 0}},
            ],
            id='mixed_case_field_names',
        ),
        pytest.param(
            'state asc  ,  priority desc',
            'Field state asc not found',
            id='extra_spaces_around_commas',
        ),
        pytest.param(
            'state   asc  ,  priority  desc  ',
            'Field state   asc not found',
            id='extra_spaces',
        ),
        pytest.param(
            'unknown_field', 'Field unknown_field not found', id='unknown_field_error'
        ),
        pytest.param(',', 'Invalid sort expression', id='empty_comma_error'),
        pytest.param(
            'subject, nonexistent_field desc',
            'Field nonexistent_field not found',
            id='nonexistent_field_in_list_error',
        ),
        pytest.param('field,', 'Invalid sort expression', id='trailing_comma_error'),
        pytest.param(',field', 'Invalid sort expression', id='leading_comma_error'),
        pytest.param(
            'field invalid_direction',
            'Field field invalid_direction not found',
            id='invalid_direction_error',
        ),
        pytest.param(
            'field ascc', 'Field field ascc not found', id='typo_in_direction_error'
        ),
        pytest.param(
            'field descc', 'Field field descc not found', id='typo_in_desc_error'
        ),
        pytest.param(
            'priority multi',
            [
                {
                    '$addFields': {
                        'priority multi__sort': {
                            '$ifNull': [
                                {
                                    '$arrayElemAt': [
                                        {
                                            '$map': {
                                                'input': {
                                                    '$filter': {
                                                        'input': '$fields',
                                                        'as': 'field',
                                                        'cond': {
                                                            '$regexMatch': {
                                                                'input': '$$field.name',
                                                                'regex': '^priority multi$',
                                                                'options': 'i',
                                                            }
                                                        },
                                                    }
                                                },
                                                'as': 'matchedField',
                                                'in': '$$matchedField.value.value',
                                            }
                                        },
                                        0,
                                    ]
                                },
                                None,
                            ]
                        }
                    }
                },
                {'$sort': {'priority multi__sort': 1}},
                {'$project': {'priority multi__sort': 0}},
            ],
            id='enum_multi_asc',
        ),
        pytest.param(
            'priority multi desc',
            [
                {
                    '$addFields': {
                        'priority multi__sort': {
                            '$ifNull': [
                                {
                                    '$arrayElemAt': [
                                        {
                                            '$map': {
                                                'input': {
                                                    '$filter': {
                                                        'input': '$fields',
                                                        'as': 'field',
                                                        'cond': {
                                                            '$regexMatch': {
                                                                'input': '$$field.name',
                                                                'regex': '^priority multi$',
                                                                'options': 'i',
                                                            }
                                                        },
                                                    }
                                                },
                                                'as': 'matchedField',
                                                'in': '$$matchedField.value.value',
                                            }
                                        },
                                        0,
                                    ]
                                },
                                None,
                            ]
                        }
                    }
                },
                {'$sort': {'priority multi__sort': -1}},
                {'$project': {'priority multi__sort': 0}},
            ],
            id='enum_multi_desc',
        ),
        pytest.param(
            'version multi',
            [
                {
                    '$addFields': {
                        'version multi__sort': {
                            '$ifNull': [
                                {
                                    '$arrayElemAt': [
                                        {
                                            '$map': {
                                                'input': {
                                                    '$filter': {
                                                        'input': '$fields',
                                                        'as': 'field',
                                                        'cond': {
                                                            '$regexMatch': {
                                                                'input': '$$field.name',
                                                                'regex': '^version multi$',
                                                                'options': 'i',
                                                            }
                                                        },
                                                    }
                                                },
                                                'as': 'matchedField',
                                                'in': '$$matchedField.value.value',
                                            }
                                        },
                                        0,
                                    ]
                                },
                                None,
                            ]
                        }
                    }
                },
                {'$sort': {'version multi__sort': 1}},
                {'$project': {'version multi__sort': 0}},
            ],
            id='version_multi_asc',
        ),
        pytest.param(
            'version multi desc',
            [
                {
                    '$addFields': {
                        'version multi__sort': {
                            '$ifNull': [
                                {
                                    '$arrayElemAt': [
                                        {
                                            '$map': {
                                                'input': {
                                                    '$filter': {
                                                        'input': '$fields',
                                                        'as': 'field',
                                                        'cond': {
                                                            '$regexMatch': {
                                                                'input': '$$field.name',
                                                                'regex': '^version multi$',
                                                                'options': 'i',
                                                            }
                                                        },
                                                    }
                                                },
                                                'as': 'matchedField',
                                                'in': '$$matchedField.value.value',
                                            }
                                        },
                                        0,
                                    ]
                                },
                                None,
                            ]
                        }
                    }
                },
                {'$sort': {'version multi__sort': -1}},
                {'$project': {'version multi__sort': 0}},
            ],
            id='version_multi_desc',
        ),
        pytest.param(
            'assignee multi',
            [
                {
                    '$addFields': {
                        'assignee multi__sort': {
                            '$ifNull': [
                                {
                                    '$arrayElemAt': [
                                        {
                                            '$map': {
                                                'input': {
                                                    '$filter': {
                                                        'input': '$fields',
                                                        'as': 'field',
                                                        'cond': {
                                                            '$regexMatch': {
                                                                'input': '$$field.name',
                                                                'regex': '^assignee multi$',
                                                                'options': 'i',
                                                            }
                                                        },
                                                    }
                                                },
                                                'as': 'matchedField',
                                                'in': '$$matchedField.value.email',
                                            }
                                        },
                                        0,
                                    ]
                                },
                                None,
                            ]
                        }
                    }
                },
                {'$sort': {'assignee multi__sort': 1}},
                {'$project': {'assignee multi__sort': 0}},
            ],
            id='user_multi_asc',
        ),
        pytest.param(
            'assignee multi desc',
            [
                {
                    '$addFields': {
                        'assignee multi__sort': {
                            '$ifNull': [
                                {
                                    '$arrayElemAt': [
                                        {
                                            '$map': {
                                                'input': {
                                                    '$filter': {
                                                        'input': '$fields',
                                                        'as': 'field',
                                                        'cond': {
                                                            '$regexMatch': {
                                                                'input': '$$field.name',
                                                                'regex': '^assignee multi$',
                                                                'options': 'i',
                                                            }
                                                        },
                                                    }
                                                },
                                                'as': 'matchedField',
                                                'in': '$$matchedField.value.email',
                                            }
                                        },
                                        0,
                                    ]
                                },
                                None,
                            ]
                        }
                    }
                },
                {'$sort': {'assignee multi__sort': -1}},
                {'$project': {'assignee multi__sort': 0}},
            ],
            id='user_multi_desc',
        ),
        pytest.param(
            'date, date, date',
            [
                {
                    '$addFields': {
                        'date__sort': {
                            '$ifNull': [
                                {
                                    '$arrayElemAt': [
                                        {
                                            '$map': {
                                                'input': {
                                                    '$filter': {
                                                        'input': '$fields',
                                                        'as': 'field',
                                                        'cond': {
                                                            '$regexMatch': {
                                                                'input': '$$field.name',
                                                                'regex': '^date$',
                                                                'options': 'i',
                                                            }
                                                        },
                                                    }
                                                },
                                                'as': 'matchedField',
                                                'in': '$$matchedField.value',
                                            }
                                        },
                                        0,
                                    ]
                                },
                                None,
                            ]
                        }
                    }
                },
                {'$sort': {'date__sort': 1}},
                {'$project': {'date__sort': 0}},
            ],
            id='triple_same_field',
        ),
        pytest.param(
            'project asc, project desc',
            [{'$sort': {'project.name': -1}}],
            id='duplicate_with_different_order',
        ),
        pytest.param(
            'project, project desc, project asc',
            [{'$sort': {'project.name': 1}}],
            id='triple_duplicate_with_different_order',
        ),
    ],
)
async def test_sort_transformation(
    mock_get_custom_fields: mock.AsyncMock,
    sort_expr: str,
    expected: list[dict] | str,
) -> None:
    mock_get_custom_fields.return_value = _custom_fields()
    from pm.api.issue_query.sort import SortTransformError, transform_sort

    if isinstance(expected, str):
        with pytest.raises(SortTransformError) as exc_info:
            await transform_sort(sort_expr)
        assert str(exc_info.value) == expected
    else:
        res = await transform_sort(sort_expr)
        assert res == expected


@pytest.mark.asyncio
@pytest.mark.parametrize(
    'query, sort_expr, expected',
    [
        pytest.param('', '', ({}, []), id='empty_query_and_sort'),
        pytest.param(
            '',
            'project',
            ({}, [{'$sort': {'project.name': 1}}]),
            id='sort_only_project',
        ),
        pytest.param(
            '', 'id desc', ({}, [{'$sort': {'_id': -1}}]), id='sort_only_id_desc'
        ),
        pytest.param(
            'subject: Test',
            'project',
            (
                {'subject': {'$regex': 'Test', '$options': 'i'}},
                [{'$sort': {'project.name': 1}}],
            ),
            id='query_and_sort_basic',
        ),
        pytest.param(
            'subject: Test and #resolved',
            'created_at desc',
            (
                {
                    '$and': [
                        {'subject': {'$regex': 'Test', '$options': 'i'}},
                        {'resolved_at': {'$ne': None}},
                    ]
                },
                [{'$sort': {'created_at': -1}}],
            ),
            id='complex_query_with_sort',
        ),
        pytest.param(
            'state: open',
            'priority desc, created_at',
            (
                {
                    'fields': {
                        '$elemMatch': {
                            'name': {'$regex': '^state$', '$options': 'i'},
                            'value.value': 'open',
                        }
                    }
                },
                [
                    {
                        '$addFields': {
                            'priority__sort': {
                                '$ifNull': [
                                    {
                                        '$arrayElemAt': [
                                            {
                                                '$map': {
                                                    'input': {
                                                        '$filter': {
                                                            'input': '$fields',
                                                            'as': 'field',
                                                            'cond': {
                                                                '$regexMatch': {
                                                                    'input': '$$field.name',
                                                                    'regex': '^priority$',
                                                                    'options': 'i',
                                                                }
                                                            },
                                                        }
                                                    },
                                                    'as': 'matchedField',
                                                    'in': '$$matchedField.value.value',
                                                }
                                            },
                                            0,
                                        ]
                                    },
                                    None,
                                ]
                            }
                        }
                    },
                    {'$sort': {'priority__sort': -1, 'created_at': 1}},
                    {'$project': {'priority__sort': 0}},
                ],
            ),
            id='complex_search_and_sort',
        ),
    ],
)
async def test_search_transformation_with_sort(
    query: str,
    sort_expr: str,
    expected: tuple[dict, list],
) -> None:
    with (
        mock.patch(
            'pm.api.issue_query.search.get_custom_fields', new_callable=mock.AsyncMock
        ) as mock_search_cf,
        mock.patch(
            'pm.api.issue_query.sort.get_custom_fields', new_callable=mock.AsyncMock
        ) as mock_sort_cf,
    ):
        mock_search_cf.return_value = _custom_fields()
        mock_sort_cf.return_value = _custom_fields()
        from pm.api.issue_query import transform_query

        full_query = query
        if sort_expr:
            full_query = (
                f'{query} sort by: {sort_expr}' if query else f'sort by: {sort_expr}'
            )
        result = await transform_query(full_query)
        assert result == expected
