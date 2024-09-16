from collections.abc import Coroutine

__all__ = ('run_task',)


def run_task(task: Coroutine) -> None:
    import asyncio

    from beanie import init_beanie
    from motor.motor_asyncio import AsyncIOMotorClient

    from pm.config import CONFIG
    from pm.models import __beanie_models__

    async def _run() -> None:
        client = AsyncIOMotorClient(CONFIG.DB_URI)
        db = client.get_default_database()
        await init_beanie(db, document_models=__beanie_models__)
        await task

    asyncio.run(_run())
