import re
from datetime import date, datetime, time
from typing import Any

from dateutil.relativedelta import relativedelta
from lark import (
    Lark,
    Transformer,
    UnexpectedCharacters,
    UnexpectedEOF,
    UnexpectedToken,
)
from lark.exceptions import VisitError

import pm.models as m
from pm.api.search.parse_logical_expression import (
    BracketError,
    ExpressionNode,
    LogicalOperatorT,
    Node,
    OperatorError,
    OperatorNode,
    UnexpectedEndOfExpression,
    check_brackets,
    parse_logical_expression,
)
from pm.utils.dateutils import utcnow

__all__ = (
    'transform_query',
    'transform_text_search',
    'TransformError',
    'get_suggestions',
)

HASHTAG_VALUES = {'#resolved', '#unresolved'}
RESERVED_FIELDS = {
    'subject',
    'text',
    'project',
    'updated_at',
    'updated_by',
    'created_at',
    'created_by',
    'tag',
}

EXPRESSION_GRAMMAR = """
    start: attribute_condition | hashtag_value

    hashtag_value: HASHTAG_RESOLVED | HASHTAG_UNRESOLVED

    HASHTAG_RESOLVED: "#resolved"i
    HASHTAG_UNRESOLVED: "#unresolved"i

    attribute_condition: FIELD_NAME _COLON attribute_values

    attribute_values: NULL_VALUE
                    | NUMBER_VALUE
                    | DATE_VALUE
                    | DATETIME_VALUE
                    | relative_dt
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
                    | relative_dt_range
                    | relative_dt_left_inf_range
                    | relative_dt_right_inf_range


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
    
    relative_dt: dt_period_with_offset | dt_period
    dt_period_with_offset: (NOW_VALUE | TODAY_VALUE) (dt_offset)*
    dt_period: DATETIME_PERIOD_PREFIX DATETIME_PERIOD_UNIT
    dt_offset: SIGN DATETIME_OFFSET_VALUE
    relative_dt_range: relative_dt _RANGE_DELIMITER relative_dt
    relative_dt_left_inf_range: INF_MINUS_VALUE _RANGE_DELIMITER relative_dt
    relative_dt_right_inf_range: relative_dt _RANGE_DELIMITER INF_PLUS_VALUE

    _RANGE_DELIMITER.10: ".."
    _COLON: ":"
    USER_ME: "me"i
    EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/
    DATE_VALUE.2: /[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])/
    DATETIME_VALUE.3: /[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])T([01]\\d|2[0-3]):([0-5]\\d):([0-5]\\d)/
    NULL_VALUE: "null"i
    INF_PLUS_VALUE: "inf"i
    INF_MINUS_VALUE.1: "-inf"i
    FIELD_NAME: /[a-zA-Z_0-9][a-zA-Z0-9_ -]*/
    NUMBER_VALUE: /[0-9]+(\\.[0-9]+)?(?!\\.(?!\\.)|\\d|[a-zA-Z]|-)/
    STRING_VALUE: /[^:()" *${}]+/
    QUOTED_STRING: /"[^"]*"/
    SIGN: ("+" | "-")
    NOW_VALUE.9: "now"i
    TODAY_VALUE.9: "today"i
    DATETIME_PERIOD_PREFIX: "this"i
    DATETIME_PERIOD_UNIT: "week"i | "month"i | "year"i
    DATETIME_OFFSET_VALUE: /[0-9]+(\\.[5])?(?:h|d)(?![a-zA-Z0-9])/
    %import common.WS
    %ignore WS
"""


# pylint: disable=invalid-name, unused-argument
# noinspection PyMethodMayBeStatic, PyUnusedLocal, PyPep8Naming
class MongoQueryTransformer(Transformer):
    __current_user: str | None
    __cached_fields: dict[str, list[m.CustomField]]

    def __fields_by_name(self, field_name: str) -> list[m.CustomField]:
        return self.__cached_fields.get(field_name.lower(), [])

    def _transform_boolean_field_value(self, field: m.CustomField, value: Any) -> dict:
        if value is None:
            return {'value': None}
        if isinstance(value, str) and value.lower() in ['true', 'false']:
            return {'value': value.lower() == 'true'}
        raise ValueError(f'Field {field.name} must be either True or False')

    def __transform_single_field_value(self, field: m.CustomField, value: Any) -> dict:
        if field.type == m.CustomFieldTypeT.BOOLEAN:
            return self._transform_boolean_field_value(field, value)
        if field.type in (m.CustomFieldTypeT.USER, m.CustomFieldTypeT.USER_MULTI):
            return {'value.email': value}
        if field.type in (
            m.CustomFieldTypeT.STATE,
            m.CustomFieldTypeT.ENUM,
            m.CustomFieldTypeT.ENUM_MULTI,
            m.CustomFieldTypeT.VERSION,
            m.CustomFieldTypeT.VERSION_MULTI,
        ):
            return {'value.value': str(value) if value is not None else None}
        if field.type == m.CustomFieldTypeT.STRING:
            return {'value': str(value) if value is not None else None}
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

    def __init__(
        self, current_user: str | None, cached_fields: dict[str, list[m.CustomField]]
    ):
        self.__current_user = current_user
        self.__cached_fields = cached_fields
        super().__init__()

    def hashtag_value(self, args):
        val = args[0].value
        if val == '#resolved':
            return {
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
            }
        if val == '#unresolved':
            return {
                '$or': [
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
            }
        raise ValueError(f'Unknown hashtag value: {val}')

    def escape_regex(self, value: str) -> str:
        return re.escape(value)

    def attribute_condition(self, args):
        field, value = args
        if isinstance(value, str) and field in ('project', 'subject', 'tag'):
            value = self.escape_regex(value)
        if field == 'project':
            if value is None:
                return {'project.slug': None}
            return {'project.slug': {'$regex': f'^{value}$', '$options': 'i'}}
        if field == 'subject':
            if value is None:
                return {'subject': None}
            return {'subject': {'$regex': str(value), '$options': 'i'}}
        if field == 'text':
            if value is None:
                return {'text': None}
            return {'$text': {'$search': str(value)}}
        if field in ('updated_at', 'created_at'):
            if isinstance(value, date) and not isinstance(value, datetime):
                start_of_day = datetime.combine(value, time.min)
                now = utcnow()
                end_of_day_max = datetime.combine(value, time.max)
                if value <= now.date():
                    end_of_day = min(end_of_day_max, now)
                else:
                    end_of_day = end_of_day_max
                return {field: {'$gte': start_of_day, '$lte': end_of_day}}
            return {field: value}
        if field == 'tag':
            if value is None:
                return {'tags': []}
            return {'tags.name': {'$regex': f'^{value}$', '$options': 'i'}}
        if field in ('updated_by', 'created_by'):
            return {f'{field}.email': value}
        return {
            'fields': {
                '$elemMatch': {
                    'name': {'$regex': f'^{field.lower()}$', '$options': 'i'},
                    **self.__transform_field_value(field, value),
                }
            }
        }

    def dt_period_with_offset(self, args):
        dt_type = args[0]
        dt = utcnow()
        offsets = args[1:] if len(args) > 1 else []
        if offsets:
            for offset in offsets:
                amount, unit = offset
                dt = self._apply_dt_offset(dt, amount, unit)
        if dt_type == 'today':
            return {
                '$gte': datetime.combine(dt.date(), time.min),
                '$lte': datetime.combine(dt.date(), time.max),
            }
        if dt_type == 'now':
            return {
                '$gte': datetime.combine(
                    dt.date(),
                    time(dt.hour, dt.minute, time.min.second, time.min.microsecond),
                ),
                '$lte': datetime.combine(
                    dt.date(),
                    time(dt.hour, dt.minute, time.max.second, time.max.microsecond),
                ),
            }
        raise ValueError(f'Unsupported period: {dt_type}')

    def relative_dt(self, args):
        return args[0]

    def _transform_dt_unit(self, now, unit):
        if unit == 'week':
            start = now - relativedelta(days=now.weekday())
            end = start + relativedelta(days=6)
        elif unit == 'month':
            start = now.replace(day=1)
            end = (start + relativedelta(months=1)) - relativedelta(days=1)
        elif unit == 'year':
            start = now.replace(month=1, day=1)
            end = now.replace(month=12, day=31)
        else:
            raise ValueError(f'Unknown period unit: {unit}')
        start = datetime.combine(start.date(), time.min)
        end = datetime.combine(end.date(), time.max)
        return {'$gte': start, '$lte': end}

    def _apply_dt_offset(self, dtobj, number, unit):
        if unit == 'h':
            return dtobj + relativedelta(hours=number)
        if unit == 'd':
            return dtobj + relativedelta(days=number)
        raise ValueError(f'Unknown offset unit: {unit}')

    def dt_period(self, args):
        prefix = args[0]
        now = utcnow()
        if prefix == 'this':
            return self._transform_dt_unit(now, args[1])
        raise ValueError(f'Unknown period prefix: {prefix}')

    def dt_offset(self, args):
        amount, unit = args[1]
        if args[0].value == '-':
            amount = -amount
        return amount, unit

    def relative_dt_range(self, args):
        left_dt_range = args[0]
        right_dt_range = args[1]
        self._validate_range([left_dt_range['$gte'], right_dt_range['$lte']])
        return {'$gte': left_dt_range['$gte'], '$lte': right_dt_range['$lte']}

    def relative_dt_left_inf_range(self, args):
        dt_range = args[1]
        return {'$lt': dt_range['$lte']}

    def relative_dt_right_inf_range(self, args):
        dt_range = args[0]
        return {'$gt': dt_range['$gte']}

    def DATETIME_OFFSET_VALUE(self, token):
        return float(token[:-1]), token[-1]

    def TODAY_VALUE(self, token):
        return token.value

    def NOW_VALUE(self, token):
        return token.value

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
        if args[0] and args[0].lower() == 'me':
            return self.__current_user
        return args[0]

    def STRING_VALUE(self, token):
        return str(token.value)

    def QUOTED_STRING(self, token):
        return str(token.value).strip('"')

    def number_range(self, args):
        self._validate_range(args)
        return {'$gte': args[0], '$lte': args[1]}

    def number_left_inf_range(self, args):
        return {'$lt': args[1]}

    def number_right_inf_range(self, args):
        return {'$gt': args[0]}

    def date_range(self, args):
        self._validate_range(args)
        return {'$gte': args[0], '$lte': args[1]}

    def date_left_inf_range(self, args):
        return {'$lt': args[1]}

    def date_right_inf_range(self, args):
        return {'$gt': args[0]}

    def datetime_range(self, args):
        self._validate_range(args)
        return {'$gte': args[0], '$lte': args[1]}

    def datetime_left_inf_range(self, args):
        return {'$lt': args[1]}

    def datetime_right_inf_range(self, args):
        return {'$gt': args[0]}

    def FIELD_NAME(self, token):
        return str.strip(token.value)

    def EMAIL(self, token):
        return str(token.value)

    def start(self, args):
        return args[0]

    def _validate_range(self, args):
        if args[0] > args[1]:
            raise ValueError(
                'Field has invalid range: start value is greater than end value'
            )


class TransformError(Exception):
    message: str
    expected: set[str]
    position: int | None
    orig_exc: Exception | None

    def __init__(
        self,
        message: str,
        position: int | None = None,
        expected: set[str] | None = None,
        orig_exc: Exception | None = None,
    ):
        self.message = message
        self.expected = expected or set()
        self.position = position
        self.orig_exc = orig_exc
        super().__init__(message)


parser = Lark(EXPRESSION_GRAMMAR, parser='lalr', propagate_positions=False, cache=True)


async def transform_expression(
    expression: str,
    cached_fields: dict[str, list[m.CustomField]],
    current_user_email: str | None = None,
) -> dict:
    try:
        tree = parser.parse(expression)
        transformer = MongoQueryTransformer(
            current_user_email,
            cached_fields=cached_fields,
        )
        return transformer.transform(tree)
    except UnexpectedToken as err:
        raise TransformError(
            'Failed to parse query',
            position=err.pos_in_stream,
            expected=err.expected,
            orig_exc=err,
        ) from err
    except UnexpectedCharacters as err:
        raise TransformError(
            'Failed to parse query', position=err.pos_in_stream
        ) from err
    except UnexpectedEOF as err:
        raise TransformError(
            'Failed to parse query', position=err.pos_in_stream
        ) from err
    except ValueError as err:
        raise TransformError(str(err)) from err
    except VisitError as err:
        if isinstance(err.orig_exc, ValueError) and 'Field' in str(err.orig_exc):
            raise TransformError(str(err.orig_exc)) from err
        raise TransformError('Failed to parse query') from err


OPERATOR_MAP = {
    LogicalOperatorT.AND: '$and',
    LogicalOperatorT.OR: '$or',
}


def _check_mongo_text_exp_exceeded(query: dict) -> bool:
    count = 0
    stack = [query]
    while stack:
        current = stack.pop()
        if '$text' in current:
            count += 1
            if count > 1:
                return True
        for _, value in current.items():
            if isinstance(value, dict):
                stack.append(value)
            elif isinstance(value, list):
                stack.extend(item for item in value if isinstance(item, dict))
    return count > 1


async def _transform_tree_and_extract_context(
    node: Node,
    cached_fields: dict[str, list[m.CustomField]],
    current_user_email: str | None = None,
) -> dict:
    try:
        return await transform_expression(
            node.expression,
            cached_fields=cached_fields,
            current_user_email=current_user_email,
        )
    except TransformError as exc:
        orig_exc = getattr(exc, 'orig_exc', None)
        if orig_exc and isinstance(orig_exc, UnexpectedToken):
            if any(keyword in ('_COLON', 'FIELD_NAME') for keyword in exc.expected):
                return transform_text_search(node.expression)
            if exc.position > 0 and node.expression[exc.position - 1].isspace():
                whitespace_start = exc.position - 1
                while (
                    whitespace_start > 0
                    and node.expression[whitespace_start - 1].isspace()
                ):
                    whitespace_start -= 1
                orig_node_exp = node.expression[:whitespace_start].strip()
                context_part = node.expression[whitespace_start:].strip()
                result = await transform_expression(
                    orig_node_exp,
                    cached_fields=cached_fields,
                    current_user_email=current_user_email,
                )
                if context_part:
                    text_field_query = result.get('$text', {}).get('$search')
                    if text_field_query is not None:
                        result['$text']['$search'] += ' ' + context_part
                    else:
                        result['__context_search'] = context_part
                return result
            raise
        raise


async def _merge_nodes_with_context(
    left: dict, right: dict, operator: LogicalOperatorT
) -> dict:
    ctx = []
    for query in (left, right):
        if '__context_search' in query:
            ctx.append(query.pop('__context_search'))
    result = {OPERATOR_MAP[operator]: [left, right]}
    if ctx:
        result['__context_search'] = ' '.join(ctx)
    return result


async def transform_tree(
    node: Node,
    cached_fields: dict[str, list[m.CustomField]],
    current_user_email: str | None = None,
) -> dict:
    if isinstance(node, ExpressionNode):
        return await _transform_tree_and_extract_context(
            node, cached_fields, current_user_email
        )
    if isinstance(node, OperatorNode):
        left = await transform_tree(
            node.left,
            cached_fields=cached_fields,
            current_user_email=current_user_email,
        )
        right = await transform_tree(
            node.right,
            cached_fields=cached_fields,
            current_user_email=current_user_email,
        )
        return await _merge_nodes_with_context(left, right, node.operator)


async def transform_query(query: str, current_user_email: str | None = None) -> dict:
    try:
        check_brackets(query)
    except BracketError as err:
        if err.value:
            raise TransformError(
                f'Invalid bracket "{err.value}" at position {err.pos}',
                position=err.pos,
            ) from err
    try:
        tree = parse_logical_expression(query)
    except OperatorError as err:
        raise TransformError(
            f'Invalid operator "{err.operator}" at position {err.pos}',
            position=err.pos,
            expected=err.expected,
        ) from err
    except UnexpectedEndOfExpression as err:
        raise TransformError(str(err)) from err
    if not tree:
        return {}
    custom_fields = await _get_custom_fields()
    result = await transform_tree(
        tree, cached_fields=custom_fields, current_user_email=current_user_email
    )
    if result and '__context_search' in result:
        ctx = result.pop('__context_search')
        result = {'$and': [result, transform_text_search(ctx)]}
    if _check_mongo_text_exp_exceeded(result):
        raise TransformError('Failed to parse query')
    return result


def transform_text_search(search: str) -> dict:
    return {'$text': {'$search': search}}


async def get_suggestions(query: str, current_user_email: str | None = None) -> list:
    custom_fields = await _get_custom_fields()
    projects = await _get_projects()
    missing_closing_brackets = False
    try:
        check_brackets(query)
    except BracketError as err:
        if err.value:
            raise TransformError(
                f'Invalid bracket "{err.value}" at position {err.pos}',
                position=err.pos,
            ) from err
        missing_closing_brackets = True
    try:
        tree = parse_logical_expression(query)
    except OperatorError as err:
        if err.pos != len(query) - 1:
            raise TransformError(
                f'Invalid operator "{err.operator}" at position {err.pos}',
                position=err.pos,
                expected=err.expected,
            ) from err
        return list(_transform_expected(err.expected, custom_fields))
    except UnexpectedEndOfExpression as err:
        return list(_transform_expected(err.expected, custom_fields))
    if not tree:
        return ['(', *custom_fields.keys(), *HASHTAG_VALUES, *RESERVED_FIELDS]
    last_expression_token = tree.get_last_token()
    if not isinstance(last_expression_token, ExpressionNode):
        return []

    try:
        await transform_expression(
            last_expression_token.expression,
            cached_fields=custom_fields,
            current_user_email=current_user_email,
        )
    except TransformError as err:
        if last_expression_token.expression.startswith('#'):
            return [
                hash_val[len(last_expression_token.expression) :]
                for hash_val in HASHTAG_VALUES
                if hash_val.startswith(last_expression_token.expression)
            ]
        if '_COLON' in err.expected:
            suggestions = set()
            for field in custom_fields:
                if field == last_expression_token.expression.lower():
                    suggestions.add(':')
                    continue
                if field.startswith(last_expression_token.expression.lower()):
                    suggestions.add(field[len(last_expression_token.expression) - 1 :])
            return list(suggestions)
        if 'NULL_VALUE' in err.expected:
            field_name = last_expression_token.expression.split(':')[0].strip()
            return list(get_field_possible_values(field_name, custom_fields, projects))
        if 'DATETIME_PERIOD_UNIT' in err.expected:
            field_name, val = map(
                str.strip, last_expression_token.expression.split(':', maxsplit=1)
            )
            possible_values = get_field_possible_values(
                field_name, custom_fields, projects
            )
            return [
                val_[len(val) :].strip()
                for val_ in possible_values
                if val_.startswith(val)
            ]
        return []
    if last_expression_token.expression not in HASHTAG_VALUES:
        field_name, val = map(
            str.strip, last_expression_token.expression.split(':', maxsplit=1)
        )
        possible_values = get_field_possible_values(field_name, custom_fields, projects)
        if not possible_values or val in possible_values:
            return ['AND', 'OR'] + ([')'] if missing_closing_brackets else [])
        return [val_[len(val) :] for val_ in possible_values if val_.startswith(val)]
    return ['AND', 'OR'] + ([')'] if missing_closing_brackets else [])


def _transform_expected(
    expected: set[str], custom_fields: dict[str, list[m.CustomField]]
) -> set[str]:
    res = set()
    for exp in expected:
        if exp == 'expression':
            res.update(custom_fields.keys())
            res.update(RESERVED_FIELDS)
            res.update(HASHTAG_VALUES)
            continue
        res.add(exp.upper())
    return res


# todo: store in redis cache with ttl
async def _get_custom_fields() -> dict[str, list[m.CustomField]]:
    fields = await m.CustomField.find(with_children=True).to_list()
    res = {}
    for field in fields:
        res.setdefault(field.name.lower(), []).append(field)
    return res


# todo: store in redis cache with ttl
async def _get_projects() -> dict[str, list[m.Project]]:
    projects = await m.Project.find().to_list()
    res = {}
    for project in projects:
        res.setdefault(project.slug.lower(), []).append(project)
    return res


RELATIVE_DATETIME_VALUES = {'now', 'today', 'this week', 'this month', 'this year'}


def get_field_possible_values(
    field_name: str,
    fields: dict[str, list[m.CustomField]],
    projects: dict[str, list[m.Project]],
) -> set[str]:
    results = set()
    field_name = field_name.lower()
    if field_name in (
        'subject',
        'text',
        'updated_at',
        'created_at',
        'updated_by',
        'created_by',
        'tag',
    ):
        if field_name in ('updated_at', 'created_at'):
            results.update(RELATIVE_DATETIME_VALUES)
        return results
    if field_name == 'project':
        return set(projects.keys())
    if field_name not in fields:
        return results
    for field in fields[field_name]:
        if field.is_nullable:
            results.add('null')
        if field.type in (
            m.CustomFieldTypeT.STATE,
            m.CustomFieldTypeT.ENUM,
            m.CustomFieldTypeT.ENUM_MULTI,
            m.CustomFieldTypeT.VERSION,
            m.CustomFieldTypeT.VERSION_MULTI,
        ):
            results.update([option.value for option in field.options])
            continue
        if field.type in (m.CustomFieldTypeT.USER, m.CustomFieldTypeT.USER_MULTI):
            results.update([user.email for user in field.users])
            continue
        if field.type in (m.CustomFieldTypeT.DATE, m.CustomFieldTypeT.DATETIME):
            results.update(RELATIVE_DATETIME_VALUES)
            continue
    return results
