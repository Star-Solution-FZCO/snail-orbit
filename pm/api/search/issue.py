from datetime import date, datetime
from typing import Any

import pyparsing as pp

__all__ = ('transform_query',)


class ValueNode:
    value: str

    def __init__(self, tokens: pp.ParseResults) -> None:
        self.value = tokens[0]


SimpleValue = pp.Word(pp.alphanums + '_-')
ComplexValue = pp.Suppress('{') + pp.Word(pp.alphanums + '_- ') + pp.Suppress('}')
SimpleValue.addParseAction(ValueNode)
ComplexValue.addParseAction(ValueNode)
Value = ComplexValue | SimpleValue


class NegativeSingleValueNode:
    value: ValueNode

    def __init__(self, tokens: pp.ParseResults) -> None:
        self.value = tokens[1]


class PositiveSingleValueNode:
    value: str

    def __init__(self, tokens: pp.ParseResults) -> None:
        self.value = tokens[1]


PositiveSingleValue = pp.Literal('#') + Value
NegativeSingleValue = pp.Literal('-') + Value
PositiveSingleValue.setParseAction(PositiveSingleValueNode)
NegativeSingleValue.setParseAction(NegativeSingleValueNode)


class ValueRangeNode:
    start: ValueNode
    end: ValueNode

    def __init__(self, tokens: pp.ParseResults) -> None:
        self.start = tokens[0]
        self.end = tokens[1]


ValueRange = Value + pp.Suppress(pp.Literal('..')) + Value
ValueRange.addParseAction(ValueRangeNode)

Attribute = pp.Word(pp.alphanums + '_')
AttributeFilter = (
    pp.Optional(pp.Literal('-'), default='+') + (Value | ValueRange)
) | pp.Forward()


class CategorizedFilterNode:
    attribute: str
    filters: list[tuple[bool, ValueNode | ValueRangeNode]]

    def __init__(self, tokens: pp.ParseResults) -> None:
        self.attribute = tokens[0]
        self.filters = []
        for i in range(2, len(tokens), 2):
            self.filters.append((tokens[i - 1] == '+', tokens[i]))

    @property
    def __attribute_arg(self) -> str:
        if self.attribute in ('subject', 'text'):
            return self.attribute
        if self.attribute == 'project':
            return 'fields.project.slug'
        return f'fields.{self.attribute}.value'

    @staticmethod
    def __transform_value(val: ValueNode) -> Any:
        if val.value == 'null':
            return None
        try:
            return int(val.value)
        except ValueError:
            pass
        try:
            return float(val.value)
        except ValueError:
            pass
        try:
            return datetime.fromisoformat(val.value)
        except ValueError:
            pass
        return val.value

    def to_mongo(self):
        def _include_to_mongo(val: ValueNode | ValueRangeNode) -> dict:
            if isinstance(val, ValueNode):
                return {'$eq': self.__transform_value(value)}
            return {
                '$gte': self.__transform_value(value.start),
                '$lte': self.__transform_value(value.end),
            }

        def _exclude_to_mongo(val: ValueNode | ValueRangeNode) -> dict:
            if isinstance(val, ValueNode):
                return {'$ne': self.__transform_value(value)}
            return {
                '$lt': self.__transform_value(value.start),
                '$gt': self.__transform_value(value.end),
            }

        include = []
        exclude = []
        for is_positive, value in self.filters:
            if is_positive:
                include.append({self.__attribute_arg: _include_to_mongo(value)})
            else:
                exclude.append({self.__attribute_arg: _exclude_to_mongo(value)})
        results = []
        if include:
            results.append({'$or': include} if len(include) > 1 else include[0])
        if exclude:
            results.append({'$and': exclude} if len(exclude) > 1 else exclude[0])

        if len(results) == 2:
            return {'$and': results}
        return results[0]


CategorizedFilter = (
    Attribute
    + pp.Suppress(pp.Literal(':'))
    + pp.delimitedList(AttributeFilter, delim=',')
)
CategorizedFilter.addParseAction(CategorizedFilterNode)


class HasNode:
    attributes: list[str]

    def __init__(self, tokens: pp.ParseResults) -> None:
        self.attributes = tokens.asList()


Has = pp.Suppress(pp.Literal('has:')) + pp.delimitedList(Attribute, delim=',')
Has.addParseAction(HasNode)


Term = PositiveSingleValue | NegativeSingleValue | Has | CategorizedFilter
TermNodeT = (
    NegativeSingleValueNode | PositiveSingleValueNode | CategorizedFilterNode | HasNode
)

SortAttribute = Attribute
SortField = pp.Group(
    SortAttribute + pp.Optional(pp.Literal('asc') | pp.Literal('desc'), default='asc')
)
Sort = pp.Group(
    pp.Suppress(pp.Literal('sort by:')) + pp.delimitedList(SortField, delim=',')
)


class BinOp:
    operator: str
    operands: list

    def __init__(self, tokens: pp.ParseResults) -> None:
        self.operator = tokens[0][1]
        self.operands = tokens[0][::2]

    @property
    def mongo_operator(self):
        return f'${self.operator}'


SearchRequest = pp.infixNotation(
    Term,
    [
        (pp.Literal('and'), 2, pp.opAssoc.LEFT, BinOp),
        (pp.Literal('or'), 2, pp.opAssoc.LEFT, BinOp),
    ],
) + pp.Optional(Sort)


def transform_parse_results(parsed: TermNodeT) -> dict:
    if isinstance(parsed, HasNode):
        return {attr: {'$exists': True} for attr in parsed.attributes}
    if isinstance(parsed, CategorizedFilterNode):
        return parsed.to_mongo()
    if isinstance(parsed, PositiveSingleValueNode):
        return {}
    if isinstance(parsed, NegativeSingleValueNode):
        return {}
    raise ValueError(f'Unknown node type: {type(parsed)}')


def transform(parsed: TermNodeT | BinOp) -> dict:
    if isinstance(parsed, BinOp):
        return {parsed.mongo_operator: [transform(part) for part in parsed.operands]}
    return transform_parse_results(parsed)


def transform_sort(parsed: pp.ParseResults) -> list[str]:
    def _direction_prefix(direction: str):
        return '-' if direction == 'desc' else '+'

    return [f'{_direction_prefix(part[1])}{part[0]}' for part in parsed]


def transform_query(query: str) -> tuple[dict, list[str]]:
    result = SearchRequest.parseString(query)
    return transform(result[0]), transform_sort(result[1]) if len(result) > 1 else []
