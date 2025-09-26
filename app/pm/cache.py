import logging
from collections.abc import Awaitable, Callable
from datetime import timedelta
from typing import Any, ParamSpec, TypeVar

from pm.config import CONFIG
from pm.utils.cache import (
    CacheConfig,
    CacheRegistry,
    RedisCache,
)
from pm.utils.cache import (
    cached as _cached,
)

logger = logging.getLogger(__name__)

P = ParamSpec('P')
T = TypeVar('T')

__all__ = (
    'CacheConfig',
    'CacheRegistry',
    'RedisCache',
    'cached',
    'clear_cache_provider',
    'get_cache_provider',
    'init_cache',
    'init_cache_system',
    'shutdown_cache_system',
)

# Module-level registry instance
_registry = CacheRegistry()


async def init_cache(config: CacheConfig) -> RedisCache:
    """Initialize and register a cache provider."""
    provider = RedisCache(config)
    await provider.init()
    _registry.set_provider(provider)
    return provider


def get_cache_provider() -> RedisCache | None:
    """Get the current cache provider instance."""
    return _registry.get_provider()  # type: ignore[return-value]


def clear_cache_provider() -> None:
    """Clear the cache provider instance (useful for testing)."""
    _registry.clear()


async def init_cache_system() -> None:
    """Initialize the application cache system."""
    if not CONFIG.CACHE_REDIS_URL:
        logger.info('Cache Redis URL not configured, cache system disabled')
        return

    try:
        cache_config = CacheConfig(
            redis_url=CONFIG.CACHE_REDIS_URL,
            default_ttl_seconds=CONFIG.CACHE_DEFAULT_TTL_SECONDS,
            max_connections=CONFIG.CACHE_MAX_CONNECTIONS,
            key_prefix=CONFIG.CACHE_KEY_PREFIX,
        )
        await init_cache(cache_config)
        logger.info('Cache system initialized successfully')
    except (ConnectionError, OSError, ValueError) as e:
        logger.warning('Failed to initialize cache system', exc_info=e)
        logger.info('Application will continue without caching')


async def shutdown_cache_system() -> None:
    """Clean shutdown of the application cache system."""
    cache_provider = get_cache_provider()
    if cache_provider:
        await cache_provider.close()
        logger.info('Cache system shutdown completed')


def cached(
    ttl: int | timedelta | None = None,
    tags: list[str] | None = None,
    skip_cache_on_error: bool = True,
    namespace: str = 'general',
    serializer: Callable[[T], Any] | None = None,
    deserializer: Callable[[Any], T] | None = None,
    key_builder: Callable[[Callable[..., Any], tuple[Any, ...], dict[str, Any]], str]
    | None = None,
) -> Callable[[Callable[P, Awaitable[T]]], Callable[P, Awaitable[T]]]:
    """Pre-configured cached decorator with app registry."""
    return _cached(
        ttl=ttl,
        tags=tags,
        skip_cache_on_error=skip_cache_on_error,
        namespace=namespace,
        serializer=serializer,
        deserializer=deserializer,
        key_builder=key_builder,
        registry=_registry,
    )
