import aiofiles.os
from aiofiles import threadpool
from aiofiles.threadpool.binary import AsyncBufferedIOBase
from pyfakefs.fake_filesystem import FakeFileWrapper
from pyfakefs.fake_filesystem_unittest import Patcher

__all__ = ('aio_fs',)


@threadpool.wrap.register(FakeFileWrapper)
def _(file, *, loop=None, executor=None):
    return AsyncBufferedIOBase(file, loop=loop, executor=executor)


def aio_fs():
    with Patcher(modules_to_reload=[aiofiles.os.path, aiofiles.os]) as patcher:
        yield patcher.fs
