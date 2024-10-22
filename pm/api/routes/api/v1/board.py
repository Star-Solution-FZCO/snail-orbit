from collections.abc import Sequence
from http import HTTPStatus
from typing import Any

import beanie.operators as bo
from beanie import PydanticObjectId
from fastapi import Depends, HTTPException, Query
from pydantic import BaseModel, Field

import pm.models as m
from pm.api.context import current_user, current_user_context_dependency
from pm.api.events_bus import send_event
from pm.api.exceptions import ValidateModelException
from pm.api.search.issue import TransformError, transform_query
from pm.api.utils.router import APIRouter
from pm.api.views.custom_fields import CustomFieldLinkOutput
from pm.api.views.issue import (
    CustomFieldValueOutT,
    IssueOutput,
    ProjectField,
    transform_custom_field_value,
)
from pm.api.views.output import BaseListOutput, ModelIdOutput, SuccessPayloadOutput
from pm.api.views.params import ListParams
from pm.tasks.actions import task_notify_by_pararam
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
        )


class BoardCreate(BaseModel):
    name: str
    description: str | None = None
    query: str | None = None
    projects: list[PydanticObjectId]
    column_field: PydanticObjectId
    columns: list
    swimlane_field: PydanticObjectId | None = None
    swimlanes: list = Field(default_factory=list)
    card_fields: list[PydanticObjectId] = Field(default_factory=list)


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
    q = m.Board.find().sort(m.Board.name)
    results = []
    async for obj in q.limit(query.limit).skip(query.offset):
        results.append(BoardOutput.from_obj(obj))
    return BaseListOutput.make(
        count=await q.count(),
        limit=query.limit,
        offset=query.offset,
        items=results,
    )


@router.post('')
async def create_board(
    body: BoardCreate,
) -> SuccessPayloadOutput[BoardOutput]:
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
                HTTPStatus.BAD_REQUEST, 'Swimlane field can' 't be of type MULTI'
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
    return SuccessPayloadOutput(payload=BoardOutput.from_obj(board))


@router.put('/{board_id}')
async def update_board(
    board_id: PydanticObjectId,
    body: BoardUpdate,
) -> SuccessPayloadOutput[BoardOutput]:
    board = await m.Board.find_one(m.Board.id == board_id)
    if not board:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Board not found')
    data = body.dict(exclude_unset=True)
    for k in ('name', 'description', 'query'):
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
                    HTTPStatus.BAD_REQUEST, 'Swimlane field can' 't be of type MULTI'
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
    await board.delete()
    return ModelIdOutput.make(board_id)


@router.get('/{board_id}/issues')
async def get_board_issues(
    board_id: PydanticObjectId,
) -> BaseListOutput[SwimlaneOutput]:
    board: m.Board | None = await m.Board.find_one(m.Board.id == board_id)
    if not board:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Board not found')
    flt = {}
    if board.query:
        try:
            flt = await transform_query(board.query)
        except TransformError as err:
            raise HTTPException(HTTPStatus.BAD_REQUEST, err.message) from err
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
    for issue in await m.Issue.find(flt).sort(m.Issue.id).to_list():
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
    user_ctx = current_user()
    board: m.Board | None = await m.Board.find_one(m.Board.id == board_id)
    if not board:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Board not found')
    issue: m.Issue | None = await m.Issue.find_one(m.Issue.id == issue_id)
    if not issue:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')
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
        try:
            for wf in pr.workflows:
                await wf.run(issue)
        except WorkflowException as err:
            raise ValidateModelException(
                payload=IssueOutput.from_obj(issue),
                error_messages=[err.msg],
                error_fields=err.fields_errors,
            )
        issue.gen_history_record(user_ctx.user)
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
        HTTPStatus.BAD_REQUEST, f'Project {p.id} does not have custom field {field.id}'
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
        )
