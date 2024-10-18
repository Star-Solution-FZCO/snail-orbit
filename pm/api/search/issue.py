from datetime import date, datetime
from typing import Any

from lark import Lark, Transformer, UnexpectedCharacters, UnexpectedEOF, UnexpectedToken

import pm.models as m

__all__ = (
    'transform_query',
    'TransformError',
)


GRAMMAR = """
    start: or_expression

    or_expression: and_expression (_OR and_expression)*
    and_expression: primary (_AND primary)*

    primary: attribute_condition
             | hashtag_value
             | _LEFT_BRACKET or_expression _RIGHT_BRACKET -> group_expr

    hashtag_value: HASHTAG_RESOLVED | HASHTAG_UNRESOLVED

    HASHTAG_RESOLVED: "#resolved"
    HASHTAG_UNRESOLVED: "#unresolved"

    attribute_condition: FIELD_NAME _COLON attribute_values

    attribute_values: NULL_VALUE
                    | NUMBER_VALUE
                    | DATE_VALUE
                    | DATETIME_VALUE
                    | user_value
                    | STRING_VALUE
                    | QUOTED_STRING
                    | number_range
                    | number_left_inf_range
                    | number_right_inf_range
                    | date_range
                    | date_left_inf_range
                    | date_right_inf_range
                    | datetime_range
                    | datetime_left_inf_range
                    | datetime_right_inf_range


    number_range: NUMBER_VALUE _RANGE_DELIMITER NUMBER_VALUE
    number_left_inf_range: INF_MINUS_VALUE _RANGE_DELIMITER NUMBER_VALUE
    number_right_inf_range: NUMBER_VALUE _RANGE_DELIMITER INF_PLUS_VALUE
    date_range: DATE_VALUE _RANGE_DELIMITER DATE_VALUE
    date_left_inf_range: INF_MINUS_VALUE _RANGE_DELIMITER DATE_VALUE
    date_right_inf_range: DATE_VALUE _RANGE_DELIMITER INF_PLUS_VALUE
    datetime_range: DATETIME_VALUE _RANGE_DELIMITER DATETIME_VALUE
    datetime_left_inf_range: INF_MINUS_VALUE _RANGE_DELIMITER DATETIME_VALUE
    datetime_right_inf_range: DATETIME_VALUE _RANGE_DELIMITER INF_PLUS_VALUE
    user_value: USER_ME | EMAIL

    _AND: "and"i
    _OR: "or"i
    _RANGE_DELIMITER: ".."
    _COLON: ":"
    _RIGHT_BRACKET: ")"
    _LEFT_BRACKET: "("
    USER_ME: "me"
    EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}/
    DATE_VALUE: /[0-9]{4}-[0-9]{2}-[0-9]{2}/
    DATETIME_VALUE: /[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}/
    NULL_VALUE: "null"
    INF_PLUS_VALUE: "inf"
    INF_MINUS_VALUE: "-inf"
    FIELD_NAME: /[a-zA-Z_0-9][a-zA-Z0-9_ ]*/
    NUMBER_VALUE: /[0-9]+(\\.[0-9]+)?/
    STRING_VALUE: /[^:()" ]+/
    QUOTED_STRING: /"[^"]*"/

    %import common.WS
    %ignore WS
"""


# noinspection PyMethodMayBeStatic, PyUnusedLocal, PyPep8Naming
class MongoQueryTransformer(Transformer):
    __current_user: str | None
    __cached_fields: dict

    def __fields_by_name(self, field_name: str) -> list[m.CustomField]:
        return self.__cached_fields.get(field_name, [])

    def __transform_single_field_value(self, field: m.CustomField, value: Any) -> dict:
        if field.type == m.CustomFieldTypeT.STATE:
            return {'value.state': value}
        if field.type in (m.CustomFieldTypeT.USER, m.CustomFieldTypeT.USER_MULTI):
            return {'value.email': value}
        if field.type in (m.CustomFieldTypeT.ENUM, m.CustomFieldTypeT.ENUM_MULTI):
            return {'value.value': value}
        if field.type in (m.CustomFieldTypeT.VERSION, m.CustomFieldTypeT.VERSION_MULTI):
            return {'value.version': value}
        return {'value': value}

    def __transform_field_value(self, field_name: str, value: Any) -> dict:
        if not (fields := self.__fields_by_name(field_name)):
            raise ValueError(f'Field {field_name} not found')
        if len(fields) == 1:
            return self.__transform_single_field_value(fields[0], value)
        return {
            '$or': [
                self.__transform_single_field_value(field, value) for field in fields
            ]
        }

    def __init__(self, current_user: str | None, cached_fields: dict):
        self.__current_user = current_user
        self.__cached_fields = cached_fields
        super().__init__()

    def or_expression(self, args):
        if len(args) == 1:
            return args[0]
        return {'$or': args}

    def and_expression(self, args):
        if len(args) == 1:
            return args[0]
        return {'$and': args}

    def group_expr(self, args):
        return args[0]

    def hashtag_value(self, args):
        val = args[0].value
        if val == '#resolved':
            return {
                'fields': {'$elemMatch': {'type': 'state', 'value.is_resolved': True}}
            }
        if val == '#unresolved':
            return {
                'fields': {'$elemMatch': {'type': 'state', 'value.is_resolved': False}}
            }

    def attribute_condition(self, args):
        field, value = args
        return {
            'fields': {
                '$elemMatch': {
                    'name': field,
                    **self.__transform_field_value(field, value),
                }
            }
        }

    def attribute_values(self, args):
        return args[0]

    def NULL_VALUE(self, token):
        return None

    def NUMBER_VALUE(self, token):
        return float(token.value)

    def DATE_VALUE(self, token):
        return date.fromisoformat(token.value)

    def DATETIME_VALUE(self, token):
        return datetime.fromisoformat(token.value)

    def user_value(self, args):
        if args[0] == 'me':
            return self.__current_user
        return args[0]

    def STRING_VALUE(self, token):
        return str(token.value)

    def QUOTED_STRING(self, token):
        return str(token.value).strip('"')

    def number_range(self, args):
        return {'$gte': args[0], '$lte': args[1]}

    def number_left_inf_range(self, args):
        return {'$lt': args[1]}

    def number_right_inf_range(self, args):
        return {'$gt': args[0]}

    def date_range(self, args):
        return {'$gte': args[0], '$lte': args[1]}

    def date_left_inf_range(self, args):
        return {'$lt': args[1]}

    def date_right_inf_range(self, args):
        return {'$gt': args[0]}

    def datetime_range(self, args):
        return {'$gte': args[0], '$lte': args[1]}

    def datetime_left_inf_range(self, args):
        return {'$lt': args[1]}

    def datetime_right_inf_range(self, args):
        return {'$gt': args[0]}

    def FIELD_NAME(self, token):
        return token.value

    def primary(self, args):
        return args[0]

    def start(self, args):
        return args[0]


class TransformError(Exception):
    message: str
    expected: set[str]
    position: int | None

    def __init__(
        self,
        message: str,
        position: int | None = None,
        expected: set[str] | None = None,
    ):
        self.message = message
        self.expected = expected or set()
        self.position = position
        super().__init__(message)


async def transform_query(q: str, current_user_email: str | None = None) -> dict:
    parser = Lark(GRAMMAR, parser='lalr', propagate_positions=True)
    try:
        tree = parser.parse(q)
        transformer = MongoQueryTransformer(
            current_user_email, cached_fields=await _get_custom_fields()
        )
        return transformer.transform(tree)
    except UnexpectedToken as err:
        raise TransformError(
            'Failed to parse query', position=err.pos_in_stream, expected=err.expected
        )
    except UnexpectedCharacters as err:
        raise TransformError('Failed to parse query', position=err.pos_in_stream)
    except UnexpectedEOF as err:
        raise TransformError('Failed to parse query', position=err.pos_in_stream)
    except ValueError as err:
        raise TransformError(str(err))


async def _get_custom_fields() -> dict:
    fields = await m.CustomField.find(with_children=True).to_list()
    res = {}
    for field in fields:
        if field.name not in res:
            res[field.name] = []
        res[field.name].append(field)
    return res
