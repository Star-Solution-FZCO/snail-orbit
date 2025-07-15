from collections.abc import Sequence
from typing import TYPE_CHECKING, TypeVar

from fastapi import Query
from pydantic import BaseModel

from pm.utils.mongo_filter import parse_filter, parse_sort

if TYPE_CHECKING:
    from beanie import Document
    from beanie.odm.queries.find import FindMany

__all__ = (
    'IssueSearchParams',
    'ListParams',
)

DocT = TypeVar('DocT', bound='Document')


class ListParams(BaseModel):
    limit: int = Query(50, ge=0, description='limit results')
    offset: int = Query(0, ge=0, description='offset')
    search: str = Query('', description='search')
    filter: str | None = Query(None, description='filter')
    sort_by: str | None = Query(None, description='sort')

    def apply_filter(
        self,
        query: 'FindMany[DocT]',
        model: type[DocT],
        available_fields: list[str] | None = None,
    ) -> 'FindMany[DocT]':
        if not self.filter:
            return query
        if not (flt := parse_filter(model, self.filter, available_fields)):
            return query
        return query.find(flt)

    def apply_sort(
        self,
        query: 'FindMany[DocT]',
        model: type[DocT],
        available_fields: Sequence[str] | None = None,
        default_sort: Sequence[str] | None = None,
    ) -> 'FindMany[DocT]':
        if not self.sort_by:
            return query if not default_sort else query.sort(*default_sort)
        if not (sort_ := parse_sort(model, self.sort_by, available_fields)):
            return query if not default_sort else query.sort(*default_sort)
        return query.sort(*sort_)


class IssueSearchParams(BaseModel):
    q: str | None = Query(None, description='search query')
    search: str | None = Query(None, description='context search')
