from collections.abc import Mapping, Sequence
from typing import TYPE_CHECKING, Any, get_args

import beanie.operators as bo
import pyparsing as pp
from beanie import Document

if TYPE_CHECKING:
    from beanie.odm.operators.find.array import BaseFindOperator
    from pydantic.fields import FieldInfo


__all__ = (
    'parse_filter',
    'parse_sort',
)


AVAILABLE_OPERATORS = [
    'eq',
    'ne',
    'in',
    'nin',
    'lt',
    'lte',
    'gt',
    'gte',
    'contains',
    'icontains',
    'startswith',
    'endswith',
]
AVAILABLE_OPERATORS_STRING = ' '.join(AVAILABLE_OPERATORS)
OPERATOR_TO_TYPE = {
    'list': {
        'in': bo.In,
        'nin': bo.NotIn,
        'default': bo.Eq,
    },
    'int': {
        'eq': bo.Eq,
        'ne': bo.NE,
        'lt': bo.LT,
        'lte': bo.LTE,
        'gt': bo.GT,
        'gte': bo.GTE,
        'in': bo.In,
        'nin': bo.NotIn,
        'default': bo.Eq,
    },
    'float': {
        'eq': bo.Eq,
        'ne': bo.NE,
        'lt': bo.LT,
        'lte': bo.LTE,
        'gt': bo.GT,
        'gte': bo.GTE,
        'in': bo.In,
        'nin': bo.NotIn,
        'default': bo.Eq,
    },
    'str': {
        'contains': lambda f, s: bo.RegEx(f, rf'.*{s}.*'),
        'icontains': lambda f, s: bo.RegEx(f, rf'.*{s}.*', 'i'),
        'startswith': lambda f, s: bo.RegEx(f, rf'^{s}.*'),
        'endswith': lambda f, s: bo.RegEx(f, rf'.*{s}$'),
        'ne': bo.NE,
        'eq': bo.Eq,
        'in': bo.In,
        'nin': bo.NotIn,
        'default': bo.Eq,
    },
}


class BinOp:
    operands: list

    def __init__(self, tokens: pp.ParseResults) -> None:
        self.operands = tokens[0][::2]


class AndOp(BinOp):
    pass


class OrOp(BinOp):
    pass


class NotOp:
    operand: Any

    def __init__(self, tokens: pp.ParseResults) -> None:
        self.operand = tokens[0][1]


FIELD_PART = pp.Group(
    pp.Word(pp.alphanums) + pp.ZeroOrMore(pp.Char('_') + pp.Word(pp.alphanums)),
).setResultsName('field_part')

FIELD_NAME = FIELD_PART + pp.Optional(pp.OneOrMore(pp.Suppress('__') + FIELD_PART))


FILTER_EXPRESSION = pp.Group(
    FIELD_NAME
    + pp.Optional(
        pp.Group(
            pp.Suppress('___') + pp.oneOf(AVAILABLE_OPERATORS_STRING),
        ).setResultsName('operator'),
    )
    + pp.Suppress(':')
    + pp.Group(
        pp.DelimitedList(pp.QuotedString('"') | pp.Word(pp.alphanums + '.')),
    ).setResultsName('value'),
)


FILTER_STRING = pp.infixNotation(
    FILTER_EXPRESSION,
    [
        (pp.Keyword('not', caseless=True), 1, pp.opAssoc.RIGHT, NotOp),
        (pp.Keyword('and', caseless=True), 2, pp.opAssoc.LEFT, AndOp),
        (pp.Keyword('or', caseless=True), 2, pp.opAssoc.LEFT, OrOp),
    ],
)


SORT_EXPRESSION = pp.Group(FIELD_NAME).setResultsName('asc_field') | pp.Group(
    pp.Suppress('-') + FIELD_NAME,
).setResultsName('desc_field')

SORT_STRING = pp.DelimitedList(SORT_EXPRESSION)


def convert_value(value: Any, inner_type: type) -> Any:
    if isinstance(value, list):
        return [convert_value(v, inner_type) for v in value]
    if inner_type is bool:
        return str(value).lower() not in ('false', '0')
    try:
        return inner_type(value)
    except TypeError:
        return value


def get_operator(
    field_name: str,
    field_type: 'FieldInfo',
    value: Any,
    operator: str | None = None,
) -> 'BaseFindOperator':
    outer = field_type.annotation
    inner = args_[0] if (args_ := get_args(outer)) else outer
    cls_name = outer.__name__
    value = convert_value(value, inner)
    if operator is None:
        if str.lower(cls_name) not in OPERATOR_TO_TYPE:
            return bo.Eq(field_name, value)
        operator = 'default'
    if str.lower(cls_name) not in OPERATOR_TO_TYPE:
        raise ValueError(f'unknown class name {cls_name}')
    try:
        op_cls = OPERATOR_TO_TYPE[str.lower(cls_name)][operator]
    except KeyError as err:
        raise ValueError(f'invalid operator {operator} for {field_name}') from err
    return op_cls(field_name, value)


def get_available_field(
    field_parts: list[str],
    model: type[Document],
    available_fields: Sequence[str] | None = None,
) -> tuple[str, Any]:
    if not field_parts:
        raise ValueError('empty field')
    field_name = '.'.join(field_parts)
    field_name_dash = '__'.join(field_parts)
    if (
        available_fields
        and field_name not in available_fields
        and field_name_dash not in available_fields
    ):
        raise PermissionError(f'You cannot search by field {field_name}')
    try:
        field = model.model_fields[field_parts[0]]
    except KeyError as err:
        raise PermissionError(
            f'You cannot search by this field "{field_name}"'
        ) from err
    return field_name, field


def transform_filter_expression(
    part: pp.ParseResults,
    model: type[Document],
    available_fields: Sequence[str] | None = None,
) -> 'BaseFindOperator':
    field_parts: list[str] = [''.join(part[0])]
    value = None
    operator = None
    for p in part[1:]:
        if p.get_name() == 'field_part':
            field_parts += [''.join(p)]
        if p.get_name() == 'operator':
            operator = ''.join(p)
        if p.get_name() == 'value':
            value = list(p) if len(p) > 1 else ''.join(p)
    field_name, field = get_available_field(field_parts, model, available_fields)
    return get_operator(field_name, field, value, operator)


def transform_filter(
    parsed: pp.ParseResults,
    model: type[Document],
    available_fields: Sequence[str] | None = None,
    not_: bool = False,
) -> Mapping[str, Any]:
    if isinstance(parsed, OrOp):
        op_ = bo.Nor if not_ else bo.Or
        return op_(
            *(
                transform_filter(part, model, available_fields)
                for part in parsed.operands
            ),
        )
    if isinstance(parsed, AndOp):
        if not_:
            return bo.Or(
                *(
                    transform_filter(part, model, available_fields, not_=True)
                    for part in parsed.operands
                ),
            )
        return bo.And(
            *(
                transform_filter(part, model, available_fields)
                for part in parsed.operands
            ),
        )
    if isinstance(parsed, NotOp):
        return transform_filter(parsed.operand, model, available_fields, not_=not not_)
    parsed_expression = transform_filter_expression(parsed, model, available_fields)
    return bo.Not(parsed_expression) if not_ else parsed_expression


def transform_sort_expression(
    part: pp.ParseResults,
    model: type[Document],
    available_fields: Sequence[str] | None = None,
) -> str:
    direction = '-' if part.get_name() == 'desc_field' else ''
    field_parts: list[str] = [''.join(p) for p in part]
    field_name, _ = get_available_field(field_parts, model, available_fields)
    return direction + field_name


def transform_sort(
    parsed: pp.ParseResults,
    model: type[Document],
    available_fields: Sequence[str] | None = None,
) -> list[str]:
    return [transform_sort_expression(part, model, available_fields) for part in parsed]


def parse_filter(
    model: type[Document],
    query: str,
    available_fields: Sequence[str] | None = None,
) -> Mapping[str, Any]:
    if not query:
        return {}
    return transform_filter(
        FILTER_STRING.parse_string(query, False)[0],
        model,
        available_fields,
    )


def parse_sort(
    model: type[Document],
    query: str,
    available_fields: Sequence[str] | None = None,
) -> list[str]:
    if not query:
        return []
    return transform_sort(
        SORT_STRING.parse_string(query, False),
        model,
        available_fields,
    )
