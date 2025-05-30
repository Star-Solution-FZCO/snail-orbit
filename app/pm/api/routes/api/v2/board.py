from http import HTTPStatus

import beanie.operators as bo
from beanie import PydanticObjectId
from fastapi import Depends, HTTPException
from pydantic import BaseModel

import pm.models as m
from pm.api.context import current_user, current_user_context_dependency
from pm.api.issue_query import IssueQueryTransformError, transform_query
from pm.api.issue_query.search import transform_text_search
from pm.api.utils.router import APIRouter
from pm.api.views.issue import (
    CustomFieldValueOutT,
    IssueOutput,
    transform_custom_field_value,
)
from pm.api.views.output import SuccessPayloadOutput
from pm.api.views.params import IssueSearchParams
from pm.permissions import Permissions

__all__ = ('router',)

router = APIRouter(
    prefix='/board',
    tags=['board'],
    dependencies=[Depends(current_user_context_dependency)],
)


class BoardIssuesOutput(BaseModel):
    swimlanes: list[CustomFieldValueOutT]
    columns: list[CustomFieldValueOutT]
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

    swimlanes_list = [
        transform_custom_field_value(sl, board.swimlane_field) for sl in swimlanes
    ]
    columns_list = [
        transform_custom_field_value(col, board.column_field) for col in board.columns
    ]
    issues_list = []

    for sl, cols in swimlanes.items():
        swimlane_columns = []
        for col_value in board.columns:
            if col_value in cols:
                issues = cols[col_value]
                issues.sort(key=lambda i: priorities.get(i.id, float('inf')))
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
                issues.sort(key=lambda i: priorities.get(i.id, float('inf')))
                non_swimlane_columns.append(
                    [IssueOutput.from_obj(issue) for issue in issues]
                )
            else:
                non_swimlane_columns.append([])
        issues_list.append(non_swimlane_columns)

    return SuccessPayloadOutput(
        payload=BoardIssuesOutput(
            swimlanes=swimlanes_list,
            columns=columns_list,
            issues=issues_list,
        )
    )
