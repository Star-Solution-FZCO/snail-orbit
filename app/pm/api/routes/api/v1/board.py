# pylint: disable=too-many-lines
from collections.abc import Sequence
from http import HTTPStatus
from typing import Annotated, Any
from uuid import UUID

import beanie.operators as bo
from beanie import PydanticObjectId
from fastapi import Depends, HTTPException, Query
from pydantic import BaseModel, Field, RootModel

import pm.models as m
from pm.api.context import current_user, current_user_context_dependency
from pm.api.events_bus import send_event
from pm.api.exceptions import ValidateModelException
from pm.api.issue_query import IssueQueryTransformError, transform_query
from pm.api.issue_query.search import transform_text_search
from pm.api.utils.router import APIRouter
from pm.api.views.custom_fields import (
    BooleanCustomFieldGroupWithValuesOutput,
    CustomFieldGroupLinkOutput,
    CustomFieldGroupWithValuesOutputT,
    CustomFieldLinkOutput,
    DateCustomFieldGroupWithValuesOutput,
    DateTimeCustomFieldGroupWithValuesOutput,
    EnumCustomFieldGroupWithValuesOutput,
    FloatCustomFieldGroupWithValuesOutput,
    IntegerCustomFieldGroupWithValuesOutput,
    StateCustomFieldGroupWithValuesOutput,
    StringCustomFieldGroupWithValuesOutput,
    UserCustomFieldGroupWithValuesOutput,
    VersionCustomFieldGroupWithValuesOutput,
    custom_field_group_with_values_output_cls_from_type,
)
from pm.api.views.issue import (
    CustomFieldValueOutT,
    IssueOutput,
    ProjectField,
)
from pm.api.views.output import (
    BaseListOutput,
    ModelIdOutput,
    SuccessPayloadOutput,
    UUIDOutput,
)
from pm.api.views.params import IssueSearchParams, ListParams
from pm.api.views.permission import PermissionOutput
from pm.api.views.user import UserOutput
from pm.permissions import PermAnd, Permissions
from pm.services.issue import update_tags_on_close_resolve
from pm.tasks.actions.notification_batch import schedule_batched_notification
from pm.utils.dateutils import utcnow
from pm.utils.events_bus import Event, EventType
from pm.utils.pydantic_uuid import UUIDStr
from pm.workflows import WorkflowException

__all__ = ('router',)

router = APIRouter(
    prefix='/board',
    tags=['board'],
    dependencies=[Depends(current_user_context_dependency)],
)


BoardColumnOutputT = (
    EnumCustomFieldGroupWithValuesOutput
    | StateCustomFieldGroupWithValuesOutput
    | VersionCustomFieldGroupWithValuesOutput
)


class BoardColumnOutputRootModel(RootModel):
    root: Annotated[BoardColumnOutputT, Field(..., discriminator='type')]


BoardSwimlaneOutputT = (
    StringCustomFieldGroupWithValuesOutput
    | IntegerCustomFieldGroupWithValuesOutput
    | FloatCustomFieldGroupWithValuesOutput
    | BooleanCustomFieldGroupWithValuesOutput
    | DateCustomFieldGroupWithValuesOutput
    | DateTimeCustomFieldGroupWithValuesOutput
    | UserCustomFieldGroupWithValuesOutput
    | EnumCustomFieldGroupWithValuesOutput
    | StateCustomFieldGroupWithValuesOutput
    | VersionCustomFieldGroupWithValuesOutput
)


class BoardSwimlaneOutputRootModel(RootModel):
    root: Annotated[BoardSwimlaneOutputT, Field(..., discriminator='type')]


def transform_field_with_values_to_discriminated(
    values: list[m.CustomFieldValueT],
    field: m.CustomFieldLink | m.CustomField | m.CustomFieldGroupLink,
) -> CustomFieldGroupWithValuesOutputT:
    output_cls = custom_field_group_with_values_output_cls_from_type(field.type)

    transformed_values = []
    for value in values:
        transformed_value = value
        if value is None:
            transformed_value = None
        elif field.type == m.CustomFieldTypeT.DATE and value is not None:
            transformed_value = value.date()
        elif isinstance(value, m.UserLinkField):
            transformed_value = UserOutput.from_obj(value)
        elif (
            isinstance(value, list) and value and isinstance(value[0], m.UserLinkField)
        ):
            transformed_value = [UserOutput.from_obj(v) for v in value]
        transformed_values.append(transformed_value)

    return output_cls(
        field=CustomFieldGroupLinkOutput.from_obj(field),
        type=field.type,
        values=transformed_values,
    )


class BoardOutput(BaseModel):
    id: PydanticObjectId = Field(description='Board identifier')
    name: str = Field(description='Board name')
    description: str | None = Field(description='Board description')
    query: str | None = Field(description='Board query filter')
    projects: list[ProjectField] = Field(description='Associated projects')
    columns: BoardColumnOutputRootModel = Field(
        description='Column configuration with discriminated values'
    )
    swimlanes: BoardSwimlaneOutputRootModel | None = Field(
        description='Swimlane configuration with discriminated values'
    )
    card_fields: list[CustomFieldGroupLinkOutput] = Field(
        description='Fields shown on cards'
    )
    card_colors_fields: list[CustomFieldGroupLinkOutput] = Field(
        description='Fields used for card colors'
    )
    ui_settings: dict = Field(description='UI configuration settings')
    created_by: UserOutput = Field(description='Board creator')
    permissions: list[PermissionOutput] = Field(description='Board permissions')
    is_favorite: bool = Field(description='Whether board is favorited by current user')

    @classmethod
    def from_obj(cls, obj: m.Board) -> 'BoardOutput':
        user_ctx = current_user()
        return cls(
            id=obj.id,
            name=obj.name,
            description=obj.description,
            query=obj.query,
            projects=[ProjectField.from_obj(p) for p in obj.projects],
            columns=transform_field_with_values_to_discriminated(
                obj.columns, obj.column_field
            ),
            swimlanes=transform_field_with_values_to_discriminated(
                obj.swimlanes, obj.swimlane_field
            )
            if obj.swimlane_field
            else None,
            card_fields=[
                CustomFieldGroupLinkOutput.from_obj(f) for f in obj.card_fields
            ],
            card_colors_fields=[
                CustomFieldGroupLinkOutput.from_obj(f) for f in obj.card_colors_fields
            ],
            ui_settings=obj.ui_settings,
            created_by=UserOutput.from_obj(obj.created_by),
            permissions=[
                PermissionOutput.from_obj(p) for p in obj.filter_permissions(user_ctx)
            ],
            is_favorite=obj.is_favorite_of(user_ctx.user.id),
        )


class BoardCreate(BaseModel):
    name: str
    description: str | None = None
    query: str | None = None
    projects: list[PydanticObjectId]
    column_field: UUIDStr
    columns: list
    swimlane_field: UUIDStr | None = None
    swimlanes: Annotated[list, Field(default_factory=list)]
    card_fields: Annotated[list[UUIDStr], Field(default_factory=list)]
    card_colors_fields: Annotated[list[UUIDStr], Field(default_factory=list)]
    ui_settings: Annotated[dict, Field(default_factory=dict)]


class BoardUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    query: str | None = None
    projects: list[PydanticObjectId] | None = None
    column_field: UUIDStr | None = None
    columns: list | None = None
    swimlane_field: UUIDStr | None = None
    swimlanes: list | None = None
    card_fields: list[UUIDStr] | None = None
    card_colors_fields: list[UUIDStr] | None = None
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
    filter_query = m.Board.get_filter_query(user_ctx=user_ctx)
    q = m.Board.aggregate(
        [
            {'$match': filter_query},
            {
                '$addFields': {
                    'is_favorite': {'$in': [user_ctx.user.id, '$favorite_of']}
                }
            },
            {'$sort': {'is_favorite': -1, 'name': 1}},
            {'$skip': query.offset},
            {'$limit': query.limit},
        ],
        projection_model=m.Board,
    )
    cnt = await m.Board.find(filter_query).count()
    return BaseListOutput.make(
        items=[BoardOutput.from_obj(board) async for board in q],
        count=cnt,
        limit=query.limit,
        offset=query.offset,
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

    card_fields = await _resolve_custom_field_groups(body.card_fields)
    for cf in card_fields:
        _any_projects_has_custom_field(cf, projects)

    card_colors_fields = await _resolve_custom_field_groups(body.card_colors_fields)
    for cf in card_colors_fields:
        validate_custom_field_has_one_color(cf)
        _all_projects_has_custom_field(cf, projects)

    column_field_ = await _resolve_custom_field_groups([body.column_field])
    if not column_field_:
        raise HTTPException(HTTPStatus.BAD_REQUEST, 'Column field not found')
    column_field = column_field_[0]
    if column_field.type not in (m.CustomFieldTypeT.STATE, m.CustomFieldTypeT.ENUM):
        raise HTTPException(
            HTTPStatus.BAD_REQUEST, 'Column field must be of type STATE or ENUM'
        )
    _all_projects_has_custom_field(column_field, projects)
    columns = await validate_custom_field_values(column_field, body.columns)

    swimlane_field: m.CustomFieldGroupLink | None = None
    swimlanes = []
    if body.swimlane_field:
        swimlane_field_ = await _resolve_custom_field_groups([body.swimlane_field])
        if not swimlane_field_:
            raise HTTPException(HTTPStatus.BAD_REQUEST, 'Swimlane field not found')
        swimlane_field = swimlane_field_[0]
        if swimlane_field.type in (
            m.CustomFieldTypeT.ENUM_MULTI,
            m.CustomFieldTypeT.USER_MULTI,
        ):
            raise HTTPException(
                HTTPStatus.BAD_REQUEST, 'Swimlane field can not be of type MULTI'
            )
        _all_projects_has_custom_field(swimlane_field, projects)
        swimlanes = await validate_custom_field_values(swimlane_field, body.swimlanes)

    board = m.Board(
        name=body.name,
        description=body.description,
        query=body.query,
        projects=[m.ProjectLinkField.from_obj(p) for p in projects],
        column_field=column_field,
        columns=columns,
        swimlane_field=swimlane_field,
        swimlanes=swimlanes,
        card_fields=card_fields,
        card_colors_fields=card_colors_fields,
        ui_settings=body.ui_settings,
        created_by=m.UserLinkField.from_obj(user_ctx.user),
        permissions=[
            m.PermissionRecord(
                target_type=m.PermissionTargetType.USER,
                target=m.UserLinkField.from_obj(user_ctx.user),
                permission_type=m.PermissionType.ADMIN,
            )
        ],
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
    if not board.check_permissions(user_ctx, m.PermissionType.VIEW):
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
    if not board.check_permissions(user_ctx, m.PermissionType.EDIT):
        raise HTTPException(HTTPStatus.FORBIDDEN, 'No permission to edit this board')

    data = body.model_dump(
        exclude_unset=True, include={'name', 'description', 'query', 'ui_settings'}
    )
    for k, v in data.items():
        setattr(board, k, v)

    if 'projects' in body.model_fields_set:
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

    if 'column_field' in body.model_fields_set:
        column_field_ = await _resolve_custom_field_groups([body.column_field])
        if not column_field_:
            raise HTTPException(HTTPStatus.BAD_REQUEST, 'Column field not found')
        board.column_field = column_field_[0]
        if board.column_field.type not in (
            m.CustomFieldTypeT.STATE,
            m.CustomFieldTypeT.ENUM,
        ):
            raise HTTPException(
                HTTPStatus.BAD_REQUEST, 'Column field must be of type STATE or ENUM'
            )

    _all_projects_has_custom_field(board.column_field, projects)
    columns = body.columns if 'columns' in body.model_fields_set else board.columns
    board.columns = await validate_custom_field_values(board.column_field, columns)

    if 'swimlane_field' in body.model_fields_set:
        if not body.swimlane_field:
            board.swimlane_field = None
        else:
            swimlane_field_ = await _resolve_custom_field_groups([body.swimlane_field])
            if not swimlane_field_:
                raise HTTPException(HTTPStatus.BAD_REQUEST, 'Swimlane field not found')
            swimlane_field = swimlane_field_[0]
            if swimlane_field.type in (
                m.CustomFieldTypeT.ENUM_MULTI,
                m.CustomFieldTypeT.USER_MULTI,
            ):
                raise HTTPException(
                    HTTPStatus.BAD_REQUEST, 'Swimlane field can not be of type MULTI'
                )
            board.swimlane_field = swimlane_field
    if board.swimlane_field:
        _all_projects_has_custom_field(board.swimlane_field, projects)
        swimlanes = (
            body.swimlanes if 'swimlanes' in body.model_fields_set else board.swimlanes
        )
        board.swimlanes = await validate_custom_field_values(
            board.swimlane_field, swimlanes
        )
    else:
        board.swimlanes = []

    if 'card_fields' in body.model_fields_set:
        board.card_fields = await _resolve_custom_field_groups(body.card_fields)
    for cf in board.card_fields:
        _any_projects_has_custom_field(cf, projects)

    if 'card_colors_fields' in body.model_fields_set:
        board.card_colors_fields = await _resolve_custom_field_groups(
            body.card_colors_fields
        )
    for cf in board.card_colors_fields:
        validate_custom_field_has_one_color(cf)
        _all_projects_has_custom_field(cf, projects)

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
    if not board.check_permissions(user_ctx, m.PermissionType.EDIT):
        raise HTTPException(HTTPStatus.FORBIDDEN, 'No permission to delete this board')
    await board.delete()
    return ModelIdOutput.make(board_id)


class BoardIssuesOutput(BaseModel):
    columns: BoardColumnOutputRootModel = Field(
        description='Column configuration with discriminated values'
    )
    swimlanes: BoardSwimlaneOutputRootModel | None = Field(
        description='Swimlane configuration with discriminated values'
    )
    issues: list[list[list[IssueOutput]]]


@router.get('/{board_id}/issues')
async def get_board_issues(
    board_id: PydanticObjectId,
    query: IssueSearchParams = Depends(),
) -> SuccessPayloadOutput[BoardIssuesOutput]:
    user_ctx = current_user()

    board: m.Board | None = await m.Board.find_one(m.Board.id == board_id)
    if not board:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Board not found')
    if not board.check_permissions(user_ctx, m.PermissionType.VIEW):
        raise HTTPException(HTTPStatus.FORBIDDEN, 'No permission to view this board')

    q = m.Issue.find(
        bo.In(
            m.Issue.project.id,
            user_ctx.get_projects_with_permission(Permissions.ISSUE_READ),
        )
    )

    if board.query:
        try:
            flt, _ = await transform_query(
                board.query, current_user_email=user_ctx.user.email
            )
            q = q.find(flt)
        except IssueQueryTransformError as err:
            raise HTTPException(HTTPStatus.BAD_REQUEST, err.message) from err

    if board.projects:
        q = q.find(bo.In(m.Issue.project.id, [p.id for p in board.projects]))

    if query.q:
        try:
            flt, _ = await transform_query(
                query.q, current_user_email=user_ctx.user.email
            )
            q = q.find(flt)
        except IssueQueryTransformError as err:
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

    for issue in await q.project(m.Issue.get_ro_projection_model()).to_list():
        if board.swimlane_field and not (
            sl_field := issue.get_field_by_gid(board.swimlane_field.gid)
        ):
            continue
        if not (col_field := issue.get_field_by_gid(board.column_field.gid)):
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
    if board.issues_order:

        def apply_relationship_ordering(col_issues: list[m.Issue]) -> None:
            if not col_issues or not board.issues_order:
                return

            relationships = dict(board.issues_order)
            issue_ids_in_col = {issue.id for issue in col_issues}

            relevant_relationships = [
                (issue_id, after_id)
                for issue_id, after_id in relationships.items()
                if issue_id in issue_ids_in_col
                and (after_id is None or after_id in issue_ids_in_col)
            ]

            if not relevant_relationships:
                return

            result = col_issues.copy()
            issue_map = {issue.id: i for i, issue in enumerate(result)}

            for moved_issue_id, after_issue_id in relevant_relationships:
                moved_idx = issue_map.get(moved_issue_id)
                if moved_idx is None:
                    continue

                moved_issue = result.pop(moved_idx)

                if after_issue_id is None:
                    target_idx = 0
                else:
                    after_idx = issue_map.get(after_issue_id)
                    if after_idx is None:
                        continue
                    target_idx = after_idx + 1 if after_idx < moved_idx else after_idx

                result.insert(target_idx, moved_issue)

                issue_map = {issue.id: i for i, issue in enumerate(result)}

            col_issues[:] = result

        for sl_result in swimlanes.values():
            for col_result in sl_result.values():
                apply_relationship_ordering(col_result)
        if non_swimlane is not None:
            for col_result in non_swimlane.values():
                apply_relationship_ordering(col_result)

    issues_list = []

    for sl, cols in swimlanes.items():
        swimlane_columns = []
        for col_value in board.columns:
            if col_value in cols:
                issues = cols[col_value]
                swimlane_columns.append(
                    [IssueOutput.from_obj(issue) for issue in issues]
                )
            else:
                swimlane_columns.append([])
        issues_list.append(swimlane_columns)

    if non_swimlane is not None:
        non_swimlane_columns = []
        for col_value in board.columns:
            if col_value in non_swimlane:
                issues = non_swimlane[col_value]
                non_swimlane_columns.append(
                    [IssueOutput.from_obj(issue) for issue in issues]
                )
            else:
                non_swimlane_columns.append([])
        issues_list.append(non_swimlane_columns)

    return SuccessPayloadOutput(
        payload=BoardIssuesOutput(
            columns=transform_field_with_values_to_discriminated(
                board.columns, board.column_field
            ),
            swimlanes=transform_field_with_values_to_discriminated(
                board.swimlanes, board.swimlane_field
            )
            if board.swimlane_field
            else None,
            issues=issues_list,
        )
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
    if not board.check_permissions(user_ctx, m.PermissionType.VIEW):
        raise HTTPException(HTTPStatus.FORBIDDEN, 'No permission to use this board')
    issue: m.Issue | None = await m.Issue.find_one(m.Issue.id == issue_id)
    if not issue:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Issue not found')

    user_ctx.validate_issue_permission(
        issue, PermAnd(Permissions.ISSUE_READ, Permissions.ISSUE_UPDATE)
    )

    data = body.dict(exclude_unset=True)
    if 'column' in data:
        column = (
            await validate_custom_field_values(board.column_field, [data['column']])
        )[0]
        if column not in board.columns:
            raise HTTPException(HTTPStatus.BAD_REQUEST, 'Invalid column')
        if not (issue_field := issue.get_field_by_gid(board.column_field.gid)):
            raise HTTPException(
                HTTPStatus.INTERNAL_SERVER_ERROR, 'Issue has no column field'
            )
        issue_field.value = column
    if 'swimlane' in data:
        if not board.swimlane_field:
            raise HTTPException(HTTPStatus.BAD_REQUEST, 'Board has no swimlanes')
        swimlane = (
            await validate_custom_field_values(board.swimlane_field, [body.swimlane])
        )[0]
        if swimlane not in board.swimlanes:
            raise HTTPException(HTTPStatus.BAD_REQUEST, 'Invalid swimlane')
        if not (issue_field := issue.get_field_by_gid(board.swimlane_field.gid)):
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
            ) from err
        issue.update_state(now=now)
        await update_tags_on_close_resolve(issue)
        issue.gen_history_record(user_ctx.user, time=now)
        latest_history_changes = issue.history[-1].changes if issue.history else []
        issue.updated_at = now
        issue.updated_by = m.UserLinkField.from_obj(user_ctx.user)
        await issue.replace()
        await schedule_batched_notification(
            'update',
            issue.subject,
            issue.id_readable,
            [str(s) for s in issue.subscribers],
            str(issue.project.id),
            author=user_ctx.user.email,
            field_changes=latest_history_changes,
        )
        await send_event(
            Event(
                type=EventType.ISSUE_UPDATE,
                data={'issue_id': str(issue.id), 'project_id': str(issue.project.id)},
            )
        )
    board.move_issue(issue.id, after_issue.id if after_issue else None)
    await board.save_changes()
    return ModelIdOutput.make(issue_id)


@router.get('/column_field/select')
async def select_column_field(
    project_id: list[PydanticObjectId] = Query(...),
) -> BaseListOutput[CustomFieldGroupLinkOutput]:
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
        items=[CustomFieldGroupLinkOutput.from_obj(cf) for cf in fields],
    )


@router.get('/swimlane_field/select')
async def select_swimlane_field(
    project_id: list[PydanticObjectId] = Query(...),
) -> BaseListOutput[CustomFieldGroupLinkOutput]:
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
        items=[CustomFieldGroupLinkOutput.from_obj(cf) for cf in fields],
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
) -> BaseListOutput[CustomFieldGroupLinkOutput]:
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
        items=[CustomFieldGroupLinkOutput.from_obj(cf) for cf in fields],
    )


class GrantPermissionBody(BaseModel):
    target_type: m.PermissionTargetType
    target: PydanticObjectId
    permission_type: m.PermissionType


class UpdatePermissionBody(BaseModel):
    permission_type: m.PermissionType


@router.post('/{board_id}/permission')
async def grant_permission(
    board_id: PydanticObjectId,
    body: GrantPermissionBody,
) -> UUIDOutput:
    """
    Grants one permission from set of permission types to a specified target (user or group) for a board.
    """
    board = await m.Board.find_one(m.Board.id == board_id)
    if not board:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail='Board not found')
    user_ctx = current_user()
    if not board.check_permissions(user_ctx, m.PermissionType.ADMIN):
        raise HTTPException(
            status_code=HTTPStatus.FORBIDDEN,
            detail='You cannot modify permissions for this board',
        )
    if body.target_type == m.PermissionTargetType.USER:
        user: m.User | None = await m.User.find_one(m.User.id == body.target)
        if not user:
            raise HTTPException(HTTPStatus.NOT_FOUND, 'User not found')
        target = m.UserLinkField.from_obj(user)
    else:
        group: m.Group | None = await m.Group.find_one(m.Group.id == body.target)
        if not group:
            raise HTTPException(HTTPStatus.NOT_FOUND, 'Group not found')
        target = m.GroupLinkField.from_obj(group)
    if board.has_permission_for_target(target):
        raise HTTPException(HTTPStatus.CONFLICT, 'Permission already granted')
    p = m.PermissionRecord(
        target_type=body.target_type,
        target=target,
        permission_type=body.permission_type,
    )
    board.permissions.append(p)
    await board.save_changes()
    return UUIDOutput.make(p.id)


@router.put('/{board_id}/permission/{permission_id}')
async def change_permission(
    board_id: PydanticObjectId,
    permission_id: UUID,
    body: UpdatePermissionBody,
) -> UUIDOutput:
    board = await m.Board.find_one(m.Board.id == board_id)
    if not board:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Board not found')
    user_ctx = current_user()
    if not board.check_permissions(user_ctx, m.PermissionType.ADMIN):
        raise HTTPException(
            HTTPStatus.FORBIDDEN,
            'You cannot modify permissions for this board',
        )
    if not (
        perm := next(
            (obj for obj in board.permissions if obj.id == permission_id), None
        )
    ):
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Permission not found')
    if perm.permission_type == body.permission_type:
        return UUIDOutput.make(perm.id)
    if (
        perm.permission_type == m.PermissionType.ADMIN
        and not board.has_any_other_admin_target(perm.target)
    ):
        raise HTTPException(HTTPStatus.FORBIDDEN, 'Board must have at least one admin')
    perm.permission_type = body.permission_type
    await board.save_changes()
    return UUIDOutput.make(perm.id)


@router.delete('/{board_id}/permission/{permission_id}')
async def revoke_permission(
    board_id: PydanticObjectId,
    permission_id: UUID,
) -> UUIDOutput:
    board = await m.Board.find_one(m.Board.id == board_id)
    if not board:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail='Board not found')
    user_ctx = current_user()
    if not board.check_permissions(user_ctx, m.PermissionType.ADMIN):
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
    if (
        perm.permission_type == m.PermissionType.ADMIN
        and not board.has_any_other_admin_target(perm.target)
    ):
        raise HTTPException(HTTPStatus.FORBIDDEN, 'Board must have at least one admin')
    board.permissions.remove(perm)
    await board.save_changes()
    return UUIDOutput.make(perm.id)


@router.get('/{board_id}/permissions')
async def get_board_permissions(
    board_id: PydanticObjectId,
    query: ListParams = Depends(),
) -> BaseListOutput[PermissionOutput]:
    board = await m.Board.find_one(m.Board.id == board_id)
    if not board:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Board not found')
    user_ctx = current_user()
    if not board.check_permissions(user_ctx, m.PermissionType.ADMIN):
        raise HTTPException(HTTPStatus.FORBIDDEN, 'You cannot view board permissions')
    return BaseListOutput.make(
        count=len(board.permissions),
        limit=query.limit,
        offset=query.offset,
        items=[
            PermissionOutput.from_obj(perm)
            for perm in board.permissions[query.offset : query.offset + query.limit]
        ],
    )


@router.post('/{board_id}/favorite')
async def favorite_board(
    board_id: PydanticObjectId,
) -> SuccessPayloadOutput[BoardOutput]:
    user_ctx = current_user()
    board = await m.Board.find_one(m.Board.id == board_id)
    if not board:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Board not found')
    if not board.check_permissions(user_ctx, m.PermissionType.VIEW):
        raise HTTPException(HTTPStatus.FORBIDDEN, 'No permission to view this board')
    if board.is_favorite_of(user_ctx.user.id):
        raise HTTPException(HTTPStatus.CONFLICT, 'Board already in favorites')
    board.favorite_of.append(user_ctx.user.id)
    await board.save_changes()
    return SuccessPayloadOutput(payload=BoardOutput.from_obj(board))


@router.post('/{board_id}/unfavorite')
async def unfavorite_board(
    board_id: PydanticObjectId,
) -> SuccessPayloadOutput[BoardOutput]:
    user_ctx = current_user()
    board = await m.Board.find_one(m.Board.id == board_id)
    if not board:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Board not found')
    if not board.check_permissions(user_ctx, m.PermissionType.VIEW):
        raise HTTPException(HTTPStatus.FORBIDDEN, 'No permission to view this board')
    if not board.is_favorite_of(user_ctx.user.id):
        raise HTTPException(HTTPStatus.CONFLICT, 'Board is not in favorites')
    board.favorite_of.remove(user_ctx.user.id)
    await board.save_changes()
    return SuccessPayloadOutput(payload=BoardOutput.from_obj(board))


def _intersect_custom_fields(
    projects: Sequence[m.Project],
) -> set[m.CustomFieldGroupLink]:
    if not projects:
        return set()
    return set.intersection(
        *(
            {m.CustomFieldGroupLink.from_obj(cf) for cf in pr.custom_fields}
            for pr in projects
        )
    )


def _all_projects_has_custom_field(
    field: m.CustomField | m.CustomFieldLink | m.CustomFieldGroupLink,
    projects: Sequence[m.Project],
) -> None:
    if not projects:
        raise HTTPException(HTTPStatus.BAD_REQUEST, 'No projects specified')
    for p in projects:
        if all(cf.gid != field.gid for cf in p.custom_fields):
            raise HTTPException(
                HTTPStatus.BAD_REQUEST,
                f'Field {field.name} not found in project {p.id}',
            )


def _any_projects_has_custom_field(
    field: m.CustomField | m.CustomFieldLink | m.CustomFieldGroupLink,
    projects: Sequence[m.Project],
) -> None:
    if not projects:
        raise HTTPException(HTTPStatus.BAD_REQUEST, 'No projects specified')
    for p in projects:
        if any(cf.gid == field.gid for cf in p.custom_fields):
            return None
    raise HTTPException(
        HTTPStatus.BAD_REQUEST, f'Projects does not have custom field {field.name}'
    )


async def _resolve_custom_field_groups(
    field_gids: list[str],
) -> list[m.CustomFieldGroupLink]:
    if not field_gids:
        return []
    results = await m.CustomField.find(
        bo.In(m.CustomField.gid, field_gids), with_children=True
    ).to_list()

    groups = {cf.gid: m.CustomFieldGroupLink.from_obj(cf) for cf in results}

    if len(groups) != len(field_gids):
        not_found = set(field_gids) - set(groups.keys())
        raise HTTPException(HTTPStatus.BAD_REQUEST, f'Fields not found: {not_found}')

    return [groups[gid] for gid in field_gids]


async def validate_custom_field_values(
    field: m.CustomFieldGroupLink,
    values: list,
) -> list[m.CustomFieldValueT]:
    fields = await field.resolve()
    results = []
    for val in values:
        transformed_value = None
        for cf in fields:
            try:
                results.append(cf.validate_value(val))
                break
            except m.CustomFieldValidationError as err:
                transformed_value = err.value
                continue
        else:
            raise HTTPException(
                HTTPStatus.BAD_REQUEST,
                f'Value {transformed_value} is not valid for field {field.name}',
            )

    return results


def validate_custom_field_has_one_color(
    field: m.CustomFieldGroupLink | m.CustomFieldLink | m.CustomField,
) -> None:
    if field.type not in (
        m.CustomFieldTypeT.ENUM,
        m.CustomFieldTypeT.STATE,
    ):
        raise HTTPException(
            HTTPStatus.BAD_REQUEST, 'Card color field must be of type ENUM or STATE'
        )
