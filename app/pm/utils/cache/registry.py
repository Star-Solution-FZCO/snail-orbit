from .provider import CacheProvider

__all__ = ('CacheRegistry',)


class CacheRegistry:
    """Registry for cache provider instances."""

    def __init__(self) -> None:
        self._provider: CacheProvider | None = None

    def set_provider(self, provider: CacheProvider) -> None:
        """Set the cache provider instance."""
        self._provider = provider

    def get_provider(self) -> CacheProvider | None:
        """Get the current cache provider instance."""
        return self._provider

    def clear(self) -> None:
        """Clear the cache provider instance."""
        self._provider = None
