import type { CreateAgileBoardT } from "types";
import type { AgileBoardFormData } from "../components/agile_board_form/agile_board_form.schema";

export const formValuesToCreateForm = (
    form: AgileBoardFormData,
): CreateAgileBoardT => ({
    ...form,
    columns: form.columns.map((el) => el.value),
    projects: form.projects.map((project) => project.id),
    column_field: form.column_field.id,
    swimlane_field: form.swimlane_field?.id || null,
    swimlanes: form.swimlanes.map((el) => el.value),
    card_fields: form.card_fields.map((field) => field.id),
    card_colors_fields: form.card_colors_fields.map((field) => field.id),
});
