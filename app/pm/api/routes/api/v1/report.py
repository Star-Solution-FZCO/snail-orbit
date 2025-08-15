# pylint: disable=too-many-lines
from http import HTTPStatus
from typing import TYPE_CHECKING, Annotated, Any, Literal
from uuid import UUID

from beanie import PydanticObjectId
from fastapi import Depends, HTTPException
from pydantic import BaseModel, Field

import pm.models as m
from pm.api.context import current_user, current_user_context_dependency
from pm.api.issue_query import IssueQueryTransformError, transform_query
from pm.api.utils.router import APIRouter
from pm.api.views.custom_fields import (
    CustomFieldGroupLinkOutput,
    CustomFieldGroupWithReportValuesOutputT,
    ShortOptionOutput,
    custom_field_group_with_report_values_output_cls_from_type,
)
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
from pm.utils.pydantic_uuid import UUIDStr

if TYPE_CHECKING:
    from pm.api.context import UserContext


__all__ = ('router',)


OPTION_BASED_FIELD_TYPES = (
    m.CustomFieldTypeT.ENUM,
    m.CustomFieldTypeT.ENUM_MULTI,
    m.CustomFieldTypeT.STATE,
    m.CustomFieldTypeT.VERSION,
    m.CustomFieldTypeT.VERSION_MULTI,
    m.CustomFieldTypeT.OWNED,
    m.CustomFieldTypeT.OWNED_MULTI,
)

USER_BASED_FIELD_TYPES = (
    m.CustomFieldTypeT.USER,
    m.CustomFieldTypeT.USER_MULTI,
)

MULTI_TO_SINGLE_FIELD_TYPE_MAPPING = {
    m.CustomFieldTypeT.USER_MULTI: m.CustomFieldTypeT.USER,
    m.CustomFieldTypeT.ENUM_MULTI: m.CustomFieldTypeT.ENUM,
    m.CustomFieldTypeT.VERSION_MULTI: m.CustomFieldTypeT.VERSION,
    m.CustomFieldTypeT.OWNED_MULTI: m.CustomFieldTypeT.OWNED,
}


def convert_aggregated_value_to_proper_output(
    raw_value: Any, sample_value: Any, field: m.CustomField
) -> Any:
    """Convert aggregated raw values to proper output format based on field type."""
    if field.type in OPTION_BASED_FIELD_TYPES:
        if sample_value and isinstance(sample_value, dict) and 'value' in sample_value:
            return ShortOptionOutput(
                value=str(sample_value['value']),
                color=sample_value.get('color'),
            )
        return ShortOptionOutput(
            value=str(raw_value) if raw_value is not None else '', color=None
        )

    if field.type in USER_BASED_FIELD_TYPES:
        if sample_value and isinstance(sample_value, dict):
            user_link = m.UserLinkField(**sample_value)
            return UserOutput.from_obj(user_link)
        return raw_value

    return raw_value


def transform_field_with_values_to_report_discriminated(
    values: list[Any],
    original_field: m.CustomFieldGroupLink,
) -> CustomFieldGroupWithReportValuesOutputT:
    """Transform field values using report-specific discriminated union with ShortOptionOutput."""
    field_output = CustomFieldGroupLinkOutput.from_obj(original_field)

    if original_field.type in MULTI_TO_SINGLE_FIELD_TYPE_MAPPING:
        single_value_type = MULTI_TO_SINGLE_FIELD_TYPE_MAPPING[original_field.type]
        output_cls = custom_field_group_with_report_values_output_cls_from_type(
            single_value_type
        )

        return output_cls(
            field=field_output,
            type=single_value_type,
            values=values,
        )
    output_cls = custom_field_group_with_report_values_output_cls_from_type(
        original_field.type
    )
    return output_cls(
        field=field_output,
        type=original_field.type,
        values=values,
    )


router = APIRouter(
    prefix='/report',
    tags=['report'],
    dependencies=[Depends(current_user_context_dependency)],
    responses=error_responses(
        (HTTPStatus.UNAUTHORIZED, ErrorOutput),
        (HTTPStatus.FORBIDDEN, ErrorOutput),
    ),
)


class AxisOutput(BaseModel):
    type: m.AxisType = Field(description='Type of axis (project or custom field)')
    custom_field: CustomFieldGroupLinkOutput | None = Field(
        default=None,
        description='Custom field for the axis (only when type is CUSTOM_FIELD)',
    )


class ReportOutput(BaseModel):
    id: str
    name: str
    description: str | None
    query: str | None
    projects: list[ProjectField]
    axis_1: AxisOutput
    axis_2: AxisOutput | None
    ui_settings: dict = Field(
        default_factory=dict, description='UI-specific settings for the report'
    )
    created_by: UserOutput
    permissions: list[PermissionOutput]
    is_favorite: bool = Field(description='Whether report is favorited by current user')
    current_permission: m.PermissionType = Field(description='Current user permission')

    @classmethod
    def from_obj(cls, obj: m.Report, user_ctx: 'UserContext') -> 'ReportOutput':
        """Create report output from the Report object."""
        return cls(
            id=str(obj.id),
            name=obj.name,
            description=obj.description,
            query=obj.query,
            projects=[ProjectField.from_obj(p) for p in obj.projects],
            axis_1=AxisOutput(
                type=obj.axis_1.type,
                custom_field=CustomFieldGroupLinkOutput.from_obj(
                    obj.axis_1.custom_field
                )
                if obj.axis_1.custom_field
                else None,
            ),
            axis_2=AxisOutput(
                type=obj.axis_2.type,
                custom_field=CustomFieldGroupLinkOutput.from_obj(
                    obj.axis_2.custom_field
                )
                if obj.axis_2.custom_field
                else None,
            )
            if obj.axis_2
            else None,
            ui_settings=obj.ui_settings,
            created_by=UserOutput.from_obj(obj.created_by),
            permissions=[
                PermissionOutput.from_obj(p) for p in obj.filter_permissions(user_ctx)
            ],
            is_favorite=obj.is_favorite_of(user_ctx.user.id),
            current_permission=obj.user_permission(user_ctx),
        )


class ProjectAxisOutput(BaseModel):
    type: Literal['project'] = Field(
        default='project', description='Axis type identifier'
    )
    values: list[ProjectField] = Field(description='List of projects in this axis')


class ReportDataOutput(BaseModel):
    """Unified report data output structure (similar to BoardIssuesOutput)."""

    axis_1: CustomFieldGroupWithReportValuesOutputT | ProjectAxisOutput | None = Field(
        default=None,
        description='First axis configuration with discriminated values (like columns)',
    )
    axis_2: CustomFieldGroupWithReportValuesOutputT | ProjectAxisOutput | None = Field(
        default=None,
        description='Second axis configuration with discriminated values (like swimlanes)',
    )
    data: list[list[int]] = Field(
        description='2D array of issue counts: [axis_2_value_index][axis_1_value_index]'
    )


class GrantPermissionBody(BaseModel):
    target_type: m.PermissionTargetType
    target: PydanticObjectId
    permission_type: m.PermissionType


class AxisInput(BaseModel):
    type: m.AxisType = Field(description='Type of axis (project or custom field)')
    custom_field_gid: UUIDStr | None = Field(
        default=None,
        description='Custom field GID for the axis (only when type is CUSTOM_FIELD)',
    )


class ReportCreate(BaseModel):
    name: str
    description: str | None = None
    query: str | None = None
    projects: list[PydanticObjectId] = Field(default_factory=list)
    axis_1: AxisInput
    axis_2: AxisInput | None = None
    ui_settings: dict = Field(
        default_factory=dict, description='UI-specific settings for the report'
    )
    permissions: Annotated[list[GrantPermissionBody], Field(default_factory=list)]


class ReportUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    query: str | None = None
    projects: list[PydanticObjectId] | None = None
    axis_1: AxisInput | None = None
    axis_2: AxisInput | None = None
    ui_settings: dict | None = None
    permissions: list[GrantPermissionBody] | None = None


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
    items = [ReportOutput.from_obj(report, user_ctx) for report in reports]

    return BaseListOutput.make(
        count=count,
        limit=query.limit,
        offset=query.offset,
        items=items,
    )


async def _validate_axis(axis: AxisInput) -> m.Axis:
    """Validate and convert AxisInput to Axis model."""
    if axis.type == m.AxisType.CUSTOM_FIELD:
        if not axis.custom_field_gid:
            raise HTTPException(
                HTTPStatus.BAD_REQUEST,
                'custom_field_gid must be provided for custom field axis',
            )

        field = await m.CustomField.find_one(
            m.CustomField.gid == axis.custom_field_gid, with_children=True
        )
        if not field:
            raise HTTPException(
                HTTPStatus.BAD_REQUEST,
                f'Custom field {axis.custom_field_gid} not found',
            )

        custom_field = m.CustomFieldGroupLink.from_obj(field)
    elif axis.type == m.AxisType.PROJECT:
        if axis.custom_field_gid is not None:
            raise HTTPException(
                HTTPStatus.BAD_REQUEST, 'custom_field_gid must be None for project axis'
            )
        custom_field = None
    else:
        raise HTTPException(HTTPStatus.BAD_REQUEST, f'Invalid axis type: {axis.type}')

    return m.Axis(type=axis.type, custom_field=custom_field)


@router.post('/')
async def create_report(body: ReportCreate) -> SuccessPayloadOutput[ReportOutput]:
    user_ctx = current_user()

    permissions = [
        m.PermissionRecord(
            target_type=m.PermissionTargetType.USER,
            target=m.UserLinkField.from_obj(user_ctx.user),
            permission_type=m.PermissionType.ADMIN,
        ),
    ]

    if len(body.permissions) != len({perm.target for perm in body.permissions}):
        raise HTTPException(HTTPStatus.BAD_REQUEST, 'Duplicate permission targets')

    for perm in body.permissions:
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

    projects = []
    if body.projects:
        for project_id in body.projects:
            project = await m.Project.find_one(m.Project.id == project_id)
            if not project:
                raise HTTPException(
                    HTTPStatus.BAD_REQUEST, f'Project {project_id} not found'
                )
            projects.append(m.ProjectLinkField.from_obj(project))

    # Validate axes
    axis_1 = await _validate_axis(body.axis_1)
    axis_2 = await _validate_axis(body.axis_2) if body.axis_2 else None

    # Create and save report
    report = m.Report(
        name=body.name,
        description=body.description,
        query=body.query,
        projects=projects,
        axis_1=axis_1,
        axis_2=axis_2,
        ui_settings=body.ui_settings,
        created_by=m.UserLinkField.from_obj(user_ctx.user),
        permissions=permissions,
    )

    await report.insert()
    return SuccessPayloadOutput(payload=ReportOutput.from_obj(report, user_ctx))


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
    return SuccessPayloadOutput(payload=ReportOutput.from_obj(report, user_ctx))


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


async def _update_report_fields(
    report: m.Report, body_data: ReportUpdate, user_ctx: 'UserContext'
) -> None:
    """Update report fields."""
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

    if body_data.axis_1 is not None:
        report.axis_1 = await _validate_axis(body_data.axis_1)

    if body_data.axis_2 is not None:
        report.axis_2 = await _validate_axis(body_data.axis_2)

    for k, v in body_data.model_dump(
        exclude_unset=True, include={'name', 'description', 'query', 'ui_settings'}
    ).items():
        setattr(report, k, v)


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

    await _update_report_fields(report, body, user_ctx)

    if report.is_changed:
        await report.save_changes()
    return SuccessPayloadOutput(payload=ReportOutput.from_obj(report, user_ctx))


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
    return SuccessPayloadOutput(payload=ReportOutput.from_obj(report, user_ctx))


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
    return SuccessPayloadOutput(payload=ReportOutput.from_obj(report, user_ctx))


async def resolve_grant_permission_target(
    body: GrantPermissionBody,
) -> m.UserLinkField | m.GroupLinkField:
    if body.target_type == m.PermissionTargetType.USER:
        user: m.User | None = await m.User.find_one(m.User.id == body.target)
        if not user:
            raise HTTPException(HTTPStatus.BAD_REQUEST, 'User not found')
        return m.UserLinkField.from_obj(user)
    group: m.Group | None = await m.Group.find_one(
        m.Group.id == body.target, with_children=True
    )
    if not group:
        raise HTTPException(HTTPStatus.BAD_REQUEST, 'Group not found')
    return m.GroupLinkField.from_obj(group)


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


async def generate_single_axis_report_data(
    report: m.Report,
    user_ctx: 'UserContext',
) -> ReportDataOutput:
    """Generate data for single-axis reports (project or custom field)."""
    base_filter = await _build_base_filter(report, user_ctx)

    # Report axis
    if report.axis_1.type == m.AxisType.PROJECT:
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

        data_row = []
        for project in report.projects:
            count = count_lookup.get(project.id, 0)
            data_row.append(count)

        project_values = [ProjectField.from_obj(project) for project in report.projects]

        return ReportDataOutput(
            axis_1=ProjectAxisOutput(values=project_values),
            axis_2=None,
            data=[data_row],
        )

    # Custom field axis
    field_gid = report.axis_1.custom_field.gid

    field = await m.CustomField.find_one(
        m.CustomField.gid == field_gid, with_children=True
    )
    if not field:
        raise HTTPException(HTTPStatus.BAD_REQUEST, f'Field {field_gid} not found')

    if field.type in MULTI_TO_SINGLE_FIELD_TYPE_MAPPING:
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
                                    'cond': {'$eq': ['$$field.gid', field_gid]},
                                }
                            },
                            0,
                        ]
                    }
                }
            },
            {'$unwind': '$field_value.value'},
            {
                '$group': {
                    '_id': '$field_value.value',
                    'count': {'$sum': 1},
                    'sample_value': {'$first': '$field_value.value'},
                }
            },
            {'$sort': {'_id': 1}},
        ]
    else:
        if field.type in OPTION_BASED_FIELD_TYPES:
            group_field = '$field_value.value.value'
            sample_field = '$field_value.value'
        elif field.type in USER_BASED_FIELD_TYPES:
            group_field = '$field_value.value'
            sample_field = '$field_value.value'
        else:
            group_field = '$field_value.value'
            sample_field = '$field_value'

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
                                    'cond': {'$eq': ['$$field.gid', field_gid]},
                                }
                            },
                            0,
                        ]
                    }
                }
            },
            {
                '$group': {
                    '_id': group_field,
                    'count': {'$sum': 1},
                    'sample_value': {'$first': sample_field},
                }
            },
            {'$sort': {'_id': 1}},
        ]

    aggregation_result = await m.Issue.aggregate(pipeline).to_list()

    field_values = []
    data_row = []

    for result in aggregation_result:
        raw_value = result['_id']
        count = result['count']
        sample_value = result.get('sample_value')

        converted_value = convert_aggregated_value_to_proper_output(
            raw_value, sample_value, field
        )
        field_values.append(converted_value)
        data_row.append(count)

    return ReportDataOutput(
        axis_1=transform_field_with_values_to_report_discriminated(
            field_values, report.axis_1.custom_field
        ),
        axis_2=None,
        data=[data_row],
    )


async def generate_project_custom_field_report_data(
    report: m.Report,
    user_ctx: 'UserContext',
) -> ReportDataOutput:
    """Generate data for project + custom field axis reports."""
    base_filter = await _build_base_filter(report, user_ctx)

    # axis_1 is project, axis_2 is custom field
    custom_field_gid = report.axis_2.custom_field.gid

    custom_field = await m.CustomField.find_one(
        m.CustomField.gid == custom_field_gid, with_children=True
    )
    if not custom_field:
        raise HTTPException(
            HTTPStatus.BAD_REQUEST, f'Field {custom_field_gid} not found'
        )

    pipeline = [
        {'$match': base_filter},
        {
            '$addFields': {
                'custom_field_value': {
                    '$arrayElemAt': [
                        {
                            '$filter': {
                                'input': '$fields',
                                'as': 'field',
                                'cond': {'$eq': ['$$field.gid', custom_field_gid]},
                            }
                        },
                        0,
                    ]
                }
            }
        },
    ]

    if custom_field.type in MULTI_TO_SINGLE_FIELD_TYPE_MAPPING:
        pipeline.extend(
            [
                {'$unwind': '$custom_field_value.value'},
                {
                    '$group': {
                        '_id': {
                            'project_id': '$project.id',
                            'custom_field_value': '$custom_field_value.value',
                        },
                        'count': {'$sum': 1},
                        'project_name': {'$first': '$project.name'},
                        'project_slug': {'$first': '$project.slug'},
                        'sample_custom_field_value': {
                            '$first': '$custom_field_value.value'
                        },
                    }
                },
            ]
        )
    else:
        if custom_field.type in OPTION_BASED_FIELD_TYPES:
            sample_field = '$custom_field_value.value'
            group_field = '$custom_field_value.value.value'
        else:
            sample_field = '$custom_field_value'
            group_field = '$custom_field_value.value'

        pipeline.append(
            {
                '$group': {
                    '_id': {
                        'project_id': '$project.id',
                        'custom_field_value': group_field,
                    },
                    'count': {'$sum': 1},
                    'project_name': {'$first': '$project.name'},
                    'project_slug': {'$first': '$project.slug'},
                    'sample_custom_field_value': {'$first': sample_field},
                }
            }
        )

    pipeline.append({'$sort': {'_id.project_id': 1, '_id.custom_field_value': 1}})

    aggregation_result = await m.Issue.aggregate(pipeline).to_list()

    unique_custom_field_values = []
    seen_custom_field_values = set()

    for result in aggregation_result:
        result_id = result.get('_id', {})
        custom_field_value = result_id.get('custom_field_value')
        sample_value = result.get('sample_custom_field_value')

        if (
            custom_field_value is not None
            and custom_field_value not in seen_custom_field_values
        ):
            seen_custom_field_values.add(custom_field_value)
            converted_value = convert_aggregated_value_to_proper_output(
                custom_field_value, sample_value, custom_field
            )
            unique_custom_field_values.append(converted_value)

    project_values = [ProjectField.from_obj(project) for project in report.projects]

    data = [[0 for _ in project_values] for _ in unique_custom_field_values]

    custom_field_value_to_index = {}
    for result in aggregation_result:
        result_id = result.get('_id', {})
        custom_field_value = result_id.get('custom_field_value')
        if (
            custom_field_value is not None
            and custom_field_value not in custom_field_value_to_index
        ):
            custom_field_value_to_index[custom_field_value] = len(
                custom_field_value_to_index
            )

    project_id_to_index = {project.id: i for i, project in enumerate(report.projects)}

    for result in aggregation_result:
        result_id = result.get('_id', {})
        project_id = result_id.get('project_id')
        custom_field_value = result_id.get('custom_field_value')
        count = result.get('count', 0)

        if project_id is not None and custom_field_value is not None:
            project_idx = project_id_to_index.get(project_id)
            custom_field_idx = custom_field_value_to_index.get(custom_field_value)

            if project_idx is not None and custom_field_idx is not None:
                data[custom_field_idx][project_idx] = count

    return ReportDataOutput(
        axis_1=ProjectAxisOutput(values=project_values),
        axis_2=transform_field_with_values_to_report_discriminated(
            unique_custom_field_values, report.axis_2.custom_field
        ),
        data=data,
    )


async def generate_custom_field_project_report_data(
    report: m.Report,
    user_ctx: 'UserContext',
) -> ReportDataOutput:
    """Generate data for custom field + project axis reports (reverse of project + custom field)."""
    base_filter = await _build_base_filter(report, user_ctx)

    # axis_1 is custom field, axis_2 is project
    custom_field_gid = report.axis_1.custom_field.gid

    custom_field = await m.CustomField.find_one(
        m.CustomField.gid == custom_field_gid, with_children=True
    )
    if not custom_field:
        raise HTTPException(
            HTTPStatus.BAD_REQUEST, f'Field {custom_field_gid} not found'
        )

    pipeline = [
        {'$match': base_filter},
        {
            '$addFields': {
                'custom_field_value': {
                    '$arrayElemAt': [
                        {
                            '$filter': {
                                'input': '$fields',
                                'as': 'field',
                                'cond': {'$eq': ['$$field.gid', custom_field_gid]},
                            }
                        },
                        0,
                    ]
                }
            }
        },
    ]

    if custom_field.type in MULTI_TO_SINGLE_FIELD_TYPE_MAPPING:
        pipeline.extend(
            [
                {'$unwind': '$custom_field_value.value'},
                {
                    '$group': {
                        '_id': {
                            'custom_field_value': '$custom_field_value.value',
                            'project_id': '$project.id',
                        },
                        'count': {'$sum': 1},
                        'project_name': {'$first': '$project.name'},
                        'project_slug': {'$first': '$project.slug'},
                        'sample_custom_field_value': {
                            '$first': '$custom_field_value.value'
                        },
                    }
                },
            ]
        )
    else:
        if custom_field.type in OPTION_BASED_FIELD_TYPES:
            sample_field = '$custom_field_value.value'
            group_field = '$custom_field_value.value.value'
        else:
            sample_field = '$custom_field_value'
            group_field = '$custom_field_value.value'

        pipeline.append(
            {
                '$group': {
                    '_id': {
                        'custom_field_value': group_field,
                        'project_id': '$project.id',
                    },
                    'count': {'$sum': 1},
                    'project_name': {'$first': '$project.name'},
                    'project_slug': {'$first': '$project.slug'},
                    'sample_custom_field_value': {'$first': sample_field},
                }
            }
        )

    pipeline.append({'$sort': {'_id.custom_field_value': 1, '_id.project_id': 1}})

    aggregation_result = await m.Issue.aggregate(pipeline).to_list()

    unique_project_ids = set()
    unique_custom_field_values = []
    seen_custom_field_values = set()

    for result in aggregation_result:
        result_id = result.get('_id', {})
        project_id = result_id.get('project_id')
        custom_field_value = result_id.get('custom_field_value')
        sample_value = result.get('sample_custom_field_value')

        if project_id is not None:
            unique_project_ids.add(project_id)
        if (
            custom_field_value is not None
            and custom_field_value not in seen_custom_field_values
        ):
            unique_custom_field_values.append((custom_field_value, sample_value))
            seen_custom_field_values.add(custom_field_value)

    custom_field_values = []
    for raw_value, sample_value in unique_custom_field_values:
        converted_value = convert_aggregated_value_to_proper_output(
            raw_value, sample_value, custom_field
        )
        custom_field_values.append(converted_value)

    project_values = [ProjectField.from_obj(project) for project in report.projects]

    count_lookup = {}
    for result in aggregation_result:
        result_id = result.get('_id', {})
        custom_field_value = result_id.get('custom_field_value')
        project_id = result_id.get('project_id')
        count = result.get('count', 0)

        key = (custom_field_value, project_id)
        count_lookup[key] = count

    data = []
    for raw_value, _ in unique_custom_field_values:
        custom_field_row = []
        for project in report.projects:
            count = count_lookup.get((raw_value, project.id), 0)
            custom_field_row.append(count)
        data.append(custom_field_row)

    return ReportDataOutput(
        axis_1=transform_field_with_values_to_report_discriminated(
            custom_field_values, report.axis_1.custom_field
        ),
        axis_2=ProjectAxisOutput(values=project_values),
        data=data,
    )


async def generate_two_axis_report_data(
    report: m.Report,
    user_ctx: 'UserContext',
) -> ReportDataOutput:
    """Generate data for two-axis reports (similar to Board with columns and swimlanes)."""
    base_filter = await _build_base_filter(report, user_ctx)

    primary_field_gid = report.axis_1.custom_field.gid
    secondary_field_gid = report.axis_2.custom_field.gid

    primary_field = await m.CustomField.find_one(
        m.CustomField.gid == primary_field_gid, with_children=True
    )
    secondary_field = await m.CustomField.find_one(
        m.CustomField.gid == secondary_field_gid, with_children=True
    )

    if not primary_field or not secondary_field:
        raise HTTPException(HTTPStatus.BAD_REQUEST, 'Field not found')

    pipeline = [
        {'$match': base_filter},
        {
            '$addFields': {
                'primary_field_value': {
                    '$arrayElemAt': [
                        {
                            '$filter': {
                                'input': '$fields',
                                'as': 'field',
                                'cond': {'$eq': ['$$field.gid', primary_field_gid]},
                            }
                        },
                        0,
                    ]
                },
                'secondary_field_value': {
                    '$arrayElemAt': [
                        {
                            '$filter': {
                                'input': '$fields',
                                'as': 'field',
                                'cond': {'$eq': ['$$field.gid', secondary_field_gid]},
                            }
                        },
                        0,
                    ]
                },
            }
        },
    ]

    primary_value_field = '$primary_field_value.value'
    if primary_field.type in MULTI_TO_SINGLE_FIELD_TYPE_MAPPING:
        pipeline.append(
            {
                '$addFields': {
                    'primary_field_value_unwound': {
                        '$cond': {
                            'if': {'$isArray': '$primary_field_value.value'},
                            'then': '$primary_field_value.value',
                            'else': ['$primary_field_value.value'],
                        }
                    }
                }
            }
        )
        pipeline.append({'$unwind': '$primary_field_value_unwound'})
        primary_value_field = '$primary_field_value_unwound'

    secondary_value_field = '$secondary_field_value.value'
    if secondary_field.type in MULTI_TO_SINGLE_FIELD_TYPE_MAPPING:
        pipeline.append(
            {
                '$addFields': {
                    'secondary_field_value_unwound': {
                        '$cond': {
                            'if': {'$isArray': '$secondary_field_value.value'},
                            'then': '$secondary_field_value.value',
                            'else': ['$secondary_field_value.value'],
                        }
                    }
                }
            }
        )
        pipeline.append({'$unwind': '$secondary_field_value_unwound'})
        secondary_value_field = '$secondary_field_value_unwound'

    if primary_field.type in OPTION_BASED_FIELD_TYPES:
        sample_primary_field = primary_value_field
        if primary_field.type in MULTI_TO_SINGLE_FIELD_TYPE_MAPPING:
            group_primary_field = f'{primary_value_field}.value'
        else:
            group_primary_field = '$primary_field_value.value.value'
    else:
        sample_primary_field = (
            '$primary_field_value'
            if primary_field.type not in MULTI_TO_SINGLE_FIELD_TYPE_MAPPING
            else primary_value_field
        )
        group_primary_field = primary_value_field

    if secondary_field.type in OPTION_BASED_FIELD_TYPES:
        sample_secondary_field = secondary_value_field
        if secondary_field.type in MULTI_TO_SINGLE_FIELD_TYPE_MAPPING:
            group_secondary_field = f'{secondary_value_field}.value'
        else:
            group_secondary_field = '$secondary_field_value.value.value'
    else:
        sample_secondary_field = (
            '$secondary_field_value'
            if secondary_field.type not in MULTI_TO_SINGLE_FIELD_TYPE_MAPPING
            else secondary_value_field
        )
        group_secondary_field = secondary_value_field

    pipeline.extend(
        [
            {
                '$group': {
                    '_id': {
                        'primary_value': group_primary_field,
                        'secondary_value': group_secondary_field,
                    },
                    'count': {'$sum': 1},
                    'sample_primary_value': {'$first': sample_primary_field},
                    'sample_secondary_value': {'$first': sample_secondary_field},
                }
            },
            {'$sort': {'_id.secondary_value': 1, '_id.primary_value': 1}},
        ]
    )

    aggregation_result = await m.Issue.aggregate(pipeline).to_list()

    unique_primary_values = []
    unique_secondary_values = []
    seen_primary = set()
    seen_secondary = set()

    for result in aggregation_result:
        result_id = result.get('_id', {})
        primary_value = result_id.get('primary_value')
        secondary_value = result_id.get('secondary_value')
        sample_primary = result.get('sample_primary_value')
        sample_secondary = result.get('sample_secondary_value')

        if primary_value is not None and primary_value not in seen_primary:
            seen_primary.add(primary_value)
            converted_primary = convert_aggregated_value_to_proper_output(
                primary_value, sample_primary, primary_field
            )
            unique_primary_values.append(converted_primary)

        if secondary_value is not None and secondary_value not in seen_secondary:
            seen_secondary.add(secondary_value)
            converted_secondary = convert_aggregated_value_to_proper_output(
                secondary_value, sample_secondary, secondary_field
            )
            unique_secondary_values.append(converted_secondary)

    primary_value_to_index = {}
    for result in aggregation_result:
        result_id = result.get('_id', {})
        primary_value = result_id.get('primary_value')
        if primary_value is not None and primary_value not in primary_value_to_index:
            primary_value_to_index[primary_value] = len(primary_value_to_index)

    secondary_value_to_index = {}
    for result in aggregation_result:
        result_id = result.get('_id', {})
        secondary_value = result_id.get('secondary_value')
        if (
            secondary_value is not None
            and secondary_value not in secondary_value_to_index
        ):
            secondary_value_to_index[secondary_value] = len(secondary_value_to_index)

    data = [[0 for _ in unique_primary_values] for _ in unique_secondary_values]

    for result in aggregation_result:
        result_id = result.get('_id', {})
        primary_value = result_id.get('primary_value')
        secondary_value = result_id.get('secondary_value')
        count = result.get('count', 0)

        if primary_value is not None and secondary_value is not None:
            primary_idx = primary_value_to_index.get(primary_value)
            secondary_idx = secondary_value_to_index.get(secondary_value)
            if primary_idx is not None and secondary_idx is not None:
                data[secondary_idx][primary_idx] = count

    return ReportDataOutput(
        axis_1=transform_field_with_values_to_report_discriminated(
            unique_primary_values, report.axis_1.custom_field
        ),
        axis_2=transform_field_with_values_to_report_discriminated(
            unique_secondary_values, report.axis_2.custom_field
        ),
        data=data,
    )


@router.post('/{report_id}/generate')
async def generate_report_data(
    report_id: PydanticObjectId,
) -> SuccessPayloadOutput[ReportDataOutput]:
    user_ctx = current_user()
    report: m.Report | None = await m.Report.find_one(m.Report.id == report_id)
    if not report:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Report not found')
    if not report.check_permissions(user_ctx, m.PermissionType.VIEW):
        raise HTTPException(HTTPStatus.FORBIDDEN, 'No permission to view this report')

    if not report.axis_2:
        return SuccessPayloadOutput(
            payload=await generate_single_axis_report_data(report, user_ctx)
        )
    if (
        report.axis_1.type == m.AxisType.PROJECT
        and report.axis_2.type == m.AxisType.CUSTOM_FIELD
    ):
        return SuccessPayloadOutput(
            payload=await generate_project_custom_field_report_data(report, user_ctx)
        )
    if (
        report.axis_1.type == m.AxisType.CUSTOM_FIELD
        and report.axis_2.type == m.AxisType.PROJECT
    ):
        return SuccessPayloadOutput(
            payload=await generate_custom_field_project_report_data(report, user_ctx)
        )
    if (
        report.axis_1.type == m.AxisType.CUSTOM_FIELD
        and report.axis_2.type == m.AxisType.CUSTOM_FIELD
    ):
        return SuccessPayloadOutput(
            payload=await generate_two_axis_report_data(report, user_ctx)
        )
    raise HTTPException(
        HTTPStatus.NOT_IMPLEMENTED,
        f'Report generation not implemented for axis configuration: axis_1={report.axis_1.type}, axis_2={report.axis_2.type if report.axis_2 else None}',
    )
