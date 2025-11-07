import logging
import re

from ._base import IssueQueryTransformError
from .search import transform_search
from .sort import transform_sort

__all__ = (
    'IssueQueryTransformError',
    'transform_query',
)

logger = logging.getLogger(__name__)


SORT_BY_PATTERN = r'(^|\s+)sort\s+by:\s*'
SORT_BY_PART_INDEX = 2


def split_query(query: str) -> tuple[str, str]:
    parts = re.split(SORT_BY_PATTERN, query, maxsplit=1, flags=re.IGNORECASE)
    return parts[0], parts[SORT_BY_PART_INDEX] if len(
        parts,
    ) > SORT_BY_PART_INDEX else ''


async def transform_query(
    query: str,
    current_user_email: str | None = None,
    sort_by: str | None = None,
) -> tuple[dict, list]:
    search_part, sort_part = split_query(query)
    if sort_by:
        sort_part = sort_by
    search_transformed = await transform_search(
        search_part,
        current_user_email,
    )
    sort_transformed = await transform_sort(sort_part)
    logger.debug(
        "query='%s' -> search=%s sort=%s", query, search_transformed, sort_transformed
    )
    return search_transformed, sort_transformed
