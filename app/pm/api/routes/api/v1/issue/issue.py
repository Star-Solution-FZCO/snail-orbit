# pylint: disable=too-many-lines
from http import HTTPStatus
from typing import Annotated, Any
from uuid import UUID, uuid4

import beanie.operators as bo
from beanie import PydanticObjectId
from fastapi import Depends, HTTPException, Query
from pydantic import BaseModel, Field

import pm.models as m
from pm.api.context import current_user
from pm.api.events_bus import send_event, send_task
from pm.api.exceptions import ValidateModelError
from pm.api.issue_query import (
    IssueQueryTransformError,
    transform_query,
)
from pm.api.issue_query.search import transform_text_search
from pm.api.routes.api.v1.project import ProjectListItemOutput
from pm.api.utils.router import APIRouter
from pm.api.views.encryption import EncryptedObject
from pm.api.views.error_responses import READ_ERRORS, WRITE_ERRORS, error_responses
from pm.api.views.issue import (
    AttachmentSourceTypeT,
    IssueAttachmentBatchCreateBody,
    IssueAttachmentBatchDeleteBody,
    IssueAttachmentBody,
    IssueAttachmentWithSourceOutput,
    IssueDraftOutput,
    IssueListOutput,
    IssueOutput,
)
from pm.api.views.output import (
    BaseListOutput,
    BatchFailureItem,
    BatchOperationOutput,
    BatchSuccessItem,
    ErrorOutput,
    ModelIdOutput,
    SuccessOutput,
    SuccessPayloadOutput,
    UUIDOutput,
)
from pm.api.views.params import IssueSearchParams, ListParams
from pm.api.views.select import SelectParams
from pm.permissions import PermAnd, ProjectPermissions
from pm.services.files import resolve_files
from pm.services.issue import update_tags_on_close_resolve
from pm.tasks.actions.notification_batch import schedule_batched_notification
from pm.utils.dateutils import utcnow
from pm.utils.events_bus import Event, EventType, Task, TaskType
from pm.workflows import WorkflowError

from ._utils import update_attachments

__all__ = ('router',)

router = APIRouter()


class IssueCreate(BaseModel):
    project_id: PydanticObjectId
    subject: str
    text: EncryptedObject | None = None
    fields: Annotated[dict[str, Any], Field(default_factory=dict)]
    attachments: Annotated[list[IssueAttachmentBody], Field(default_factory=list)]


class IssueUpdate(BaseModel):
    project_id: PydanticObjectId | None = None
    subject: str | None = None
    text: EncryptedObject | None = None
    fields: dict[str, Any] | None = None
    attachments: list[IssueAttachmentBody] | None = None


class IssueDraftCreate(BaseModel):
    project_id: PydanticObjectId | None = None
    subject: str | None = None
    text: EncryptedObject | None = None
    fields: Annotated[dict[str, Any], Field(default_factory=dict)]
    attachments: Annotated[list[IssueAttachmentBody], Field(default_factory=list)]


class IssueDraftUpdate(BaseModel):
    project_id: PydanticObjectId | None = None
    subject: str | None = None
    text: EncryptedObject | None = None
    fields: dict[str, Any] | None = None
    attachments: list[IssueAttachmentBody] | None = None


class IssueListParams(IssueSearchParams):
    limit: int = Query(50, le=1000, description='limit results')
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


class IssueListByIdsRequest(BaseModel):
    issue_ids: list[PydanticObjectId | str] = Field(
        description='List of issue IDs or aliases to fetch'
    )


class IssuePermissionCreate(BaseModel):
    target_type: m.PermissionTargetType
    target_id: PydanticObjectId
    role_id: PydanticObjectId


class IssuePermissionOutput(BaseModel):
    id: UUID
    target_type: m.PermissionTargetType
    target: m.GroupLinkField | m.UserLinkField
    role: m.ProjectRoleLinkField


@router.get('/list')
async def list_issues(
    query: IssueListParams = Depends(),
) -> BaseListOutput[IssueListOutput]:
    user_ctx = current_user()
    q = m.Issue.find(
        user_ctx.get_issue_filter_for_permission(ProjectPermissions.ISSUE_READ),
    )

    pipeline = []
    sort_pipeline = [{'$sort': {'updated_at': -1}}]
    if query.q or query.sort_by:
        try:
            flt, sort_pipeline_ = await transform_query(
                query.q or '',
                current_user_email=user_ctx.user.email,
                sort_by=query.sort_by,
            )
            if flt:
                q = q.find(flt)
            if sort_pipeline_:
                sort_pipeline = sort_pipeline_
        except IssueQueryTransformError as err:
            raise HTTPException(
                HTTPStatus.BAD_REQUEST,
                err.message,
            ) from err
    if query.search:
        q = q.find(transform_text_search(query.search))
    cnt = await q.count()

    pipeline += sort_pipeline
    pipeline += [
        {
            '$skip': query.offset,
        },
        {
            '$limit': query.limit,
        },
    ]
    q = q.aggregate(
        pipeline,
        projection_model=m.IssueRO,
    )
    accessible_tag_ids = await user_ctx.get_accessible_tag_ids()

    return BaseListOutput.make(
        items=[
            await IssueListOutput.from_obj(obj, accessible_tag_ids) async for obj in q
        ],
        count=cnt,
        limit=query.limit,
        offset=query.offset,
    )


@router.post('/list', responses=error_responses(*READ_ERRORS))
async def list_issues_by_ids(
    body: IssueListByIdsRequest,
) -> BaseListOutput[IssueListOutput]:
    user_ctx = current_user()

    q = m.Issue.find(
        bo.And(
            bo.Or(
                bo.In(m.Issue.id, body.issue_ids),
                bo.In(m.Issue.aliases, body.issue_ids),
            ),
            user_ctx.get_issue_filter_for_permission(ProjectPermissions.ISSUE_READ),
        )
    )

    issues_dict = {}
    async for issue in q:
        issues_dict[str(issue.id)] = issue
        for alias in issue.aliases:
            issues_dict[alias] = issue

    accessible_tag_ids = await user_ctx.get_accessible_tag_ids()

    items = []
    for requested_id in body.issue_ids:
        requested_id_str = str(requested_id)
        if issue := issues_dict.get(requested_id_str):
            items.append(await IssueListOutput.from_obj(issue, accessible_tag_ids))

    return BaseListOutput.make(
        items=items,
        count=len(items),
        limit=len(items),
        offset=0,
    )


@router.post('/draft', responses=error_responses(*WRITE_ERRORS))
async def create_draft(
    body: IssueDraftCreate,
) -> SuccessPayloadOutput[IssueDraftOutput]:
    user_ctx = current_user()
    project: m.Project | None = None
    if body.project_id:
        project = await m.Project.find_one(
            m.Project.id == body.project_id,
            fetch_links=True,
        )
        if not project:
            raise HTTPException(HTTPStatus.BAD_REQUEST, 'Project not found')
    if not project and body.fields:
        raise HTTPException(
            HTTPStatus.BAD_REQUEST,
            'Fields can be specified without a project',
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
        text=body.text.value if body.text else None,
        project=(
            m.ProjectLinkField(id=project.id, name=project.name, slug=project.slug)
            if project
            else None
        ),
        fields=validated_fields,
        created_by=m.UserLinkField.from_obj(user_ctx.user),
        encryption=body.text.encryption if body.text else None,
    )
    await update_attachments(obj, body.attachments, user=user_ctx.user)
    if validation_errors:
        raise ValidateModelError(
            payload=await IssueDraftOutput.from_obj(obj),
            error_messages=['Custom field validation error'],
            error_fields={e.field.name: e.msg for e in validation_errors},
        )
    await obj.insert()
    return SuccessPayloadOutput(payload=await IssueDraftOutput.from_obj(obj))


@router.get('/draft/list')
async def list_drafts(
    limit: int = Query(50, le=1000, description='limit results'),
    offset: int = Query(0, description='offset'),
) -> BaseListOutput[IssueDraftOutput]:
    user_ctx = current_user()
    q = m.IssueDraft.find(m.IssueDraft.created_by.id == user_ctx.user.id).sort(
        m.IssueDraft.id,
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


@router.get('/project/select')
async def select_projects_for_issue_creation(
    query: SelectParams = Depends(),
) -> BaseListOutput[ProjectListItemOutput]:
    user_ctx = current_user()

    read_project_ids = user_ctx.get_projects_with_permission(
        ProjectPermissions.PROJECT_READ
    )
    create_issue_project_ids = user_ctx.get_projects_with_permission(
        ProjectPermissions.ISSUE_CREATE
    )
    project_ids = read_project_ids & create_issue_project_ids

    q = m.Project.find(
        bo.In(m.Project.id, project_ids),
        bo.Eq(m.Project.is_active, True),
    )

    if query.search:
        q = q.find(m.Project.search_query(query.search))

    # Count for pagination
    cnt = await q.count()

    # Build pipeline to sort favorites first, then by name
    pipeline = [
        {
            '$addFields': {
                'is_favorite': {'$in': [user_ctx.user.id, '$favorite_of']},
            },
        },
        {
            '$sort': {
                'is_favorite': -1,
                'slug': 1,
            },
        },
        {
            '$skip': query.offset,
        },
        {
            '$limit': query.limit,
        },
    ]

    q_agg = q.aggregate(pipeline, projection_model=m.Project.get_ro_projection_model())

    return BaseListOutput.make(
        items=[ProjectListItemOutput.from_obj(obj) async for obj in q_agg],
        count=cnt,
        limit=query.limit,
        offset=query.offset,
    )


@router.get('/draft/{draft_id}', responses=error_responses(*READ_ERRORS))
async def get_draft(
    draft_id: PydanticObjectId,
) -> SuccessPayloadOutput[IssueDraftOutput]:
    user_ctx = current_user()
    obj: m.IssueDraft | None = await m.IssueDraft.find_one(m.IssueDraft.id == draft_id)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Draft not found')
    if obj.created_by.id != user_ctx.user.id:
        raise HTTPException(
            HTTPStatus.FORBIDDEN,
            'You do not have permission to read this draft',
        )
    return SuccessPayloadOutput(payload=await IssueDraftOutput.from_obj(obj))


@router.put(
    '/draft/{draft_id}',
    responses=error_responses(
        (HTTPStatus.BAD_REQUEST, ErrorOutput),
        (HTTPStatus.UNAUTHORIZED, ErrorOutput),
        (HTTPStatus.FORBIDDEN, ErrorOutput),
        (HTTPStatus.NOT_FOUND, ErrorOutput),
        (HTTPStatus.UNPROCESSABLE_ENTITY, ErrorOutput),
    ),
)
async def update_draft(
    draft_id: PydanticObjectId,
    body: IssueDraftUpdate,
) -> SuccessPayloadOutput[IssueDraftOutput]:
    user_ctx = current_user()
    obj: m.IssueDraft | None = await m.IssueDraft.find_one(m.IssueDraft.id == draft_id)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Draft not found')
    if obj.created_by.id != user_ctx.user.id:
        raise HTTPException(
            HTTPStatus.FORBIDDEN,
            'You do not have permission to update this draft',
        )
    if 'project_id' in body.model_fields_set:
        if obj.project is not None:
            current_project = await obj.get_project(fetch_links=True)
            if current_project and current_project.encryption_settings is not None:
                raise HTTPException(
                    HTTPStatus.UNPROCESSABLE_ENTITY,
                    'Cannot change project for drafts in encrypted projects',
                )

        project: m.Project | None = None
        if body.project_id and not (
            project := await m.Project.find_one(
                m.Project.id == body.project_id,
                fetch_links=True,
            )
        ):
            raise HTTPException(HTTPStatus.BAD_REQUEST, 'Project not found')
        obj.project = m.ProjectLinkField.from_obj(project) if project else None
        obj.fields = filter_valid_project_fields(obj.fields, project)
    else:
        project = await obj.get_project(fetch_links=True)
    if not project and body.fields:
        raise HTTPException(
            HTTPStatus.BAD_REQUEST,
            'Fields can be specified without a project',
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
        exclude={'project_id', 'fields', 'attachments', 'text'},
        exclude_unset=True,
    ).items():
        setattr(obj, k, v)
    if 'attachments' in body.model_fields_set:
        await update_attachments(obj, body.attachments, user=user_ctx.user)
    if 'text' in body.model_fields_set:
        obj.text = body.text.value if body.text else None
        obj.encryption = body.text.encryption if body.text else None
    if validation_errors:
        raise ValidateModelError(
            payload=await IssueDraftOutput.from_obj(obj),
            error_messages=['Custom field validation error'],
            error_fields={e.field.name: e.msg for e in validation_errors},
        )
    if obj.is_changed:
        await obj.replace()
    return SuccessPayloadOutput(payload=await IssueDraftOutput.from_obj(obj))


@router.delete('/draft/{draft_id}', responses=error_responses(*READ_ERRORS))
async def delete_draft(
    draft_id: PydanticObjectId,
) -> ModelIdOutput:
    user_ctx = current_user()
    obj: m.IssueDraft | None = await m.IssueDraft.find_one(m.IssueDraft.id == draft_id)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Draft not found')
    if obj.created_by.id != user_ctx.user.id:
        raise HTTPException(
            HTTPStatus.FORBIDDEN,
            'You do not have permission to delete this draft',
        )
    await obj.delete()
    return ModelIdOutput.from_obj(obj)


@router.post('/draft/{draft_id}/create', responses=error_responses(*WRITE_ERRORS))
async def create_issue_from_draft(
    draft_id: PydanticObjectId,
) -> SuccessPayloadOutput[IssueOutput]:
    user_ctx = current_user()
    now = utcnow()
    draft: m.IssueDraft | None = await m.IssueDraft.find_one(
        m.IssueDraft.id == draft_id,
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
            HTTPStatus.BAD_REQUEST,
            'Cannot create issue from draft without a project',
        )

    user_ctx.validate_project_permission(
        draft.project,
        PermAnd(ProjectPermissions.ISSUE_CREATE, ProjectPermissions.ISSUE_READ),
    )

    if not draft.subject:
        raise HTTPException(
            HTTPStatus.BAD_REQUEST,
            'Cannot create issue from draft without subject',
        )
    project = await draft.get_project(fetch_links=True)

    _, validation_errors = await validate_custom_fields_values(
        {},
        project,
        draft,
    )
    if validation_errors:
        raise ValidateModelError(
            payload=await IssueDraftOutput.from_obj(draft),
            error_messages=['Custom field validation error'],
            error_fields={e.field.name: e.msg for e in validation_errors},
        )

    obj = m.Issue(
        subject=draft.subject,
        text=draft.text,
        project=m.ProjectLinkField(id=project.id, name=project.name, slug=project.slug),
        fields=draft.fields,
        subscribers=[user_ctx.user.id],
        created_by=m.UserLinkField.from_obj(user_ctx.user),
        created_at=now,
        updated_by=m.UserLinkField.from_obj(user_ctx.user),
        updated_at=now,
        encryption=draft.encryption,
    )
    await update_attachments(obj, draft.attachments, user=user_ctx.user, now=now)
    try:
        for wf in project.workflows:
            if isinstance(wf, m.OnChangeWorkflow):
                await wf.run(obj)
    except WorkflowError as err:
        raise ValidateModelError(
            payload=await IssueOutput.from_obj(obj),
            error_messages=[err.msg],
            error_fields=err.fields_errors,
        ) from err
    obj.aliases.append(await project.get_new_issue_alias())
    obj.update_state(now=now)
    await obj.insert()
    await draft.delete()
    await send_event(
        Event(
            type=EventType.ISSUE_CREATE,
            data={'issue_id': str(obj.id), 'project_id': str(obj.project.id)},
        ),
    )
    for a in obj.attachments:
        if a.encryption:
            continue
        await send_task(Task(type=TaskType.OCR, data={'attachment_id': str(a.id)}))
    await schedule_batched_notification(
        'create',
        obj.subject,
        obj.id_readable,
        [str(s) for s in obj.subscribers],
        str(project.id),
        author=user_ctx.user.email,
    )
    accessible_tag_ids = await user_ctx.get_accessible_tag_ids()
    return SuccessPayloadOutput(
        payload=await IssueOutput.from_obj(obj, accessible_tag_ids)
    )


@router.get('/{issue_id_or_alias}', responses=error_responses(*READ_ERRORS))
async def get_issue(
    issue_id_or_alias: PydanticObjectId | str,
) -> SuccessPayloadOutput[IssueOutput]:
    obj = await m.Issue.find_one_by_id_or_alias(issue_id_or_alias)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')

    user_ctx = current_user()
    user_ctx.validate_issue_permission(obj, ProjectPermissions.ISSUE_READ)

    accessible_tag_ids = await user_ctx.get_accessible_tag_ids()

    return SuccessPayloadOutput(
        payload=await IssueOutput.from_obj(obj, accessible_tag_ids)
    )


@router.post('/', responses=error_responses(*WRITE_ERRORS))
async def create_issue(
    body: IssueCreate,
) -> SuccessPayloadOutput[IssueOutput]:
    user_ctx = current_user()
    now = utcnow()
    project: m.Project | None = await m.Project.find_one(
        m.Project.id == body.project_id,
        fetch_links=True,
    )
    if not project:
        raise HTTPException(HTTPStatus.BAD_REQUEST, 'Project not found')

    user_ctx.validate_project_permission(
        project,
        PermAnd(ProjectPermissions.ISSUE_CREATE, ProjectPermissions.ISSUE_READ),
    )

    validated_fields, validation_errors = await validate_custom_fields_values(
        body.fields,
        project,
    )
    obj = m.Issue(
        subject=body.subject,
        text=body.text.value if body.text else None,
        project=m.ProjectLinkField(id=project.id, name=project.name, slug=project.slug),
        fields=validated_fields,
        subscribers=[user_ctx.user.id],
        created_by=m.UserLinkField.from_obj(user_ctx.user),
        created_at=now,
        updated_by=m.UserLinkField.from_obj(user_ctx.user),
        updated_at=now,
        encryption=body.text.encryption if body.text else None,
    )
    await update_attachments(obj, body.attachments, user=user_ctx.user, now=now)
    if validation_errors:
        raise ValidateModelError(
            payload=await IssueOutput.from_obj(obj),
            error_messages=['Custom field validation error'],
            error_fields={e.field.name: e.msg for e in validation_errors},
        )
    try:
        for wf in project.workflows:
            if isinstance(wf, m.OnChangeWorkflow):
                await wf.run(obj)
    except WorkflowError as err:
        raise ValidateModelError(
            payload=await IssueOutput.from_obj(obj),
            error_messages=[err.msg],
            error_fields=err.fields_errors,
        ) from err
    obj.aliases.append(await project.get_new_issue_alias())
    obj.update_state(now=now)
    await obj.insert()
    await send_event(
        Event(
            type=EventType.ISSUE_CREATE,
            data={'issue_id': str(obj.id), 'project_id': str(obj.project.id)},
        ),
    )
    for a in obj.attachments:
        if a.encryption:
            continue
        await send_task(Task(type=TaskType.OCR, data={'attachment_id': str(a.id)}))
    await schedule_batched_notification(
        'create',
        obj.subject,
        obj.id_readable,
        [str(s) for s in obj.subscribers],
        str(project.id),
        author=user_ctx.user.email,
    )
    accessible_tag_ids = await user_ctx.get_accessible_tag_ids()
    return SuccessPayloadOutput(
        payload=await IssueOutput.from_obj(obj, accessible_tag_ids)
    )


@router.put(
    '/{issue_id_or_alias}',
    responses=error_responses(
        (HTTPStatus.BAD_REQUEST, ErrorOutput),
        (HTTPStatus.UNAUTHORIZED, ErrorOutput),
        (HTTPStatus.FORBIDDEN, ErrorOutput),
        (HTTPStatus.NOT_FOUND, ErrorOutput),
        (HTTPStatus.UNPROCESSABLE_ENTITY, ErrorOutput),
    ),
)
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
        obj,
        PermAnd(ProjectPermissions.ISSUE_UPDATE, ProjectPermissions.ISSUE_READ),
    )

    move_to_another_project = (
        'project_id' in body.model_fields_set and body.project_id != obj.project.id
    )
    if move_to_another_project:
        current_project = await obj.get_project(fetch_links=True)
        if current_project.encryption_settings is not None:
            raise HTTPException(
                HTTPStatus.UNPROCESSABLE_ENTITY,
                'Cannot change project for issues in encrypted projects',
            )

        project = await m.Project.find_one(
            m.Project.id == body.project_id,
            fetch_links=True,
        )
        if not project:
            raise HTTPException(HTTPStatus.BAD_REQUEST, 'Project not found')
        user_ctx.validate_project_permission(
            project,
            PermAnd(ProjectPermissions.ISSUE_READ, ProjectPermissions.ISSUE_CREATE),
        )
        obj.project = m.ProjectLinkField.from_obj(project)
        obj.fields = filter_valid_project_fields(obj.fields, project)
    else:
        project = await obj.get_project(fetch_links=True)

    validation_errors = []
    for k, v in body.model_dump(
        exclude={'attachments', 'text'},
        exclude_unset=True,
    ).items():
        if k == 'fields':
            f_val, validation_errors = await validate_custom_fields_values(
                v,
                project,
                obj,
            )
            obj.fields = f_val
            continue
        setattr(obj, k, v)
    issue_attachment_ids = {a.id for a in obj.attachments}
    extra_attachment_ids = {
        a.id for a in body.attachments or [] if a.id not in issue_attachment_ids
    }
    if 'attachments' in body.model_fields_set:
        await update_attachments(obj, body.attachments, user=user_ctx.user, now=now)
    if 'text' in body.model_fields_set:
        obj.text = body.text.value if body.text else None
        obj.encryption = body.text.encryption if body.text else None
    if validation_errors:
        raise ValidateModelError(
            payload=await IssueOutput.from_obj(obj),
            error_messages=['Custom field validation error'],
            error_fields={e.field.name: e.msg for e in validation_errors},
        )
    try:
        for wf in project.workflows:
            if isinstance(wf, m.OnChangeWorkflow):
                await wf.run(obj)
    except WorkflowError as err:
        raise ValidateModelError(
            payload=await IssueOutput.from_obj(obj),
            error_messages=[err.msg],
            error_fields=err.fields_errors,
        ) from err
    obj.update_state(now=now)
    await update_tags_on_close_resolve(obj)
    if move_to_another_project:
        if existing_alias := obj.get_alias_by_slug(project.slug):
            obj.aliases.remove(existing_alias)
            obj.aliases.append(existing_alias)
        else:
            obj.aliases.append(await project.get_new_issue_alias())
    if obj.is_changed:
        obj.gen_history_record(user_ctx.user, now)
        latest_history_changes = obj.history[-1].changes if obj.history else []
        obj.updated_at = now
        obj.updated_by = m.UserLinkField.from_obj(user_ctx.user)
        await obj.replace()
        await schedule_batched_notification(
            'update',
            obj.subject,
            obj.id_readable,
            [str(s) for s in obj.subscribers],
            str(obj.project.id),
            author=user_ctx.user.email,
            field_changes=latest_history_changes,
        )
        await send_event(
            Event(
                type=EventType.ISSUE_UPDATE,
                data={'issue_id': str(obj.id), 'project_id': str(obj.project.id)},
            ),
        )
        for a in obj.attachments:
            if a.id not in extra_attachment_ids or a.encryption:
                continue
            await send_task(Task(type=TaskType.OCR, data={'attachment_id': str(a.id)}))
        await m.Issue.update_issue_embedded_links(obj)
    accessible_tag_ids = await user_ctx.get_accessible_tag_ids()
    return SuccessPayloadOutput(
        payload=await IssueOutput.from_obj(obj, accessible_tag_ids)
    )


@router.delete('/{issue_id_or_alias}', responses=error_responses(*READ_ERRORS))
async def delete_issue(
    issue_id_or_alias: PydanticObjectId | str,
) -> ModelIdOutput:
    obj: m.Issue | None = await m.Issue.find_one_by_id_or_alias(issue_id_or_alias)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')

    user_ctx = current_user()
    user_ctx.validate_issue_permission(
        obj,
        PermAnd(ProjectPermissions.ISSUE_DELETE, ProjectPermissions.ISSUE_READ),
    )

    await obj.delete()
    await m.Issue.find(
        {'interlinks': {'$elemMatch': {'issue.id': obj.id}}},
    ).update(
        {'$pull': {'interlinks': {'issue.id': obj.id}}},
    )

    await schedule_batched_notification(
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
        ),
    )
    return ModelIdOutput.from_obj(obj)


@router.post('/{issue_id_or_alias}/subscribe', responses=error_responses(*WRITE_ERRORS))
async def subscribe_issue(
    issue_id_or_alias: PydanticObjectId | str,
) -> SuccessPayloadOutput[IssueOutput]:
    obj: m.Issue | None = await m.Issue.find_one_by_id_or_alias(issue_id_or_alias)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')

    user_ctx = current_user()
    user_ctx.validate_issue_permission(obj, ProjectPermissions.ISSUE_READ)

    if user_ctx.user.id not in obj.subscribers:
        obj.subscribers.append(user_ctx.user.id)
        await obj.replace()
    accessible_tag_ids = await user_ctx.get_accessible_tag_ids()
    return SuccessPayloadOutput(
        payload=await IssueOutput.from_obj(obj, accessible_tag_ids)
    )


@router.post(
    '/{issue_id_or_alias}/unsubscribe',
    responses=error_responses(*WRITE_ERRORS),
)
async def unsubscribe_issue(
    issue_id_or_alias: PydanticObjectId | str,
) -> SuccessPayloadOutput[IssueOutput]:
    obj: m.Issue | None = await m.Issue.find_one_by_id_or_alias(issue_id_or_alias)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')

    user_ctx = current_user()
    user_ctx.validate_issue_permission(obj, ProjectPermissions.ISSUE_READ)

    if user_ctx.user.id in obj.subscribers:
        obj.subscribers.remove(user_ctx.user.id)
        await obj.replace()
    accessible_tag_ids = await user_ctx.get_accessible_tag_ids()
    return SuccessPayloadOutput(
        payload=await IssueOutput.from_obj(obj, accessible_tag_ids)
    )


@router.post('/{issue_id_or_alias}/link', responses=error_responses(*WRITE_ERRORS))
async def link_issues(
    issue_id_or_alias: PydanticObjectId | str,
    body: IssueInterlinkCreate,
) -> SuccessPayloadOutput[IssueOutput]:
    obj: m.Issue | None = await m.Issue.find_one_by_id_or_alias(issue_id_or_alias)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')

    user_ctx = current_user()
    user_ctx.validate_issue_permission(
        obj,
        PermAnd(ProjectPermissions.ISSUE_UPDATE, ProjectPermissions.ISSUE_READ),
    )

    target_issues: list[m.Issue] = await m.Issue.find(
        bo.And(
            bo.Or(
                bo.In(m.Issue.id, body.target_issues),
                bo.In(m.Issue.aliases, body.target_issues),
            ),
            user_ctx.get_issue_filter_for_permission(ProjectPermissions.ISSUE_READ),
        ),
    ).to_list()

    if not target_issues:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Target issues not found')

    for target_issue in target_issues:
        user_ctx.validate_issue_permission(
            target_issue,
            PermAnd(ProjectPermissions.ISSUE_READ, ProjectPermissions.ISSUE_UPDATE),
        )

        if obj.id == target_issue.id:
            raise HTTPException(HTTPStatus.BAD_REQUEST, 'Cannot link issue to itself')

        if any(il.issue.id == target_issue.id for il in obj.interlinks):
            raise HTTPException(
                HTTPStatus.CONFLICT,
                f'Issue already linked to {target_issue.id_readable}',
            )

        il_id = uuid4()

        obj.interlinks.append(
            m.IssueInterlink(
                id=il_id,
                issue=m.IssueLinkField.from_obj(target_issue),
                type=body.type,
            ),
        )

        target_issue.interlinks.append(
            m.IssueInterlink(
                id=il_id,
                issue=m.IssueLinkField.from_obj(obj),
                type=body.type.inverse(),
            ),
        )
        await target_issue.replace()

    await obj.replace()
    accessible_tag_ids = await user_ctx.get_accessible_tag_ids()
    return SuccessPayloadOutput(
        payload=await IssueOutput.from_obj(obj, accessible_tag_ids)
    )


@router.get(
    '/{issue_id_or_alias}/link/target/select',
    responses=error_responses(*READ_ERRORS),
)
async def select_linkable_issues(
    issue_id_or_alias: PydanticObjectId | str,
    query: SelectParams = Depends(),
) -> BaseListOutput[IssueListOutput]:
    obj: m.Issue | None = await m.Issue.find_one_by_id_or_alias(issue_id_or_alias)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')

    user_ctx = current_user()
    user_ctx.validate_issue_permission(obj, ProjectPermissions.ISSUE_READ)

    q = m.Issue.find(
        bo.And(
            bo.NE(m.Issue.id, obj.id),
            bo.NotIn(m.Issue.id, [il.issue.id for il in obj.interlinks]),
            user_ctx.get_issue_filter_for_permission(ProjectPermissions.ISSUE_READ),
            user_ctx.get_issue_filter_for_permission(ProjectPermissions.ISSUE_UPDATE),
            bo.Or(
                bo.RegEx(m.Issue.subject, query.search, 'i'),
                bo.RegEx(m.Issue.aliases, query.search, 'i'),
            ),
        ),
    ).sort(m.Issue.id)
    return await BaseListOutput.make_from_query(
        q,
        limit=query.limit,
        offset=query.offset,
        projection_fn=IssueListOutput.from_obj,
    )


@router.put(
    '/{issue_id_or_alias}/link/{interlink_id}',
    responses=error_responses(
        (HTTPStatus.BAD_REQUEST, ErrorOutput),
        (HTTPStatus.UNAUTHORIZED, ErrorOutput),
        (HTTPStatus.FORBIDDEN, ErrorOutput),
        (HTTPStatus.NOT_FOUND, ErrorOutput),
        (HTTPStatus.UNPROCESSABLE_ENTITY, ErrorOutput),
    ),
)
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
        obj,
        PermAnd(ProjectPermissions.ISSUE_UPDATE, ProjectPermissions.ISSUE_READ),
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
        (il for il in target_obj.interlinks if il.id == interlink_id),
        None,
    )
    if not target_il:
        raise HTTPException(
            HTTPStatus.INTERNAL_SERVER_ERROR,
            'Target interlink not found',
        )

    user_ctx.validate_issue_permission(
        target_obj,
        PermAnd(ProjectPermissions.ISSUE_READ, ProjectPermissions.ISSUE_UPDATE),
    )

    src_il.type = body.type
    target_il.type = body.type.inverse()

    await obj.replace()
    await target_obj.replace()

    accessible_tag_ids = await user_ctx.get_accessible_tag_ids()
    return SuccessPayloadOutput(
        payload=await IssueOutput.from_obj(obj, accessible_tag_ids)
    )


@router.delete(
    '/{issue_id_or_alias}/link/{interlink_id}',
    responses=error_responses(*READ_ERRORS),
)
async def unlink_issue(
    issue_id_or_alias: PydanticObjectId | str,
    interlink_id: UUID,
) -> SuccessPayloadOutput[IssueOutput]:
    obj: m.Issue | None = await m.Issue.find_one_by_id_or_alias(issue_id_or_alias)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')

    user_ctx = current_user()
    user_ctx.validate_issue_permission(
        obj,
        PermAnd(ProjectPermissions.ISSUE_UPDATE, ProjectPermissions.ISSUE_READ),
    )

    src_il = next((il for il in obj.interlinks if il.id == interlink_id), None)
    if not src_il:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Interlink not found')

    target_obj: m.Issue | None = await m.Issue.find_one(m.Issue.id == src_il.issue.id)
    target_il = None

    if target_obj:
        user_ctx.validate_issue_permission(
            target_obj,
            PermAnd(ProjectPermissions.ISSUE_READ, ProjectPermissions.ISSUE_UPDATE),
        )
        target_il = next(
            (il for il in target_obj.interlinks if il.id == interlink_id),
            None,
        )

    obj.interlinks.remove(src_il)
    await obj.replace()

    if target_obj and target_il:
        target_obj.interlinks.remove(target_il)
        await target_obj.replace()

    accessible_tag_ids = await user_ctx.get_accessible_tag_ids()
    return SuccessPayloadOutput(
        payload=await IssueOutput.from_obj(obj, accessible_tag_ids)
    )


@router.put(
    '/{issue_id_or_alias}/tag',
    responses=error_responses(
        (HTTPStatus.BAD_REQUEST, ErrorOutput),
        (HTTPStatus.UNAUTHORIZED, ErrorOutput),
        (HTTPStatus.FORBIDDEN, ErrorOutput),
        (HTTPStatus.NOT_FOUND, ErrorOutput),
        (HTTPStatus.UNPROCESSABLE_ENTITY, ErrorOutput),
    ),
)
async def tag_issue(
    issue_id_or_alias: PydanticObjectId | str,
    body: IssueTagCreate,
) -> SuccessPayloadOutput[IssueOutput]:
    obj: m.Issue | None = await m.Issue.find_one_by_id_or_alias(issue_id_or_alias)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')

    user_ctx = current_user()
    user_ctx.validate_issue_permission(
        obj,
        PermAnd(ProjectPermissions.ISSUE_UPDATE, ProjectPermissions.ISSUE_READ),
    )

    tag: m.Tag | None = await m.Tag.find_one(m.Tag.id == body.tag_id)
    if not tag:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Tag not found')

    if not tag.check_permissions(user_ctx, m.PermissionType.VIEW):
        raise HTTPException(HTTPStatus.FORBIDDEN, 'Tag access denied')

    if tag.id in {t.id for t in obj.tags}:
        raise HTTPException(HTTPStatus.CONFLICT, 'Issue already tagged')

    obj.tags.append(m.TagLinkField.from_obj(tag))
    await obj.replace()

    accessible_tag_ids = await user_ctx.get_accessible_tag_ids()
    return SuccessPayloadOutput(
        payload=await IssueOutput.from_obj(obj, accessible_tag_ids)
    )


@router.put(
    '/{issue_id_or_alias}/untag',
    responses=error_responses(
        (HTTPStatus.BAD_REQUEST, ErrorOutput),
        (HTTPStatus.UNAUTHORIZED, ErrorOutput),
        (HTTPStatus.FORBIDDEN, ErrorOutput),
        (HTTPStatus.NOT_FOUND, ErrorOutput),
        (HTTPStatus.UNPROCESSABLE_ENTITY, ErrorOutput),
    ),
)
async def untag_issue(
    issue_id_or_alias: PydanticObjectId | str,
    body: IssueTagDelete,
) -> SuccessPayloadOutput[IssueOutput]:
    obj: m.Issue | None = await m.Issue.find_one_by_id_or_alias(issue_id_or_alias)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')

    user_ctx = current_user()
    user_ctx.validate_issue_permission(
        obj,
        PermAnd(ProjectPermissions.ISSUE_UPDATE, ProjectPermissions.ISSUE_READ),
    )

    tag: m.Tag | None = await m.Tag.find_one(m.Tag.id == body.tag_id)
    if not tag:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Tag not found')

    if not tag.check_permissions(user_ctx, m.PermissionType.VIEW):
        raise HTTPException(HTTPStatus.FORBIDDEN, 'Tag access denied')

    if tag.id not in {t.id for t in obj.tags}:
        raise HTTPException(HTTPStatus.CONFLICT, 'Issue not tagged')

    obj.tags = [t for t in obj.tags if t.id != tag.id]
    await obj.replace()

    accessible_tag_ids = await user_ctx.get_accessible_tag_ids()
    return SuccessPayloadOutput(
        payload=await IssueOutput.from_obj(obj, accessible_tag_ids)
    )


@router.get(
    '/{issue_id_or_alias}/permissions',
    responses=error_responses(
        (HTTPStatus.UNAUTHORIZED, ErrorOutput),
        (HTTPStatus.FORBIDDEN, ErrorOutput),
        (HTTPStatus.NOT_FOUND, ErrorOutput),
    ),
)
async def get_issue_permissions(
    issue_id_or_alias: PydanticObjectId | str,
    query: SelectParams = Depends(),
) -> BaseListOutput[IssuePermissionOutput]:
    obj: m.Issue | None = await m.Issue.find_one_by_id_or_alias(issue_id_or_alias)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')

    user_ctx = current_user()
    user_ctx.validate_issue_permission(obj, ProjectPermissions.ISSUE_READ)

    return BaseListOutput.make(
        items=[
            IssuePermissionOutput(
                id=perm.id,
                target_type=perm.target_type,
                target=perm.target,
                role=perm.role,
            )
            for perm in obj.permissions[query.offset : query.offset + query.limit]
        ],
        count=len(obj.permissions),
        limit=query.limit,
        offset=query.offset,
    )


@router.post(
    '/{issue_id_or_alias}/permission',
    responses=error_responses(
        (HTTPStatus.BAD_REQUEST, ErrorOutput),
        (HTTPStatus.UNAUTHORIZED, ErrorOutput),
        (HTTPStatus.FORBIDDEN, ErrorOutput),
        (HTTPStatus.NOT_FOUND, ErrorOutput),
        (HTTPStatus.CONFLICT, ErrorOutput),
    ),
)
async def grant_issue_permission(
    issue_id_or_alias: PydanticObjectId | str,
    body: IssuePermissionCreate,
) -> UUIDOutput:
    obj: m.Issue | None = await m.Issue.find_one_by_id_or_alias(issue_id_or_alias)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')

    user_ctx = current_user()
    user_ctx.validate_issue_permission(obj, ProjectPermissions.ISSUE_UPDATE)

    role: m.ProjectRole | None = await m.ProjectRole.find_one(
        m.ProjectRole.id == body.role_id
    )
    if not role:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Role not found')

    if body.target_type == m.PermissionTargetType.GROUP:
        target: m.Group | None = await m.Group.find_one(
            m.Group.id == body.target_id, with_children=True
        )
        if not target:
            raise HTTPException(HTTPStatus.NOT_FOUND, 'Group not found')
        permission = m.ProjectPermission(
            target_type=body.target_type,
            target=m.GroupLinkField.from_obj(target),
            role=m.ProjectRoleLinkField.from_obj(role),
        )
    else:
        target: m.User | None = await m.User.find_one(m.User.id == body.target_id)
        if not target:
            raise HTTPException(HTTPStatus.NOT_FOUND, 'User not found')
        permission = m.ProjectPermission(
            target_type=body.target_type,
            target=m.UserLinkField.from_obj(target),
            role=m.ProjectRoleLinkField.from_obj(role),
        )

    if any(perm == permission for perm in obj.permissions):
        raise HTTPException(HTTPStatus.CONFLICT, 'Permission already exists')
    obj.permissions.append(permission)
    await obj.replace()
    return UUIDOutput.make(permission.id)


@router.delete(
    '/{issue_id_or_alias}/permission/{permission_id}',
    responses=error_responses(
        (HTTPStatus.UNAUTHORIZED, ErrorOutput),
        (HTTPStatus.FORBIDDEN, ErrorOutput),
        (HTTPStatus.NOT_FOUND, ErrorOutput),
    ),
)
async def revoke_issue_permission(
    issue_id_or_alias: PydanticObjectId | str,
    permission_id: UUID,
) -> UUIDOutput:
    obj: m.Issue | None = await m.Issue.find_one_by_id_or_alias(issue_id_or_alias)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')

    user_ctx = current_user()
    user_ctx.validate_issue_permission(
        obj,
        PermAnd(
            ProjectPermissions.ISSUE_READ,
            ProjectPermissions.ISSUE_MANAGE_PERMISSIONS,
        ),
    )

    if not any(perm.id == permission_id for perm in obj.permissions):
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Permission not found')

    permission_to_delete = next(
        (perm for perm in obj.permissions if perm.id == permission_id), None
    )
    if not permission_to_delete:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Permission not found')

    is_user_permission = (
        permission_to_delete.target_type == 'user'
        and permission_to_delete.target.id == user_ctx.user.id
    )
    is_user_group_permission = (
        permission_to_delete.target_type == 'group'
        and permission_to_delete.target.id in user_ctx.all_group_ids
    )

    if is_user_permission or is_user_group_permission:
        remaining_permissions = [
            perm for perm in obj.permissions if perm.id != permission_id
        ]
        temp_obj = m.Issue(
            **obj.model_dump(exclude={'permissions'}), permissions=remaining_permissions
        )

        remaining_permission_claims = temp_obj.get_user_permissions(
            user_ctx.user, user_ctx.all_group_ids
        )
        if not obj.disable_project_permissions_inheritance:
            remaining_permission_claims.update(
                user_ctx.permissions.get(obj.project.id, set())
            )

        still_has_permissions = ProjectPermissions.ISSUE_MANAGE_PERMISSIONS.check(
            remaining_permission_claims
        ) and ProjectPermissions.ISSUE_READ.check(remaining_permission_claims)

        if not still_has_permissions:
            raise HTTPException(
                HTTPStatus.FORBIDDEN,
                'You would lose management permissions on this issue. Add another management permission first.',
            )

    obj.permissions = [perm for perm in obj.permissions if perm.id != permission_id]
    await obj.replace()
    return UUIDOutput.make(permission_id)


@router.get(
    '/{issue_id_or_alias}/permissions/resolve',
    responses=error_responses(
        (HTTPStatus.UNAUTHORIZED, ErrorOutput),
        (HTTPStatus.FORBIDDEN, ErrorOutput),
        (HTTPStatus.NOT_FOUND, ErrorOutput),
    ),
)
async def resolve_issue_permissions(
    issue_id_or_alias: PydanticObjectId | str,
) -> SuccessPayloadOutput[dict[str, bool]]:
    obj: m.Issue | None = await m.Issue.find_one_by_id_or_alias(issue_id_or_alias)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')

    user_ctx = current_user()
    user_ctx.validate_issue_permission(obj, ProjectPermissions.ISSUE_READ)

    effective_permissions = obj.get_user_permissions(user_ctx.user)

    if not obj.disable_project_permissions_inheritance:
        project_permissions = user_ctx.permissions.get(obj.project.id, set())
        effective_permissions = effective_permissions.union(project_permissions)

    result = {perm.value: perm in effective_permissions for perm in ProjectPermissions}

    return SuccessPayloadOutput(payload=result)


@router.post(
    '/{issue_id_or_alias}/permissions/copy-from-project',
    responses=error_responses(
        (HTTPStatus.UNAUTHORIZED, ErrorOutput),
        (HTTPStatus.FORBIDDEN, ErrorOutput),
        (HTTPStatus.NOT_FOUND, ErrorOutput),
    ),
)
async def copy_project_permissions_to_issue(
    issue_id_or_alias: PydanticObjectId | str,
) -> SuccessOutput:
    """Copy all project permissions to issue level"""
    obj: m.Issue | None = await m.Issue.find_one_by_id_or_alias(issue_id_or_alias)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')

    user_ctx = current_user()
    user_ctx.validate_issue_permission(
        obj,
        PermAnd(
            ProjectPermissions.ISSUE_MANAGE_PERMISSIONS, ProjectPermissions.ISSUE_READ
        ),
    )

    project: m.Project | None = await obj.get_project(fetch_links=True)
    if not project:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Project not found')

    copied_count = 0
    for project_permission in project.permissions:
        equivalent_exists = any(
            perm.target_type == project_permission.target_type
            and perm.target.id == project_permission.target.id
            and perm.role.id == project_permission.role.id
            for perm in obj.permissions
        )

        if not equivalent_exists:
            new_permission = m.ProjectPermission(
                target_type=project_permission.target_type,
                target=project_permission.target,
                role=project_permission.role,
            )
            obj.permissions.append(new_permission)
            copied_count += 1

    if copied_count > 0:
        await obj.replace()

    return SuccessOutput()


@router.post(
    '/{issue_id_or_alias}/permissions/disable-inheritance',
    responses=error_responses(
        (HTTPStatus.UNAUTHORIZED, ErrorOutput),
        (HTTPStatus.CONFLICT, ErrorOutput),
        (HTTPStatus.NOT_FOUND, ErrorOutput),
    ),
)
async def disable_project_permissions_inheritance(
    issue_id_or_alias: PydanticObjectId | str,
) -> SuccessOutput:
    """Disable project permission inheritance for this issue"""
    obj: m.Issue | None = await m.Issue.find_one_by_id_or_alias(issue_id_or_alias)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')

    user_ctx = current_user()
    user_ctx.validate_issue_permission(
        obj,
        PermAnd(
            ProjectPermissions.ISSUE_MANAGE_PERMISSIONS, ProjectPermissions.ISSUE_READ
        ),
    )
    if obj.disable_project_permissions_inheritance:
        return SuccessOutput()

    issue_permissions = obj.get_user_permissions(user_ctx.user, user_ctx.all_group_ids)
    has_manage_permissions = ProjectPermissions.ISSUE_MANAGE_PERMISSIONS.check(
        issue_permissions
    ) and ProjectPermissions.ISSUE_READ.check(issue_permissions)

    if not has_manage_permissions:
        raise HTTPException(
            HTTPStatus.CONFLICT,
            'You would lose management permissions on this issue. '
            'First copy project permissions or create direct issue permissions.',
        )

    obj.disable_project_permissions_inheritance = True
    await obj.replace()

    return SuccessOutput()


@router.post(
    '/{issue_id_or_alias}/permissions/enable-inheritance',
    responses=error_responses(
        (HTTPStatus.UNAUTHORIZED, ErrorOutput),
        (HTTPStatus.NOT_FOUND, ErrorOutput),
    ),
)
async def enable_project_permissions_inheritance(
    issue_id_or_alias: PydanticObjectId | str,
) -> SuccessOutput:
    """Enable project permission inheritance for this issue"""
    obj: m.Issue | None = await m.Issue.find_one_by_id_or_alias(issue_id_or_alias)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')

    user_ctx = current_user()
    user_ctx.validate_issue_permission(
        obj,
        PermAnd(
            ProjectPermissions.ISSUE_MANAGE_PERMISSIONS, ProjectPermissions.ISSUE_READ
        ),
    )

    if not obj.disable_project_permissions_inheritance:
        return SuccessOutput()

    obj.disable_project_permissions_inheritance = False
    await obj.replace()

    return SuccessOutput()


@router.get(
    '/{issue_id_or_alias}/attachment/list',
    responses=error_responses(*READ_ERRORS),
)
async def list_issue_attachments(
    issue_id_or_alias: PydanticObjectId | str,
    query: ListParams = Depends(),
) -> BaseListOutput[IssueAttachmentWithSourceOutput]:
    """List all attachments for an issue, including those from comments"""
    obj: m.Issue | None = await m.Issue.find_one_by_id_or_alias(issue_id_or_alias)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')

    user_ctx = current_user()
    user_ctx.validate_issue_permission(obj, ProjectPermissions.ISSUE_READ)

    all_attachments = []

    for attachment in obj.attachments:
        attachment_out = await IssueAttachmentWithSourceOutput.from_obj_with_source(
            attachment, AttachmentSourceTypeT.ISSUE, obj.id
        )
        all_attachments.append(attachment_out)

    for comment in obj.comments:
        for attachment in comment.attachments:
            attachment_out = await IssueAttachmentWithSourceOutput.from_obj_with_source(
                attachment, AttachmentSourceTypeT.COMMENT, comment.id
            )
            all_attachments.append(attachment_out)

    all_attachments.sort(key=lambda a: a.created_at, reverse=True)

    total_count = len(all_attachments)
    paginated_attachments = all_attachments[query.offset : query.offset + query.limit]

    return BaseListOutput.make(
        items=paginated_attachments,
        count=total_count,
        limit=query.limit,
        offset=query.offset,
    )


@router.post(
    '/{issue_id_or_alias}/attachment',
    responses=error_responses(*WRITE_ERRORS),
)
async def add_issue_attachment(
    issue_id_or_alias: PydanticObjectId | str,
    body: IssueAttachmentBody,
) -> SuccessPayloadOutput[IssueAttachmentWithSourceOutput]:
    """Add an attachment to an issue"""
    obj: m.Issue | None = await m.Issue.find_one_by_id_or_alias(issue_id_or_alias)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')

    user_ctx = current_user()
    user_ctx.validate_issue_permission(
        obj, PermAnd(ProjectPermissions.ISSUE_READ, ProjectPermissions.ISSUE_UPDATE)
    )

    if any(a.id == body.id for a in obj.attachments):
        raise HTTPException(HTTPStatus.CONFLICT, 'Attachment already exists')

    now = utcnow()

    try:
        file_data = await resolve_files([body.id])
        if body.id not in file_data:
            raise HTTPException(HTTPStatus.BAD_REQUEST, 'File not found')
        file_info = file_data[body.id]
    except ValueError as err:
        raise HTTPException(HTTPStatus.BAD_REQUEST, str(err)) from err

    # Create the attachment
    attachment = m.IssueAttachment(
        id=body.id,
        name=file_info.name,
        size=file_info.size,
        content_type=file_info.content_type,
        author=m.UserLinkField.from_obj(user_ctx.user),
        created_at=now,
        encryption=body.encryption,
    )

    obj.attachments.append(attachment)
    obj.updated_at = now
    obj.updated_by = m.UserLinkField.from_obj(user_ctx.user)

    await obj.replace()

    if not attachment.encryption:
        await send_task(
            Task(type=TaskType.OCR, data={'attachment_id': str(attachment.id)})
        )

    await schedule_batched_notification(
        'update',
        obj.subject,
        obj.id_readable,
        [str(s) for s in obj.subscribers],
        str(obj.project.id),
        author=user_ctx.user.email,
        field_changes=[],
    )

    await send_event(
        Event(
            type=EventType.ISSUE_UPDATE,
            data={'issue_id': str(obj.id), 'project_id': str(obj.project.id)},
        ),
    )

    return SuccessPayloadOutput(
        payload=await IssueAttachmentWithSourceOutput.from_obj_with_source(
            attachment, AttachmentSourceTypeT.ISSUE, obj.id
        )
    )


@router.delete(
    '/{issue_id_or_alias}/attachment/{attachment_id}',
    responses=error_responses(*WRITE_ERRORS),
)
async def delete_issue_attachment(
    issue_id_or_alias: PydanticObjectId | str,
    attachment_id: UUID,
) -> UUIDOutput:
    """Delete an attachment from an issue"""
    obj: m.Issue | None = await m.Issue.find_one_by_id_or_alias(issue_id_or_alias)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')

    user_ctx = current_user()
    user_ctx.validate_issue_permission(
        obj, PermAnd(ProjectPermissions.ISSUE_READ, ProjectPermissions.ISSUE_UPDATE)
    )

    attachment_found = False
    for attachment in obj.attachments:
        if attachment.id == attachment_id:
            obj.attachments = [a for a in obj.attachments if a.id != attachment_id]
            attachment_found = True
            break

    if not attachment_found:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Attachment not found')

    # Update issue timestamps
    now = utcnow()
    obj.updated_at = now
    obj.updated_by = m.UserLinkField.from_obj(user_ctx.user)

    await obj.replace()

    # Send notification
    await schedule_batched_notification(
        'update',
        obj.subject,
        obj.id_readable,
        [str(s) for s in obj.subscribers],
        str(obj.project.id),
        author=user_ctx.user.email,
        field_changes=[],
    )

    await send_event(
        Event(
            type=EventType.ISSUE_UPDATE,
            data={'issue_id': str(obj.id), 'project_id': str(obj.project.id)},
        ),
    )

    return UUIDOutput.make(attachment_id)


@router.post(
    '/{issue_id_or_alias}/attachments/batch-create',
    status_code=HTTPStatus.MULTI_STATUS,
    responses=error_responses(*WRITE_ERRORS),
)
async def batch_create_issue_attachments(
    issue_id_or_alias: PydanticObjectId | str,
    body: IssueAttachmentBatchCreateBody,
) -> BatchOperationOutput[IssueAttachmentWithSourceOutput, IssueAttachmentBody]:
    """Create multiple attachments for an issue"""
    obj: m.Issue | None = await m.Issue.find_one_by_id_or_alias(issue_id_or_alias)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')

    user_ctx = current_user()
    user_ctx.validate_issue_permission(
        obj, PermAnd(ProjectPermissions.ISSUE_READ, ProjectPermissions.ISSUE_UPDATE)
    )

    if not body.attachments:
        return BatchOperationOutput.make(successes=[], failures=[])

    now = utcnow()
    existing_attachment_ids = {a.id for a in obj.attachments}
    successes = []
    failures = []

    try:
        file_ids = [a.id for a in body.attachments]
        new_file_ids = [fid for fid in file_ids if fid not in existing_attachment_ids]
        file_data = await resolve_files(new_file_ids)
    except ValueError as err:
        failures.extend(
            [
                BatchFailureItem(
                    payload=attachment,
                    error_code=HTTPStatus.BAD_REQUEST,
                    error_messages=[str(err)],
                )
                for attachment in body.attachments
            ]
        )
        return BatchOperationOutput.make(successes=successes, failures=failures)

    for attachment_body in body.attachments:
        try:
            if attachment_body.id in existing_attachment_ids:
                failures.append(
                    BatchFailureItem(
                        payload=attachment_body,
                        error_code=HTTPStatus.CONFLICT,
                        error_messages=['Attachment already exists'],
                    )
                )
                continue

            if attachment_body.id not in file_data:
                failures.append(
                    BatchFailureItem(
                        payload=attachment_body,
                        error_code=HTTPStatus.BAD_REQUEST,
                        error_messages=['File not found'],
                    )
                )
                continue

            file_info = file_data[attachment_body.id]
            attachment = m.IssueAttachment(
                id=attachment_body.id,
                name=file_info.name,
                size=file_info.size,
                content_type=file_info.content_type,
                author=m.UserLinkField.from_obj(user_ctx.user),
                created_at=now,
                encryption=attachment_body.encryption,
            )

            obj.attachments.append(attachment)
            attachment_out = await IssueAttachmentWithSourceOutput.from_obj_with_source(
                attachment, AttachmentSourceTypeT.ISSUE, obj.id
            )
            successes.append(BatchSuccessItem(payload=attachment_out))

            if not attachment.encryption:
                await send_task(
                    Task(type=TaskType.OCR, data={'attachment_id': str(attachment.id)})
                )

        except (ValueError, KeyError, AttributeError) as e:
            failures.append(
                BatchFailureItem(
                    payload=attachment_body,
                    error_code=HTTPStatus.UNPROCESSABLE_ENTITY,
                    error_messages=[str(e)],
                )
            )

    if successes:
        obj.updated_at = now
        obj.updated_by = m.UserLinkField.from_obj(user_ctx.user)
        await obj.replace()

        await schedule_batched_notification(
            'update',
            obj.subject,
            obj.id_readable,
            [str(s) for s in obj.subscribers],
            str(obj.project.id),
            author=user_ctx.user.email,
            field_changes=[],
        )

        await send_event(
            Event(
                type=EventType.ISSUE_UPDATE,
                data={'issue_id': str(obj.id), 'project_id': str(obj.project.id)},
            ),
        )

    return BatchOperationOutput.make(successes=successes, failures=failures)


@router.post(
    '/{issue_id_or_alias}/attachments/batch-delete',
    status_code=HTTPStatus.MULTI_STATUS,
    responses=error_responses(*WRITE_ERRORS),
)
async def batch_delete_issue_attachments(
    issue_id_or_alias: PydanticObjectId | str,
    body: IssueAttachmentBatchDeleteBody,
) -> BatchOperationOutput[UUID, UUID]:
    """Delete multiple attachments from an issue"""
    obj: m.Issue | None = await m.Issue.find_one_by_id_or_alias(issue_id_or_alias)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')

    user_ctx = current_user()
    user_ctx.validate_issue_permission(
        obj, PermAnd(ProjectPermissions.ISSUE_READ, ProjectPermissions.ISSUE_UPDATE)
    )

    if not body.attachment_ids:
        return BatchOperationOutput.make(successes=[], failures=[])

    existing_attachment_ids = {a.id for a in obj.attachments}
    successes = []
    failures = []

    for attachment_id in body.attachment_ids:
        try:
            if attachment_id not in existing_attachment_ids:
                failures.append(
                    BatchFailureItem(
                        payload=attachment_id,
                        error_code=HTTPStatus.NOT_FOUND,
                        error_messages=['Attachment not found'],
                    )
                )
                continue

            obj.attachments = [a for a in obj.attachments if a.id != attachment_id]
            successes.append(BatchSuccessItem(payload=attachment_id))

        except (ValueError, KeyError, AttributeError) as e:
            failures.append(
                BatchFailureItem(
                    payload=attachment_id,
                    error_code=HTTPStatus.UNPROCESSABLE_ENTITY,
                    error_messages=[str(e)],
                )
            )

    if successes:
        now = utcnow()
        obj.updated_at = now
        obj.updated_by = m.UserLinkField.from_obj(user_ctx.user)
        await obj.replace()

        await schedule_batched_notification(
            'update',
            obj.subject,
            obj.id_readable,
            [str(s) for s in obj.subscribers],
            str(obj.project.id),
            author=user_ctx.user.email,
            field_changes=[],
        )

        await send_event(
            Event(
                type=EventType.ISSUE_UPDATE,
                data={'issue_id': str(obj.id), 'project_id': str(obj.project.id)},
            ),
        )

    return BatchOperationOutput.make(successes=successes, failures=failures)


async def validate_custom_fields_values(
    fields: dict[str, Any],
    project: m.Project,
    issue: m.Issue | None = None,
    ignore_none_errors: bool = False,
) -> tuple[list[m.CustomFieldValueUnion], list[m.CustomFieldValidationError]]:
    project_fields = {f.name: f for f in project.custom_fields}
    issue_fields = {f.name: f for f in issue.fields} if issue else {}
    for f_name in fields:
        if f_name not in project_fields:
            raise HTTPException(
                HTTPStatus.BAD_REQUEST,
                f'Field {f_name} is not allowed',
            )

    results = []
    errors: list[m.CustomFieldValidationError] = []
    for f in project.custom_fields:
        if f.name not in fields:
            issue_field_val = issue_fields.get(f.name)
            fields[f.name] = (
                issue_field_val.value if issue_field_val else f.default_value
            )
        try:
            val_ = await f.validate_value(fields[f.name])
        except m.CustomFieldCanBeNoneError as err:
            val_ = None
            if not ignore_none_errors:
                errors.append(err)
        except m.CustomFieldValidationError as err:
            val_ = err.value
            errors.append(err)
        results.append(
            m.get_cf_value_class(f.type)(
                id=f.id,
                gid=f.gid,
                name=f.name,
                type=f.type,
                value=val_,
            ),
        )
    return results, errors


def filter_valid_project_fields(
    fields: list[m.CustomFieldValueUnion],
    project: m.Project | None,
) -> list[m.CustomFieldValueUnion]:
    if not project:
        return []
    project_field_ids = {f.id for f in project.custom_fields}
    return [f for f in fields if f.id in project_field_ids]
