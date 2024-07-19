import datetime

import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql.selectable import Select

__all__ = (
    'get_utc',
    'count_select_query_results',
)


def get_utc() -> datetime.datetime:
    """
    Get the current date and time in UTC.
    :return: The current date and time in UTC.
    """
    return datetime.datetime.now(datetime.UTC)


async def count_select_query_results(query: Select, session: AsyncSession) -> int:
    count_res = await session.scalar(
        sa.select(sa.func.count()).select_from(  # pylint: disable=not-callable
            query.subquery()
        )
    )
    return count_res or 0
