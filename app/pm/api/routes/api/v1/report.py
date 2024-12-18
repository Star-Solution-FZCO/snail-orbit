import dataclasses
from collections import defaultdict
from http import HTTPStatus
from typing import Any

import beanie.operators as bo
from beanie import PydanticObjectId
from fastapi import Depends, HTTPException
from pydantic import BaseModel

import pm.models as m
from pm.api.context import current_user, current_user_context_dependency
from pm.api.utils.router import APIRouter
from pm.api.views.output import SuccessPayloadOutput
from pm.models import CustomFieldTypeT
from pm.permissions import PermAnd, Permissions

__all__ = ('router',)


router = APIRouter(
    prefix='/report',
    tags=['report'],
    dependencies=[Depends(current_user_context_dependency)],
)


class Projects(BaseModel):
    projects: list[PydanticObjectId]


class ReportCreate(Projects):
    field: str


class ReportItem(BaseModel):
    value: Any | None
    count: int


class ReportOutput(BaseModel):
    values: list[ReportItem]
    count: int


class MatrixReportCreate(Projects):
    fields: list[str]


class MatrixRow(BaseModel):
    value: Any | None
    values: list[int]
    count: int


class MatrixReportOutput(BaseModel):
    columns: list[Any | None]
    rows: list[MatrixRow]
    totals: list[int]
    grand_total: int


@dataclasses.dataclass
class MatrixReport:
    rows: set[Any] = dataclasses.field(default_factory=set)
    columns: set[Any] = dataclasses.field(default_factory=set)
    counts: dict = dataclasses.field(
        default_factory=lambda: defaultdict(lambda: defaultdict(int))
    )
    column_totals: dict[Any, int] = dataclasses.field(
        default_factory=lambda: defaultdict(int)
    )
    row_totals: dict[Any, int] = dataclasses.field(
        default_factory=lambda: defaultdict(int)
    )
    grand_total: int = 0

    def add(self, rows: list, columns: list) -> None:
        self.rows.update(rows)
        self.columns.update(columns)
        for r in rows:
            for c in columns:
                self.counts[r][c] += 1
                self.column_totals[c] += 1
                self.row_totals[r] += 1
                self.grand_total += 1

    def build(self) -> MatrixReportOutput:
        columns = list(self.columns)
        matrix_rows = []
        for r in self.rows:
            values = [self.counts[r][c] for c in columns]
            matrix_rows.append(
                MatrixRow(value=r, values=values, count=self.row_totals[r])
            )
        return MatrixReportOutput(
            columns=columns,
            rows=matrix_rows,
            totals=[self.column_totals[c] for c in columns],
            grand_total=self.grand_total,
        )


@router.post('/by-field')
async def make_report_by_field(
    body: ReportCreate,
) -> SuccessPayloadOutput[ReportOutput]:
    project_ids = set(body.projects)
    if not project_ids:
        raise HTTPException(
            HTTPStatus.BAD_REQUEST, 'At least one project must be specified'
        )
    user_ctx = current_user()
    projects = await m.Project.find(
        bo.In(m.Project.id, project_ids), fetch_links=True
    ).to_list()
    for p in project_ids - {p.id for p in projects}:
        raise HTTPException(HTTPStatus.BAD_REQUEST, f'Project {p} not found')
    for project in projects:
        user_ctx.validate_project_permission(
            project, PermAnd(Permissions.PROJECT_READ, Permissions.ISSUE_READ)
        )
    for project in projects:
        if not any(field.name == body.field for field in project.custom_fields):
            raise HTTPException(
                status_code=HTTPStatus.NOT_FOUND,
                detail=f'Field {body.field} not found in {project.id}',
            )
    q = m.Issue.find(
        bo.And(
            bo.In(m.Issue.project.id, project_ids),
        )
    )
    counts = defaultdict(int)
    issues = 0
    async for obj in q:
        field = obj.get_field_by_name(body.field)
        if field is None or field.value is None:
            counts[None] += 1
            issues += 1
            continue
        issues += 1
        if field.type in (CustomFieldTypeT.USER_MULTI, CustomFieldTypeT.ENUM_MULTI):
            for val in field.value:
                counts[val] += 1
            continue
        counts[field.value] += 1
    items = [ReportItem(value=value, count=count) for value, count in counts.items()]
    items.sort(key=lambda x: x.count, reverse=True)
    return SuccessPayloadOutput(payload=ReportOutput(values=items, count=issues))


@router.post('/by-project')
async def make_report_by_project(
    body: Projects,
) -> SuccessPayloadOutput[ReportOutput]:
    user_ctx = current_user()
    project_ids = set(body.projects)
    if not project_ids:
        raise HTTPException(
            HTTPStatus.BAD_REQUEST, 'At least one project must be specified'
        )
    projects = await m.Project.find(bo.In(m.Project.id, project_ids)).to_list()
    for p in project_ids - {p.id for p in projects}:
        raise HTTPException(HTTPStatus.BAD_REQUEST, f'Project {p} not found')
    for project in projects:
        user_ctx.validate_project_permission(
            project, PermAnd(Permissions.PROJECT_READ, Permissions.ISSUE_READ)
        )
    items = []
    issues = 0
    for project in projects:
        count = await m.Issue.find(bo.Eq(m.Issue.project.id, project.id)).count()
        items.append(ReportItem(value=project, count=count))
        issues += count
    items.sort(key=lambda x: x.count, reverse=True)
    return SuccessPayloadOutput(payload=ReportOutput(values=items, count=issues))


@router.post('/matrix')
async def make_matrix_report(
    body: MatrixReportCreate,
) -> SuccessPayloadOutput[MatrixReportOutput]:
    if len(set(body.fields)) != 2:
        raise HTTPException(
            HTTPStatus.BAD_REQUEST,
            'Exactly two different fields must be specified for matrix report',
        )
    project_ids = set(body.projects)
    if not project_ids:
        raise HTTPException(
            HTTPStatus.BAD_REQUEST, 'At least one project must be specified'
        )
    projects = await m.Project.find(
        bo.In(m.Project.id, project_ids), fetch_links=True
    ).to_list()
    for p in project_ids - {p.id for p in projects}:
        raise HTTPException(HTTPStatus.BAD_REQUEST, f'Project {p} not found')
    user_ctx = current_user()
    for project in projects:
        user_ctx.validate_project_permission(
            project, PermAnd(Permissions.PROJECT_READ, Permissions.ISSUE_READ)
        )
    for project in projects:
        project_fields = {field.name for field in project.custom_fields}
        for field in body.fields:
            if field not in project_fields:
                raise HTTPException(
                    status_code=HTTPStatus.NOT_FOUND,
                    detail=f'Field {field} not found in {project.id}',
                )
    column_field, row_field = body.fields
    matrix = MatrixReport()
    async for issue in m.Issue.find(bo.In(m.Issue.project.id, project_ids)):
        row = issue.get_field_by_name(row_field)
        col = issue.get_field_by_name(column_field)
        matrix.add(rows=process_field_value(row), columns=process_field_value(col))
    matrix = matrix.build()
    return SuccessPayloadOutput(payload=matrix)


def process_field_value(
    field: m.CustomFieldValue | None,
) -> list[Any]:
    if not field:
        return [None]
    if field.value is None:
        return [None]
    if field.type in (CustomFieldTypeT.USER_MULTI, CustomFieldTypeT.ENUM_MULTI):
        return field.value
    return [field.value]
