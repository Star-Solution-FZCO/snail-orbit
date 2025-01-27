from collections.abc import Sequence
from http import HTTPStatus
from typing import Annotated, Any, Self
from uuid import UUID

import beanie.operators as bo
from beanie import PydanticObjectId
from fastapi import Depends, HTTPException, Query
from pydantic import BaseModel, Field

import pm.models as m
from pm.api.context import current_user, current_user_context_dependency
from pm.api.events_bus import send_event
from pm.api.exceptions import ValidateModelException
from pm.api.search.issue import TransformError, transform_query, transform_text_search
from pm.api.utils.router import APIRouter
from pm.api.views.custom_fields import CustomFieldLinkOutput
from pm.api.views.group import GroupOutput
from pm.api.views.issue import (
    CustomFieldValueOutT,
    IssueOutput,
    ProjectField,
    transform_custom_field_value,
)
from pm.api.views.output import (
    BaseListOutput,
    ModelIdOutput,
    SuccessPayloadOutput,
    UUIDOutput,
)
from pm.api.views.params import IssueSearchParams, ListParams
from pm.api.views.user import UserOutput
from pm.permissions import PermAnd, Permissions
from pm.services.issue import update_tags_on_close_resolve
from pm.tasks.actions import task_notify_by_pararam
from pm.utils.dateutils import utcnow
from pm.utils.events_bus import Event, EventType
from pm.workflows import WorkflowException

__all__ = ('router',)

router = APIRouter(
    prefix='/board',
    tags=['board'],
    dependencies=[Depends(current_user_context_dependency)],
)


class BoardOutput(BaseModel):
    id: PydanticObjectId
    name: str
    description: str | None
    query: str | None
    projects: list[ProjectField]
    column_field: CustomFieldLinkOutput
    columns: list[CustomFieldValueOutT]
    swimlane_field: CustomFieldLinkOutput | None = None
    swimlanes: list[CustomFieldValueOutT]
    card_fields: list[CustomFieldLinkOutput]
    card_colors_fields: list[CustomFieldLinkOutput]
    ui_settings: dict

    @classmethod
    def from_obj(cls, obj: m.Board) -> 'BoardOutput':
        return cls(
            id=obj.id,
            name=obj.name,
            description=obj.description,
            query=obj.query,
            projects=[ProjectField.from_obj(p) for p in obj.projects],
            column_field=CustomFieldLinkOutput.from_obj(obj.column_field),
            columns=[
                transform_custom_field_value(v, obj.column_field) for v in obj.columns
            ],
            swimlane_field=CustomFieldLinkOutput.from_obj(obj.swimlane_field)
            if obj.swimlane_field
            else None,
            swimlanes=[
                transform_custom_field_value(v, obj.swimlane_field)
                for v in obj.swimlanes
            ],
            card_fields=[CustomFieldLinkOutput.from_obj(f) for f in obj.card_fields],
            card_colors_fields=[
                CustomFieldLinkOutput.from_obj(f) for f in obj.card_colors_fields
            ],
            ui_settings=obj.ui_settings,
        )


class BoardCreate(BaseModel):
    name: str
    description: str | None = None
    query: str | None = None
    projects: list[PydanticObjectId]
    column_field: PydanticObjectId
    columns: list
    swimlane_field: PydanticObjectId | None = None
    swimlanes: Annotated[list, Field(default_factory=list)]
    card_fields: Annotated[list[PydanticObjectId], Field(default_factory=list)]
    card_colors_fields: Annotated[list[PydanticObjectId], Field(default_factory=list)]
    ui_settings: Annotated[dict, Field(default_factory=dict)]


class BoardUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    query: str | None = None
    projects: list[PydanticObjectId] | None = None
    column_field: PydanticObjectId | None = None
    columns: list | None = None
    swimlane_field: PydanticObjectId | None = None
    swimlanes: list | None = None
    card_fields: list[PydanticObjectId] | None = None
    card_colors_fields: list[PydanticObjectId] | None = None
    ui_settings: dict | None = None


class ColumnOutput(BaseModel):
    field_value: CustomFieldValueOutT
    issues: list[IssueOutput]


class SwimlaneOutput(BaseModel):
    field_value: CustomFieldValueOutT
    columns: list[ColumnOutput]


@router.get('/list')
async def list_boards(
    query: ListParams = Depends(),
) -> BaseListOutput[BoardOutput]:
    user_ctx = current_user()
    user_groups = [g.id for g in user_ctx.user.groups]
    filter_query = {
        '$or': [
            {'created_by.id': user_ctx.user.id},
            {
                'permissions': {
                    '$elemMatch': {
                        'target_type': m.PermissionTargetType.USER,
                        'target.id': user_ctx.user.id,
                        'can_view': True,
                    }
                }
            },
            {
                'permissions': {
                    '$elemMatch': {
                        'target_type': m.PermissionTargetType.GROUP,
                        'target.id': {'$in': user_groups},
                        'can_view': True,
                    }
                }
            },
        ]
    }
    q = m.Board.find(filter_query).sort(m.Board.name)
    return await BaseListOutput.make_from_query(
        q,
        limit=query.limit,
        offset=query.offset,
        projection_fn=BoardOutput.from_obj,
    )


@router.post('')
async def create_board(
    body: BoardCreate,
) -> SuccessPayloadOutput[BoardOutput]:
    user_ctx = current_user()
    projects = await m.Project.find(
        bo.In(m.Project.id, body.projects),
        fetch_links=True,
    ).to_list()
    if len(projects) != len(body.projects):
        not_found = set(body.projects) - {p.id for p in projects}
        raise HTTPException(HTTPStatus.BAD_REQUEST, f'Projects not found: {not_found}')
    column_field: m.CustomField | None = await m.CustomField.find_one(
        m.CustomField.id == body.column_field, with_children=True
    )
    if not column_field:
        raise HTTPException(HTTPStatus.BAD_REQUEST, 'Column field not found')
    if column_field.type not in (m.CustomFieldTypeT.STATE, m.CustomFieldTypeT.ENUM):
        raise HTTPException(
            HTTPStatus.BAD_REQUEST, 'Column field must be of type STATE or ENUM'
        )
    _all_projects_has_custom_field(column_field, projects)
    card_fields = await _resolve_custom_fields(body.card_fields)
    for cf in card_fields:
        _any_projects_has_custom_field(cf, projects)
    card_colors_fields = await _resolve_custom_fields(body.card_colors_fields)
    for cf in card_colors_fields:
        validate_custom_field_has_one_color(cf)
        _all_projects_has_custom_field(cf, projects)
    columns = validate_custom_field_values(column_field, body.columns)
    swimlane_field: m.CustomField | None = None
    swimlanes = []
    if body.swimlane_field:
        swimlane_field = await m.CustomField.find_one(
            m.CustomField.id == body.swimlane_field, with_children=True
        )
        if not swimlane_field:
            raise HTTPException(HTTPStatus.BAD_REQUEST, 'Swimlane field not found')
        if swimlane_field.type in (
            m.CustomFieldTypeT.ENUM_MULTI,
            m.CustomFieldTypeT.USER_MULTI,
        ):
            raise HTTPException(
                HTTPStatus.BAD_REQUEST, 'Swimlane field can not be of type MULTI'
            )
        _all_projects_has_custom_field(swimlane_field, projects)
        swimlanes = validate_custom_field_values(swimlane_field, body.swimlanes)
    board = m.Board(
        name=body.name,
        description=body.description,
        query=body.query,
        projects=[m.ProjectLinkField.from_obj(p) for p in projects],
        column_field=m.CustomFieldLink.from_obj(column_field),
        columns=columns,
        swimlane_field=m.CustomFieldLink.from_obj(swimlane_field)
        if swimlane_field
        else None,
        swimlanes=swimlanes,
        card_fields=[m.CustomFieldLink.from_obj(cf) for cf in card_fields],
        card_colors_fields=[
            m.CustomFieldLink.from_obj(cf) for cf in card_colors_fields
        ],
        ui_settings=body.ui_settings,
        created_by=m.UserLinkField.from_obj(user_ctx.user),
        permissions=[],
    )
    await board.insert()
    return SuccessPayloadOutput(payload=BoardOutput.from_obj(board))


@router.get('/{board_id}')
async def get_board(
    board_id: PydanticObjectId,
) -> SuccessPayloadOutput[BoardOutput]:
    board = await m.Board.find_one(m.Board.id == board_id)
    if not board:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Board not found')
    user_ctx = current_user()
    can_view, _ = board.check_board_permissions(user_ctx.user)
    if not can_view:
        raise HTTPException(HTTPStatus.FORBIDDEN, 'No permission to view this board')
    return SuccessPayloadOutput(payload=BoardOutput.from_obj(board))


@router.put('/{board_id}')
async def update_board(
    board_id: PydanticObjectId,
    body: BoardUpdate,
) -> SuccessPayloadOutput[BoardOutput]:
    board = await m.Board.find_one(m.Board.id == board_id)
    if not board:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Board not found')
    user_ctx = current_user()
    _, can_edit = board.check_board_permissions(user_ctx.user)
    if not can_edit:
        raise HTTPException(HTTPStatus.FORBIDDEN, 'No permission to edit this board')
    data = body.dict(exclude_unset=True)
    for k in ('name', 'description', 'query', 'ui_settings'):
        if k in data:
            setattr(board, k, data[k])
    if 'projects' in data:
        projects = await m.Project.find(
            bo.In(m.Project.id, body.projects),
            fetch_links=True,
        ).to_list()
        if len(projects) != len(body.projects):
            not_found = set(body.projects) - {p.id for p in projects}
            raise HTTPException(
                HTTPStatus.BAD_REQUEST, f'Projects not found: {not_found}'
            )
        board.projects = [m.ProjectLinkField.from_obj(p) for p in projects]
    else:
        projects = [await p.resolve(fetch_links=True) for p in board.projects]
    if 'column_field' in data:
        column_field: m.CustomField | None = await m.CustomField.find_one(
            m.CustomField.id == body.column_field, with_children=True
        )
        if not column_field:
            raise HTTPException(HTTPStatus.BAD_REQUEST, 'Column field not found')
        if column_field.type not in (m.CustomFieldTypeT.STATE, m.CustomFieldTypeT.ENUM):
            raise HTTPException(
                HTTPStatus.BAD_REQUEST, 'Column field must be of type STATE or ENUM'
            )
        board.column_field = m.CustomFieldLink.from_obj(column_field)
    else:
        column_field = await board.column_field.resolve()
    if 'columns' in data:
        columns = body.columns
    else:
        columns = board.columns
    if 'swimlane_field' in data:
        if body.swimlane_field:
            swimlane_field: m.CustomField | None = await m.CustomField.find_one(
                m.CustomField.id == body.swimlane_field, with_children=True
            )
            if not swimlane_field:
                raise HTTPException(HTTPStatus.BAD_REQUEST, 'Swimlane field not found')
            if swimlane_field.type in (
                m.CustomFieldTypeT.ENUM_MULTI,
                m.CustomFieldTypeT.USER_MULTI,
            ):
                raise HTTPException(
                    HTTPStatus.BAD_REQUEST, 'Swimlane field can not be of type MULTI'
                )
            board.swimlane_field = m.CustomFieldLink.from_obj(swimlane_field)
        else:
            swimlane_field = None
            board.swimlane_field = None
    else:
        swimlane_field = (
            await board.swimlane_field.resolve() if board.swimlane_field else None
        )
    if 'swimlanes' in data:
        if swimlane_field:
            swimlanes = body.swimlanes
        else:
            swimlanes = []
    else:
        swimlanes = board.swimlanes

    card_fields: list[m.CustomField | m.CustomFieldLink] = board.card_fields
    if 'card_fields' in data:
        card_fields = await _resolve_custom_fields(body.card_fields)
    for cf in card_fields:
        _any_projects_has_custom_field(cf, projects)
    board.card_fields = [m.CustomFieldLink.from_obj(cf) for cf in card_fields]

    card_colors_fields: list[m.CustomField | m.CustomFieldLink] = (
        board.card_colors_fields
    )
    if 'card_colors_fields' in data:
        card_colors_fields = await _resolve_custom_fields(body.card_colors_fields)
    for cf in card_colors_fields:
        validate_custom_field_has_one_color(cf)
        _all_projects_has_custom_field(cf, projects)
    board.card_colors_fields = [
        m.CustomFieldLink.from_obj(cf) for cf in card_colors_fields
    ]

    _all_projects_has_custom_field(column_field, projects)
    board.column_field = m.CustomFieldLink.from_obj(column_field)
    board.columns = validate_custom_field_values(column_field, columns)
    if swimlane_field:
        _all_projects_has_custom_field(swimlane_field, projects)
        board.swimlanes = validate_custom_field_values(swimlane_field, swimlanes)
        board.swimlane_field = m.CustomFieldLink.from_obj(swimlane_field)
    else:
        board.swimlane_field = None
        board.swimlanes = []
    board.projects = [m.ProjectLinkField.from_obj(p) for p in projects]
    if board.is_changed:
        await board.replace()
    return SuccessPayloadOutput(payload=BoardOutput.from_obj(board))


@router.delete('/{board_id}')
async def delete_board(
    board_id: PydanticObjectId,
) -> ModelIdOutput:
    board = await m.Board.find_one(m.Board.id == board_id)
    if not board:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Board not found')
    user_ctx = current_user()
    _, can_edit = board.check_board_permissions(user_ctx.user)
    if not can_edit:
        raise HTTPException(HTTPStatus.FORBIDDEN, 'No permission to delete this board')
    await board.delete()
    return ModelIdOutput.make(board_id)


@router.get('/{board_id}/issues')
async def get_board_issues(
    board_id: PydanticObjectId,
    query: IssueSearchParams = Depends(),
) -> BaseListOutput[SwimlaneOutput]:
    user_ctx = current_user()

    board: m.Board | None = await m.Board.find_one(m.Board.id == board_id)
    if not board:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Board not found')

    can_view, _ = board.check_board_permissions(user_ctx.user)
    if not can_view:
        raise HTTPException(HTTPStatus.FORBIDDEN, 'No permission to view this board')

    q = m.Issue.find(
        bo.In(
            m.Issue.project.id,
            user_ctx.get_projects_with_permission(Permissions.ISSUE_READ),
        )
    )

    if board.query:
        try:
            q = q.find(
                await transform_query(
                    board.query, current_user_email=user_ctx.user.email
                )
            )
        except TransformError as err:
            raise HTTPException(HTTPStatus.BAD_REQUEST, err.message) from err

    if board.projects:
        q = q.find(bo.In(m.Issue.project.id, [p.id for p in board.projects]))

    if query.q:
        try:
            q = q.find(
                await transform_query(query.q, current_user_email=user_ctx.user.email)
            )
        except TransformError as err:
            raise HTTPException(HTTPStatus.BAD_REQUEST, err.message) from err

    if query.search:
        q = q.find(transform_text_search(query.search))

    if board.swimlane_field:
        non_swimlane = None
        if None in board.swimlanes:
            non_swimlane = {col: [] for col in board.columns}
        swimlanes = {
            sl: {col: [] for col in board.columns}
            for sl in board.swimlanes
            if sl is not None
        }
    else:
        non_swimlane = {col: [] for col in board.columns}
        swimlanes = {}

    for issue in await q.to_list():
        if board.swimlane_field and not (
            sl_field := issue.get_field_by_id(board.swimlane_field.id)
        ):
            continue
        if not (col_field := issue.get_field_by_id(board.column_field.id)):
            continue
        if col_field.value not in board.columns:
            continue
        if not board.swimlane_field or sl_field.value is None:
            if non_swimlane is not None:
                non_swimlane[col_field.value].append(issue)
            continue
        if sl_field.value not in swimlanes:
            continue
        swimlanes[sl_field.value][col_field.value].append(issue)
    priorities = {id_: idx for idx, id_ in enumerate(board.issues_order)}
    for sl_result in swimlanes.values():
        for col_result in sl_result.values():
            col_result.sort(key=lambda i: priorities.get(i.id, float('inf')))
    if non_swimlane is not None:
        for col_result in non_swimlane.values():
            col_result.sort(key=lambda i: priorities.get(i.id, float('inf')))
    return BaseListOutput.make(
        count=len(swimlanes) + (1 if non_swimlane is not None else 0),
        limit=len(swimlanes) + (1 if non_swimlane is not None else 0),
        offset=0,
        items=[
            SwimlaneOutput(
                field_value=transform_custom_field_value(sl, board.swimlane_field),
                columns=[
                    ColumnOutput(
                        field_value=transform_custom_field_value(
                            col, board.column_field
                        ),
                        issues=[IssueOutput.from_obj(issue) for issue in issues],
                    )
                    for col, issues in cols.items()
                ],
            )
            for sl, cols in swimlanes.items()
        ]
        + (
            [
                SwimlaneOutput(
                    field_value=None,
                    columns=[
                        ColumnOutput(
                            field_value=transform_custom_field_value(
                                col, board.column_field
                            ),
                            issues=[IssueOutput.from_obj(issue) for issue in issues],
                        )
                        for col, issues in non_swimlane.items()
                    ],
                )
            ]
            if non_swimlane is not None
            else []
        ),
    )


class IssueMoveBody(BaseModel):
    after_issue: PydanticObjectId | None = None
    column: Any | None = None
    swimlane: Any | None = None


@router.put('/{board_id}/issues/{issue_id}')
async def move_issue(
    board_id: PydanticObjectId,
    issue_id: PydanticObjectId,
    body: IssueMoveBody,
) -> ModelIdOutput:
    now = utcnow()
    user_ctx = current_user()
    board: m.Board | None = await m.Board.find_one(m.Board.id == board_id)
    if not board:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Board not found')
    _, can_edit = board.check_board_permissions(user_ctx.user)
    if not can_edit:
        raise HTTPException(
            HTTPStatus.FORBIDDEN, 'No permission to move issues in this board'
        )
    issue: m.Issue | None = await m.Issue.find_one(m.Issue.id == issue_id)
    if not issue:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')

    user_ctx.validate_issue_permission(
        issue, PermAnd(Permissions.ISSUE_READ, Permissions.ISSUE_UPDATE)
    )

    data = body.dict(exclude_unset=True)
    if 'column' in data:
        column_field = await board.column_field.resolve()
        column = validate_custom_field_values(column_field, [data['column']])[0]
        if column not in board.columns:
            raise HTTPException(HTTPStatus.BAD_REQUEST, 'Invalid column')
        if not (issue_field := issue.get_field_by_id(board.column_field.id)):
            raise HTTPException(
                HTTPStatus.INTERNAL_SERVER_ERROR, 'Issue has no column field'
            )
        issue_field.value = column
    if 'swimlane' in data:
        if not board.swimlane_field:
            raise HTTPException(HTTPStatus.BAD_REQUEST, 'Board has no swimlanes')
        swimlane_field = await board.swimlane_field.resolve()
        swimlane = validate_custom_field_values(swimlane_field, [body.swimlane])[0]
        if swimlane not in board.swimlanes:
            raise HTTPException(HTTPStatus.BAD_REQUEST, 'Invalid swimlane')
        if not (issue_field := issue.get_field_by_id(board.swimlane_field.id)):
            raise HTTPException(
                HTTPStatus.INTERNAL_SERVER_ERROR, 'Issue has no swimlane field'
            )
        issue_field.value = swimlane
    if body.after_issue:
        after_issue: m.Issue | None = await m.Issue.find_one(
            m.Issue.id == body.after_issue
        )
        if not after_issue:
            raise HTTPException(HTTPStatus.NOT_FOUND, 'After issue not found')
    else:
        after_issue = None
    if issue.is_changed:
        pr = await issue.get_project(fetch_links=True)
        await update_tags_on_close_resolve(issue)
        try:
            for wf in pr.workflows:
                await wf.run(issue)
        except WorkflowException as err:
            raise ValidateModelException(
                payload=IssueOutput.from_obj(issue),
                error_messages=[err.msg],
                error_fields=err.fields_errors,
            ) from err
        issue.gen_history_record(user_ctx.user, time=now)
        issue.updated_at = now
        issue.updated_by = m.UserLinkField.from_obj(user_ctx.user)
        await issue.replace()
        task_notify_by_pararam.delay(
            'update',
            issue.subject,
            issue.id_readable,
            [str(s) for s in issue.subscribers],
            str(issue.project.id),
        )
        await send_event(
            Event(type=EventType.ISSUE_UPDATE, data={'issue_id': str(issue.id)})
        )
    board.move_issue(issue.id, after_issue.id if after_issue else None)
    await board.save_changes()
    return ModelIdOutput.make(issue_id)


@router.get('/column_field/select')
async def select_column_field(
    project_id: list[PydanticObjectId] = Query(...),
) -> BaseListOutput[CustomFieldLinkOutput]:
    projects = await m.Project.find(
        bo.In(m.Project.id, project_id),
        fetch_links=True,
    ).to_list()
    fields = [
        cf
        for cf in _intersect_custom_fields(projects)
        if cf.type in (m.CustomFieldTypeT.STATE, m.CustomFieldTypeT.ENUM)
    ]
    return BaseListOutput.make(
        count=len(fields),
        limit=len(fields),
        offset=0,
        items=[CustomFieldLinkOutput.from_obj(cf) for cf in fields],
    )


@router.get('/swimlane_field/select')
async def select_swimlane_field(
    project_id: list[PydanticObjectId] = Query(...),
) -> BaseListOutput[CustomFieldLinkOutput]:
    projects = await m.Project.find(
        bo.In(m.Project.id, project_id),
        fetch_links=True,
    ).to_list()
    fields = [
        cf
        for cf in _intersect_custom_fields(projects)
        if cf.type not in (m.CustomFieldTypeT.ENUM_MULTI, m.CustomFieldTypeT.USER_MULTI)
    ]
    return BaseListOutput.make(
        count=len(fields),
        limit=len(fields),
        offset=0,
        items=[CustomFieldLinkOutput.from_obj(cf) for cf in fields],
    )


@router.get('/custom_field/select')
async def select_custom_field(
    project_id: list[PydanticObjectId] = Query(...),
) -> BaseListOutput[CustomFieldLinkOutput]:
    projects = await m.Project.find(
        bo.In(m.Project.id, project_id),
        fetch_links=True,
    ).to_list()
    fields = set()
    for project in projects:
        for field in project.custom_fields:
            fields.add(field)
    return BaseListOutput.make(
        count=len(fields),
        limit=len(fields),
        offset=0,
        items=[CustomFieldLinkOutput.from_obj(cf) for cf in fields],
    )


@router.get('/card_color_field/select')
async def select_card_color_field(
    project_id: list[PydanticObjectId] = Query(...),
) -> BaseListOutput[CustomFieldLinkOutput]:
    projects = await m.Project.find(
        bo.In(m.Project.id, project_id),
        fetch_links=True,
    ).to_list()
    fields = [
        cf
        for cf in _intersect_custom_fields(projects)
        if cf.type
        in (
            m.CustomFieldTypeT.ENUM,
            m.CustomFieldTypeT.STATE,
        )
    ]
    return BaseListOutput.make(
        count=len(fields),
        limit=len(fields),
        offset=0,
        items=[CustomFieldLinkOutput.from_obj(cf) for cf in fields],
    )


class GrantPermissionBody(BaseModel):
    target_type: m.PermissionTargetType
    target: PydanticObjectId
    can_edit: bool = False
    can_view: bool = False


class BoardPermissionOutput(BaseModel):
    id: UUID
    target_type: m.PermissionTargetType
    target: GroupOutput | UserOutput
    can_edit: bool
    can_view: bool

    @classmethod
    def from_obj(cls, obj: m.BoardPermission) -> Self:
        target = (
            GroupOutput.from_obj(obj.target)
            if obj.target_type == m.PermissionTargetType.GROUP
            else UserOutput.from_obj(obj.target)
        )
        return cls(
            id=obj.id,
            target_type=obj.target_type,
            target=target,
            can_edit=obj.can_edit,
            can_view=obj.can_view,
        )


@router.post('/{board_id}/permission')
async def grant_permission(
    board_id: PydanticObjectId,
    body: GrantPermissionBody,
) -> UUIDOutput:
    user_ctx = current_user()
    board = await m.Board.find_one(m.Board.id == board_id)
    if not board:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail='Board not found')
    if board.created_by.id != user_ctx.user.id:
        raise HTTPException(
            status_code=HTTPStatus.FORBIDDEN,
            detail=f'You cannot modify permissions for board {board_id}',
        )
    if body.target_type == m.PermissionTargetType.USER:
        user: m.User | None = await m.User.find_one(m.User.id == body.target)
        if not user:
            raise HTTPException(HTTPStatus.BAD_REQUEST, 'User not found')
        if user.id == user_ctx.user.id:
            raise HTTPException(
                status_code=HTTPStatus.BAD_REQUEST,
                detail='Cannot grant permissions to self',
            )
        permission = m.BoardPermission(
            target_type=body.target_type,
            target=m.UserLinkField.from_obj(user),
        )
    else:
        group: m.Group | None = await m.Group.find_one(m.Group.id == body.target)
        if not group:
            raise HTTPException(HTTPStatus.BAD_REQUEST, 'Group not found')
        if group.id not in {g.id for g in user_ctx.user.groups}:
            raise HTTPException(
                status_code=HTTPStatus.FORBIDDEN,
                detail='You cannot grant permissions to groups you are not member of',
            )
        permission = m.BoardPermission(
            target_type=body.target_type,
            target=m.GroupLinkField.from_obj(group),
        )
    permission.can_edit = body.can_edit
    permission.can_view = body.can_view
    existing_perm = next(
        (
            perm
            for perm in board.permissions
            if perm.target_type == body.target_type and perm.target.id == body.target
        ),
        None,
    )
    if existing_perm and (
        existing_perm.can_view != body.can_view
        or existing_perm.can_edit != body.can_edit
    ):
        raise HTTPException(
            status_code=HTTPStatus.CONFLICT,
            detail=f'Conflicting permission {existing_perm.id} exists for {body.target_type} {body.target}',
        )
    if any(perm == permission for perm in board.permissions):
        raise HTTPException(HTTPStatus.CONFLICT, 'Permission already granted')
    board.permissions.append(permission)
    await board.save_changes()
    return UUIDOutput.make(permission.id)


@router.delete('/{board_id}/permission/{permission_id}')
async def revoke_permission(
    board_id: PydanticObjectId,
    permission_id: UUID,
) -> UUIDOutput:
    user_ctx = current_user()
    board = await m.Board.find_one(m.Board.id == board_id)
    if not board:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail='Board not found')
    if board.created_by.id != user_ctx.user.id:
        raise HTTPException(
            status_code=HTTPStatus.FORBIDDEN,
            detail='You cannot modify permissions for this board',
        )
    if not (
        perm := next(
            (obj for obj in board.permissions if obj.id == permission_id), None
        )
    ):
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Permission not found')
    board.permissions.remove(perm)
    await board.save_changes()
    return UUIDOutput.make(perm.id)


@router.get('/{board_id}/permissions')
async def get_board_permissions(
    board_id: PydanticObjectId,
    query: ListParams = Depends(),
) -> BaseListOutput[BoardPermissionOutput]:
    board = await m.Board.find_one(m.Board.id == board_id)
    if not board:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Board not found')
    user_ctx = current_user()
    if board.created_by.id != user_ctx.user.id:
        raise HTTPException(
            HTTPStatus.FORBIDDEN, 'Only board admin can view permissions'
        )
    return BaseListOutput.make(
        count=len(board.permissions),
        limit=query.limit,
        offset=query.offset,
        items=[
            BoardPermissionOutput.from_obj(perm)
            for perm in board.permissions[query.offset : query.offset + query.limit]
        ],
    )


def _intersect_custom_fields(
    projects: Sequence[m.Project],
) -> set[m.CustomField]:
    if not projects:
        return set()
    fields = set(projects[0].custom_fields)
    for p in projects[1:]:
        fields &= set(p.custom_fields)
    return fields


def _all_projects_has_custom_field(
    field: m.CustomField | m.CustomFieldLink, projects: Sequence[m.Project]
) -> None:
    if not projects:
        raise HTTPException(HTTPStatus.BAD_REQUEST, 'No projects specified')
    for p in projects:
        if all(cf.id != field.id for cf in p.custom_fields):
            raise HTTPException(
                HTTPStatus.BAD_REQUEST,
                f'Field {field.name} not found in project {p.id}',
            )


def _any_projects_has_custom_field(
    field: m.CustomField | m.CustomFieldLink, projects: Sequence[m.Project]
) -> None:
    if not projects:
        raise HTTPException(HTTPStatus.BAD_REQUEST, 'No projects specified')
    for p in projects:
        if any(cf.id == field.id for cf in p.custom_fields):
            return None
    raise HTTPException(
        HTTPStatus.BAD_REQUEST, f'Projects does not have custom field {field.id}'
    )


async def _resolve_custom_fields(
    fields: list[PydanticObjectId],
) -> list[m.CustomField]:
    if not fields:
        return []
    results = await m.CustomField.find(
        bo.In(m.CustomField.id, fields), with_children=True
    ).to_list()
    if len(results) != len(fields):
        not_found = set(fields) - {cf.id for cf in results}
        raise HTTPException(HTTPStatus.BAD_REQUEST, f'Fields not found: {not_found}')
    return results


def validate_custom_field_values(
    field: m.CustomField,
    values: list,
) -> list[m.CustomFieldValueT]:
    try:
        return [field.validate_value(v) for v in values]
    except m.CustomFieldValidationError as err:
        raise HTTPException(
            HTTPStatus.BAD_REQUEST, f'Invalid value {err.value} for field {field.name}'
        ) from err


def validate_custom_field_has_one_color(
    field: m.CustomField,
) -> None:
    if field.type not in (
        m.CustomFieldTypeT.ENUM,
        m.CustomFieldTypeT.STATE,
    ):
        raise HTTPException(
            HTTPStatus.BAD_REQUEST, 'Card color field must be of type ENUM or STATE'
        )
