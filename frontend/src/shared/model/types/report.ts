import type {
    AxisOutput,
    AxisType,
    PmApiRoutesApiV1ReportGrantPermissionBody,
    ReportCreate,
    ReportOutput,
    ReportUpdate,
} from "./backend-schema.gen";

export type ReportT = ReportOutput;

export type CreateReportParams = ReportCreate;

export type UpdateReportParams = ReportUpdate;

export type GrantReportPermissionParams =
    PmApiRoutesApiV1ReportGrantPermissionBody;

export type AxisT = AxisOutput;

export type AxisTypeT = AxisType;
