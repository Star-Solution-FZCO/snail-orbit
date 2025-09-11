import type {
    BoardCreate,
    BoardIssuesOutput,
    BoardOutput,
    CustomFieldGroupLinkOutput,
} from "./backend-schema.gen";
import type { PermissionTargetTypeT, PermissionTypeT } from "./permission";

export type CreateAgileBoardT = BoardCreate;

export type BoardIssuesT = BoardIssuesOutput;

export const columnsStrategies = ["column", "maxWidth"] as const;

export type ColumnStrategyT = (typeof columnsStrategies)[number];

export type UiSettingT = {
    minCardHeight?: string;
    columnsStrategy: ColumnStrategyT;
    columns?: number;
    columnMaxWidth?: number;
};

export type AgileBoardT = Omit<BoardOutput, "ui_settings"> & {
    ui_settings: UiSettingT;
};

export type UpdateAgileBoardT = Partial<CreateAgileBoardT>;

export type AgileBoardCardFieldT = CustomFieldGroupLinkOutput;

export type GrantPermissionParams = {
    board_id: string;
    target_type: PermissionTargetTypeT;
    target: string;
    permission_type: PermissionTypeT;
};

export type RevokePermissionParams = {
    board_id: string;
    permission_id: string;
};

export type ChangePermissionParams = {
    board_id: string;
    permission_id: string;
    permission_type: PermissionTypeT;
};

export type MoveIssueT = {
    board_id: string;
    issue_id: string;
    column: string | null;
    swimlane?: string;
    after_issue: string | null;
};
