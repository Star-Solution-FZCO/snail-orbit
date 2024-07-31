from fastapi import Query
from pydantic import BaseModel, field_validator

__all__ = (
    'ListFilterParams',
    'SelectParams',
    'ListParams',
)


class SelectParams(BaseModel):
    search: str | None = Query(default='', description='Filter results by value')


class ListParams(BaseModel):
    limit: int = Query(50, le=50, description='limit results')
    offset: int = Query(0, description='offset')
    sort_by: str | None = Query(None, max_length=50, description='sort by field')
    direction: str = Query(
        'desc', max_length=4, description='sort direction asc or desc'
    )

    @field_validator('direction')
    def check_direction(cls, v: str) -> str:
        if v not in ('desc', 'asc'):
            raise ValueError('wrong direction')
        return v


class ListFilterParams(ListParams):
    filter: str = Query(None, description='filter params')
