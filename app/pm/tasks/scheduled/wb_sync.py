import asyncio

import pm.models as m
from pm.config import CONFIG
from pm.services.avatars import generate_default_avatar
from pm.tasks._base import setup_database
from pm.tasks.app import broker
from pm.utils.wb import WbAPIClient

__all__ = ('wb_sync',)


FIELDS_MAP = {
    'english_name': 'name',
    'active': 'is_active',
}


async def wb_user_sync() -> None:
    wb_client = WbAPIClient(
        CONFIG.WB_URL,
        (CONFIG.WB_API_TOKEN_KID, CONFIG.WB_API_TOKEN_SECRET),
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
                ),
            )
            continue
        if (
            not CONFIG.WB_USER_SYNC_LOCAL
            and users[user.email].origin == m.UserOriginType.LOCAL
        ):
            continue
        users[user.email].origin = m.UserOriginType.WB
        users[user.email].avatar_type = m.UserAvatarType.EXTERNAL
        for field, mapped_field in FIELDS_MAP.items():
            setattr(users[user.email], mapped_field, getattr(user, field))
        if users[user.email].is_changed:
            await users[user.email].save_changes()
            await asyncio.gather(
                m.Project.update_user_embedded_links(users[user.email]),
                m.Issue.update_user_embedded_links(users[user.email]),
                m.IssueDraft.update_user_embedded_links(users[user.email]),
                m.UserMultiCustomField.update_user_embedded_links(users[user.email]),
                m.UserCustomField.update_user_embedded_links(users[user.email]),
                m.Tag.update_user_embedded_links(users[user.email]),
            )
            await generate_default_avatar(users[user.email])


async def wb_team_sync() -> None:
    wb_client = WbAPIClient(
        CONFIG.WB_URL,
        (CONFIG.WB_API_TOKEN_KID, CONFIG.WB_API_TOKEN_SECRET),
    )
    groups_by_wb_id = {g.wb_id: g for g in await m.WBGroup.all().to_list()}
    async for team in wb_client.get_teams():
        if group := groups_by_wb_id.get(team.id):
            group.name = team.name
            group.description = team.description
            if group.is_changed:
                await group.save_changes()
                await asyncio.gather(
                    m.Project.update_group_embedded_links(group),
                    m.UserCustomField.update_group_embedded_links(group),
                    m.UserMultiCustomField.update_group_embedded_links(group),
                )
            continue
        new_group = m.WBGroup(
            name=team.name,
            description=team.description,
            wb_id=team.id,
        )
        await new_group.insert()
        groups_by_wb_id[new_group.wb_id] = new_group
    users = await m.User.all().to_list()
    for group in groups_by_wb_id.values():
        members = {
            member.email for member in await wb_client.get_team_members(group.wb_id)
        }
        for user in users:
            if user.email in members:
                if any(gr.id == group.id for gr in user.groups):
                    continue
                user.groups.append(m.GroupLinkField.from_obj(group))
            elif any(gr.id == group.id for gr in user.groups):
                user.groups = [gr for gr in user.groups if gr.id != group.id]
            if user.is_changed:
                await user.save_changes()
                if user.is_changed:
                    await user.save_changes()


async def _wb_sync() -> None:
    await wb_user_sync()
    await wb_team_sync()


@broker.task(
    schedule=[{'cron': '*/5 * * * *'}] if CONFIG.WB_SYNC_ENABLED else [],
    task_name='wb_sync',
)
async def wb_sync() -> None:
    if CONFIG.WB_SYNC_ENABLED:
        await setup_database()
        await _wb_sync()
