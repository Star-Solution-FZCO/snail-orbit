from fastapi import Query
from pydantic import BaseModel

__all__ = (
    'IssueSearchParams',
    'ListParams',
)


class ListParams(BaseModel):
    limit: int = Query(50, ge=0, description='limit results')
    offset: int = Query(0, ge=0, description='offset')
    search: str = Query('', description='search')


class IssueSearchParams(BaseModel):
    q: str | None = Query(None, description='search query')
    search: str | None = Query(None, description='context search')
