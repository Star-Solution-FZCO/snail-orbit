# pylint: disable=too-many-lines
from http import HTTPStatus
from typing import Annotated, Any
from uuid import UUID, uuid4

import beanie.operators as bo
from beanie import PydanticObjectId
from fastapi import Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

import pm.models as m
from pm.api.context import current_user
from pm.api.events_bus import send_event, send_task
from pm.api.exceptions import ValidateModelException
from pm.api.search.issue import (
    TransformError,
    get_suggestions,
    transform_query,
    transform_text_search,
)
from pm.api.utils.router import APIRouter
from pm.api.views.issue import IssueDraftOutput, IssueOutput
from pm.api.views.output import BaseListOutput, ModelIdOutput, SuccessPayloadOutput
from pm.api.views.params import IssueSearchParams
from pm.api.views.select import SelectParams
from pm.permissions import PermAnd, Permissions
from pm.services.files import resolve_files
from pm.services.issue import update_tags_on_close_resolve
from pm.tasks.actions import task_notify_by_pararam
from pm.utils.dateutils import utcnow
from pm.utils.events_bus import Event, EventType, Task, TaskType
from pm.workflows import WorkflowException

__all__ = ('router',)

router = APIRouter()


class IssueCreate(BaseModel):
    project_id: PydanticObjectId
    subject: str
    text: str | None = None
    fields: Annotated[dict[str, Any], Field(default_factory=dict)]
    attachments: Annotated[list[UUID], Field(default_factory=list)]


class IssueUpdate(BaseModel):
    project_id: PydanticObjectId | None = None
    subject: str | None = None
    text: str | None = None
    fields: dict[str, Any] | None = None
    attachments: list[UUID] | None = None


class IssueDraftCreate(BaseModel):
    project_id: PydanticObjectId | None = None
    subject: str | None = None
    text: str | None = None
    fields: Annotated[dict[str, Any], Field(default_factory=dict)]
    attachments: Annotated[list[UUID], Field(default_factory=list)]


class IssueDraftUpdate(BaseModel):
    project_id: PydanticObjectId | None = None
    subject: str | None = None
    text: str | None = None
    fields: dict[str, Any] | None = None
    attachments: list[UUID] | None = None


class IssueListParams(IssueSearchParams):
    limit: int = Query(50, le=50, description='limit results')
    offset: int = Query(0, description='offset')


class IssueInterlinkCreate(BaseModel):
    target_issues: list[PydanticObjectId | str]
    type: m.IssueInterlinkTypeT


class IssueInterlinkUpdate(BaseModel):
    type: m.IssueInterlinkTypeT


class IssueTagCreate(BaseModel):
    tag_id: PydanticObjectId


class IssueTagDelete(BaseModel):
    tag_id: PydanticObjectId


@router.get('/list')
async def list_issues(
    query: IssueListParams = Depends(),
) -> BaseListOutput[IssueOutput]:
    user_ctx = current_user()
    q = m.Issue.find(
        bo.In(
            m.Issue.project.id,
            user_ctx.get_projects_with_permission(Permissions.ISSUE_READ),
        )
    )

    if query.q:
        try:
            flt = await transform_query(query.q, current_user_email=user_ctx.user.email)
        except TransformError as err:
            raise HTTPException(
                HTTPStatus.BAD_REQUEST,
                err.message,
            ) from err
        q = q.find(flt)
    if query.search:
        q = q.find(transform_text_search(query.search))
    q = q.sort(m.Issue.id).project(m.Issue.get_ro_projection_model())
    return await BaseListOutput.make_from_query(
        q,
        limit=query.limit,
        offset=query.offset,
        projection_fn=IssueOutput.from_obj,
    )


@router.get('/search/suggest')
async def get_search_suggestion(
    q: str = Query(),
) -> JSONResponse:
    try:
        suggestions = await get_suggestions(q)
    except TransformError as err:
        raise HTTPException(
            HTTPStatus.BAD_REQUEST,
            err.message,
        ) from err
    return JSONResponse(content=suggestions)


@router.post('/draft')
async def create_draft(
    body: IssueDraftCreate,
) -> SuccessPayloadOutput[IssueDraftOutput]:
    user_ctx = current_user()
    now = utcnow()
    project: m.Project | None = None
    if body.project_id:
        project = await m.Project.find_one(
            m.Project.id == body.project_id, fetch_links=True
        )
        if not project:
            raise HTTPException(HTTPStatus.BAD_REQUEST, 'Project not found')
    attachments = {}
    if body.attachments:
        try:
            attachments = await resolve_files(body.attachments)
        except ValueError as err:
            raise HTTPException(HTTPStatus.BAD_REQUEST, str(err)) from err
    if not project and body.fields:
        raise HTTPException(
            HTTPStatus.BAD_REQUEST, 'Fields can be specified without a project'
        )
    validated_fields, validation_errors = [], []
    if project:
        validated_fields, validation_errors = await validate_custom_fields_values(
            body.fields,
            project,
            ignore_none_errors=True,
        )
    obj = m.IssueDraft(
        subject=body.subject,
        text=body.text,
        project=(
            m.ProjectLinkField(id=project.id, name=project.name, slug=project.slug)
            if project
            else None
        ),
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
        created_by=m.UserLinkField.from_obj(user_ctx.user),
    )
    if validation_errors:
        raise ValidateModelException(
            payload=IssueDraftOutput.from_obj(obj),
            error_messages=['Custom field validation error'],
            error_fields={e.field.name: e.msg for e in validation_errors},
        )
    await obj.insert()
    return SuccessPayloadOutput(payload=IssueDraftOutput.from_obj(obj))


@router.get('/draft/list')
async def list_drafts(
    limit: int = Query(50, le=50, description='limit results'),
    offset: int = Query(0, description='offset'),
) -> BaseListOutput[IssueDraftOutput]:
    user_ctx = current_user()
    q = m.IssueDraft.find(m.IssueDraft.created_by.id == user_ctx.user.id).sort(
        m.IssueDraft.id
    )
    return await BaseListOutput.make_from_query(
        q,
        limit=limit,
        offset=offset,
        projection_fn=IssueDraftOutput.from_obj,
    )


@router.get('/draft/select')
async def select_draft(
    query: SelectParams = Depends(),
) -> BaseListOutput[IssueDraftOutput]:
    user_ctx = current_user()
    q = m.IssueDraft.find(
        m.IssueDraft.created_by.id == user_ctx.user.id,
        bo.RegEx(m.IssueDraft.subject, query.search, 'i'),
    ).sort(m.IssueDraft.id)
    return await BaseListOutput.make_from_query(
        q,
        limit=query.limit,
        offset=query.offset,
        projection_fn=IssueDraftOutput.from_obj,
    )


@router.get('/draft/{draft_id}')
async def get_draft(
    draft_id: PydanticObjectId,
) -> SuccessPayloadOutput[IssueDraftOutput]:
    user_ctx = current_user()
    obj: m.IssueDraft | None = await m.IssueDraft.find_one(m.IssueDraft.id == draft_id)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Draft not found')
    if obj.created_by.id != user_ctx.user.id:
        raise HTTPException(
            HTTPStatus.FORBIDDEN, 'You do not have permission to read this draft'
        )
    return SuccessPayloadOutput(payload=IssueDraftOutput.from_obj(obj))


@router.put('/draft/{draft_id}')
async def update_draft(
    draft_id: PydanticObjectId,
    body: IssueDraftUpdate,
) -> SuccessPayloadOutput[IssueDraftOutput]:
    user_ctx = current_user()
    now = utcnow()
    obj: m.IssueDraft | None = await m.IssueDraft.find_one(m.IssueDraft.id == draft_id)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Draft not found')
    if obj.created_by.id != user_ctx.user.id:
        raise HTTPException(
            HTTPStatus.FORBIDDEN, 'You do not have permission to update this draft'
        )
    if 'project_id' in body.model_fields_set:
        project: m.Project | None = None
        if body.project_id:
            if not (
                project := await m.Project.find_one(
                    m.Project.id == body.project_id, fetch_links=True
                )
            ):
                raise HTTPException(HTTPStatus.BAD_REQUEST, 'Project not found')
        obj.project = m.ProjectLinkField.from_obj(project) if project else None
        obj.fields = filter_valid_project_fields(obj.fields, project)
    else:
        project = await obj.get_project(fetch_links=True)
    if not project and body.fields:
        raise HTTPException(
            HTTPStatus.BAD_REQUEST, 'Fields can be specified without a project'
        )
    validation_errors = []
    if project:
        f_val, validation_errors = await validate_custom_fields_values(
            body.fields or {},
            project,
            obj,
            ignore_none_errors=True,
        )
        obj.fields = f_val
    for k, v in body.model_dump(
        exclude={'project_id', 'fields'}, exclude_unset=True
    ).items():
        if k == 'attachments':
            new_attachment_ids = set(v)
            current_attachment_ids = set(a.id for a in obj.attachments)
            extra_attachment_ids = new_attachment_ids - current_attachment_ids
            remove_attachment_ids = current_attachment_ids - new_attachment_ids
            try:
                extra_attachments = await resolve_files(list(extra_attachment_ids))
            except ValueError as err:
                raise HTTPException(HTTPStatus.BAD_REQUEST, str(err)) from err
            obj.attachments = [
                a for a in obj.attachments if a.id not in remove_attachment_ids
            ]
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
            payload=IssueDraftOutput.from_obj(obj),
            error_messages=['Custom field validation error'],
            error_fields={e.field.name: e.msg for e in validation_errors},
        )
    if obj.is_changed:
        await obj.replace()
    return SuccessPayloadOutput(payload=IssueDraftOutput.from_obj(obj))


@router.delete('/draft/{draft_id}')
async def delete_draft(
    draft_id: PydanticObjectId,
) -> ModelIdOutput:
    user_ctx = current_user()
    obj: m.IssueDraft | None = await m.IssueDraft.find_one(m.IssueDraft.id == draft_id)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Draft not found')
    if obj.created_by.id != user_ctx.user.id:
        raise HTTPException(
            HTTPStatus.FORBIDDEN, 'You do not have permission to delete this draft'
        )
    await obj.delete()
    return ModelIdOutput.from_obj(obj)


@router.post('/draft/{draft_id}/create')
async def create_issue_from_draft(
    draft_id: PydanticObjectId,
) -> SuccessPayloadOutput[IssueOutput]:
    user_ctx = current_user()
    now = utcnow()
    draft: m.IssueDraft | None = await m.IssueDraft.find_one(
        m.IssueDraft.id == draft_id
    )
    if not draft:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Draft not found')
    if draft.created_by.id != user_ctx.user.id:
        raise HTTPException(
            HTTPStatus.FORBIDDEN,
            'You do not have permission to create issue from this draft',
        )
    if not draft.project:
        raise HTTPException(
            HTTPStatus.BAD_REQUEST, 'Cannot create issue from draft without a project'
        )

    user_ctx.validate_project_permission(
        draft.project, PermAnd(Permissions.ISSUE_CREATE, Permissions.ISSUE_READ)
    )

    if not draft.subject:
        raise HTTPException(
            HTTPStatus.BAD_REQUEST, 'Cannot create issue from draft without subject'
        )
    project = await draft.get_project(fetch_links=True)

    _, validation_errors = await validate_custom_fields_values(
        {},
        project,
        draft,
    )
    if validation_errors:
        raise ValidateModelException(
            payload=IssueDraftOutput.from_obj(draft),
            error_messages=['Custom field validation error'],
            error_fields={e.field.name: e.msg for e in validation_errors},
        )

    attachments = {}
    if draft.attachments:
        try:
            attachments = await resolve_files([a.id for a in draft.attachments])
        except ValueError as err:
            raise HTTPException(HTTPStatus.BAD_REQUEST, str(err)) from err

    obj = m.Issue(
        subject=draft.subject,
        text=draft.text,
        project=m.ProjectLinkField(id=project.id, name=project.name, slug=project.slug),
        fields=draft.fields,
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
        subscribers=[user_ctx.user.id],
        created_by=m.UserLinkField.from_obj(user_ctx.user),
    )
    try:
        for wf in project.workflows:
            if isinstance(wf, m.OnChangeWorkflow):
                await wf.run(obj)
    except WorkflowException as err:
        raise ValidateModelException(
            payload=IssueOutput.from_obj(obj),
            error_messages=[err.msg],
            error_fields=err.fields_errors,
        ) from err
    obj.aliases.append(await project.get_new_issue_alias())
    await obj.insert()
    await draft.delete()
    await send_event(
        Event(
            type=EventType.ISSUE_CREATE,
            data={'issue_id': str(obj.id), 'project_id': str(obj.project.id)},
        )
    )
    for a in obj.attachments:
        if a.encryption:
            continue
        await send_task(Task(type=TaskType.OCR, data={'attachment_id': str(a.id)}))
    task_notify_by_pararam.delay(
        'create',
        obj.subject,
        obj.id_readable,
        [str(s) for s in obj.subscribers],
        str(project.id),
        author=user_ctx.user.email,
    )
    return SuccessPayloadOutput(payload=IssueOutput.from_obj(obj))


@router.get('/{issue_id_or_alias}')
async def get_issue(
    issue_id_or_alias: PydanticObjectId | str,
) -> SuccessPayloadOutput[IssueOutput]:
    obj = await m.Issue.find_one_by_id_or_alias(issue_id_or_alias)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')

    user_ctx = current_user()
    user_ctx.validate_issue_permission(obj, Permissions.ISSUE_READ)

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

    user_ctx.validate_project_permission(
        project, PermAnd(Permissions.ISSUE_CREATE, Permissions.ISSUE_READ)
    )

    attachments = {}
    if body.attachments:
        try:
            attachments = await resolve_files(body.attachments)
        except ValueError as err:
            raise HTTPException(HTTPStatus.BAD_REQUEST, str(err)) from err

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
        subscribers=[user_ctx.user.id],
        created_by=m.UserLinkField.from_obj(user_ctx.user),
    )
    if validation_errors:
        raise ValidateModelException(
            payload=IssueOutput.from_obj(obj),
            error_messages=['Custom field validation error'],
            error_fields={e.field.name: e.msg for e in validation_errors},
        )
    try:
        for wf in project.workflows:
            if isinstance(wf, m.OnChangeWorkflow):
                await wf.run(obj)
    except WorkflowException as err:
        raise ValidateModelException(
            payload=IssueOutput.from_obj(obj),
            error_messages=[err.msg],
            error_fields=err.fields_errors,
        ) from err
    obj.aliases.append(await project.get_new_issue_alias())
    await obj.insert()
    await send_event(
        Event(
            type=EventType.ISSUE_CREATE,
            data={'issue_id': str(obj.id), 'project_id': str(obj.project.id)},
        )
    )
    for a in obj.attachments:
        if a.encryption:
            continue
        await send_task(Task(type=TaskType.OCR, data={'attachment_id': str(a.id)}))
    task_notify_by_pararam.delay(
        'create',
        obj.subject,
        obj.id_readable,
        [str(s) for s in obj.subscribers],
        str(project.id),
        author=user_ctx.user.email,
    )
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

    user_ctx.validate_issue_permission(
        obj, PermAnd(Permissions.ISSUE_UPDATE, Permissions.ISSUE_READ)
    )

    if 'project_id' in body.model_fields_set:
        project = await m.Project.find_one(
            m.Project.id == body.project_id, fetch_links=True
        )
        if not project:
            raise HTTPException(HTTPStatus.BAD_REQUEST, 'Project not found')
        user_ctx.validate_project_permission(
            project, PermAnd(Permissions.ISSUE_READ, Permissions.ISSUE_CREATE)
        )
        obj.project = m.ProjectLinkField.from_obj(project)
        obj.fields = filter_valid_project_fields(obj.fields, project)
    else:
        project = await obj.get_project(fetch_links=True)

    validation_errors = []
    extra_attachment_ids = set()
    for k, v in body.dict(exclude_unset=True).items():
        if k == 'fields':
            f_val, validation_errors = await validate_custom_fields_values(
                v, project, obj
            )
            obj.fields = f_val
            continue
        if k == 'attachments':
            new_attachment_ids = set(v)
            current_attachment_ids = set(a.id for a in obj.attachments)
            extra_attachment_ids = new_attachment_ids - current_attachment_ids
            remove_attachment_ids = current_attachment_ids - new_attachment_ids
            try:
                extra_attachments = await resolve_files(list(extra_attachment_ids))
            except ValueError as err:
                raise HTTPException(HTTPStatus.BAD_REQUEST, str(err)) from err
            obj.attachments = [
                a for a in obj.attachments if a.id not in remove_attachment_ids
            ]
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
    await update_tags_on_close_resolve(obj)
    try:
        for wf in project.workflows:
            if isinstance(wf, m.OnChangeWorkflow):
                await wf.run(obj)
    except WorkflowException as err:
        raise ValidateModelException(
            payload=IssueOutput.from_obj(obj),
            error_messages=[err.msg],
            error_fields=err.fields_errors,
        ) from err
    if obj.is_changed:
        obj.gen_history_record(user_ctx.user, now)
        obj.updated_at = now
        obj.updated_by = m.UserLinkField.from_obj(user_ctx.user)
        await obj.replace()
        task_notify_by_pararam.delay(
            'update',
            obj.subject,
            obj.id_readable,
            [str(s) for s in obj.subscribers],
            str(obj.project.id),
            author=user_ctx.user.email,
        )
        await send_event(
            Event(
                type=EventType.ISSUE_UPDATE,
                data={'issue_id': str(obj.id), 'project_id': str(obj.project.id)},
            )
        )
        for a in obj.attachments:
            if a.id not in extra_attachment_ids or a.encryption:
                continue
            await send_task(Task(type=TaskType.OCR, data={'attachment_id': str(a.id)}))
        await m.Issue.update_issue_embedded_links(obj)
    return SuccessPayloadOutput(payload=IssueOutput.from_obj(obj))


@router.delete('/{issue_id_or_alias}')
async def delete_issue(
    issue_id_or_alias: PydanticObjectId | str,
) -> ModelIdOutput:
    obj: m.Issue | None = await m.Issue.find_one_by_id_or_alias(issue_id_or_alias)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')

    user_ctx = current_user()
    user_ctx.validate_issue_permission(
        obj, PermAnd(Permissions.ISSUE_DELETE, Permissions.ISSUE_READ)
    )

    await obj.delete()
    task_notify_by_pararam.delay(
        'delete',
        obj.subject,
        obj.id_readable,
        [str(s) for s in obj.subscribers],
        str(obj.project.id),
        author=user_ctx.user.email,
    )
    await send_event(
        Event(
            type=EventType.ISSUE_DELETE,
            data={'issue_id': str(obj.id), 'project_id': str(obj.project.id)},
        )
    )
    return ModelIdOutput.from_obj(obj)


@router.post('/{issue_id_or_alias}/subscribe')
async def subscribe_issue(
    issue_id_or_alias: PydanticObjectId | str,
) -> SuccessPayloadOutput[IssueOutput]:
    obj: m.Issue | None = await m.Issue.find_one_by_id_or_alias(issue_id_or_alias)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')

    user_ctx = current_user()
    user_ctx.validate_issue_permission(obj, Permissions.ISSUE_READ)

    if user_ctx.user.id not in obj.subscribers:
        obj.subscribers.append(user_ctx.user.id)
        await obj.replace()
    return SuccessPayloadOutput(payload=IssueOutput.from_obj(obj))


@router.post('/{issue_id_or_alias}/unsubscribe')
async def unsubscribe_issue(
    issue_id_or_alias: PydanticObjectId | str,
) -> SuccessPayloadOutput[IssueOutput]:
    obj: m.Issue | None = await m.Issue.find_one_by_id_or_alias(issue_id_or_alias)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')

    user_ctx = current_user()
    user_ctx.validate_issue_permission(obj, Permissions.ISSUE_READ)

    if user_ctx.user.id in obj.subscribers:
        obj.subscribers.remove(user_ctx.user.id)
        await obj.replace()
    return SuccessPayloadOutput(payload=IssueOutput.from_obj(obj))


@router.post('/{issue_id_or_alias}/link')
async def link_issues(
    issue_id_or_alias: PydanticObjectId | str,
    body: IssueInterlinkCreate,
) -> SuccessPayloadOutput[IssueOutput]:
    obj: m.Issue | None = await m.Issue.find_one_by_id_or_alias(issue_id_or_alias)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')

    user_ctx = current_user()
    user_ctx.validate_issue_permission(
        obj, PermAnd(Permissions.ISSUE_UPDATE, Permissions.ISSUE_READ)
    )

    target_issues: list[m.Issue] = await m.Issue.find(
        bo.Or(
            bo.In(m.Issue.id, body.target_issues),
            bo.In(m.Issue.aliases, body.target_issues),
        )
    ).to_list()

    if not target_issues:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Target issues not found')

    for target_issue in target_issues:
        user_ctx.validate_issue_permission(
            target_issue, PermAnd(Permissions.ISSUE_READ, Permissions.ISSUE_UPDATE)
        )

        if obj.id == target_issue.id:
            raise HTTPException(HTTPStatus.BAD_REQUEST, 'Cannot link issue to itself')

        if any(il.issue.id == target_issue.id for il in obj.interlinks):
            raise HTTPException(
                HTTPStatus.CONFLICT, f'Issue already linked to {target_issue.id}'
            )

        il_id = uuid4()

        obj.interlinks.append(
            m.IssueInterlink(
                id=il_id,
                issue=m.IssueLinkField.from_obj(target_issue),
                type=body.type,
            )
        )

        target_issue.interlinks.append(
            m.IssueInterlink(
                id=il_id,
                issue=m.IssueLinkField.from_obj(obj),
                type=body.type.inverse(),
            )
        )
        await target_issue.replace()

    await obj.replace()
    return SuccessPayloadOutput(payload=IssueOutput.from_obj(obj))


@router.get('/{issue_id_or_alias}/link/target/select')
async def select_linkable_issues(
    issue_id_or_alias: PydanticObjectId | str,
    query: SelectParams = Depends(),
) -> BaseListOutput[IssueOutput]:
    obj: m.Issue | None = await m.Issue.find_one_by_id_or_alias(issue_id_or_alias)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')

    user_ctx = current_user()
    user_ctx.validate_issue_permission(obj, Permissions.ISSUE_READ)

    q = m.Issue.find(
        bo.And(
            bo.NE(m.Issue.id, obj.id),
            bo.NotIn(m.Issue.id, [il.issue.id for il in obj.interlinks]),
            bo.In(
                m.Issue.project.id,
                user_ctx.get_projects_with_permission(
                    PermAnd(Permissions.ISSUE_READ, Permissions.ISSUE_UPDATE)
                ),
            ),
            bo.Or(
                bo.RegEx(m.Issue.subject, query.search, 'i'),
                bo.RegEx(m.Issue.aliases, query.search, 'i'),
            ),
        )
    ).sort(m.Issue.id)
    return await BaseListOutput.make_from_query(
        q,
        limit=query.limit,
        offset=query.offset,
        projection_fn=IssueOutput.from_obj,
    )


@router.put('/{issue_id_or_alias}/link/{interlink_id}')
async def update_link(
    issue_id_or_alias: PydanticObjectId | str,
    interlink_id: UUID,
    body: IssueInterlinkUpdate,
) -> SuccessPayloadOutput[IssueOutput]:
    obj: m.Issue | None = await m.Issue.find_one_by_id_or_alias(issue_id_or_alias)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')

    user_ctx = current_user()
    user_ctx.validate_issue_permission(
        obj, PermAnd(Permissions.ISSUE_UPDATE, Permissions.ISSUE_READ)
    )

    src_il = next((il for il in obj.interlinks if il.id == interlink_id), None)
    if not src_il:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Interlink not found')

    if src_il.type == body.type:
        raise HTTPException(HTTPStatus.CONFLICT, 'Interlink type is the same')

    target_obj: m.Issue | None = await m.Issue.find_one(m.Issue.id == src_il.issue.id)
    if not target_obj:
        raise HTTPException(HTTPStatus.INTERNAL_SERVER_ERROR, 'Target issue not found')
    target_il = next(
        (il for il in target_obj.interlinks if il.id == interlink_id), None
    )
    if not target_il:
        raise HTTPException(
            HTTPStatus.INTERNAL_SERVER_ERROR, 'Target interlink not found'
        )

    user_ctx.validate_issue_permission(
        target_obj, PermAnd(Permissions.ISSUE_READ, Permissions.ISSUE_UPDATE)
    )

    src_il.type = body.type
    target_il.type = body.type.inverse()

    await obj.replace()
    await target_obj.replace()

    return SuccessPayloadOutput(payload=IssueOutput.from_obj(obj))


@router.delete('/{issue_id_or_alias}/link/{interlink_id}')
async def unlink_issue(
    issue_id_or_alias: PydanticObjectId | str,
    interlink_id: UUID,
) -> SuccessPayloadOutput[IssueOutput]:
    obj: m.Issue | None = await m.Issue.find_one_by_id_or_alias(issue_id_or_alias)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')

    user_ctx = current_user()
    user_ctx.validate_issue_permission(
        obj, PermAnd(Permissions.ISSUE_UPDATE, Permissions.ISSUE_READ)
    )

    src_il = next((il for il in obj.interlinks if il.id == interlink_id), None)
    if not src_il:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Interlink not found')

    target_obj: m.Issue | None = await m.Issue.find_one(m.Issue.id == src_il.issue.id)
    if not target_obj:
        raise HTTPException(HTTPStatus.INTERNAL_SERVER_ERROR, 'Target issue not found')
    target_il = next(
        (il for il in target_obj.interlinks if il.id == interlink_id), None
    )
    if not target_il:
        raise HTTPException(
            HTTPStatus.INTERNAL_SERVER_ERROR, 'Target interlink not found'
        )

    user_ctx.validate_issue_permission(
        target_obj, PermAnd(Permissions.ISSUE_READ, Permissions.ISSUE_UPDATE)
    )

    obj.interlinks.remove(src_il)
    target_obj.interlinks.remove(target_il)

    await obj.replace()
    await target_obj.replace()

    return SuccessPayloadOutput(payload=IssueOutput.from_obj(obj))


@router.put('/{issue_id_or_alias}/tag')
async def tag_issue(
    issue_id_or_alias: PydanticObjectId | str,
    body: IssueTagCreate,
) -> SuccessPayloadOutput[IssueOutput]:
    obj: m.Issue | None = await m.Issue.find_one_by_id_or_alias(issue_id_or_alias)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')

    user_ctx = current_user()
    user_ctx.validate_issue_permission(
        obj, PermAnd(Permissions.ISSUE_UPDATE, Permissions.ISSUE_READ)
    )

    tag: m.Tag | None = await m.Tag.find_one(m.Tag.id == body.tag_id)
    if not tag:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Tag not found')

    if tag.id in {t.id for t in obj.tags}:
        raise HTTPException(HTTPStatus.CONFLICT, 'Issue already tagged')

    obj.tags.append(m.TagLinkField.from_obj(tag))
    await obj.replace()

    return SuccessPayloadOutput(payload=IssueOutput.from_obj(obj))


@router.put('/{issue_id_or_alias}/untag')
async def untag_issue(
    issue_id_or_alias: PydanticObjectId | str,
    body: IssueTagDelete,
) -> SuccessPayloadOutput[IssueOutput]:
    obj: m.Issue | None = await m.Issue.find_one_by_id_or_alias(issue_id_or_alias)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')

    user_ctx = current_user()
    user_ctx.validate_issue_permission(
        obj, PermAnd(Permissions.ISSUE_UPDATE, Permissions.ISSUE_READ)
    )

    tag: m.Tag | None = await m.Tag.find_one(m.Tag.id == body.tag_id)
    if not tag:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Tag not found')

    if tag.id not in {t.id for t in obj.tags}:
        raise HTTPException(HTTPStatus.CONFLICT, 'Issue not tagged')

    obj.tags = [t for t in obj.tags if t.id != tag.id]
    await obj.replace()

    return SuccessPayloadOutput(payload=IssueOutput.from_obj(obj))


async def validate_custom_fields_values(
    fields: dict[str, Any],
    project: m.Project,
    issue: m.Issue | None = None,
    ignore_none_errors: bool = False,
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
        except m.CustomFieldCanBeNoneError as err:
            val_ = None
            if not ignore_none_errors:
                errors.append(err)
        except m.CustomFieldValidationError as err:
            val_ = err.value
            errors.append(err)
        results.append(
            m.CustomFieldValue(
                id=f.id,
                gid=f.gid,
                name=f.name,
                type=f.type,
                value=val_,
            )
        )
    return results, errors


def filter_valid_project_fields(
    fields: list[m.CustomFieldValue], project: m.Project | None
) -> list[m.CustomFieldValue]:
    if not project:
        return []
    project_field_ids = {f.id for f in project.custom_fields}
    return [f for f in fields if f.id in project_field_ids]
