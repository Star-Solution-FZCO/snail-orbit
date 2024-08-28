from http import HTTPStatus
from typing import Any

from beanie import PydanticObjectId
from fastapi import Depends, HTTPException, Query
from pydantic import BaseModel, Field

import pm.models as m
from pm.api.events_bus import Event, EventType
from pm.api.exceptions import ValidateModelException
from pm.api.search.issue import transform_query
from pm.api.utils.router import APIRouter
from pm.api.views.issue import IssueOutput
from pm.api.views.output import BaseListOutput, SuccessPayloadOutput
from pm.workflows import WorkflowException

__all__ = ('router',)

router = APIRouter()


class IssueCreate(BaseModel):
    project_id: PydanticObjectId
    subject: str
    text: str | None = None
    fields: dict[str, Any] = Field(default_factory=dict)


class BoardPosition(BaseModel):
    board_id: PydanticObjectId
    after_issue: PydanticObjectId | None


class IssueUpdate(BaseModel):
    subject: str | None = None
    text: str | None = None
    fields: dict[str, Any] | None = None
    board_position: BoardPosition | None = None


class IssueListParams(BaseModel):
    q: str | None = Query(None, description='search query')
    limit: int = Query(50, le=50, description='limit results')
    offset: int = Query(0, description='offset')


@router.get('/list')
async def list_issues(
    query: IssueListParams = Depends(),
) -> BaseListOutput[IssueOutput]:
    flt = {}
    sort = (m.Issue.id,)
    if query.q:
        flt, sort_ = transform_query(query.q)
        sort = sort_ or sort
    q = m.Issue.find(flt).sort(*sort)
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
) -> SuccessPayloadOutput[IssueOutput]:
    project: m.Project | None = await m.Project.find_one(
        m.Project.id == body.project_id, fetch_links=True
    )
    if not project:
        raise HTTPException(HTTPStatus.BAD_REQUEST, 'Project not found')
    validated_fields, validation_errors = await validate_custom_fields_values(
        body.fields, project
    )
    obj = m.Issue(
        subject=body.subject,
        text=body.text,
        project=m.ProjectLinkField(id=project.id, name=project.name, slug=project.slug),
        fields=validated_fields,
    )
    if validation_errors:
        raise ValidateModelException(
            payload=IssueOutput.from_obj(obj),
            error_messages=['Custom field validation error'],
            error_fields={e.field.name: e.msg for e in validation_errors},
        )
    try:
        for wf in project.workflows:
            await wf.run(obj)
    except WorkflowException as err:
        raise ValidateModelException(
            payload=IssueOutput.from_obj(obj),
            error_messages=[err.msg],
            error_fields=err.fields_errors,
        )
    await obj.insert()
    await Event(type=EventType.ISSUE_CREATE, data={'issue_id': str(obj.id)}).send()
    return SuccessPayloadOutput(payload=IssueOutput.from_obj(obj))


@router.put('/{issue_id}')
async def update_issue(
    issue_id: PydanticObjectId,
    body: IssueUpdate,
) -> SuccessPayloadOutput[IssueOutput]:
    obj: m.Issue | None = await m.Issue.find_one(
        m.Issue.id == issue_id, fetch_links=True
    )
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')
    if body.board_position:
        board = await m.Board.find_one(m.Board.id == body.board_position.board_id)
        if not board:
            raise HTTPException(HTTPStatus.BAD_REQUEST, 'Board not found')
    project = await obj.get_project(fetch_links=True)
    validation_errors = []
    for k, v in body.dict(exclude_unset=True).items():
        if k == 'board_position':
            continue
        if k == 'fields':
            f_val, validation_errors = await validate_custom_fields_values(
                v, project, obj
            )
            obj.fields.update(f_val)
            continue
        setattr(obj, k, v)
    if validation_errors:
        raise ValidateModelException(
            payload=IssueOutput.from_obj(obj),
            error_messages=['Custom field validation error'],
            error_fields={e.field.name: e.msg for e in validation_errors},
        )
    try:
        for wf in project.workflows:
            await wf.run(obj)
    except WorkflowException as err:
        raise ValidateModelException(
            payload=IssueOutput.from_obj(obj),
            error_messages=[err.msg],
            error_fields=err.fields_errors,
        )
    if body.board_position:
        board.move_issue(obj.id, after_id=body.board_position.after_issue)
        await board.save_changes()
    if obj.is_changed:
        await obj.save_changes()
        await Event(type=EventType.ISSUE_UPDATE, data={'issue_id': str(obj.id)}).send()
    return SuccessPayloadOutput(payload=IssueOutput.from_obj(obj))


async def validate_custom_fields_values(
    fields: dict[str, Any], project: m.Project, issue: m.Issue | None = None
) -> tuple[dict[str, m.CustomFieldValue], list[m.CustomFieldValidationError]]:
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
    errors: list[m.CustomFieldValidationError] = []
    for key, val in fields.items():
        if key not in project_fields:
            raise HTTPException(HTTPStatus.BAD_REQUEST, f'Field {key} is not allowed')
        try:
            val_ = project_fields[key].validate_value(val)
        except m.CustomFieldValidationError as err:
            val_ = err.value
            errors.append(err)
        results[key] = m.CustomFieldValue(
            id=project_fields[key].id,
            type=project_fields[key].type,
            value=val_,
        )
    return results, errors
