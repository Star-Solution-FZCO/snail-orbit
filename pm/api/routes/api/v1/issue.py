from http import HTTPStatus
from typing import Any, Self

from beanie import PydanticObjectId
from fastapi import Depends, HTTPException
from pydantic import BaseModel, Field

import pm.models as m
from pm.api.context import current_user_context_dependency
from pm.api.utils.router import APIRouter
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
    fields: dict[str, m.CustomFieldValue]

    @classmethod
    def from_obj(cls, obj: m.Issue) -> Self:
        return cls(
            id=obj.id,
            project=ProjectField.from_obj(obj),
            subject=obj.subject,
            text=obj.text,
            comments=[IssueCommentOutput.from_obj(comment) for comment in obj.comments],
            fields=obj.fields,
        )


class IssueCreate(BaseModel):
    project_id: PydanticObjectId
    subject: str
    text: str | None = None
    fields: dict[str, Any] = Field(default_factory=dict)


class IssueUpdate(BaseModel):
    subject: str | None = None
    text: str | None = None
    fields: dict[str, Any] | None = None


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
    project: m.Project | None = await m.Project.find_one(
        m.Project.id == body.project_id, fetch_links=True
    )
    if not project:
        raise HTTPException(HTTPStatus.BAD_REQUEST, 'Project not found')
    validated_fields = await validate_custom_fields_values(body.fields, project)
    obj = m.Issue(
        subject=body.subject,
        text=body.text,
        project=m.ProjectLinkField(id=project.id, name=project.name, slug=project.slug),
        fields=validated_fields,
    )
    await obj.insert()
    return ModelIdOutput.from_obj(obj)


@router.put('/{issue_id}')
async def update_issue(
    issue_id: PydanticObjectId,
    body: IssueUpdate,
) -> ModelIdOutput:
    obj: m.Issue | None = await m.Issue.find_one(
        m.Issue.id == issue_id, fetch_links=True
    )
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')
    for k, v in body.dict(exclude_unset=True).items():
        if k == 'fields':
            project = await obj.get_project(fetch_links=True)
            v = await validate_custom_fields_values(v, project, obj)
            obj.fields.update(v)
            continue
        setattr(obj, k, v)
    if obj.is_changed:
        await obj.save_changes()
    return ModelIdOutput.from_obj(obj)


async def validate_custom_fields_values(
    fields: dict[str, Any], project: m.Project, issue: m.Issue | None = None
) -> dict[str, m.CustomFieldValue]:
    all_issue_fields = set(fields.keys())
    if issue:
        all_issue_fields |= set(issue.fields.keys())
    for f in project.custom_fields:  # type: m.CustomField
        if f.is_nullable:
            continue
        if f.name not in all_issue_fields:
            raise HTTPException(HTTPStatus.BAD_REQUEST, f'Field {f.name} is required')

    results = {}
    project_fields = {f.name: f for f in project.custom_fields}
    for key, val in fields.items():
        if key not in project_fields:
            raise HTTPException(HTTPStatus.BAD_REQUEST, f'Field {key} is not allowed')
        val = project_fields[key].validate_value(val)
        results[key] = m.CustomFieldValue(
            id=project_fields[key].id,
            type=project_fields[key].type,
            value=val,
        )
    return results
