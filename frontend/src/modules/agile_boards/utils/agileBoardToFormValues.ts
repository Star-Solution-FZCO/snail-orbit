import type { AgileBoardT } from "types";
import type { AgileBoardFormData } from "../components/agile_board_form/agile_board_form.schema";
import { normalizeFieldValue } from "./normalizeFieldValue";

export const agileBoardToFormValues = (
    values: AgileBoardT,
): AgileBoardFormData => ({
    ...values,
    ui_settings: {
        ...values.ui_settings,
        minCardHeight: values.ui_settings.minCardHeight ?? "",
        columns: values.ui_settings.columns || 1,
        columnMaxWidth: values.ui_settings.columnMaxWidth || 120,
        columnsStrategy: values.ui_settings.columnsStrategy || "column",
    },
    columns: values.columns.map((column) => normalizeFieldValue(column)),
    swimlanes: values.swimlanes.map((swimlane) =>
        normalizeFieldValue(swimlane),
    ),
});
