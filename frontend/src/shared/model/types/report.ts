import type {
    AxisOutput,
    AxisType,
    PmApiRoutesApiV1ReportGrantPermissionBody,
    ReportCreate,
    ReportDataOutput,
    ReportOutput,
    ReportUpdate,
} from "./backend-schema.gen";

export const enum ReportDisplayType {
    TABLE = "table",
    LINE_CHART = "line_chart",
    BAR_CHART = "bar_chart",
    PIE_CHART = "pie_chart",
}

export type ReportT = ReportOutput & {
    ui_settings: {
        report_type: ReportDisplayType;
    };
};

export type ReportDataT = ReportDataOutput;

export type CreateReportParams = ReportCreate;

export type UpdateReportParams = ReportUpdate;

export type GrantReportPermissionParams =
    PmApiRoutesApiV1ReportGrantPermissionBody;

export type AxisT = AxisOutput;

export type AxisTypeT = AxisType;
