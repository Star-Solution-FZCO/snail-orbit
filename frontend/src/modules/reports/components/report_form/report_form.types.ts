import type { ReportT } from "shared/model/types/report";
import { ReportDisplayType } from "shared/model/types/report";

export type ReportFormValues = Omit<
    ReportT,
    "created_by" | "current_permission" | "is_favorite"
>;

export const reportFormDefaultValues: ReportFormValues = {
    id: "",
    query: "",
    name: "",
    axis_1: { type: "project", custom_field: null },
    axis_2: null,
    description: "",
    projects: [],
    permissions: [],
    ui_settings: {
        report_type: ReportDisplayType.TABLE,
    },
};
