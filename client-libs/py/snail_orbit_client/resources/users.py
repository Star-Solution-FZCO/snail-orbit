"""User management resource."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from ..models import User
from .base import AsyncBaseResource, BaseResource

if TYPE_CHECKING:
    from collections.abc import AsyncIterator, Iterator

    from ..client import SnailOrbitAsyncClient, SnailOrbitClient


class UsersResource(BaseResource):
    """Synchronous user management operations."""

    def __init__(self, client: SnailOrbitClient) -> None:
        """Initialize users resource."""
        super().__init__(client)

    def list(
        self, search: str | None = None, filter: str | None = None, **params: Any
    ) -> Iterator[User]:
        """List all users.

        Args:
            search: Search query to filter users
            filter: Filter query using query language (e.g., "name___contains:john and is_active___eq:true")
            **params: Other query parameters

        Yields:
            User objects
        """
        if search:
            params['search'] = search
        if filter:
            params['filter'] = filter
        yield from self._paginate('/api/v1/user/list', User, params)

    def get(self, user_id: str) -> User:
        """Get a specific user by ID.

        Args:
            user_id: User ID

        Returns:
            User object
        """
        data = self._get(f'/api/v1/user/{user_id}')
        return self._validate_and_convert(data, User)


class AsyncUsersResource(AsyncBaseResource):
    """Asynchronous user management operations."""

    def __init__(self, client: SnailOrbitAsyncClient) -> None:
        """Initialize async users resource."""
        super().__init__(client)

    async def list(
        self, search: str | None = None, filter: str | None = None, **params: Any
    ) -> AsyncIterator[User]:
        """List all users.

        Args:
            search: Search query to filter users
            filter: Filter query using query language (e.g., "name___contains:john and is_active___eq:true")
            **params: Other query parameters

        Yields:
            User objects
        """
        if search:
            params['search'] = search
        if filter:
            params['filter'] = filter
        async for user in self._paginate('/api/v1/user/list', User, params):
            yield user

    async def get(self, user_id: str) -> User:
        """Get a specific user by ID.

        Args:
            user_id: User ID

        Returns:
            User object
        """
        data = await self._get(f'/api/v1/user/{user_id}')
        return self._validate_and_convert(data, User)
