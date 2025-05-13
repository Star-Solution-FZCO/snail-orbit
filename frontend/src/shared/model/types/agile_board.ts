import type { BoardOutput, CustomFieldLinkOutput } from "./backend-schema.gen";
import type {
    BasicCustomFieldT,
    EnumFieldValueT,
    StateFieldValueT,
    VersionFieldValueT,
} from "./custom_fields";
import type { IssueT } from "./issue";
import type { PermissionTargetT, PermissionTypeT } from "./permission";

export type ColumnT = BasicCustomFieldT;

export type CreateAgileBoardT = {
    name: string;
    description: string | null;
    query: string | null;
    column_field: string;
    columns: string[];
    projects: string[];
    swimlane_field: string | null; // custom field id
    swimlanes: string[]; // list of custom field ids
    card_fields: string[]; // list of custom field ids
    card_colors_fields: string[]; // list of custom field ids
    ui_settings?: UiSettingT;
};

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

export type AgileFieldValueT =
    | EnumFieldValueT
    | StateFieldValueT
    | VersionFieldValueT;

export type AgileBoardCardFieldT = CustomFieldLinkOutput;

export type AgileColumnT = {
    field_value: AgileFieldValueT | null;
    issues: IssueT[];
};

export type AgileSwimLineT = {
    field_value: AgileFieldValueT | null;
    columns: AgileColumnT[];
};

export type GrantPermissionParams = {
    board_id: string;
    target_type: PermissionTargetT;
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
