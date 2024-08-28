import json
from dataclasses import dataclass
from enum import IntEnum
from typing import Self

import redis.asyncio as aioredis

from pm.config import CONFIG

__all__ = (
    'EventType',
    'Event',
)

pool = aioredis.ConnectionPool.from_url(CONFIG.REDIS_EVENT_BUS_URL)


class EventType(IntEnum):
    ISSUE_UPDATE = 0
    ISSUE_CREATE = 1
    ISSUE_DELETE = 2


@dataclass
class Event:
    type: EventType
    data: dict

    def _to_bus_msg(self) -> bytes:
        return json.dumps(
            {
                'type': self.type,
                'data': self.data,
            }
        ).encode()

    async def send(self) -> None:
        async with aioredis.Redis(connection_pool=pool) as client:
            await client.publish('events', self._to_bus_msg())

    @classmethod
    def from_bus_msg(cls, msg: bytes) -> Self:
        data = json.loads(msg)
        return cls(
            type=EventType(data['type']),
            data=data['data'],
        )
