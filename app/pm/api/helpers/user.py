from collections.abc import Callable, Collection
from typing import Any

import beanie.operators as bo
from beanie import PydanticObjectId

import pm.models as m
from pm.cache import cached
from pm.utils.cache.serializers import deserialize_objectid_set, serialize_objectid_set
from pm.utils.document import DocumentIdRO

__all__ = (
    'get_user_favorite_projects',
    'resolve_users_by_email',
)


async def resolve_users_by_email(
    emails: Collection[str], only_active: bool = False, raise_on_not_found: bool = False
) -> dict[str, m.User]:
    """Resolve users by their email addresses.

    Args:
        emails (Collection[str]): A collection of email addresses to resolve.
        only_active (bool, optional): If True, only active users will be considered. Defaults to False.
        raise_on_not_found (bool, optional): If True, raises an exception if any email is not found. Defaults to False.

    Returns:
        dict[str, m.User]: A mapping of email addresses to User objects.
    """

    q = m.User.find(bo.In(m.User.email, list(emails)))
    if only_active:
        q = q.find(bo.Eq(m.User.is_active, True))
    users = {user.email: user for user in await q.to_list()}

    if raise_on_not_found:
        missing_emails = set(emails) - set(users)
        if missing_emails:
            raise ValueError(f'Users not found for emails: {", ".join(missing_emails)}')

    return users


# pylint: disable=unused-argument
# ruff: noqa: ARG001
def _user_favorite_projects_key_builder(
    func: Callable[..., Any], args: tuple[Any, ...], kwargs: dict[str, Any]
) -> str:
    """Build cache key for resolve_user_favorite_projects based on user ID."""
    return f'user_favorite_projects:{args[0]}'


@cached(
    ttl=120,
    tags=['projects:all'],
    namespace='settings',
    serializer=serialize_objectid_set,
    deserializer=deserialize_objectid_set,
    key_builder=_user_favorite_projects_key_builder,
)
async def get_user_favorite_projects(
    user_id: PydanticObjectId,
) -> set[PydanticObjectId]:
    """Resolve favorite project IDs for user."""
    favorite_projects = (
        await m.Project.find(bo.Eq(m.Project.favorite_of, user_id))
        .project(DocumentIdRO)
        .to_list()
    )
    return {p.id for p in favorite_projects}
