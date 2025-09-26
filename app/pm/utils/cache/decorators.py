import functools
import inspect
import logging
from collections.abc import Awaitable, Callable
from datetime import timedelta
from typing import Any, ParamSpec, TypeVar

import redis.exceptions as redis_exc

from .registry import CacheRegistry

logger = logging.getLogger(__name__)

__all__ = ('cached',)

P = ParamSpec('P')
T = TypeVar('T')


def _convert_ttl_to_seconds(ttl: int | timedelta | None) -> int | None:
    """Convert TTL to seconds, handling both int and timedelta."""
    if ttl is None:
        return None
    if isinstance(ttl, timedelta):
        return int(ttl.total_seconds())
    return ttl


def cached(
    ttl: int | timedelta | None = None,
    tags: list[str] | None = None,
    skip_cache_on_error: bool = True,
    namespace: str = 'general',
    serializer: Callable[[T], Any] | None = None,
    deserializer: Callable[[Any], T] | None = None,
    key_builder: Callable[[Callable[..., Any], tuple[Any, ...], dict[str, Any]], str]
    | None = None,
    registry: CacheRegistry | None = None,
) -> Callable[[Callable[P, Awaitable[T]]], Callable[P, Awaitable[T]]]:
    key_builder = key_builder or _default_key_builder

    def decorator(func: Callable[P, Awaitable[T]]) -> Callable[P, Awaitable[T]]:
        @functools.wraps(func)
        async def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
            if not registry:
                # No registry provided, execute function directly
                return await func(*args, **kwargs)

            cache_provider = registry.get_provider()

            if not cache_provider:
                return await func(*args, **kwargs)

            cache_key = key_builder(func, args, kwargs)

            # Get key prefix from cache provider config
            prefix = 'snail_orbit_cache'  # fallback
            if hasattr(cache_provider, 'config') and hasattr(
                cache_provider.config, 'key_prefix'
            ):
                prefix = cache_provider.config.key_prefix

            cache_key = f'{prefix}:{namespace}:{cache_key}'

            try:
                cached_value = await cache_provider.get(cache_key)
                if cached_value is not None:
                    logger.debug('Cache hit for key: %s', cache_key)
                    if deserializer:
                        return deserializer(cached_value)
                    return cached_value

                logger.debug('Cache miss for key: %s', cache_key)
                result = await func(*args, **kwargs)

                cache_value = serializer(result) if serializer else result
                await cache_provider.set(
                    cache_key, cache_value, ttl=_convert_ttl_to_seconds(ttl), tags=tags
                )

                return result

            except (redis_exc.RedisError, redis_exc.ConnectionError, OSError) as e:
                logger.warning(
                    'Cache operation failed',
                    exc_info=e,
                    extra={'function': func.__name__},
                )

                if skip_cache_on_error:
                    return await func(*args, **kwargs)
                raise

        return wrapper

    return decorator


def _default_key_builder(
    func: Callable[..., Any],
    args: tuple[Any, ...],
    kwargs: dict[str, Any],
) -> str:
    sig = inspect.signature(func)
    bound = sig.bind(*args, **kwargs)
    bound.apply_defaults()

    if 'self' in bound.arguments:
        del bound.arguments['self']
    if 'cls' in bound.arguments:
        del bound.arguments['cls']

    func_id = f'{func.__module__}.{func.__name__}'
    args_repr = repr(bound.arguments)

    return f'{func_id}:{args_repr}'
