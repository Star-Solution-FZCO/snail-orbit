import re
from abc import ABC, abstractmethod
from collections.abc import Callable
from enum import StrEnum

__all__ = (
    'BracketError',
    'ExpressionNode',
    'LogicalOperatorT',
    'Node',
    'OperatorError',
    'OperatorNode',
    'UnexpectedEndOfExpressionError',
    'check_brackets',
    'parse_logical_expression',
)

OPERATOR_PATTERN = re.compile(r'\b(and|or)\b', re.IGNORECASE)


class LogicalOperatorT(StrEnum):
    AND = 'and'
    OR = 'or'


class Node(ABC):
    @abstractmethod
    def get_last_token(self) -> 'Node':
        pass

    @abstractmethod
    def print_tree(self, print_fn: Callable[[str], None], level: int = 0) -> None:
        pass


class OperatorNode(Node):
    operator: LogicalOperatorT
    left: Node
    right: Node

    def __init__(self, operator: LogicalOperatorT, left: Node, right: Node) -> None:
        self.operator = operator
        self.left = left
        self.right = right

    def __repr__(self) -> str:
        return f'({self.left} {self.operator} {self.right})'

    def get_last_token(self) -> Node:
        return self.right.get_last_token()

    def print_tree(self, print_fn: Callable[[str], None], level: int = 0) -> None:
        print_fn(' ' * level * 4 + self.operator)
        self.left.print_tree(print_fn, level + 1)
        self.right.print_tree(print_fn, level + 1)


class ExpressionNode(Node):
    expression: str
    start_pos: int
    end_pos: int

    def __init__(self, expression: str, start_pos: int, end_pos: int) -> None:
        self.expression = expression
        self.start_pos = start_pos
        self.end_pos = end_pos

    def __repr__(self) -> str:
        return self.expression

    def get_last_token(self) -> Node:
        return self

    def print_tree(self, print_fn: Callable[[str], None], level: int = 0) -> None:
        print_fn(' ' * level * 4 + self.expression)


class OperatorError(ValueError):
    operator: str
    pos: int
    previous_token: str | None

    def __init__(
        self,
        operator: str,
        pos: int,
        previous_token: str | None = None,
    ) -> None:
        self.operator = operator
        self.pos = pos
        self.previous_token = previous_token
        msg = f'Invalid operator "{operator}" at position {pos}'
        if previous_token:
            msg += f' after "{previous_token}"'
        super().__init__(msg)

    @property
    def expected(self) -> set[str]:
        if not self.previous_token:
            return {'(', 'expression'}
        if self.previous_token in ('and', 'or', '('):
            return {'(', 'expression'}
        if self.previous_token == ')':  # nosec hardcoded_password_string  # noqa: S105
            return {'and', 'or', ')'}
        return {'and', 'or', ')', 'expression'}


class BracketError(ValueError):
    value: str | None
    pos: int

    def __init__(self, value: str | None, pos: int) -> None:
        self.value = value
        self.pos = pos
        msg = (
            f'Invalid bracket "{value}" at position {pos}'
            if value
            else f'Missing bracket at position {pos}'
        )
        super().__init__(msg)


class UnexpectedEndOfExpressionError(ValueError):
    previous_token: str

    def __init__(self, previous_token: str) -> None:
        self.previous_token = previous_token
        super().__init__(f'Unexpected end of expression after "{previous_token}"')

    @property
    def expected(self) -> set[str]:
        return {'(', 'expression'}


def parse_or(tokens: list[tuple[str, int, int]]) -> Node:
    left = parse_and(tokens)
    while tokens and tokens[0][0] == LogicalOperatorT.OR.value:
        tokens.pop(0)
        right = parse_and(tokens)
        left = OperatorNode(LogicalOperatorT.OR, left, right)
    return left


def parse_and(tokens: list[tuple[str, int, int]]) -> Node:
    left = parse_primary(tokens)
    while tokens and tokens[0][0] == LogicalOperatorT.AND.value:
        tokens.pop(0)
        right = parse_primary(tokens)
        left = OperatorNode(LogicalOperatorT.AND, left, right)
    return left


def parse_primary(tokens: list[tuple[str, int, int]]) -> Node:
    token = tokens.pop(0)
    if token[0] == '(':
        expr = parse_or(tokens)
        if tokens and tokens[0][0] == ')':
            tokens.pop(0)
        return expr
    return ExpressionNode(token[0], start_pos=token[1], end_pos=token[2])


def tokenize_expression(query: str) -> list[tuple[str, int, int]]:
    tokens: list[tuple[str, int, int]] = []
    current_expr = ''
    current_expr_start = 0
    depth = 0
    in_quotes = False

    def _dump_current_expr(curr_pos: int) -> None:
        nonlocal current_expr
        nonlocal current_expr_start
        exp_ = current_expr.strip()
        s, e = current_expr_start, current_expr_start + len(current_expr) - 1
        current_expr = ''
        current_expr_start = curr_pos
        if not exp_:
            return
        tokens.append((exp_, s, e))

    def _dump_operator(op: str, pos: int) -> None:
        op = op.lower()
        if op in ('and', 'or'):
            if len(tokens) == 0:
                raise OperatorError(op, pos)
            if tokens[-1][0] in ('(', 'and', 'or'):
                raise OperatorError(op, pos, tokens[-1][0])
        elif op == ')':
            if len(tokens) == 0:
                raise OperatorError(op, pos)
            if tokens[-1][0] in ('and', 'or'):
                raise OperatorError(op, pos, tokens[-1][0])
            if tokens[-1][0] == '(':
                tokens.pop()
                return
        elif op == '(':
            if len(tokens) > 0 and tokens[-1][0] not in ('and', 'or', '('):
                raise OperatorError(op, pos, tokens[-1][0])
        tokens.append((op, pos, pos + len(op) - 1))

    i = 0
    while i < len(query):
        char = query[i]

        if char == '"':
            in_quotes = not in_quotes
            current_expr += char
        elif char == '(' and not in_quotes:
            _dump_current_expr(i + 1)
            _dump_operator(char, i)
            depth += 1
        elif char == ')' and not in_quotes:
            _dump_current_expr(i + 1)
            _dump_operator(char, i)
            depth -= 1
        elif not in_quotes:
            match = OPERATOR_PATTERN.match(query, i)
            if match:
                _dump_current_expr(i + len(match.group(0)))
                _dump_operator(match.group(0), i)
                i += len(match.group(0)) - 1
            else:
                current_expr += char
        else:
            current_expr += char

        i += 1

    q_len = len(query)
    _dump_current_expr(q_len + 1)

    for i in range(depth):
        _dump_operator(')', q_len - 1 + i)
    return tokens


def parse_logical_expression(query: str) -> Node | None:
    tokens = tokenize_expression(query)
    if not tokens:
        return None
    if tokens[-1][0] in ('and', 'or'):
        raise UnexpectedEndOfExpressionError(tokens[-1][0])
    tree = parse_or(tokens)
    if tokens:
        raise OperatorError(tokens[0][0], tokens[0][1])
    return tree


def check_brackets(query: str) -> None:
    depth = 0
    for idx, char in enumerate(query):
        if char == '(':
            depth += 1
        elif char == ')':
            depth -= 1
            if depth < 0:
                raise BracketError(char, idx)
    if depth > 0:
        raise BracketError(None, len(query))
