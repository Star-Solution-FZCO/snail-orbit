import type { ReportT } from "shared/model/types/report";

export type FormValues = Pick<ReportT, "name" | "description" | "projects"> &
    Partial<Pick<ReportT, "axis_1">>;

export type CreateReportFormProps = {
    onSubmit: (data: FormValues) => unknown;
};
