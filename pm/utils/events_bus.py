import json
from dataclasses import dataclass
from enum import IntEnum, StrEnum
from typing import TYPE_CHECKING, Self

if TYPE_CHECKING:
    from redis.asyncio import Redis


__all__ = (
    'EventType',
    'Event',
    'TaskType',
    'Task',
)


class EventType(IntEnum):
    ISSUE_UPDATE = 0
    ISSUE_CREATE = 1
    ISSUE_DELETE = 2


class TaskType(StrEnum):
    OCR = 'ocr'

    def queue_name(self) -> str:
        return f'tasks-{self}'


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

    async def send(self, client: 'Redis') -> None:
        await client.publish('events', self._to_bus_msg())

    @classmethod
    def from_bus_msg(cls, msg: bytes) -> Self:
        data = json.loads(msg)
        return cls(
            type=EventType(data['type']),
            data=data['data'],
        )


@dataclass
class Task:
    type: TaskType
    data: dict

    def _to_bus_msg(self) -> bytes:
        return json.dumps(
            {
                'type': self.type,
                'data': self.data,
            }
        ).encode()

    async def send(self, client: 'Redis') -> None:
        await client.rpush(self.type.queue_name(), self._to_bus_msg())

    @classmethod
    def from_bus_msg(cls, msg: bytes) -> Self:
        data = json.loads(msg)
        return cls(
            type=TaskType(data['type']),
            data=data['data'],
        )
