import type { CreateReportParams } from "shared/model/types/report";
import type { ReportFormValues } from "./components/report_form/report_form.types";

export const reportFormValuesToEditFormValues = (
    report: ReportFormValues,
): CreateReportParams => ({
    ...report,
    projects: report.projects.map((el) => el.id),
    permissions: [],
    axis_1: {
        type: report.axis_1.type,
        custom_field_gid: report.axis_1?.custom_field?.gid || null,
    },
    axis_2: report.axis_2
        ? {
              type: report.axis_2.type,
              custom_field_gid: report.axis_2?.custom_field?.gid || null,
          }
        : null,
});
