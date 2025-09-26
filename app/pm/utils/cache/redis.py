import logging
from typing import TypedDict, TypeVar

import redis.asyncio as aioredis
import redis.exceptions as redis_exc

from .config import CacheConfig
from .provider import CacheProvider

logger = logging.getLogger(__name__)

__all__ = ('RedisCache',)

T = TypeVar('T')


class CacheStats(TypedDict):
    """Type definition for basic cache statistics."""

    hits: int
    misses: int
    sets: int
    deletes: int
    errors: int


class RedisStats(CacheStats, total=False):
    """Extended stats that include Redis-specific information."""

    redis_memory_used: int
    redis_memory_used_human: str
    connected: bool


class RedisCache(CacheProvider):
    def __init__(self, config: CacheConfig) -> None:
        self.config = config
        self._pool: aioredis.ConnectionPool | None = None
        self._stats: CacheStats = {
            'hits': 0,
            'misses': 0,
            'sets': 0,
            'deletes': 0,
            'errors': 0,
        }

    async def init(self) -> None:
        if not self.config.redis_url:
            logger.warning('Redis cache URL not configured, cache will be disabled')
            return

        try:
            self._pool = aioredis.ConnectionPool.from_url(
                self.config.redis_url,
                max_connections=self.config.max_connections,
                decode_responses=False,
            )

            await self.health_check()
            logger.info(
                'Redis cache initialized',
                extra={'redis_url': self.config.redis_url},
            )
        except (redis_exc.RedisError, ConnectionError, OSError) as e:
            logger.exception('Failed to initialize Redis cache', exc_info=e)
            raise

    async def get(self, key: str, default: T | None = None) -> T | None:
        if not self._pool:
            return default

        try:
            async with aioredis.Redis(connection_pool=self._pool) as client:
                data = await client.get(key)

                if data is None:
                    self._stats['misses'] += 1
                    return default

                self._stats['hits'] += 1
                return self._deserialize(data)

        except (redis_exc.RedisError, redis_exc.ConnectionError, OSError) as e:
            self._stats['errors'] += 1
            logger.warning(
                'Cache get failed, falling back to default',
                exc_info=e,
                extra={'key': key},
            )
            return default

    async def set(
        self,
        key: str,
        value: T,
        ttl: int | None = None,
        tags: list[str] | None = None,
    ) -> None:
        if not self._pool:
            return

        try:
            async with aioredis.Redis(connection_pool=self._pool) as client:
                serialized_data = self._serialize(value)

                if ttl is None:
                    ttl = self.config.default_ttl_seconds

                await client.setex(key, ttl, serialized_data)

                if tags:
                    await self._set_tags(client, key, tags)

                self._stats['sets'] += 1

        except (redis_exc.RedisError, redis_exc.ConnectionError, OSError) as e:
            self._stats['errors'] += 1
            logger.warning(
                'Cache set failed',
                exc_info=e,
                extra={'key': key, 'ttl': ttl},
            )

    async def delete(self, key: str) -> bool:
        if not self._pool:
            return False

        try:
            async with aioredis.Redis(connection_pool=self._pool) as client:
                result = await client.delete(key)
                self._stats['deletes'] += 1
                return result > 0

        except (redis_exc.RedisError, redis_exc.ConnectionError, OSError) as e:
            self._stats['errors'] += 1
            logger.warning('Cache delete failed', exc_info=e, extra={'key': key})
            return False

    async def delete_many(self, keys: list[str]) -> int:
        if not self._pool or not keys:
            return 0

        try:
            async with aioredis.Redis(connection_pool=self._pool) as client:
                result = await client.delete(*keys)
                self._stats['deletes'] += result
                return result

        except (redis_exc.RedisError, redis_exc.ConnectionError, OSError) as e:
            self._stats['errors'] += 1
            logger.warning(
                'Cache delete_many failed', exc_info=e, extra={'key_count': len(keys)}
            )
            return 0

    async def exists(self, key: str) -> bool:
        if not self._pool:
            return False

        try:
            async with aioredis.Redis(connection_pool=self._pool) as client:
                result = await client.exists(key)
                return result > 0

        except (redis_exc.RedisError, redis_exc.ConnectionError, OSError) as e:
            self._stats['errors'] += 1
            logger.warning('Cache exists failed', exc_info=e, extra={'key': key})
            return False

    async def clear(self, pattern: str | None = None) -> int:
        if not self._pool:
            return 0

        try:
            async with aioredis.Redis(connection_pool=self._pool) as client:
                if pattern:
                    keys = await client.keys(pattern)
                    if keys:
                        return await client.delete(*keys)
                    return 0
                await client.flushdb()
                return -1

        except (redis_exc.RedisError, redis_exc.ConnectionError, OSError) as e:
            self._stats['errors'] += 1
            logger.warning('Cache clear failed', exc_info=e, extra={'pattern': pattern})
            return 0

    async def invalidate_by_tags(self, tags: list[str]) -> int:
        if not self._pool or not tags:
            return 0

        try:
            async with aioredis.Redis(connection_pool=self._pool) as client:
                keys_to_delete = set()

                for tag in tags:
                    tag_key = f'{self.config.key_prefix}:tag:{tag}'
                    tagged_keys = await client.smembers(tag_key)

                    for tagged_key in tagged_keys:
                        if isinstance(tagged_key, bytes):
                            keys_to_delete.add(tagged_key.decode('utf-8'))
                        else:
                            keys_to_delete.add(tagged_key)

                    await client.delete(tag_key)

                if keys_to_delete:
                    deleted = await client.delete(*keys_to_delete)
                    self._stats['deletes'] += deleted
                    return deleted

                return 0

        except (redis_exc.RedisError, redis_exc.ConnectionError, OSError) as e:
            self._stats['errors'] += 1
            logger.warning(
                'Cache invalidate_by_tags failed', exc_info=e, extra={'tags': tags}
            )
            return 0

    async def get_stats(self) -> RedisStats:
        stats = dict(self._stats)

        if self._pool:
            try:
                async with aioredis.Redis(connection_pool=self._pool) as client:
                    info = await client.info('memory')
                    stats.update(
                        {
                            'redis_memory_used': info.get('used_memory', 0),
                            'redis_memory_used_human': info.get(
                                'used_memory_human', '0B'
                            ),
                            'connected': True,
                        }
                    )
            except (redis_exc.RedisError, redis_exc.ConnectionError, OSError) as e:
                logger.warning('Failed to get Redis stats', exc_info=e)
                stats['connected'] = False
        else:
            stats['connected'] = False

        return stats

    async def health_check(self) -> bool:
        if not self._pool:
            return False

        try:
            async with aioredis.Redis(connection_pool=self._pool) as client:
                await client.ping()
                return True
        except (redis_exc.RedisError, redis_exc.ConnectionError, OSError) as e:
            logger.warning('Redis health check failed', exc_info=e)
            return False

    async def close(self) -> None:
        if self._pool:
            await self._pool.disconnect()
            self._pool = None

    async def _set_tags(
        self, client: aioredis.Redis, key: str, tags: list[str]
    ) -> None:
        for tag in tags:
            tag_key = f'{self.config.key_prefix}:tag:{tag}'
            await client.sadd(tag_key, key)
            await client.expire(tag_key, self.config.default_ttl_seconds * 2)
