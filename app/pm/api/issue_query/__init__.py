import re

from ._base import IssueQueryTransformError
from .search import transform_search
from .sort import transform_sort

__all__ = (
    'transform_query',
    'IssueQueryTransformError',
)


def split_query(query: str) -> tuple[str, str]:
    parts = re.split(r'(^|\s+)sort\s+by:\s*', query, maxsplit=1, flags=re.IGNORECASE)
    return parts[0], parts[2] if len(parts) > 2 else ''


async def transform_query(
    query: str, current_user_email: str | None = None
) -> tuple[dict, list]:
    search_part, sort_part = split_query(query)
    return await transform_search(
        search_part, current_user_email
    ), await transform_sort(sort_part)
