from collections.abc import Coroutine

__all__ = ('run_task', 'setup_database')

_DB_INITIALIZED = False


async def setup_database() -> None:
    """Initialize database connection for the worker process."""
    global _DB_INITIALIZED  # pylint: disable=global-statement
    if _DB_INITIALIZED:
        return

    # pylint: disable=import-outside-toplevel
    from beanie import init_beanie
    from motor.motor_asyncio import AsyncIOMotorClient

    from pm.config import CONFIG
    from pm.models import __beanie_models__

    client = AsyncIOMotorClient(CONFIG.DB_URI)
    db = client.get_default_database()
    await init_beanie(db, document_models=__beanie_models__)
    _DB_INITIALIZED = True


def run_task(task: Coroutine) -> None:
    """Run an async task with proper database initialization."""
    # pylint: disable=import-outside-toplevel
    import asyncio

    async def _run() -> None:
        await setup_database()
        await task

    try:
        loop = asyncio.get_running_loop()
        task_obj = loop.create_task(_run())
        return task_obj
    except RuntimeError:
        return asyncio.run(_run())
