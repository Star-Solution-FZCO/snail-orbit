from dataclasses import dataclass

__all__ = (
    'DEFAULT_KEY_PREFIX',
    'DEFAULT_MAX_CONNECTIONS',
    'DEFAULT_TTL_SECONDS',
    'CacheConfig',
)

# Cache constants
DEFAULT_TTL_SECONDS = 300  # 5 minutes
DEFAULT_MAX_CONNECTIONS = 10
DEFAULT_KEY_PREFIX = 'snail_orbit_cache'


@dataclass
class CacheConfig:
    """Configuration for Redis cache."""

    redis_url: str = ''
    default_ttl_seconds: int = DEFAULT_TTL_SECONDS
    max_connections: int = DEFAULT_MAX_CONNECTIONS
    key_prefix: str = DEFAULT_KEY_PREFIX
