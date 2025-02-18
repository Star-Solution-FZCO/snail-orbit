import redis.asyncio as aioredis

from pm.config import CONFIG
from pm.utils.events_bus import Event, Task

__all__ = (
    'send_event',
    'send_task',
)

_POOL = None
if CONFIG.REDIS_EVENT_BUS_URL:
    _POOL = aioredis.ConnectionPool.from_url(CONFIG.REDIS_EVENT_BUS_URL)


async def send_event(event: Event) -> None:
    if not _POOL:
        return
    async with aioredis.Redis(connection_pool=_POOL) as client:
        await event.send(client=client)


async def send_task(task: Task) -> None:
    if not _POOL:
        return
    async with aioredis.Redis(connection_pool=_POOL) as client:
        await task.send(client=client)
