from lark import (
    Lark,
    Transformer,
    UnexpectedCharacters,
    UnexpectedEOF,
    UnexpectedToken,
)

import pm.models as m

from ._base import IssueQueryTransformError, get_custom_fields

__all__ = (
    'transform_sort',
    'SortTransformError',
)


SORT_GRAMMAR = """
    start: sort_expression ("," sort_expression)*

    sort_expression: FIELD_NAME [direction]

    direction: "asc"i -> ascending
             | "desc"i -> descending

    FIELD_NAME: /[a-zA-Z_0-9][a-zA-Z0-9_ -]*/

    %import common.WS
    %ignore WS
"""


class SortTransformError(IssueQueryTransformError):
    pass


# pylint: disable=invalid-name, unused-argument
# noinspection PyMethodMayBeStatic, PyUnusedLocal, PyPep8Naming
class SortTransformer(Transformer):
    def __init__(self):
        super().__init__()

    def sort_expression(self, args):
        return args[0], bool(args[1])

    def ascending(self, _):
        return False

    def descending(self, _):
        return True

    def FIELD_NAME(self, token):
        return str.strip(token.value)

    def start(self, args):
        return args


parser = Lark(SORT_GRAMMAR, lexer='dynamic_complete')


def map_value_subfield(field_type: m.CustomFieldTypeT) -> str:
    if field_type in (m.CustomFieldTypeT.USER, m.CustomFieldTypeT.USER_MULTI):
        return 'value.email'
    if field_type in (
        m.CustomFieldTypeT.ENUM,
        m.CustomFieldTypeT.ENUM_MULTI,
        m.CustomFieldTypeT,
        m.CustomFieldTypeT.STATE,
        m.CustomFieldTypeT.VERSION,
        m.CustomFieldTypeT.VERSION_MULTI,
    ):
        return 'value.value'
    return 'value'


def _gen_sort_field(
    field_name: str,
    custom_fields: dict[str, m.CustomFieldTypeT],
) -> dict:
    if not (field_type := custom_fields.get(field_name.lower())):
        raise SortTransformError(f'Field {field_name} not found')
    return {
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
                                            'regex': f'^{field_name.lower()}$',
                                            'options': 'i',
                                        }
                                    },
                                }
                            },
                            'as': 'matchedField',
                            'in': f'$$matchedField.{map_value_subfield(field_type)}',
                        }
                    },
                    0,
                ]
            },
            None,
        ]
    }


async def transform_sort(
    sort_expr: str,
) -> list:
    if not sort_expr:
        return []
    try:
        tree = parser.parse(sort_expr)
        transformer = SortTransformer()
        fields: list[tuple[str, bool]] = transformer.transform(tree)
    except (UnexpectedToken, UnexpectedCharacters, UnexpectedEOF) as err:
        raise SortTransformError(
            message='Invalid sort expression',
        ) from err
    if not fields:
        return []

    custom_fields = await get_custom_fields()

    return [
        {
            '$addFields': {
                f'{field}__sort': _gen_sort_field(field, custom_fields=custom_fields),
            }
        }
        for field, _ in fields
    ] + [
        {
            '$sort': {
                f'{field}__sort': -1 if is_descending else 1
                for field, is_descending in fields
            }
        },
        {'$project': {f'{field}__sort': 0 for field, _ in fields}},
    ]
