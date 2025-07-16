from http import HTTPStatus
from typing import TYPE_CHECKING, Annotated, Any, Literal
from uuid import UUID

from beanie import PydanticObjectId
from fastapi import Depends, HTTPException
from pydantic import BaseModel, Field, RootModel

import pm.models as m
from pm.api.context import current_user, current_user_context_dependency
from pm.api.issue_query import IssueQueryTransformError, transform_query
from pm.api.utils.router import APIRouter
from pm.api.views.custom_fields import CustomFieldGroupLinkOutput
from pm.api.views.error_responses import error_responses
from pm.api.views.issue import ProjectField
from pm.api.views.output import (
    BaseListOutput,
    ErrorOutput,
    ModelIdOutput,
    SuccessPayloadOutput,
    UUIDOutput,
)
from pm.api.views.params import ListParams
from pm.api.views.permission import PermissionOutput
from pm.api.views.user import UserOutput
from pm.models.custom_fields import CustomFieldValueT
from pm.utils.pydantic_uuid import UUIDStr

if TYPE_CHECKING:
    from pm.api.context import UserContext


__all__ = ('router',)


router = APIRouter(
    prefix='/report',
    tags=['report'],
    dependencies=[Depends(current_user_context_dependency)],
    responses=error_responses(
        (HTTPStatus.UNAUTHORIZED, ErrorOutput),
        (HTTPStatus.FORBIDDEN, ErrorOutput),
    ),
)


# Base output model for common fields
class BaseReportOutput(BaseModel):
    id: str
    name: str
    description: str | None
    query: str | None
    projects: list[ProjectField]
    type: m.ReportType
    created_by: UserOutput
    permissions: list[PermissionOutput]
    is_favorite: bool = Field(description='Whether report is favorited by current user')


class IssuesPerProjectReportOutput(BaseReportOutput):
    type: Literal[m.ReportType.ISSUES_PER_PROJECT] = m.ReportType.ISSUES_PER_PROJECT


class IssuesPerFieldReportOutput(BaseReportOutput):
    type: Literal[m.ReportType.ISSUES_PER_FIELD] = m.ReportType.ISSUES_PER_FIELD
    field: CustomFieldGroupLinkOutput


class IssuesPerTwoFieldsReportOutput(BaseReportOutput):
    type: Literal[m.ReportType.ISSUES_PER_TWO_FIELDS] = (
        m.ReportType.ISSUES_PER_TWO_FIELDS
    )
    row_field: CustomFieldGroupLinkOutput
    column_field: CustomFieldGroupLinkOutput


# Discriminated union for all report outputs
ReportOutput = RootModel[
    Annotated[
        IssuesPerProjectReportOutput
        | IssuesPerFieldReportOutput
        | IssuesPerTwoFieldsReportOutput,
        Field(discriminator='type'),
    ]
]


# Report generation models
class IssuesPerProjectReportDataItem(BaseModel):
    """Single item in an issues-per-project report dataset."""

    value: ProjectField = Field(description='Project information for this item')
    count: int = Field(description='Number of issues for this project')


class IssuesPerProjectReportDataOutput(BaseModel):
    """Output model for generated issues-per-project report data."""

    type: Literal[m.ReportType.ISSUES_PER_PROJECT] = m.ReportType.ISSUES_PER_PROJECT
    items: list[IssuesPerProjectReportDataItem] = Field(
        description='List of project report data items'
    )
    total_count: int = Field(description='Total number of issues across all projects')


class IssuesPerFieldReportDataItem(BaseModel):
    """Single item in an issues-per-field report dataset."""

    value: CustomFieldValueT = Field(
        description='Field value for this item (null for empty values)'
    )
    count: int = Field(description='Number of issues for this field value')


class IssuesPerFieldReportDataOutput(BaseModel):
    """Output model for generated issues-per-field report data."""

    type: Literal[m.ReportType.ISSUES_PER_FIELD] = m.ReportType.ISSUES_PER_FIELD
    items: list[IssuesPerFieldReportDataItem] = Field(
        description='List of field report data items'
    )
    total_count: int = Field(
        description='Total number of issues across all field values'
    )


class IssuesPerTwoFieldsReportColumnItem(BaseModel):
    """Single column item within a row in a two-fields report."""

    value: CustomFieldValueT = Field(description='Column field value')
    count: int = Field(
        description='Number of issues for this column in the current row'
    )


class IssuesPerTwoFieldsReportRowItem(BaseModel):
    """Single row item in a two-fields report dataset."""

    value: CustomFieldValueT = Field(description='Row field value')
    total: int = Field(
        description='Total number of issues for this row across all columns'
    )
    columns: list[IssuesPerTwoFieldsReportColumnItem] = Field(
        description='List of column items for this row'
    )


class IssuesPerTwoFieldsReportDataOutput(BaseModel):
    """Output model for generated issues-per-two-fields report data."""

    type: Literal[m.ReportType.ISSUES_PER_TWO_FIELDS] = (
        m.ReportType.ISSUES_PER_TWO_FIELDS
    )
    rows: list[IssuesPerTwoFieldsReportRowItem] = Field(
        description='List of row items with nested column data'
    )
    total_count: int = Field(
        description='Total number of issues across all field combinations'
    )


# Discriminated union for all report data outputs (extensible for future report types)
ReportDataOutput = RootModel[
    Annotated[
        IssuesPerProjectReportDataOutput
        | IssuesPerFieldReportDataOutput
        | IssuesPerTwoFieldsReportDataOutput,
        Field(discriminator='type'),
    ]
]


def create_report_output(obj: m.Report) -> ReportOutput:
    """Create the appropriate report output based on the report type."""
    user_ctx = current_user()

    base_data = {
        'id': str(obj.id),
        'name': obj.name,
        'description': obj.description,
        'query': obj.query,
        'projects': [ProjectField.from_obj(p) for p in obj.projects],
        'created_by': UserOutput.from_obj(obj.created_by),
        'permissions': [
            PermissionOutput.from_obj(p) for p in obj.filter_permissions(user_ctx)
        ],
        'is_favorite': obj.is_favorite_of(user_ctx.user.id),
    }

    if obj.type == m.ReportType.ISSUES_PER_PROJECT:
        return ReportOutput(root=IssuesPerProjectReportOutput(**base_data))
    if obj.type == m.ReportType.ISSUES_PER_FIELD:
        return ReportOutput(
            root=IssuesPerFieldReportOutput(
                **base_data, field=CustomFieldGroupLinkOutput.from_obj(obj.field)
            )
        )
    if obj.type == m.ReportType.ISSUES_PER_TWO_FIELDS:
        return ReportOutput(
            root=IssuesPerTwoFieldsReportOutput(
                **base_data,
                row_field=CustomFieldGroupLinkOutput.from_obj(obj.row_field),
                column_field=CustomFieldGroupLinkOutput.from_obj(obj.column_field),
            )
        )
    raise HTTPException(HTTPStatus.BAD_REQUEST, f'Unknown report type: {obj.type}')


class GrantPermissionBody(BaseModel):
    target_type: m.PermissionTargetType
    target: PydanticObjectId
    permission_type: m.PermissionType


class BaseReportCreate(BaseModel):
    name: str
    type: m.ReportType
    description: str | None = None
    query: str | None = None
    projects: list[PydanticObjectId] = Field(default_factory=list)
    permissions: Annotated[list[GrantPermissionBody], Field(default_factory=list)]


class IssuesPerProjectReportCreate(BaseReportCreate):
    type: Literal[m.ReportType.ISSUES_PER_PROJECT] = m.ReportType.ISSUES_PER_PROJECT


class IssuesPerFieldReportCreate(BaseReportCreate):
    type: Literal[m.ReportType.ISSUES_PER_FIELD] = m.ReportType.ISSUES_PER_FIELD
    field_gid: UUIDStr


class IssuesPerTwoFieldsReportCreate(BaseReportCreate):
    type: Literal[m.ReportType.ISSUES_PER_TWO_FIELDS] = (
        m.ReportType.ISSUES_PER_TWO_FIELDS
    )
    row_field_gid: UUIDStr
    column_field_gid: UUIDStr


ReportCreate = RootModel[
    Annotated[
        IssuesPerProjectReportCreate
        | IssuesPerFieldReportCreate
        | IssuesPerTwoFieldsReportCreate,
        Field(discriminator='type'),
    ]
]


# Base update model for common fields
class BaseReportUpdate(BaseModel):
    type: m.ReportType
    name: str | None = None
    description: str | None = None
    query: str | None = None
    projects: list[PydanticObjectId] | None = None
    permissions: list[GrantPermissionBody] | None = None


class IssuesPerProjectReportUpdate(BaseReportUpdate):
    type: Literal[m.ReportType.ISSUES_PER_PROJECT] = m.ReportType.ISSUES_PER_PROJECT


class IssuesPerFieldReportUpdate(BaseReportUpdate):
    type: Literal[m.ReportType.ISSUES_PER_FIELD] = m.ReportType.ISSUES_PER_FIELD
    field_gid: UUIDStr | None = None


class IssuesPerTwoFieldsReportUpdate(BaseReportUpdate):
    type: Literal[m.ReportType.ISSUES_PER_TWO_FIELDS] = (
        m.ReportType.ISSUES_PER_TWO_FIELDS
    )
    row_field_gid: UUIDStr | None = None
    column_field_gid: UUIDStr | None = None


# Discriminated union for all report updates
ReportUpdate = RootModel[
    Annotated[
        IssuesPerProjectReportUpdate
        | IssuesPerFieldReportUpdate
        | IssuesPerTwoFieldsReportUpdate,
        Field(discriminator='type'),
    ]
]


@router.get('/list')
async def list_reports(
    query: ListParams = Depends(),
) -> BaseListOutput[ReportOutput]:
    user_ctx = current_user()
    filter_query = m.Report.get_filter_query(user_ctx)
    q = m.Report.find(filter_query, with_children=True).sort(m.Report.name)
    if query.search:
        q = q.find(m.Report.search_query(query.search))

    count = await q.count()
    reports = await q.limit(query.limit).skip(query.offset).to_list()
    items = [create_report_output(report) for report in reports]

    return BaseListOutput.make(
        count=count,
        limit=query.limit,
        offset=query.offset,
        items=items,
    )


async def _create_common_fields(
    body_data: BaseReportCreate, user_ctx: 'UserContext'
) -> dict:
    """Create common fields for all report types."""
    permissions = [
        m.PermissionRecord(
            target_type=m.PermissionTargetType.USER,
            target=m.UserLinkField.from_obj(user_ctx.user),
            permission_type=m.PermissionType.ADMIN,
        ),
    ]
    if len(body_data.permissions) != len(
        {perm.target for perm in body_data.permissions}
    ):
        raise HTTPException(HTTPStatus.BAD_REQUEST, 'Duplicate permission targets')
    for perm in body_data.permissions:
        if perm.target == user_ctx.user.id:
            continue
        target = await resolve_grant_permission_target(perm)
        permissions.append(
            m.PermissionRecord(
                target_type=perm.target_type,
                target=target,
                permission_type=perm.permission_type,
            ),
        )

    # Resolve project links
    projects = []
    if body_data.projects:
        for project_id in body_data.projects:
            project = await m.Project.find_one(m.Project.id == project_id)
            if not project:
                raise HTTPException(
                    HTTPStatus.BAD_REQUEST, f'Project {project_id} not found'
                )
            projects.append(m.ProjectLinkField.from_obj(project))

    return {
        'name': body_data.name,
        'description': body_data.description,
        'query': body_data.query,
        'projects': projects,
        'created_by': m.UserLinkField.from_obj(user_ctx.user),
        'permissions': permissions,
    }


async def _create_issues_per_project_report(
    body_data: IssuesPerProjectReportCreate, user_ctx: 'UserContext'
) -> m.IssuesPerProjectReport:
    """Create an IssuesPerProject report."""
    common_fields = await _create_common_fields(body_data, user_ctx)
    return m.IssuesPerProjectReport(**common_fields)


async def _create_issues_per_field_report(
    body_data: IssuesPerFieldReportCreate, user_ctx: 'UserContext'
) -> m.IssuesPerFieldReport:
    """Create an IssuesPerField report."""
    common_fields = await _create_common_fields(body_data, user_ctx)

    # Resolve field by gid
    field = await m.CustomField.find_one(
        m.CustomField.gid == body_data.field_gid, with_children=True
    )
    if not field:
        raise HTTPException(
            HTTPStatus.BAD_REQUEST, f'Custom field {body_data.field_gid} not found'
        )

    return m.IssuesPerFieldReport(
        **common_fields,
        field=m.CustomFieldGroupLink.from_obj(field),
    )


async def _create_issues_per_two_fields_report(
    body_data: IssuesPerTwoFieldsReportCreate, user_ctx: 'UserContext'
) -> m.IssuesPerTwoFieldsReport:
    """Create an IssuesPerTwoFields report."""
    common_fields = await _create_common_fields(body_data, user_ctx)

    row_field = await m.CustomField.find_one(
        m.CustomField.gid == body_data.row_field_gid, with_children=True
    )
    if not row_field:
        raise HTTPException(
            HTTPStatus.BAD_REQUEST,
            f'Custom field {body_data.row_field_gid} not found',
        )

    column_field = await m.CustomField.find_one(
        m.CustomField.gid == body_data.column_field_gid, with_children=True
    )
    if not column_field:
        raise HTTPException(
            HTTPStatus.BAD_REQUEST,
            f'Custom field {body_data.column_field_gid} not found',
        )

    return m.IssuesPerTwoFieldsReport(
        **common_fields,
        row_field=m.CustomFieldGroupLink.from_obj(row_field),
        column_field=m.CustomFieldGroupLink.from_obj(column_field),
    )


@router.post('/')
async def create_report(body: ReportCreate) -> SuccessPayloadOutput[ReportOutput]:
    user_ctx = current_user()
    body_data = body.root  # Access the discriminated union data

    if body_data.type == m.ReportType.ISSUES_PER_PROJECT:
        report = await _create_issues_per_project_report(body_data, user_ctx)
    elif body_data.type == m.ReportType.ISSUES_PER_FIELD:
        report = await _create_issues_per_field_report(body_data, user_ctx)
    elif body_data.type == m.ReportType.ISSUES_PER_TWO_FIELDS:
        report = await _create_issues_per_two_fields_report(body_data, user_ctx)
    else:
        raise HTTPException(
            HTTPStatus.BAD_REQUEST, f'Unknown report type: {body_data.type}'
        )

    await report.insert()
    return SuccessPayloadOutput(payload=create_report_output(report))


@router.get('/{report_id}')
async def get_report(
    report_id: PydanticObjectId,
) -> SuccessPayloadOutput[ReportOutput]:
    report = await m.Report.find_one(m.Report.id == report_id, with_children=True)
    if not report:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Report not found')
    user_ctx = current_user()
    if not report.check_permissions(user_ctx, m.PermissionType.VIEW):
        raise HTTPException(HTTPStatus.FORBIDDEN, 'No permission to view this report')
    return SuccessPayloadOutput(payload=create_report_output(report))


@router.delete('/{report_id}')
async def delete_report(report_id: PydanticObjectId) -> ModelIdOutput:
    user_ctx = current_user()
    report = await m.Report.find_one(m.Report.id == report_id, with_children=True)
    if not report:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Report not found')
    if not report.check_permissions(user_ctx, m.PermissionType.ADMIN):
        raise HTTPException(HTTPStatus.FORBIDDEN, 'No permission to delete this report')
    await report.delete()
    return ModelIdOutput.from_obj(report)


async def _update_common_fields(
    report: m.Report, body_data: BaseReportUpdate, user_ctx: 'UserContext'
) -> None:
    """Update common fields for all report types."""
    if body_data.permissions:
        if not report.check_permissions(user_ctx, m.PermissionType.ADMIN):
            raise HTTPException(
                HTTPStatus.FORBIDDEN,
                'You cannot modify permissions for this report',
            )
        if len(body_data.permissions) != len(
            {perm.target for perm in body_data.permissions}
        ):
            raise HTTPException(HTTPStatus.BAD_REQUEST, 'Duplicate permission targets')
        permissions = [
            m.PermissionRecord(
                target_type=perm.target_type,
                target=await resolve_grant_permission_target(perm),
                permission_type=perm.permission_type,
            )
            for perm in body_data.permissions
        ]
        if all(perm.permission_type != m.PermissionType.ADMIN for perm in permissions):
            raise HTTPException(
                HTTPStatus.BAD_REQUEST,
                'Report must have at least one admin',
            )
        report.permissions = permissions

    if body_data.projects is not None:
        projects = []
        for project_id in body_data.projects:
            project = await m.Project.find_one(m.Project.id == project_id)
            if not project:
                raise HTTPException(
                    HTTPStatus.BAD_REQUEST, f'Project {project_id} not found'
                )
            projects.append(m.ProjectLinkField.from_obj(project))
        report.projects = projects

    for k, v in body_data.model_dump(
        exclude_unset=True, include={'name', 'description', 'query'}
    ).items():
        setattr(report, k, v)


async def _update_issues_per_field_report(
    report: m.IssuesPerFieldReport, body_data: IssuesPerFieldReportUpdate
) -> None:
    """Update type-specific fields for IssuesPerField report."""
    if body_data.field_gid:
        field = await m.CustomField.find_one(
            m.CustomField.gid == body_data.field_gid, with_children=True
        )
        if not field:
            raise HTTPException(
                HTTPStatus.BAD_REQUEST, f'Custom field {body_data.field_gid} not found'
            )
        report.field = m.CustomFieldGroupLink.from_obj(field)


async def _update_issues_per_two_fields_report(
    report: m.IssuesPerTwoFieldsReport, body_data: IssuesPerTwoFieldsReportUpdate
) -> None:
    """Update type-specific fields for IssuesPerTwoFields report."""
    if body_data.row_field_gid:
        row_field = await m.CustomField.find_one(
            m.CustomField.gid == body_data.row_field_gid, with_children=True
        )
        if not row_field:
            raise HTTPException(
                HTTPStatus.BAD_REQUEST,
                f'Custom field {body_data.row_field_gid} not found',
            )
        report.row_field = m.CustomFieldGroupLink.from_obj(row_field)

    if body_data.column_field_gid:
        column_field = await m.CustomField.find_one(
            m.CustomField.gid == body_data.column_field_gid, with_children=True
        )
        if not column_field:
            raise HTTPException(
                HTTPStatus.BAD_REQUEST,
                f'Custom field {body_data.column_field_gid} not found',
            )
        report.column_field = m.CustomFieldGroupLink.from_obj(column_field)


@router.put('/{report_id}')
async def update_report(
    report_id: PydanticObjectId,
    body: ReportUpdate,
) -> SuccessPayloadOutput[ReportOutput]:
    report: m.Report | None = await m.Report.find_one(
        m.Report.id == report_id, with_children=True
    )
    if not report:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Report not found')
    user_ctx = current_user()
    if not report.check_permissions(user_ctx, m.PermissionType.EDIT):
        raise HTTPException(HTTPStatus.FORBIDDEN, 'No permission to edit this report')

    body_data = body.root  # Access the discriminated union data

    if report.type != body_data.type:
        raise HTTPException(
            HTTPStatus.BAD_REQUEST,
            'Cannot change report type',
        )

    await _update_common_fields(report, body_data, user_ctx)

    if report.type == m.ReportType.ISSUES_PER_FIELD:
        await _update_issues_per_field_report(report, body_data)
    elif report.type == m.ReportType.ISSUES_PER_TWO_FIELDS:
        await _update_issues_per_two_fields_report(report, body_data)

    if report.is_changed:
        await report.save_changes()
    return SuccessPayloadOutput(payload=create_report_output(report))


@router.post('/{report_id}/permission')
async def grant_permission(
    report_id: PydanticObjectId,
    body: GrantPermissionBody,
) -> UUIDOutput:
    user_ctx = current_user()
    report = await m.Report.find_one(m.Report.id == report_id, with_children=True)
    if not report:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail='Report not found')
    if not report.check_permissions(user_ctx, m.PermissionType.ADMIN):
        raise HTTPException(
            status_code=HTTPStatus.FORBIDDEN,
            detail='You cannot modify permissions for this report',
        )
    target = await resolve_grant_permission_target(body)
    if report.has_permission_for_target(target):
        raise HTTPException(
            status_code=HTTPStatus.CONFLICT,
            detail='Permission already granted',
        )
    permission = m.PermissionRecord(
        target_type=body.target_type,
        target=target,
        permission_type=body.permission_type,
    )
    report.permissions.append(permission)
    await report.save_changes()
    return UUIDOutput.make(permission.id)


@router.delete('/{report_id}/permission/{permission_id}')
async def revoke_permission(
    report_id: PydanticObjectId,
    permission_id: UUID,
) -> UUIDOutput:
    user_ctx = current_user()
    report = await m.Report.find_one(m.Report.id == report_id, with_children=True)
    if not report:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail='Report not found')
    if not report.check_permissions(user_ctx, m.PermissionType.ADMIN):
        raise HTTPException(
            status_code=HTTPStatus.FORBIDDEN,
            detail='You cannot modify permissions for this report',
        )
    if not (
        perm := next(
            (obj for obj in report.permissions if obj.id == permission_id),
            None,
        )
    ):
        raise HTTPException(
            status_code=HTTPStatus.NOT_FOUND,
            detail='Permission not found',
        )
    if (
        perm.permission_type == m.PermissionType.ADMIN
        and not report.has_any_other_admin_target(perm.target)
    ):
        raise HTTPException(
            HTTPStatus.BAD_REQUEST,
            'Report must have at least one admin',
        )
    report.permissions.remove(perm)
    await report.save_changes()
    return UUIDOutput.make(perm.id)


@router.post('/{report_id}/favorite')
async def favorite_report(
    report_id: PydanticObjectId,
) -> SuccessPayloadOutput[ReportOutput]:
    user_ctx = current_user()
    report = await m.Report.find_one(m.Report.id == report_id, with_children=True)
    if not report:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Report not found')
    if not report.check_permissions(user_ctx, m.PermissionType.VIEW):
        raise HTTPException(HTTPStatus.FORBIDDEN, 'No permission to view this report')
    if report.is_favorite_of(user_ctx.user.id):
        raise HTTPException(HTTPStatus.CONFLICT, 'Report already in favorites')
    report.favorite_of.append(user_ctx.user.id)
    await report.save_changes()
    return SuccessPayloadOutput(payload=create_report_output(report))


@router.post('/{report_id}/unfavorite')
async def unfavorite_report(
    report_id: PydanticObjectId,
) -> SuccessPayloadOutput[ReportOutput]:
    user_ctx = current_user()
    report = await m.Report.find_one(m.Report.id == report_id, with_children=True)
    if not report:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Report not found')
    if not report.check_permissions(user_ctx, m.PermissionType.VIEW):
        raise HTTPException(HTTPStatus.FORBIDDEN, 'No permission to view this report')
    if not report.is_favorite_of(user_ctx.user.id):
        raise HTTPException(HTTPStatus.CONFLICT, 'Report is not in favorites')
    report.favorite_of.remove(user_ctx.user.id)
    await report.save_changes()
    return SuccessPayloadOutput(payload=create_report_output(report))


async def resolve_grant_permission_target(
    body: GrantPermissionBody,
) -> m.UserLinkField | m.GroupLinkField:
    if body.target_type == m.PermissionTargetType.USER:
        user: m.User | None = await m.User.find_one(m.User.id == body.target)
        if not user:
            raise HTTPException(HTTPStatus.BAD_REQUEST, 'User not found')
        return m.UserLinkField.from_obj(user)
    group: m.Group | None = await m.Group.find_one(m.Group.id == body.target)
    if not group:
        raise HTTPException(HTTPStatus.BAD_REQUEST, 'Group not found')
    return m.GroupLinkField.from_obj(group)


def _make_hashable_key(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, dict):
        return tuple(sorted(value.items()))
    if isinstance(value, list):
        return tuple(value)
    return value


def _sort_key(value: Any) -> tuple:
    return (value is None, str(value) if value is not None else '')


async def _build_base_filter(
    report: m.Report, user_ctx: 'UserContext'
) -> dict[str, Any]:
    base_filter = {'project.id': {'$in': [p.id for p in report.projects]}}
    if report.query:
        try:
            query_filter, _sort_pipeline = await transform_query(
                report.query, current_user_email=user_ctx.user.email
            )
            if query_filter:
                base_filter = {'$and': [base_filter, query_filter]}
        except IssueQueryTransformError as err:
            raise HTTPException(HTTPStatus.BAD_REQUEST, err.message) from err
    return base_filter


async def generate_per_project_report_data(
    report: m.Report,
    user_ctx: 'UserContext',
) -> IssuesPerProjectReportDataOutput:
    base_filter = await _build_base_filter(report, user_ctx)

    pipeline = [
        {'$match': base_filter},
        {
            '$group': {
                '_id': '$project.id',
                'count': {'$sum': 1},
                'project_name': {'$first': '$project.name'},
                'project_slug': {'$first': '$project.slug'},
            }
        },
        {'$sort': {'project_name': 1}},
    ]

    aggregation_result = await m.Issue.aggregate(pipeline).to_list()
    count_lookup = {result['_id']: result['count'] for result in aggregation_result}

    items = []
    total_count = 0
    for project in report.projects:
        count = count_lookup.get(project.id, 0)
        items.append(
            IssuesPerProjectReportDataItem(
                value=ProjectField.from_obj(project),
                count=count,
            )
        )
        total_count += count
    return IssuesPerProjectReportDataOutput(items=items, total_count=total_count)


async def generate_per_field_report_data(
    report: m.IssuesPerFieldReport,
    user_ctx: 'UserContext',
) -> IssuesPerFieldReportDataOutput:
    base_filter = await _build_base_filter(report, user_ctx)

    pipeline = [
        {'$match': base_filter},
        {
            '$addFields': {
                'field_value': {
                    '$arrayElemAt': [
                        {
                            '$filter': {
                                'input': '$fields',
                                'as': 'field',
                                'cond': {'$eq': ['$$field.gid', report.field.gid]},
                            }
                        },
                        0,
                    ]
                }
            }
        },
        {
            '$group': {
                '_id': '$field_value.value',
                'count': {'$sum': 1},
            }
        },
        {'$sort': {'_id': 1}},
    ]

    aggregation_result = await m.Issue.aggregate(pipeline).to_list()

    items = []
    total_count = 0
    for result in aggregation_result:
        field_value = result['_id']
        count = result['count']
        items.append(
            IssuesPerFieldReportDataItem(
                value=field_value,
                count=count,
            )
        )
        total_count += count

    return IssuesPerFieldReportDataOutput(items=items, total_count=total_count)


async def generate_per_two_fields_report_data(
    report: m.IssuesPerTwoFieldsReport,
    user_ctx: 'UserContext',
) -> IssuesPerTwoFieldsReportDataOutput:
    base_filter = await _build_base_filter(report, user_ctx)

    pipeline = [
        {'$match': base_filter},
        {
            '$addFields': {
                'row_field_value': {
                    '$arrayElemAt': [
                        {
                            '$filter': {
                                'input': '$fields',
                                'as': 'field',
                                'cond': {'$eq': ['$$field.gid', report.row_field.gid]},
                            }
                        },
                        0,
                    ]
                },
                'column_field_value': {
                    '$arrayElemAt': [
                        {
                            '$filter': {
                                'input': '$fields',
                                'as': 'field',
                                'cond': {
                                    '$eq': ['$$field.gid', report.column_field.gid]
                                },
                            }
                        },
                        0,
                    ]
                },
            }
        },
        {
            '$group': {
                '_id': {
                    'row_value': '$row_field_value.value',
                    'column_value': '$column_field_value.value',
                },
                'count': {'$sum': 1},
            }
        },
        {'$sort': {'_id.row_value': 1, '_id.column_value': 1}},
    ]

    aggregation_result = await m.Issue.aggregate(pipeline).to_list()

    row_groups = {}
    total_count = 0

    for result in aggregation_result:
        result_id = result.get('_id', {})
        row_value = result_id.get('row_value')
        column_value = result_id.get('column_value')
        count = result.get('count', 0)

        row_key = _make_hashable_key(row_value)

        if row_key not in row_groups:
            row_groups[row_key] = {'original_value': row_value, 'columns': []}

        row_groups[row_key]['columns'].append(
            {
                'column_value': column_value,
                'count': count,
            }
        )
        total_count += count

    rows = []
    for row_data in row_groups.values():
        original_row_value = row_data['original_value']
        columns_data = row_data['columns']

        row_total = sum(col['count'] for col in columns_data)

        columns = [
            IssuesPerTwoFieldsReportColumnItem(
                value=col['column_value'],
                count=col['count'],
            )
            for col in columns_data
        ]

        columns.sort(key=lambda x: _sort_key(x.value))

        rows.append(
            IssuesPerTwoFieldsReportRowItem(
                value=original_row_value,
                total=row_total,
                columns=columns,
            )
        )

    rows.sort(key=lambda x: _sort_key(x.value))

    return IssuesPerTwoFieldsReportDataOutput(rows=rows, total_count=total_count)


@router.post('/{report_id}/generate')
async def generate_report_data(
    report_id: str,
) -> SuccessPayloadOutput[ReportDataOutput]:
    user_ctx = current_user()
    try:
        object_id = PydanticObjectId(report_id)
        report = await m.Report.find_one(m.Report.id == object_id, with_children=True)
        if not report:
            raise HTTPException(HTTPStatus.NOT_FOUND, 'Report not found')
    except ValueError as e:
        raise HTTPException(HTTPStatus.BAD_REQUEST, f'Invalid report ID: {e!s}') from e

    if not report.check_permissions(user_ctx, m.PermissionType.VIEW):
        raise HTTPException(HTTPStatus.FORBIDDEN, 'No permission to view this report')

    if report.type == m.ReportType.ISSUES_PER_PROJECT:
        data = await generate_per_project_report_data(report, user_ctx)
    elif report.type == m.ReportType.ISSUES_PER_FIELD:
        data = await generate_per_field_report_data(report, user_ctx)
    elif report.type == m.ReportType.ISSUES_PER_TWO_FIELDS:
        data = await generate_per_two_fields_report_data(report, user_ctx)
    else:
        raise HTTPException(
            HTTPStatus.BAD_REQUEST,
            f'Report generation not implemented for type: {report.type}',
        )

    return SuccessPayloadOutput(payload=data)
