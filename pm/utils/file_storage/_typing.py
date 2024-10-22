from typing import Protocol

__all__ = ('AsyncReadable', 'AsyncWritable')


class AsyncReadable(Protocol):
    async def read(self, n: int) -> bytes:
        pass


class AsyncWritable(Protocol):
    async def write(self, data: bytes) -> None:
        pass
