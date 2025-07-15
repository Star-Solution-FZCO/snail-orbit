import re
from collections.abc import Callable, Sequence
from dataclasses import dataclass
from typing import Any, Generic, TypeVar

from fastapi import Query
from pydantic import BaseModel

import pm.models as m

__all__ = (
    'SelectParams',
    'enum_option_select',
    'state_option_select',
    'user_link_select',
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
    search: str = Query(default='', description='Filter results by value')


def _select(
    objs: Sequence[T],
    query: SelectParams,
    filter_fn: Callable[[T, str | None], bool],
    sort_key_fn: Callable[[T], Any],
) -> SelectResult[T]:
    objs = sorted(objs, key=sort_key_fn)
    objs = [o for o in objs if filter_fn(o, query.search)]
    cnt = len(objs)
    if query.limit != 0:
        objs = objs[query.offset : query.offset + query.limit]
    return SelectResult(
        total=cnt,
        limit=query.limit,
        offset=query.offset,
        items=objs,
    )


def _user_link_filter(obj: m.UserLinkField, search: str | None) -> bool:
    if not search:
        return True
    return bool(
        re.search(re.escape(search), obj.name, re.IGNORECASE)
        or re.search(re.escape(search), obj.email, re.IGNORECASE),
    )


def user_link_select(
    objs: Sequence[m.UserLinkField],
    query: SelectParams,
) -> SelectResult[m.UserLinkField]:
    return _select(objs, query, _user_link_filter, lambda o: o.name)


def _state_filter(obj: m.StateOption, search: str | None) -> bool:
    if obj.is_archived:
        return False
    if not search:
        return True
    return bool(re.search(re.escape(search), obj.value, re.IGNORECASE))


def state_option_select(
    objs: Sequence[m.StateOption],
    query: SelectParams,
) -> SelectResult[m.StateOption]:
    return _select(objs, query, _state_filter, lambda o: o.value)


def _enum_filter(obj: m.EnumOption, search: str | None) -> bool:
    if obj.is_archived:
        return False
    if not search:
        return True
    return bool(re.search(re.escape(search), obj.value, re.IGNORECASE))


def enum_option_select(
    objs: Sequence[m.EnumOption],
    query: SelectParams,
) -> SelectResult[m.EnumOption]:
    return _select(objs, query, _enum_filter, lambda o: o.value)


def _version_filter(obj: m.VersionOption, search: str | None) -> bool:
    if obj.is_archived:
        return False
    if not search:
        return True
    return bool(re.search(re.escape(search), obj.value, re.IGNORECASE))


def version_option_select(
    objs: Sequence[m.VersionOption],
    query: SelectParams,
) -> SelectResult[m.VersionOption]:
    return _select(objs, query, _version_filter, lambda o: o.value)
