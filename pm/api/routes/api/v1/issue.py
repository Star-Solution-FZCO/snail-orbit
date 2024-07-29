from typing import Self
from http import HTTPStatus

import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from starsol_sql_base.utils import count_select_query_results
from pydantic import BaseModel as PydanticBaseModel

import pm.models as m
from pm.api.db import db_session_dependency
from pm.api.views.factories.crud import CrudOutput, CrudCreateBody, CrudUpdateBody
from pm.api.views.output import BaseListOutput, SuccessPayloadOutput, ModelIdOutput
from pm.api.views.pararams import ListParams
from pm.api.context import current_user_context_dependency

__all__ = ('router',)

router = APIRouter(prefix='/issue', tags=['issue'], dependencies=[Depends(current_user_context_dependency)])


class IssueCommentOutput(CrudOutput[m.IssueComment]):
    id: int
    issue_id: int
    text: str | None


class IssueCommentCreate(PydanticBaseModel):
    text: str | None = None


class IssueOutput(PydanticBaseModel):
    id: int
    project_id: int
    subject: str
    text: str | None
    comments: list[IssueCommentOutput]

    @classmethod
    def from_obj(cls, obj: m.Issue) -> Self:
        return cls(
            id=obj.id,
            project_id=obj.project_id,
            subject=obj.subject,
            text=obj.text,
            comments=[
                IssueCommentOutput.from_obj(comment)
                for comment in obj.comments
            ],
        )


class IssueCreate(CrudCreateBody[m.Issue]):
    project_id: int
    subject: str
    text: str | None = None


class IssueUpdate(CrudUpdateBody[m.Issue]):
    subject: str | None = None
    text: str | None = None


@router.get('/list')
async def list_issues(
    query: ListParams = Depends(),
    session: AsyncSession = Depends(db_session_dependency),
) -> BaseListOutput[IssueOutput]:
    q = sa.select(m.Issue)
    count = await count_select_query_results(q, session=session)
    q = q.limit(query.limit).offset(query.offset)
    objs_ = await session.scalars(q)
    return BaseListOutput.make(
        count=count,
        limit=query.limit,
        offset=query.offset,
        items=[
            IssueOutput.from_obj(obj)
            for obj in objs_.all()
        ],
    )


@router.get('/{issue_id}')
async def get_issue(
    issue_id: int,
    session: AsyncSession = Depends(db_session_dependency),
) -> SuccessPayloadOutput[IssueOutput]:
    obj = await session.scalar(sa.select(m.Issue).where(m.Issue.id == issue_id))
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')
    return SuccessPayloadOutput(payload=IssueOutput.from_obj(obj))


@router.post('/')
async def create_issue(
    body: IssueCreate,
    session: AsyncSession = Depends(db_session_dependency),
) -> ModelIdOutput:
    project = await session.scalar(sa.select(m.Project).where(m.Project.id == body.project_id))
    if not project:
        raise HTTPException(HTTPStatus.BAD_REQUEST, 'Project not found')
    obj = m.Issue(
        project_id=body.project_id,
        subject=body.subject,
        text=body.text
    )
    session.add(obj)
    await session.commit()
    return ModelIdOutput.from_obj(obj)


@router.put('/{issue_id}')
async def update_issue(
    issue_id: int,
    body: IssueUpdate,
    session: AsyncSession = Depends(db_session_dependency),
) -> ModelIdOutput:
    obj = await session.scalar(sa.select(m.Issue).where(m.Issue.id == issue_id))
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')
    body.update_obj(obj)
    await session.commit()
    return ModelIdOutput.from_obj(obj)


@router.post('/{issue_id}/comment')
async def create_issue_comment(
    issue_id: int,
    body: IssueCommentCreate,
    session: AsyncSession = Depends(db_session_dependency),
) -> ModelIdOutput:
    issue = await session.scalar(sa.select(m.Issue).where(m.Issue.id == issue_id))
    if not issue:
        raise HTTPException(HTTPStatus.BAD_REQUEST, 'Issue not found')
    obj = m.IssueComment(
        issue_id=issue_id,
        text=body.text
    )
    session.add(obj)
    await session.commit()
    return ModelIdOutput.from_obj(obj)

