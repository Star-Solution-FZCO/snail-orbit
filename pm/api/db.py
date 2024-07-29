from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession
from starsol_sql_base.db import async_session

__all__ = ('db_session_dependency',)


async def db_session_dependency() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session
