from collections.abc import AsyncGenerator
from http import HTTPStatus
from typing import Any

import beanie.operators as bo
import redis.asyncio as aioredis
from beanie import PydanticObjectId
from fastapi import Depends, HTTPException
from fastapi.responses import StreamingResponse

import pm.models as m
from pm.api.context import current_user_context_dependency
from pm.api.utils.query_params import (
    pydantic_object_id_validator,
    query_comma_separated_list_param,
)
from pm.api.utils.router import APIRouter
from pm.config import CONFIG
from pm.utils.events_bus import Event, EventType

from ._base import SentEventOutput, SentEventType, with_ping

__all__ = ('router',)


router = APIRouter(
    prefix='/issue',
    dependencies=[Depends(current_user_context_dependency)],
)


MAP_SENT_EVENT_TYPE = {
    EventType.ISSUE_CREATE: SentEventType.ISSUE_CREATE,
    EventType.ISSUE_UPDATE: SentEventType.ISSUE_UPDATE,
    EventType.ISSUE_DELETE: SentEventType.ISSUE_DELETE,
}


def _check_issue_filters(
    issue_id: str,
    project_id: str | None,
    issue_ids: set[str] | None,
    project_ids: set[str] | None,
) -> bool:
    if not issue_ids and not project_ids:
        return True
    if issue_ids and issue_id in issue_ids:
        return True
    return bool(project_ids and project_id in project_ids)


@with_ping
async def issues_event_generator(
    issue_ids: list[PydanticObjectId] | None,
    project_ids: list[PydanticObjectId] | None,
) -> AsyncGenerator[SentEventOutput, Any]:
    issue_ids_ = {str(issue_id) for issue_id in issue_ids} if issue_ids else None
    project_ids_ = (
        {str(project_id) for project_id in project_ids} if project_ids else None
    )
    client = aioredis.from_url(CONFIG.REDIS_EVENT_BUS_URL).pubsub()
    await client.subscribe('events')
    try:
        async for msg in client.listen():
            if msg['type'] != 'message':
                continue
            event = Event.from_bus_msg(msg['data'])
            if event.type not in MAP_SENT_EVENT_TYPE:
                continue
            if not (issue_id := event.data.get('issue_id')):
                continue
            project_id = event.data.get('project_id')
            if not _check_issue_filters(issue_id, project_id, issue_ids_, project_ids_):
                continue
            yield SentEventOutput(
                type=MAP_SENT_EVENT_TYPE[event.type],
                data={'issue_id': issue_id},
            )
    finally:
        await client.unsubscribe('events')
        await client.close()


@router.get('')
async def get_issue_events(
    issue_ids: list[PydanticObjectId] | None = query_comma_separated_list_param(
        'ids',
        required=False,
        single_value_validator=pydantic_object_id_validator,
    ),
    project_ids: list[PydanticObjectId] | None = query_comma_separated_list_param(
        'project_ids',
        required=False,
        single_value_validator=pydantic_object_id_validator,
    ),
    boards_ids: list[PydanticObjectId] | None = query_comma_separated_list_param(
        'boards_ids',
        required=False,
        single_value_validator=pydantic_object_id_validator,
    ),
) -> StreamingResponse:
    if not CONFIG.REDIS_EVENT_BUS_URL:
        raise HTTPException(
            status_code=HTTPStatus.NOT_IMPLEMENTED,
            detail='Redis event bus is not configured',
        )
    if boards_ids:
        boards = await m.Board.find(bo.In(m.Board.id, set(boards_ids))).to_list()
        issue_ids = issue_ids or []
        project_ids = project_ids or []
        for board in boards:
            if not board.projects:
                issue_ids = None
                project_ids = None
                break
            project_ids.extend([pr.id for pr in board.projects])
    return StreamingResponse(
        issues_event_generator(issue_ids, project_ids),
        media_type='text/event-stream',
    )
