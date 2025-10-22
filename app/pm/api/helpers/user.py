from collections.abc import Collection

import beanie.operators as bo

import pm.models as m

__all__ = ('resolve_users_by_email',)


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
