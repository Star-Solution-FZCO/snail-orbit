import json
from dataclasses import dataclass
from enum import IntEnum
from typing import TYPE_CHECKING, Self

if TYPE_CHECKING:
    from redis.asyncio import Redis


__all__ = (
    'Event',
    'EventType',
)


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
            },
        ).encode()

    async def send(self, client: 'Redis') -> None:
        await client.publish('events', self._to_bus_msg())

    @classmethod
    def from_bus_msg(cls, msg: bytes) -> Self:
        data = json.loads(msg)
        return cls(
            type=EventType(data['type']),
            data=data['data'],
        )
