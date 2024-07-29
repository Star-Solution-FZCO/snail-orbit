from contextlib import asynccontextmanager, contextmanager
from typing import AsyncGenerator, Generator

from sqlalchemy import NullPool
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, create_async_engine
from sqlalchemy.orm import Session, sessionmaker

__all__ = ('async_session', 'autocommit_async_session', 'sync_session', 'init_engine')

engine: AsyncEngine | None = None
sm: sessionmaker | None = None


def init_engine(uri: str) -> None:
    """
    Initialize the database engine.

    :param uri: The URI of the database.
    :type uri: str
    """
    global engine, sm
    engine = create_async_engine(uri, poolclass=NullPool)
    sm = sessionmaker(  # type: ignore
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )


@asynccontextmanager
async def async_session(
    session: AsyncSession | None = None,
) -> AsyncGenerator[AsyncSession, None]:
    """
    :param session: Optional AsyncSession.
                    An optional parameter of type AsyncSession.
                    If provided, the method will yield the given session and return.
                    If not provided, a new session will be created using the sm() method, and the method will yield the newly created session.

    :return: AsyncGenerator[AsyncSession, None].
             An async generator that yields an AsyncSession object.
             If a session was provided, it will be yielded and returned immediately.
             If a session was not provided, the generator will create a new session and yield it before exiting.
    """
    if session is not None:
        yield session
        return
    if sm is None:
        raise ValueError('Database engine not initialized. Call init_engine() first')
    async with sm() as s:
        yield s


@asynccontextmanager
async def autocommit_async_session(
    session: AsyncSession | None = None,
) -> AsyncGenerator[AsyncSession, None]:
    """
    Acquire an asynchronous session with autocommit capability.

    :param session: An optional asynchronous session.
                    If provided, the session will be yielded as-is without committing the changes.
    :return: An asynchronous generator that yields an asynchronous session and automatically commits the changes made within the session.
    :rtype: AsyncGenerator[AsyncSession, None]
    """
    if session is not None:
        yield session
        await session.commit()
        return
    async with async_session(None) as s:
        yield s
        await s.commit()


@contextmanager
def sync_session() -> Generator[Session, None, None]:
    """
    sync_session

    Context manager for creating and managing a synchronous database session.

    Usage:
        with sync_session() as session:
            # Use the session for synchronous database operations

    Returns:
        A generator that yields a synchronous database session.

    Example:
        with sync_session() as session:
            session.query(User).filter(User.name == 'John').all()
    """
    if engine is None:
        raise ValueError('Database engine not initialized. Call init_engine() first')
    with AsyncSession(bind=engine).sync_session as session:
        yield session
