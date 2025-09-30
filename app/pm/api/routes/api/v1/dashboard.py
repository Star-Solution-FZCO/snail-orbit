from http import HTTPStatus
from typing import Annotated, Literal, Self
from uuid import UUID

from beanie import PydanticObjectId
from fastapi import Depends, HTTPException
from pydantic import BaseModel, Field, RootModel

import pm.models as m
from pm.api.context import current_user, current_user_context_dependency
from pm.api.issue_query import IssueQueryTransformError, transform_query
from pm.api.utils.router import APIRouter
from pm.api.views.error_responses import error_responses
from pm.api.views.output import (
    BaseListOutput,
    ErrorOutput,
    ModelIdOutput,
    SuccessPayloadOutput,
    UUIDOutput,
)
from pm.api.views.params import ListParams
from pm.api.views.permission import (
    GrantPermissionBody,
    PermissionOutput,
    UpdatePermissionBody,
)

# Import report schemas for report tile data
from pm.api.views.report import ReportLinkOutput
from pm.api.views.user import UserOutput

__all__ = ('router',)

router = APIRouter(
    prefix='/dashboard',
    tags=['dashboard'],
    dependencies=[Depends(current_user_context_dependency)],
    responses=error_responses(
        (HTTPStatus.UNAUTHORIZED, ErrorOutput),
        (HTTPStatus.FORBIDDEN, ErrorOutput),
    ),
)


class BaseTileOutput(BaseModel):
    id: UUID = Field(description='Tile identifier')
    type: m.TileTypeT
    name: str = Field(description='Display name of the tile')
    ui_settings: dict = Field(
        default_factory=dict, description='UI-specific settings for the tile'
    )


class IssueListTileOutput(BaseTileOutput):
    type: Literal[m.TileTypeT.ISSUE_LIST] = m.TileTypeT.ISSUE_LIST
    query: str = Field(description='Issue query to filter issues for this tile')

    @classmethod
    def from_obj(cls, obj: m.IssueListTile) -> Self:
        return cls(
            id=obj.id,
            type=obj.type,
            name=obj.name,
            query=obj.query,
            ui_settings=obj.ui_settings,
        )


class ReportTileOutput(BaseTileOutput):
    type: Literal[m.TileTypeT.REPORT] = m.TileTypeT.REPORT
    report: ReportLinkOutput = Field(description='Report information for this tile')

    @classmethod
    def from_obj(cls, obj: m.ReportTile) -> Self:
        return cls(
            id=obj.id,
            type=obj.type,
            name=obj.name,
            report=ReportLinkOutput.from_obj(obj.report),
            ui_settings=obj.ui_settings,
        )


# Union type for tile discrimination
TileOutputT = IssueListTileOutput | ReportTileOutput


class TileOutputRootModel(RootModel):
    root: Annotated[TileOutputT, Field(..., discriminator='type')]


class DashboardOutput(BaseModel):
    id: PydanticObjectId = Field(description='Dashboard identifier')
    name: str = Field(description='Dashboard name')
    description: str | None = Field(description='Dashboard description')
    tiles: list[TileOutputRootModel] = Field(
        description='List of tiles in this dashboard'
    )
    ui_settings: dict = Field(
        default_factory=dict, description='UI-specific settings for the dashboard'
    )
    created_by: UserOutput = Field(description='Dashboard creator')
    permissions: list[PermissionOutput] = Field(description='Dashboard permissions')
    current_permission: m.PermissionType = Field(description='Current user permission')

    @classmethod
    def from_obj(cls, obj: m.Dashboard) -> Self:
        user_ctx = current_user()

        # Process tiles without executing queries
        processed_tiles = []
        for tile in obj.tiles:
            if tile.type == m.TileTypeT.ISSUE_LIST:
                tile_output = IssueListTileOutput.from_obj(tile)
            elif tile.type == m.TileTypeT.REPORT:
                tile_output = ReportTileOutput.from_obj(tile)
            else:
                raise ValueError(f'Unknown tile type: {tile.type}')
            processed_tiles.append(TileOutputRootModel(root=tile_output))

        return cls(
            id=obj.id,
            name=obj.name,
            description=obj.description,
            tiles=processed_tiles,
            ui_settings=obj.ui_settings,
            created_by=UserOutput.from_obj(obj.created_by),
            permissions=[
                PermissionOutput.from_obj(p) for p in obj.filter_permissions(user_ctx)
            ],
            current_permission=obj.user_permission(user_ctx),
        )


class TileCreate(BaseModel):
    type: m.TileTypeT
    name: str = Field(description='Display name of the tile')
    ui_settings: dict = Field(
        default_factory=dict, description='UI-specific settings for the tile'
    )


class IssueListTileCreate(TileCreate):
    type: Literal[m.TileTypeT.ISSUE_LIST] = m.TileTypeT.ISSUE_LIST
    query: str = Field(description='Issue query to filter issues for this tile')


class ReportTileCreate(TileCreate):
    type: Literal[m.TileTypeT.REPORT] = m.TileTypeT.REPORT
    report_id: PydanticObjectId = Field(
        description='ID of the report to display in this tile'
    )


# Union type for tile creation
TileCreateT = IssueListTileCreate | ReportTileCreate


class DashboardCreate(BaseModel):
    name: str = Field(description='Dashboard name')
    description: str | None = Field(default=None, description='Dashboard description')
    ui_settings: dict = Field(
        default_factory=dict, description='UI-specific settings for the dashboard'
    )


class DashboardUpdate(BaseModel):
    name: str | None = Field(default=None, description='Dashboard name')
    description: str | None = Field(default=None, description='Dashboard description')
    ui_settings: dict | None = Field(
        default=None, description='UI-specific settings for the dashboard'
    )


class BaseTileUpdate(BaseModel):
    name: str | None = Field(default=None, description='Display name of the tile')
    ui_settings: dict | None = Field(
        default=None, description='UI-specific settings for the tile'
    )


class IssueListTileUpdate(BaseTileUpdate):
    type: Literal[m.TileTypeT.ISSUE_LIST] = m.TileTypeT.ISSUE_LIST
    query: str | None = Field(
        default=None, description='Issue query to filter issues for this tile'
    )


class ReportTileUpdate(BaseTileUpdate):
    type: Literal[m.TileTypeT.REPORT] = m.TileTypeT.REPORT
    report_id: PydanticObjectId | None = Field(
        default=None, description='Report ID for report tiles'
    )


# Union type for tile updates
TileUpdateT = IssueListTileUpdate | ReportTileUpdate


class TileUpdateRootModel(RootModel):
    root: Annotated[TileUpdateT, Field(..., discriminator='type')]


@router.get('/list')
async def list_dashboards(
    query: ListParams = Depends(),
) -> BaseListOutput[DashboardOutput]:
    user_ctx = current_user()
    filter_query = m.Dashboard.get_filter_query(user_ctx=user_ctx)
    q = m.Dashboard.find(filter_query).sort(m.Dashboard.name)

    return await BaseListOutput.make_from_query(
        q,
        limit=query.limit,
        offset=query.offset,
        projection_fn=DashboardOutput.from_obj,
    )


@router.post('')
async def create_dashboard(
    body: DashboardCreate,
) -> SuccessPayloadOutput[DashboardOutput]:
    user_ctx = current_user()

    dashboard = m.Dashboard(
        name=body.name,
        description=body.description,
        tiles=[],
        ui_settings=body.ui_settings,
        created_by=m.UserLinkField.from_obj(user_ctx.user),
        permissions=[
            m.PermissionRecord(
                target_type=m.PermissionTargetType.USER,
                target=m.UserLinkField.from_obj(user_ctx.user),
                permission_type=m.PermissionType.ADMIN,
            ),
        ],
    )
    await dashboard.insert()
    return SuccessPayloadOutput(payload=DashboardOutput.from_obj(dashboard))


@router.get('/{dashboard_id}')
async def get_dashboard(
    dashboard_id: PydanticObjectId,
) -> SuccessPayloadOutput[DashboardOutput]:
    dashboard = await m.Dashboard.find_one(m.Dashboard.id == dashboard_id)
    if not dashboard:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Dashboard not found')
    user_ctx = current_user()
    if not dashboard.check_permissions(user_ctx, m.PermissionType.VIEW):
        raise HTTPException(
            HTTPStatus.FORBIDDEN, 'No permission to view this dashboard'
        )
    return SuccessPayloadOutput(payload=DashboardOutput.from_obj(dashboard))


@router.put('/{dashboard_id}')
async def update_dashboard(
    dashboard_id: PydanticObjectId,
    body: DashboardUpdate,
) -> SuccessPayloadOutput[DashboardOutput]:
    dashboard = await m.Dashboard.find_one(m.Dashboard.id == dashboard_id)
    if not dashboard:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Dashboard not found')
    user_ctx = current_user()
    if not dashboard.check_permissions(user_ctx, m.PermissionType.EDIT):
        raise HTTPException(
            HTTPStatus.FORBIDDEN, 'No permission to edit this dashboard'
        )

    data = body.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(dashboard, k, v)

    if dashboard.is_changed:
        await dashboard.replace()
    return SuccessPayloadOutput(payload=DashboardOutput.from_obj(dashboard))


@router.delete('/{dashboard_id}')
async def delete_dashboard(
    dashboard_id: PydanticObjectId,
) -> ModelIdOutput:
    dashboard = await m.Dashboard.find_one(m.Dashboard.id == dashboard_id)
    if not dashboard:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Dashboard not found')
    user_ctx = current_user()
    if not dashboard.check_permissions(user_ctx, m.PermissionType.ADMIN):
        raise HTTPException(
            HTTPStatus.FORBIDDEN, 'No permission to delete this dashboard'
        )
    await dashboard.delete()
    return ModelIdOutput.make(dashboard_id)


@router.post('/{dashboard_id}/permission')
async def grant_permission(
    dashboard_id: PydanticObjectId,
    body: GrantPermissionBody,
) -> UUIDOutput:
    """
    Grants one permission from set of permission types to a specified target (user or group) for a dashboard.
    """
    dashboard = await m.Dashboard.find_one(m.Dashboard.id == dashboard_id)
    if not dashboard:
        raise HTTPException(
            status_code=HTTPStatus.NOT_FOUND, detail='Dashboard not found'
        )
    user_ctx = current_user()
    if not dashboard.check_permissions(user_ctx, m.PermissionType.ADMIN):
        raise HTTPException(
            status_code=HTTPStatus.FORBIDDEN,
            detail='You cannot modify permissions for this dashboard',
        )
    if body.target_type == m.PermissionTargetType.USER:
        user: m.User | None = await m.User.find_one(m.User.id == body.target)
        if not user:
            raise HTTPException(HTTPStatus.NOT_FOUND, 'User not found')
        target = m.UserLinkField.from_obj(user)
    else:
        group: m.Group | None = await m.Group.find_one(
            m.Group.id == body.target, with_children=True
        )
        if not group:
            raise HTTPException(HTTPStatus.NOT_FOUND, 'Group not found')
        target = m.GroupLinkField.from_obj(group)
    if dashboard.has_permission_for_target(target):
        raise HTTPException(HTTPStatus.CONFLICT, 'Permission already granted')
    p = m.PermissionRecord(
        target_type=body.target_type,
        target=target,
        permission_type=body.permission_type,
    )
    dashboard.permissions.append(p)
    await dashboard.save_changes()
    return UUIDOutput.make(p.id)


@router.put('/{dashboard_id}/permission/{permission_id}')
async def change_permission(
    dashboard_id: PydanticObjectId,
    permission_id: UUID,
    body: UpdatePermissionBody,
) -> UUIDOutput:
    dashboard = await m.Dashboard.find_one(m.Dashboard.id == dashboard_id)
    if not dashboard:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Dashboard not found')
    user_ctx = current_user()
    if not dashboard.check_permissions(user_ctx, m.PermissionType.ADMIN):
        raise HTTPException(
            HTTPStatus.FORBIDDEN,
            'You cannot modify permissions for this dashboard',
        )
    if not (
        perm := next(
            (obj for obj in dashboard.permissions if obj.id == permission_id),
            None,
        )
    ):
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Permission not found')
    if perm.permission_type == body.permission_type:
        return UUIDOutput.make(perm.id)
    if (
        perm.permission_type == m.PermissionType.ADMIN
        and not dashboard.has_any_other_admin_target(perm.target)
    ):
        raise HTTPException(
            HTTPStatus.FORBIDDEN, 'Dashboard must have at least one admin'
        )
    perm.permission_type = body.permission_type
    await dashboard.save_changes()
    return UUIDOutput.make(perm.id)


@router.delete('/{dashboard_id}/permission/{permission_id}')
async def revoke_permission(
    dashboard_id: PydanticObjectId,
    permission_id: UUID,
) -> UUIDOutput:
    dashboard = await m.Dashboard.find_one(m.Dashboard.id == dashboard_id)
    if not dashboard:
        raise HTTPException(
            status_code=HTTPStatus.NOT_FOUND, detail='Dashboard not found'
        )
    user_ctx = current_user()
    if not dashboard.check_permissions(user_ctx, m.PermissionType.ADMIN):
        raise HTTPException(
            status_code=HTTPStatus.FORBIDDEN,
            detail='You cannot modify permissions for this dashboard',
        )
    if not (
        perm := next(
            (obj for obj in dashboard.permissions if obj.id == permission_id),
            None,
        )
    ):
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Permission not found')
    if (
        perm.permission_type == m.PermissionType.ADMIN
        and not dashboard.has_any_other_admin_target(perm.target)
    ):
        raise HTTPException(
            HTTPStatus.FORBIDDEN, 'Dashboard must have at least one admin'
        )
    dashboard.permissions.remove(perm)
    await dashboard.save_changes()
    return UUIDOutput.make(perm.id)


@router.get('/{dashboard_id}/permissions')
async def get_dashboard_permissions(
    dashboard_id: PydanticObjectId,
    query: ListParams = Depends(),
) -> BaseListOutput[PermissionOutput]:
    dashboard = await m.Dashboard.find_one(m.Dashboard.id == dashboard_id)
    if not dashboard:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Dashboard not found')
    user_ctx = current_user()
    if not dashboard.check_permissions(user_ctx, m.PermissionType.ADMIN):
        raise HTTPException(
            HTTPStatus.FORBIDDEN, 'You cannot view dashboard permissions'
        )
    return BaseListOutput.make(
        count=len(dashboard.permissions),
        limit=query.limit,
        offset=query.offset,
        items=[
            PermissionOutput.from_obj(perm)
            for perm in dashboard.permissions[query.offset : query.offset + query.limit]
        ],
    )


@router.get('/{dashboard_id}/tile/list')
async def list_tiles(
    dashboard_id: PydanticObjectId,
    query: ListParams = Depends(),
) -> BaseListOutput[TileOutputRootModel]:
    dashboard = await m.Dashboard.find_one(m.Dashboard.id == dashboard_id)
    if not dashboard:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Dashboard not found')
    user_ctx = current_user()
    if not dashboard.check_permissions(user_ctx, m.PermissionType.VIEW):
        raise HTTPException(
            HTTPStatus.FORBIDDEN, 'No permission to view this dashboard'
        )

    # Process tiles
    processed_tiles = []
    for tile in dashboard.tiles:
        if tile.type == m.TileTypeT.ISSUE_LIST:
            tile_output = IssueListTileOutput.from_obj(tile)
            processed_tiles.append(TileOutputRootModel(root=tile_output))
        elif tile.type == m.TileTypeT.REPORT:
            tile_output = ReportTileOutput.from_obj(tile)
            processed_tiles.append(TileOutputRootModel(root=tile_output))

    start = query.offset
    end = query.offset + query.limit
    return BaseListOutput.make(
        count=len(processed_tiles),
        limit=query.limit,
        offset=query.offset,
        items=processed_tiles[start:end],
    )


@router.post('/{dashboard_id}/tile')
async def create_tile(
    dashboard_id: PydanticObjectId,
    body: TileCreateT,
) -> SuccessPayloadOutput[TileOutputRootModel]:
    dashboard = await m.Dashboard.find_one(m.Dashboard.id == dashboard_id)
    if not dashboard:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Dashboard not found')
    user_ctx = current_user()
    if not dashboard.check_permissions(user_ctx, m.PermissionType.EDIT):
        raise HTTPException(
            HTTPStatus.FORBIDDEN, 'No permission to edit this dashboard'
        )

    if body.type == m.TileTypeT.ISSUE_LIST:
        if body.query:
            try:
                await transform_query(body.query)
            except IssueQueryTransformError as err:
                raise HTTPException(
                    HTTPStatus.BAD_REQUEST,
                    f'Invalid query in tile "{body.name}": {err.message}',
                ) from err
        tile = m.IssueListTile(
            type=body.type,
            name=body.name,
            query=body.query,
            ui_settings=body.ui_settings,
        )
    elif body.type == m.TileTypeT.REPORT:
        # Verify the report exists and user has access
        report = await m.Report.find_one(m.Report.id == body.report_id)
        if not report:
            raise HTTPException(
                HTTPStatus.BAD_REQUEST,
                f'Report {body.report_id} not found',
            )
        if not report.check_permissions(user_ctx, m.PermissionType.VIEW):
            raise HTTPException(
                HTTPStatus.BAD_REQUEST,
                f'No permission to view report {body.report_id}',
            )
        tile = m.ReportTile(
            type=body.type,
            name=body.name,
            report=m.ReportLinkField.from_obj(report),
            ui_settings=body.ui_settings,
        )
    else:
        raise HTTPException(
            HTTPStatus.BAD_REQUEST,
            f'Unsupported tile type: {body.type}',
        )

    dashboard.tiles.append(tile)
    await dashboard.save_changes()

    if tile.type == m.TileTypeT.ISSUE_LIST:
        tile_output = IssueListTileOutput.from_obj(tile)
    elif tile.type == m.TileTypeT.REPORT:
        tile_output = ReportTileOutput.from_obj(tile)
    else:
        raise HTTPException(HTTPStatus.INTERNAL_SERVER_ERROR, 'Unknown tile type')

    return SuccessPayloadOutput(payload=TileOutputRootModel(root=tile_output))


@router.get('/{dashboard_id}/tile/{tile_id}')
async def get_tile(
    dashboard_id: PydanticObjectId,
    tile_id: UUID,
) -> SuccessPayloadOutput[TileOutputRootModel]:
    dashboard = await m.Dashboard.find_one(m.Dashboard.id == dashboard_id)
    if not dashboard:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Dashboard not found')
    user_ctx = current_user()
    if not dashboard.check_permissions(user_ctx, m.PermissionType.VIEW):
        raise HTTPException(
            HTTPStatus.FORBIDDEN, 'No permission to view this dashboard'
        )

    tile = next((t for t in dashboard.tiles if t.id == tile_id), None)
    if not tile:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Tile not found')

    if tile.type == m.TileTypeT.ISSUE_LIST:
        tile_output = IssueListTileOutput.from_obj(tile)
        return SuccessPayloadOutput(payload=TileOutputRootModel(root=tile_output))
    if tile.type == m.TileTypeT.REPORT:
        tile_output = ReportTileOutput.from_obj(tile)
        return SuccessPayloadOutput(payload=TileOutputRootModel(root=tile_output))
    raise HTTPException(HTTPStatus.INTERNAL_SERVER_ERROR, 'Unknown tile type')


@router.put('/{dashboard_id}/tile/{tile_id}')
async def update_tile(
    dashboard_id: PydanticObjectId,
    tile_id: UUID,
    body: TileUpdateRootModel,
) -> SuccessPayloadOutput[TileOutputRootModel]:
    dashboard = await m.Dashboard.find_one(m.Dashboard.id == dashboard_id)
    if not dashboard:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Dashboard not found')
    user_ctx = current_user()
    if not dashboard.check_permissions(user_ctx, m.PermissionType.EDIT):
        raise HTTPException(
            HTTPStatus.FORBIDDEN, 'No permission to edit this dashboard'
        )

    tile_index = next(
        (i for i, t in enumerate(dashboard.tiles) if t.id == tile_id), None
    )
    if tile_index is None:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Tile not found')

    tile = dashboard.tiles[tile_index]
    update_data = body.root

    # Type-specific validation and processing
    if update_data.type == m.TileTypeT.ISSUE_LIST:
        # Validate tile type matches
        if tile.type != m.TileTypeT.ISSUE_LIST:
            raise HTTPException(
                HTTPStatus.BAD_REQUEST,
                'Cannot update non-issue-list tile with issue list data',
            )

        # Validate query if provided
        if update_data.query:
            try:
                await transform_query(update_data.query)
            except IssueQueryTransformError as err:
                raise HTTPException(
                    HTTPStatus.BAD_REQUEST,
                    f'Invalid query: {err.message}',
                ) from err

        # Apply updates
        if update_data.name is not None:
            tile.name = update_data.name
        if update_data.query is not None:
            tile.query = update_data.query
        if update_data.ui_settings is not None:
            tile.ui_settings = update_data.ui_settings

    elif update_data.type == m.TileTypeT.REPORT:
        # Validate tile type matches
        if tile.type != m.TileTypeT.REPORT:
            raise HTTPException(
                HTTPStatus.BAD_REQUEST,
                'Cannot update non-report tile with report data',
            )

        # Handle report_id update if provided
        if update_data.report_id:
            # Verify the report exists and user has access
            report = await m.Report.find_one(m.Report.id == update_data.report_id)
            if not report:
                raise HTTPException(
                    HTTPStatus.BAD_REQUEST,
                    f'Report {update_data.report_id} not found',
                )
            if not report.check_permissions(user_ctx, m.PermissionType.VIEW):
                raise HTTPException(
                    HTTPStatus.BAD_REQUEST,
                    f'No permission to view report {update_data.report_id}',
                )
            # Update the report link
            tile.report = m.ReportLinkField.from_obj(report)

        # Apply other updates
        if update_data.name is not None:
            tile.name = update_data.name
        if update_data.ui_settings is not None:
            tile.ui_settings = update_data.ui_settings

    await dashboard.save_changes()

    if tile.type == m.TileTypeT.ISSUE_LIST:
        tile_output = IssueListTileOutput.from_obj(tile)
        return SuccessPayloadOutput(payload=TileOutputRootModel(root=tile_output))
    if tile.type == m.TileTypeT.REPORT:
        tile_output = ReportTileOutput.from_obj(tile)
        return SuccessPayloadOutput(payload=TileOutputRootModel(root=tile_output))
    raise HTTPException(
        HTTPStatus.INTERNAL_SERVER_ERROR, f'Unknown tile type: {tile.type}'
    )


@router.delete('/{dashboard_id}/tile/{tile_id}')
async def delete_tile(
    dashboard_id: PydanticObjectId,
    tile_id: UUID,
) -> UUIDOutput:
    dashboard = await m.Dashboard.find_one(m.Dashboard.id == dashboard_id)
    if not dashboard:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Dashboard not found')
    user_ctx = current_user()
    if not dashboard.check_permissions(user_ctx, m.PermissionType.EDIT):
        raise HTTPException(
            HTTPStatus.FORBIDDEN, 'No permission to edit this dashboard'
        )

    tile_index = next(
        (i for i, t in enumerate(dashboard.tiles) if t.id == tile_id), None
    )
    if tile_index is None:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Tile not found')

    dashboard.tiles.pop(tile_index)
    await dashboard.save_changes()

    return UUIDOutput.make(tile_id)
