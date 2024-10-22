from collections.abc import AsyncGenerator
from http import HTTPStatus
from typing import Any

import redis.asyncio as aioredis
from beanie import PydanticObjectId
from fastapi import HTTPException
from fastapi.responses import StreamingResponse

import pm.models as m
from pm.api.utils.router import APIRouter
from pm.api.views.issue import IssueOutput
from pm.config import CONFIG
from pm.utils.events_bus import Event, EventType

from ._base import SentEventOutput, SentEventType, with_ping

__all__ = ('router',)


router = APIRouter(prefix='/issue')


@with_ping
async def issue_event_generator(
    issue_id: PydanticObjectId,
) -> AsyncGenerator[SentEventOutput, Any]:
    client = aioredis.from_url(CONFIG.REDIS_EVENT_BUS_URL).pubsub()
    await client.subscribe('events')
    try:
        async for msg in client.listen():
            if msg['type'] != 'message':
                continue
            event = Event.from_bus_msg(msg['data'])
            if event.type not in (EventType.ISSUE_UPDATE, EventType.ISSUE_DELETE):
                continue
            if event.data.get('issue_id') != str(issue_id):
                continue
            if event.type == EventType.ISSUE_UPDATE:
                issue: m.Issue | None = await m.Issue.find_one(m.Issue.id == issue_id)
                if not issue:
                    continue
                yield SentEventOutput(
                    type=SentEventType.ISSUE_UPDATE, data=IssueOutput.from_obj(issue)
                )
                continue
            if event.type == EventType.ISSUE_DELETE:
                yield SentEventOutput(type=SentEventType.ISSUE_DELETE)
    finally:
        await client.unsubscribe('events')
        await client.close()


@router.get('/{issue_id}')
async def get_issue_events(
    issue_id: PydanticObjectId,
) -> StreamingResponse:
    if not CONFIG.REDIS_EVENT_BUS_URL:
        raise HTTPException(
            status_code=HTTPStatus.NOT_IMPLEMENTED,
            detail='Redis event bus is not configured',
        )
    return StreamingResponse(
        issue_event_generator(issue_id), media_type='text/event-stream'
    )
