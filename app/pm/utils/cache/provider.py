import json
from abc import ABC, abstractmethod
from typing import Any, TypeVar

__all__ = ('CacheProvider',)

GetT = TypeVar('GetT')
SetT = TypeVar('SetT')


class CacheProvider(ABC):
    @abstractmethod
    async def get(self, key: str, default: GetT | None = None) -> GetT | None:
        pass

    @abstractmethod
    async def set(
        self,
        key: str,
        value: SetT,
        ttl: int | None = None,
        tags: list[str] | None = None,
    ) -> None:
        pass

    @abstractmethod
    async def delete(self, key: str) -> bool:
        pass

    @abstractmethod
    async def delete_many(self, keys: list[str]) -> int:
        pass

    @abstractmethod
    async def exists(self, key: str) -> bool:
        pass

    @abstractmethod
    async def clear(self, pattern: str | None = None) -> int:
        pass

    @abstractmethod
    async def invalidate_by_tags(self, tags: list[str]) -> int:
        pass

    @abstractmethod
    async def get_stats(self) -> dict[str, Any]:
        pass

    @abstractmethod
    async def health_check(self) -> bool:
        pass

    def _serialize(self, value: Any) -> bytes:
        return json.dumps(value, default=str).encode('utf-8')

    def _deserialize(self, data: bytes) -> Any:
        return json.loads(data.decode('utf-8'))
