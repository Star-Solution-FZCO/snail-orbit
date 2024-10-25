import asyncio

import pm.models as m
from pm.config import CONFIG
from pm.services.avatars import generate_default_avatar
from pm.utils.wb import WbAPIClient

__all__ = ('wb_user_sync',)


FIELDS_MAP = {
    'english_name': 'name',
    'active': 'is_active',
}


async def wb_user_sync() -> None:
    wb_client = WbAPIClient(
        CONFIG.WB_URL, (CONFIG.WB_API_TOKEN_KID, CONFIG.WB_API_TOKEN_SECRET)
    )
    users = {u.email: u for u in await m.User.all().to_list()}
    async for user in wb_client.get_people():
        if user.email not in users:
            if not user.active and not CONFIG.WB_USER_SYNC_ADD_MISSED_INACTIVE:
                continue
            await m.User.insert_one(
                m.User(
                    email=user.email,
                    name=user.english_name,
                    is_active=user.active,
                    origin=m.UserOriginType.WB,
                )
            )
            continue
        if (
            not CONFIG.WB_USER_SYNC_LOCAL
            and users[user.email].origin == m.UserOriginType.LOCAL
        ):
            continue
        users[user.email].origin = m.UserOriginType.WB
        users[user.email].avatar_type = m.UserAvatarType.EXTERNAL
        for field in FIELDS_MAP:
            setattr(users[user.email], FIELDS_MAP[field], getattr(user, field))
        if users[user.email].is_changed:
            await users[user.email].save_changes()
            await asyncio.gather(
                m.Project.update_user_embedded_links(users[user.email]),
                m.Issue.update_user_embedded_links(users[user.email]),
                m.IssueDraft.update_user_embedded_links(users[user.email]),
                m.UserMultiCustomField.update_user_embedded_links(users[user.email]),
                m.UserCustomField.update_user_embedded_links(users[user.email]),
            )
            await generate_default_avatar(users[user.email])
