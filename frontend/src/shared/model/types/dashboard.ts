import type {
    DashboardCreate,
    DashboardOutput,
    DashboardUpdate,
    IssueListTileCreate,
    ReportTileCreate,
    TileUpdateRootModel as TileUpdate,
} from "./backend-schema.gen";
import type { PermissionTargetTypeT, PermissionTypeT } from "./permission";

export type DashboardT = DashboardOutput;

export type CreateDashboardT = DashboardCreate;

export type UpdateDashboardT = DashboardUpdate;

export type DashboardTileT = DashboardOutput["tiles"][number];

export type CreateDashboardTileT = IssueListTileCreate | ReportTileCreate;

export type UpdateDashboardTileT = TileUpdate;

export type DashboardTileTypeT = DashboardTileT["type"] | "report";

export type GrantDashboardPermissionT = {
    dashboard_id: string;
    target_type: PermissionTargetTypeT;
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
