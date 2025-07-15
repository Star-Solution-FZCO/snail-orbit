import asyncio
from collections.abc import AsyncGenerator, Callable
from enum import StrEnum
from typing import Any, ParamSpec

from pydantic import BaseModel

__all__ = (
    'SentEventOutput',
    'SentEventType',
    'with_ping',
)


PING_INTERVAL = 30  # seconds


class SentEventType(StrEnum):
    PING = 'ping'
    ISSUE_UPDATE = 'issue_update'
    ISSUE_CREATE = 'issue_create'
    ISSUE_DELETE = 'issue_delete'


class SentEventOutput(BaseModel):
    type: SentEventType
    data: dict | None = None

    def to_msg(self) -> str:
        return f'data: {self.model_dump_json(exclude_unset=True)}\n\n'


P = ParamSpec('P')


def with_ping(
    event_generator: Callable[P, AsyncGenerator[SentEventOutput, Any]],
) -> Callable[P, AsyncGenerator[str, Any]]:
    async def task(*args: P.args, **kwargs: P.kwargs) -> AsyncGenerator[str, Any]:
        queue = asyncio.Queue()

        async def wrapped_event_generator() -> None:
            async for event in event_generator(*args, **kwargs):
                await queue.put(event)

        async def ping_generator() -> None:
            while True:
                event = SentEventOutput(type=SentEventType.PING)
                await queue.put(event)
                await asyncio.sleep(PING_INTERVAL)

        async with asyncio.TaskGroup() as tg:
            tg.create_task(wrapped_event_generator())
            tg.create_task(ping_generator())
            while True:
                ev = await queue.get()
                yield ev.to_msg()
                queue.task_done()

    return task
