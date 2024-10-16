import re
from collections.abc import Callable, Sequence
from dataclasses import dataclass
from typing import Any, Generic, TypeVar

from fastapi import Query
from pydantic import BaseModel

import pm.models as m

__all__ = (
    'SelectParams',
    'user_link_select',
    'state_option_select',
    'enum_option_select',
    'version_option_select',
)

T = TypeVar('T')


@dataclass
class SelectResult(Generic[T]):
    total: int
    limit: int
    offset: int
    items: list[T]


class SelectParams(BaseModel):
    limit: int = Query(10, ge=0, description='limit results')
    offset: int = Query(0, ge=0, description='offset')
    search: str | None = Query(default='', description='Filter results by value')


def _select(
    objs: Sequence[T],
    query: SelectParams,
    filter_fn: Callable[[Sequence[T], str], list[T]],
    sort_key_fn: Callable[[T], Any],
) -> SelectResult[T]:
    objs = sorted(objs, key=sort_key_fn)
    if query.search:
        objs = filter_fn(objs, query.search)
    cnt = len(objs)
    if query.limit != 0:
        objs = objs[query.offset : query.offset + query.limit]
    return SelectResult(
        total=cnt,
        limit=query.limit,
        offset=query.offset,
        items=objs,
    )


def _user_link_filter(
    objs: Sequence[m.UserLinkField], search: str
) -> list[m.UserLinkField]:
    return [
        o
        for o in objs
        if re.search(re.escape(search), o.name, re.IGNORECASE)
        or re.search(re.escape(search), o.email, re.IGNORECASE)
    ]


def user_link_select(
    objs: Sequence[m.UserLinkField], query: SelectParams
) -> SelectResult[m.UserLinkField]:
    return _select(objs, query, _user_link_filter, lambda o: o.name)


def _state_filter(objs: Sequence[m.StateOption], search: str) -> list[m.StateOption]:
    return [
        o for o in objs if re.search(re.escape(search), o.value.state, re.IGNORECASE)
    ]


def state_option_select(
    objs: Sequence[m.StateOption], query: SelectParams
) -> SelectResult[m.StateOption]:
    return _select(objs, query, _state_filter, lambda o: o.value.state)


def _enum_filter(objs: Sequence[m.EnumOption], search: str) -> list[m.EnumOption]:
    return [o for o in objs if re.search(re.escape(search), o.value, re.IGNORECASE)]


def enum_option_select(
    objs: Sequence[m.EnumOption], query: SelectParams
) -> SelectResult[m.EnumOption]:
    return _select(objs, query, _enum_filter, lambda o: o.value.value)


def _version_filter(
    objs: Sequence[m.VersionOption], search: str
) -> list[m.VersionOption]:
    return [
        o for o in objs if re.search(re.escape(search), o.value.version, re.IGNORECASE)
    ]


def version_option_select(
    objs: Sequence[m.VersionOption], query: SelectParams
) -> SelectResult[m.VersionOption]:
    return _select(objs, query, _version_filter, lambda o: o.value.version)
