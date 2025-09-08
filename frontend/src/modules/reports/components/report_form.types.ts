import type { ReportT } from "shared/model/types/report";

export type ReportFormValues = Omit<
    ReportT,
    "id" | "created_by" | "current_permission" | "is_favorite" | "permissions"
>;

export type ReportFormProps = {
    onSubmit: (data: ReportFormValues) => unknown;
    onBack?: () => unknown;
};
