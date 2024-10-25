from io import BytesIO

__all__ = (
    'PseudoAsyncWriteBuffer',
    'PseudoAsyncReadBuffer',
)


class PseudoAsyncWriteBuffer:
    buffer: BytesIO

    def __init__(self):
        self.buffer = BytesIO()

    async def write(self, data: bytes) -> None:
        self.buffer.write(data)
        self.buffer.seek(0)


class PseudoAsyncReadBuffer:
    buffer: BytesIO

    def __init__(self, data: bytes):
        self.buffer = BytesIO(data)

    async def read(self, size: int) -> bytes:
        return self.buffer.read(size)
