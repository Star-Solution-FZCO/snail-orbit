from http import HTTPStatus
from typing import Self

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

import pm.models as m
from pm.api.context import current_user_context_dependency
from pm.api.views.output import BaseListOutput, ModelIdOutput, SuccessPayloadOutput
from pm.api.views.pararams import ListParams

__all__ = ('router',)

router = APIRouter(
    prefix='/issue',
    tags=['issue'],
    dependencies=[Depends(current_user_context_dependency)],
)


class IssueCommentOutput(BaseModel):
    text: str | None

    @classmethod
    def from_obj(cls, obj: m.IssueComment) -> Self:
        return cls(
            text=obj.text,
        )


class IssueCommentCreate(BaseModel):
    text: str | None = None


class ProjectField(BaseModel):
    id: PydanticObjectId
    name: str
    slug: str

    @classmethod
    def from_obj(cls, obj: m.Issue) -> Self:
        return cls(
            id=obj.project.id,
            name=obj.project.name,
            slug=obj.project.slug,
        )


class IssueOutput(BaseModel):
    id: PydanticObjectId
    project: ProjectField
    subject: str
    text: str | None
    comments: list[IssueCommentOutput]

    @classmethod
    def from_obj(cls, obj: m.Issue) -> Self:
        return cls(
            id=obj.id,
            project=ProjectField.from_obj(obj),
            subject=obj.subject,
            text=obj.text,
            comments=[IssueCommentOutput.from_obj(comment) for comment in obj.comments],
        )


class IssueCreate(BaseModel):
    project_id: PydanticObjectId
    subject: str
    text: str | None = None


class IssueUpdate(BaseModel):
    subject: str | None = None
    text: str | None = None


@router.get('/list')
async def list_issues(
    query: ListParams = Depends(),
) -> BaseListOutput[IssueOutput]:
    q = m.Issue.find().sort(m.Issue.id)
    results = []
    async for obj in q.limit(query.limit).skip(query.offset):
        results.append(IssueOutput.from_obj(obj))
    return BaseListOutput.make(
        count=await q.count(),
        limit=query.limit,
        offset=query.offset,
        items=results,
    )


@router.get('/{issue_id}')
async def get_issue(
    issue_id: PydanticObjectId,
) -> SuccessPayloadOutput[IssueOutput]:
    obj = await m.Issue.find_one(m.Issue.id == issue_id)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')
    return SuccessPayloadOutput(payload=IssueOutput.from_obj(obj))


@router.post('/')
async def create_issue(
    body: IssueCreate,
) -> ModelIdOutput:
    project = await m.Project.find_one(m.Project.id == body.project_id)
    if not project:
        raise HTTPException(HTTPStatus.BAD_REQUEST, 'Project not found')
    obj = m.Issue(
        subject=body.subject,
        text=body.text,
        project=m.ProjectLinkField(id=project.id, name=project.name, slug=project.slug),
    )
    await obj.insert()
    return ModelIdOutput.from_obj(obj)


@router.put('/{issue_id}')
async def update_issue(
    issue_id: PydanticObjectId,
    body: IssueUpdate,
) -> ModelIdOutput:
    obj = await m.Issue.find_one(m.Issue.id == issue_id)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')
    for k, v in body.dict(exclude_unset=True).items():
        setattr(obj, k, v)
    if obj.is_changed:
        await obj.save_changes()
    return ModelIdOutput.from_obj(obj)
