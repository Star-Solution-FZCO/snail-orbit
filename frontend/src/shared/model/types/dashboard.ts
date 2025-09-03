import type {
    DashboardCreate,
    DashboardOutput,
    DashboardUpdate,
    IssueListTileCreate,
    TileUpdate,
} from "./backend-schema.gen";
import { PermissionTargetT, PermissionTypeT } from "./permission";

export type DashboardT = DashboardOutput;

export type CreateDashboardT = DashboardCreate;

export type UpdateDashboardT = DashboardUpdate;

export type DashboardTileT = DashboardOutput["tiles"][number];

export type CreateDashboardTileT = IssueListTileCreate;

export type UpdateDashboardTileT = TileUpdate;

export type DashboardTileTypeT = DashboardTileT["type"];

export type GrantDashboardPermissionT = {
    dashboard_id: string;
    target_type: PermissionTargetT;
    target: string;
    permission_type: PermissionTypeT;
};

export type RevokeDashboardPermissionT = {
    dashboard_id: string;
    permission_id: string;
};

export type ChangeDashboardPermissionT = {
    dashboard_id: string;
    permission_id: string;
    permission_type: PermissionTypeT;
};
