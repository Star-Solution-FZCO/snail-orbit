from http import HTTPStatus
from typing import Any
from uuid import UUID

from beanie import PydanticObjectId
from fastapi import Depends, HTTPException, Query
from pydantic import BaseModel, Field

import pm.models as m
from pm.api.context import current_user
from pm.api.events_bus import Event, EventType
from pm.api.exceptions import ValidateModelException
from pm.api.search.issue import transform_query
from pm.api.utils.files import resolve_files
from pm.api.utils.router import APIRouter
from pm.api.views.issue import IssueOutput
from pm.api.views.output import BaseListOutput, ModelIdOutput, SuccessPayloadOutput
from pm.utils.dateutils import utcnow
from pm.workflows import WorkflowException

__all__ = ('router',)

router = APIRouter()


class IssueCreate(BaseModel):
    project_id: PydanticObjectId
    subject: str
    text: str | None = None
    fields: dict[str, Any] = Field(default_factory=dict)
    attachments: list[UUID] = Field(default_factory=list)


class IssueUpdate(BaseModel):
    subject: str | None = None
    text: str | None = None
    fields: dict[str, Any] | None = None
    attachments: list[UUID] | None = None


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


@router.get('/{issue_id_or_alias}')
async def get_issue(
    issue_id_or_alias: PydanticObjectId | str,
) -> SuccessPayloadOutput[IssueOutput]:
    obj = await m.Issue.find_one_by_id_or_alias(issue_id_or_alias)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')
    return SuccessPayloadOutput(payload=IssueOutput.from_obj(obj))


@router.post('/')
async def create_issue(
    body: IssueCreate,
) -> SuccessPayloadOutput[IssueOutput]:
    user_ctx = current_user()
    now = utcnow()
    project: m.Project | None = await m.Project.find_one(
        m.Project.id == body.project_id, fetch_links=True
    )
    if not project:
        raise HTTPException(HTTPStatus.BAD_REQUEST, 'Project not found')
    attachments = {}
    if body.attachments:
        try:
            attachments = await resolve_files(body.attachments)
        except ValueError as err:
            raise HTTPException(HTTPStatus.BAD_REQUEST, str(err))

    validated_fields, validation_errors = await validate_custom_fields_values(
        body.fields, project
    )
    obj = m.Issue(
        subject=body.subject,
        text=body.text,
        project=m.ProjectLinkField(id=project.id, name=project.name, slug=project.slug),
        fields=validated_fields,
        attachments=[
            m.IssueAttachment(
                id=a_id,
                name=a_data.name,
                size=a_data.size,
                content_type=a_data.content_type,
                author=m.UserLinkField.from_obj(user_ctx.user),
                created_at=now,
            )
            for a_id, a_data in attachments.items()
        ],
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
    obj.aliases.append(await project.get_new_issue_alias())
    await obj.insert()
    await Event(type=EventType.ISSUE_CREATE, data={'issue_id': str(obj.id)}).send()
    return SuccessPayloadOutput(payload=IssueOutput.from_obj(obj))


@router.put('/{issue_id_or_alias}')
async def update_issue(
    issue_id_or_alias: PydanticObjectId | str,
    body: IssueUpdate,
) -> SuccessPayloadOutput[IssueOutput]:
    user_ctx = current_user()
    now = utcnow()
    obj: m.Issue | None = await m.Issue.find_one_by_id_or_alias(issue_id_or_alias)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')
    project = await obj.get_project(fetch_links=True)
    validation_errors = []
    for k, v in body.dict(exclude_unset=True).items():
        if k == 'fields':
            f_val, validation_errors = await validate_custom_fields_values(
                v, project, obj
            )
            obj.fields = f_val
            continue
        if k == 'attachments':
            extra_attachment_ids = [a_id for a_id in v if a_id not in obj.attachments]
            try:
                extra_attachments = await resolve_files(extra_attachment_ids)
            except ValueError as err:
                raise HTTPException(HTTPStatus.BAD_REQUEST, str(err))
            obj.attachments = [a for a in obj.attachments if a.id not in v]
            obj.attachments.extend(
                [
                    m.IssueAttachment(
                        id=a_id,
                        name=a_data.name,
                        size=a_data.size,
                        content_type=a_data.content_type,
                        author=m.UserLinkField.from_obj(user_ctx.user),
                        created_at=now,
                    )
                    for a_id, a_data in extra_attachments.items()
                ]
            )
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
    if obj.is_changed:
        obj.gen_history_record(user_ctx.user, now)
        await obj.replace()
        await Event(type=EventType.ISSUE_UPDATE, data={'issue_id': str(obj.id)}).send()
    return SuccessPayloadOutput(payload=IssueOutput.from_obj(obj))


@router.delete('/{issue_id_or_alias}')
async def delete_issue(
    issue_id_or_alias: PydanticObjectId | str,
) -> ModelIdOutput:
    obj: m.Issue | None = await m.Issue.find_one_by_id_or_alias(issue_id_or_alias)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')
    await obj.delete()
    await Event(type=EventType.ISSUE_DELETE, data={'issue_id': str(obj.id)}).send()
    return ModelIdOutput.from_obj(obj)


async def validate_custom_fields_values(
    fields: dict[str, Any], project: m.Project, issue: m.Issue | None = None
) -> tuple[list[m.CustomFieldValue], list[m.CustomFieldValidationError]]:
    project_fields = {f.name: f for f in project.custom_fields}
    issue_fields = {f.name: f for f in issue.fields} if issue else {}
    for f_name in fields:
        if f_name not in project_fields:
            raise HTTPException(
                HTTPStatus.BAD_REQUEST, f'Field {f_name} is not allowed'
            )

    results = []
    errors: list[m.CustomFieldValidationError] = []
    for f in project.custom_fields:  # type: m.CustomField
        if f.name not in fields:
            issue_field_val = issue_fields.get(f.name)
            fields[f.name] = (
                issue_field_val.value if issue_field_val else f.default_value
            )
        try:
            val_ = f.validate_value(fields[f.name])
        except m.CustomFieldValidationError as err:
            val_ = err.value
            errors.append(err)
        results.append(
            m.CustomFieldValue(
                id=f.id,
                name=f.name,
                type=f.type,
                value=val_,
            )
        )
    return results, errors
